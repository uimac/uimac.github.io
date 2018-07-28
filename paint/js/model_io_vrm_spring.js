(function () {
	"use strict";

	if (pc.app.scripts.has('VRMSpringBone')) return;

	//-----------------------------------------------------------------------
	// 物理演算計算用クラス
	// porting from https://github.com/dwango/UniVRM/blob/master/Scripts/SpringBone/VRMSpringBone.cs
	//-----------------------------------------------------------------------
	let VRMSpringBoneLogic = function (center, transform, localChildPosition) {
		this.transform_ = transform;
		this.radius_ = 0;

		let worldChildPosition = this.transform_.getWorldTransform().clone().transformPoint(localChildPosition);
		this.currentTail_ = worldChildPosition;
		if (center) {
			let invCenter = center.getWorldTransform().clone();
			invCenter.invert();
			this.currentTail_ = invCenter.transformPoint(worldChildPosition);
		}
		this.prevTail_ = this.currentTail_.clone();
		this.localRotation_ = this.transform_.getLocalRotation().clone();
		this.boneAxis_ = localChildPosition.clone();
		this.boneAxis_.normalize();
		this.length_ = localChildPosition.length();
	};

	VRMSpringBoneLogic.prototype.update = function (
		center,
		stiffnessForce,
		dragForce,
		external,
		colliders
	) {
		let currentTail = this.currentTail_;
		if (center) {
			currentTail = center.getWorldTransform().clone().transformPoint(this.currentTail_)
		}

		let prevTail = this.prevTail_;
		if (center) {
			prevTail = center.getWorldTransform().clone().transformPoint(this.prevTail_)
		}

		// verlet積分で次の位置を計算
		let nextTail = currentTail.clone().add(
			currentTail.clone().sub(prevTail).scale(1.0 - dragForce) // 前フレームの移動を継続する(減衰もあるよ)
		).add(
			this.parentRotation.mul(this.localRotation_).transformVector(this.boneAxis_).scale(stiffnessForce) // 親の回転による子ボーンの移動目標
		).add(external); // 外力による移動量

		// 長さをboneLengthに強制
		nextTail = this.transform_.getPosition().clone().add(
			nextTail.sub(this.transform_.getPosition().clone()).normalize().scale(this.length_)
		);

		// Collisionで移動
		nextTail = this.collision(colliders, nextTail);

		this.prevTail_ = currentTail;
		if (center) {
			let invCenter = center.getWorldTransform().clone();
			invCenter.invert();
			this.prevTail_ = invCenter.transformPoint(currentTail);
		}
		this.currentTail_ = nextTail;
		if (center) {
			let invCenter = center.getWorldTransform().clone();
			invCenter.invert();
			this.currentTail_ = invCenter.transformPoint(nextTail);
		}

		//回転を適用
		this.transform_.setRotation(this.applyRotation(nextTail));
	}

	VRMSpringBoneLogic.prototype.applyRotation = function (nextTail)
	{
		let rotation = this.parentRotation.mul(this.localRotation_);
		let from = rotation.transformVector(this.boneAxis_);
		let to = nextTail.clone().sub(this.transform_.getPosition().clone());
				
		return  new pc.Quat().fromToRotation(from, to).mul(rotation);
	}

	VRMSpringBoneLogic.prototype.collision = function (colliders, nextTail) {
		let result = nextTail;
		colliders.forEach(function (collider) {
			let r = this.radius_ + collider.radius;
			let nextSubColPos = nextTail.clone().sub(collider.position);
			if (nextSubColPos.lengthSq() <= (r * r)) {
				// ヒット。Colliderの半径方向に押し出す
				let normal = nextSubColPos.clone();
				normal.normalize();
				let posFromCollider = collider.position.clone().add(
					normal.scale(r)
				);
				// 長さをboneLengthに強制
				let posToCollider = posFromCollider.sub(this.transform_.getPosition().clone());
				posToCollider.normalize();
				result = this.transform_.getPisition().clone().add(
					 posToCollider.scale(this.length_)
				);
			}
		}.bind(this));
		return result;
	}

	/**
	 * ParentRotation 
	 */
	Object.defineProperty(VRMSpringBoneLogic.prototype, 'parentRotation', {
		get: function () {
			if (this.transform_.parent != null) {
				return this.transform_.parent.getRotation().clone();
			}
			return pc.Quat.IDENTITY;
		}
	});

	/**
	 * LocalRotation 
	 */
	Object.defineProperty(VRMSpringBoneLogic.prototype, 'localRotation', {
		get: function () {
			return this.localRotation_;
		}
	});

	/**
	 * Radius 
	 */
	Object.defineProperty(VRMSpringBoneLogic.prototype, 'radius', {
		get: function () {
			return this.radius_;
		},
		set: function (rad) {
			this.radius_ = rad;
		}
	});


	//-----------------------------------------------------------------------
	// 物理演算用Scriptクラス
	//-----------------------------------------------------------------------
	let VRMSpringBone = pc.createScript('VRMSpringBone');

	VRMSpringBone.attributes.add('bones', { type: 'object' });
	VRMSpringBone.attributes.add('stiffnessForce', { type: 'number' });
	VRMSpringBone.attributes.add('colliderGroups', { type: 'object' });
	VRMSpringBone.attributes.add('gravityPower', { type: 'number' });
	VRMSpringBone.attributes.add('gravityDir', { type: 'vec3' });
	VRMSpringBone.attributes.add('dragForce', { type: 'number' });
	VRMSpringBone.attributes.add('center', { type: 'object' });
	VRMSpringBone.attributes.add('hitRadius', { type: 'number' });

	VRMSpringBone.prototype.initialize = function () {
		this.colliderList = [];
		this.verlets = []; 
		this.initialLocalRotationMap = null;
	};
	
	VRMSpringBone.prototype.update = function (dt) {
		if (this.verlets.length === 0) {
			if (!this.bones) {
				return;
			}
			this.setup();
		}
		this.colliderList = [];
		
		this.colliderGroups.forEach(function (group) {
			group.colliders.forEach(function (collider) {
				this.colliderList.push({
					position : new pc.Vec3(collider.offset.x, collider.offset.y, collider.offset.z),
					radius : collider.radius
				});
			}.bind(this));
		}.bind(this));

		let stiffness = this.stiffnessForce * dt;
		let external = this.gravityDir.clone().scale(this.gravityPower * dt);
		this.verlets.forEach(function (verlet) {
			verlet.radius = this.hitRadius;
			verlet.update(this.center,
				stiffness,
				this.dragForce,
				external,
				this.colliderList
				);
			
		}.bind(this));
	}
	
	function recursiveSetLocalRotation(dst, map) {
		if (!dst) return;
		map[dst] = dst.getLocalRotation().clone();
		for (let i = 0; i < dst.children.length; ++i) {
			recursiveSetLocalRotation(dst.children[i], map);
		}
	}
	VRMSpringBone.prototype.recursiveSetup = function (center, parent) {
		if (parent.children.length === 0) {
			let scale = parent.getLocalScale().clone();
			let delta = parent.getLocalPosition().clone().normalize().scale(-0.7);
			this.verlets.push(
				new VRMSpringBoneLogic(
					center, 
					parent, 
					parent.getLocalPosition().clone().add(delta)));
		} else {
			let firstChild = parent.children[0];
			let localPosition = firstChild.getLocalPosition().clone();
			let localScale = firstChild.getLocalScale().clone();
			
			this.verlets.push(
				new VRMSpringBoneLogic(
					center,
					parent,
					new pc.Vec3(
					localPosition.x * localScale.x,
					localPosition.y * localScale.y,
					localPosition.z * localScale.z
				)));

		}
		for (let i = 0; i < parent.children.length; ++i) {
			this.recursiveSetup(center, parent.children[i]);
		}
	}


	VRMSpringBone.prototype.setup = function () {
		if (!this.initialLocalRotationMap) {
			this.initialLocalRotationMap = {}
		} else {
			for (let k in this.initialLocalRotationMap) {
				k.setLocalRotation(this.initialLocalRotationMap[k]);
			}
			this.initialLocalRotationMap = {};
		}
		this.verlets = [];
		
		this.bones.forEach(function (go) {
			if (go != null) {
				recursiveSetLocalRotation(go, this.initialLocalRotationMap);
				this.recursiveSetup(this.center, go);
			}
		}.bind(this));
	}
}());