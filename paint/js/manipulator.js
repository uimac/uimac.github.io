(function () {
	"use strict";
	let PivotSize = 0.2;

	let Manipulator = function (action) {

		this.action = action;
		// xyz軸ハンドルの親
		this.manipEntity_ = new pc.Entity('Manip');
		this.target_ = null;

		// ハンドル用マテリアル
		this.mat = new pc.BasicMaterial();
		//this.mat.cull = pc.CULLFACE_NONE;
		this.mat.depthTest = false;
		//this.mat.blendType = pc.BLEND_NORMAL;
		this.mat.update();

		// 回転ハンドルMesh
		this.initRotationHandles();

		// 移動ハンドルMesh
		this.initTranslationHandles();
		
		// ハンドルを非表示に
		for (let i = 0; i < this.trans_x_.length; ++i) {
			this.trans_x_[i].setVisible(false);
			this.trans_y_[i].setVisible(false);
			this.trans_z_[i].setVisible(false);
		}
		this.rot_x_.setVisible(false);
		this.rot_y_.setVisible(false);
		this.rot_z_.setVisible(false);
		this.rot_w_.setVisible(false);
	};

	Manipulator.prototype.initRotationHandles = function () {
		let createHandle = function (mat, name, radius, trans = false) {
			let mesh = upaint.Util.createTorus(pc.app.graphicsDevice, {
				tubeRadius : 0.03, 
				ringRadius : 0.8,
				radius : radius
			});
			mesh.name = name;
			let model = upaint.Util.createImeddiateModel(mesh, mat, trans);
			model.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
			mesh.entity = this.manipEntity_;
			return model;
		}.bind(this);

		let xmat = this.mat.clone();
		xmat.color.set(1, 0, 0, 1);
		this.rot_x_ = createHandle(xmat, Manipulator.MANIP_NAME_ROTX, Math.PI);
		this.rot_x_.pcentity.setLocalEulerAngles(0, 0, 90);

		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.rot_y_ = createHandle(ymat, Manipulator.MANIP_NAME_ROTY, Math.PI);

		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.rot_z_ = createHandle(zmat, Manipulator.MANIP_NAME_ROTZ, Math.PI);
		let a = new pc.Quat();
		let b = new pc.Quat();
		a.setFromAxisAngle(upaint.Constants.AxisZ, 90);
		b.setFromAxisAngle(upaint.Constants.AxisX, 90);
		this.rot_z_.pcentity.setLocalRotation(a.mul(b));

		let wmat = this.mat.clone();
		wmat.color.set(0.6, 0.6, 0.6, 0.2);
		wmat.blendType = pc.BLEND_NORMAL;
		this.rot_w_ = createHandle(wmat, Manipulator.MANIP_NAME_ROTW, Math.PI * 2, true);

		this.manipEntity_.addChild(this.rot_x_.pcentity);
		this.manipEntity_.addChild(this.rot_y_.pcentity);
		this.manipEntity_.addChild(this.rot_z_.pcentity);
		this.manipEntity_.addChild(this.rot_w_.pcentity);
	};

	Manipulator.prototype.initTranslationHandles = function () {
		let createHandle = function (mat, name) {
			let mesh = pc.createCylinder(pc.app.graphicsDevice, {
				height  : 1.2, 
				radius  : 0.04
			});
			mesh.name = name;
			let model = upaint.Util.createImeddiateModel(mesh, mat);
			model.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
			mesh.entity = this.manipEntity_;
			
			let cone = pc.createCone(pc.app.graphicsDevice, {
				height  : 0.3, 
				baseRadius  : 0.1
			});
			cone.name = name;
			let coneModel = upaint.Util.createImeddiateModel(cone, mat);
			coneModel.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
			cone.entity = this.manipEntity_;

			return [model, coneModel];
		}.bind(this);

		let xmat = this.mat.clone();
		xmat.color.set(1, 0, 0, 1);
		this.trans_x_ = createHandle(xmat, Manipulator.MANIP_NAME_TRANSX);
		for (let i = 0; i < this.trans_x_.length; ++i) {
			this.trans_x_[i].pcentity.setLocalEulerAngles(0, 0, 90);
		}
		this.trans_x_[0].pcentity.setLocalPosition(-0.6 * PivotSize, 0, 0);
		this.trans_x_[1].pcentity.setLocalPosition(-1.2 * PivotSize, 0, 0); // cone


		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.trans_y_ = createHandle(ymat, Manipulator.MANIP_NAME_TRANSY);
		this.trans_y_[0].pcentity.setLocalPosition(0, 0.6 * PivotSize, 0);
		this.trans_y_[1].pcentity.setLocalPosition(0, 1.2 * PivotSize, 0); // cone
		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.trans_z_ = createHandle(zmat, Manipulator.MANIP_NAME_TRANSZ);
		let a = new pc.Quat();
		let b = new pc.Quat();
		a.setFromAxisAngle(upaint.Constants.AxisZ, 90);
		b.setFromAxisAngle(upaint.Constants.AxisX, 90);
		let c = a.mul(b);
		for (let i = 0; i < this.trans_z_.length; ++i) {
			this.trans_z_[i].pcentity.setLocalRotation(c);
		}
		this.trans_z_[0].pcentity.setLocalPosition(0, 0, 0.6 * PivotSize);
		this.trans_z_[1].pcentity.setLocalPosition(0, 0, 1.2 * PivotSize); // cone

		for (let i = 0; i < this.trans_x_.length; ++i) {
			this.manipEntity_.addChild(this.trans_x_[i].pcentity);
			this.manipEntity_.addChild(this.trans_y_[i].pcentity);
			this.manipEntity_.addChild(this.trans_z_[i].pcentity);
		}
	};


	/**
	 * 終了処理
	 */
	Manipulator.prototype.destroy = function () {
		this.pcentity.destroy();
	};

	/**
	 * 更新
	 */
	Manipulator.prototype.update = (function () {
		let qa = new pc.Quat();
		let qb = new pc.Quat();
		return function (camera) {
			if (!this.target) return;
			let rot = this.target.getRotation().clone().invert();
			let cameraPos = camera.pcentity.getPosition();
			let targetPos = this.target.getPosition().clone();
			let eyeVec = targetPos.sub(cameraPos);
			eyeVec.normalize();
			eyeVec = rot.clone().transformVector(eyeVec);

			qa.x = eyeVec.z;
			qa.y = 0.0;
			qa.z = -eyeVec.x;
			qa.w = 1.0 + eyeVec.y;
			qa.normalize();
			this.rot_w_.pcentity.setLocalRotation(qa);

			// rot_x
			qa.setFromAxisAngle(upaint.Constants.AxisZ, 
				pc.math.RAD_TO_DEG * Math.PI * 0.5);
			qb.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.y, -eyeVec.z));
			this.rot_x_.pcentity.setLocalRotation(qa.mul(qb));

			// rot_y
			qa.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.x, -eyeVec.z));
			this.rot_y_.pcentity.setLocalRotation(qa);

			// rot_z
			qa.setFromAxisAngle(upaint.Constants.AxisX, 
				pc.math.RAD_TO_DEG * Math.PI * 0.5);
			qb.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.x, eyeVec.y));
			this.rot_z_.pcentity.setLocalRotation(qa.mul(qb));
		}
	}());

	/**
	 * マニピュレータのターゲット
	 */
	Object.defineProperty(Manipulator.prototype, 'target', {
		get: function () {
			return this.target_;
		},
		set: function (entity) {
			if (this.manipEntity_.parent) {
				this.manipEntity_.parent.removeChild(this.manipEntity_);
			}
			this.target_ = entity;
			if (this.target_) {
				let canTrans = entity.name === "Model";
				for (let i = 0; i < this.trans_x_.length; ++i) {
					this.trans_x_[i].setVisible(canTrans);
					this.trans_y_[i].setVisible(canTrans);
					this.trans_z_[i].setVisible(canTrans);
				}
				this.rot_x_.setVisible(true);
				this.rot_y_.setVisible(true);
				this.rot_z_.setVisible(true);
				this.rot_w_.setVisible(true);
				this.target_.addChild(this.manipEntity_);
			}
		}
	});

	Manipulator.MANIP_NAME_TRANSX = "mainp_transx";
	Manipulator.MANIP_NAME_TRANSY = "mainp_transy";
	Manipulator.MANIP_NAME_TRANSZ = "mainp_transz";
	Manipulator.MANIP_NAME_ROTX = "mainp_rotx";
	Manipulator.MANIP_NAME_ROTY = "mainp_roty";
	Manipulator.MANIP_NAME_ROTZ = "mainp_rotz";
	Manipulator.MANIP_NAME_ROTW = "mainp_rotw";
	const TRANS_INDEX = {
		"mainp_transx": 0,
		"mainp_transy": 1,
		"mainp_transz": 2
	};
	const ROT_INDEX = {
		"mainp_rotx": 0,
		"mainp_roty": 1,
		"mainp_rotz": 2
	};
	const ROT_VEC = {
		"mainp_rotx": new pc.Vec3(1, 0, 0),
		"mainp_roty": new pc.Vec3(0, 1, 0),
		"mainp_rotz": new pc.Vec3(0, 0, 1)
	};
	Manipulator.prototype.isManipulator = function (meshInstance) {
		let name = meshInstance.mesh.name;
		return TRANS_INDEX.hasOwnProperty(name) 
			|| ROT_INDEX.hasOwnProperty(name);
	};
	Manipulator.prototype.getManipulatorType = function (meshInstance) {
		return meshInstance.mesh.name;
	};
	Manipulator.prototype.getEntity = function (meshInstance) {
		return meshInstance.mesh.entity;
	};
	
	// 移動
	Manipulator.prototype.translate = function (meshInstance, downpos, curpos, initialVal, isDone) {
		let name = meshInstance.mesh.name;
		if (meshInstance.mesh.entity) {
			let entity = meshInstance.mesh.entity.parent;
			let pos = entity.getPosition();

			let diff = curpos.sub(downpos);
			let newpos = entity.getPosition().clone();
			newpos.data[TRANS_INDEX[name]] += diff.data[TRANS_INDEX[name]]
			if (isDone) {
				// 移動の確定
				this.action.translateEntity({
					entity : entity,
					prePos : initialVal.pos,
					pos : newpos
				});
			} else {
				// 移動中
				entity.setPosition(newpos);
			}
		}
	};

	// ローカル回転
	Manipulator.prototype.rotate = function (meshInstance, startRay, endRay, initialVal, isDone) {
		let name = meshInstance.mesh.name;
		if (meshInstance.mesh.entity) {
			let entity = meshInstance.mesh.entity.parent;
			let pos = entity.getPosition();

			let normals = [entity.right, entity.up, entity.forward];
			let plane = new pc.Plane(pos, normals[ROT_INDEX[name]]);
			let startPos = new pc.Vec3();
			let endPos = new pc.Vec3();
			let isHitStart = plane.intersectsRay(startRay, startPos);
			let isHitEnd = plane.intersectsRay(endRay, endPos);
			if (isHitStart && isHitEnd) {
				let diffStart = startPos.sub(pos);
				diffStart.normalize();
				let diffEnd = endPos.sub(pos);
				diffEnd.normalize();
				let side = new pc.Vec3().cross(ROT_VEC[name], diffStart);

				let y = upaint.Util.clamp(diffEnd.dot(diffStart), -1.0, 1.0);
				let x = upaint.Util.clamp(diffEnd.dot(side), -1.0, 1.0);
				let rot = Math.atan2(x, y);
				
				let quat = new pc.Quat();
				quat.setFromAxisAngle(ROT_VEC[name], rot * pc.math.RAD_TO_DEG);
				let newrot = entity.getRotation().clone().mul(quat);
				if (isDone) {
					// 回転の確定
					this.action.rotateEntity({
						entity : entity,
						preRot : initialVal.rot,
						rot : newrot
					});
				} else {
					// 回転中
					entity.setRotation(newrot);
				}
			}
		}
	};

	Manipulator.prototype.manipulate = function (
		meshInstance, startRay, endRay, downpos, curpos, initialVal, isDone) {
		let name = meshInstance.mesh.name;
		if (ROT_INDEX.hasOwnProperty(name)) {
			this.rotate(meshInstance, startRay, endRay, initialVal, isDone);
		} else if (TRANS_INDEX.hasOwnProperty(name)) {
			this.translate(meshInstance, downpos, curpos, initialVal, isDone);
		}
	};

	Manipulator.EVENT_ROTATE = "rotate"
	upaint.Manipulator = Manipulator;

}());