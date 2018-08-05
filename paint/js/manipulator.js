(function () {
	"use strict";
	const MANIP_NAME_TRANSX = "mainp_transx";
	const MANIP_NAME_TRANSY = "mainp_transy";
	const MANIP_NAME_TRANSZ = "mainp_transz";
	const MANIP_NAME_ROTX = "mainp_rotx";
	const MANIP_NAME_ROTY = "mainp_roty";
	const MANIP_NAME_ROTZ = "mainp_rotz";
	const MANIP_NAME_ROTW = "mainp_rotw";
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
	let PivotSize = 0.2;

	let Manipulator = function (store, action) {
		this.action = action;
		this.camera = null;
		this.canvasResolution = {};

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

		this.bbox_ = new pc.BoundingBox(
			this.manipEntity_.getPosition().clone(), 
			this.manipEntity_.getLocalScale().clone().scale(0.5));
			
		store.on(upaint.Store.EVENT_RESIZE, function (err) {
			this.resize();
		}.bind(this));
		
		store.on(upaint.Store.EVENT_ORIENTATION_CHANGE, function (err) {
			this.resize();
		}.bind(this));

		this.ccdik = new upaint.CCDIK();
	};

	/// カメラにより初期化する
	Manipulator.prototype.init = function (camera) {
		this.camera = camera;
		this.resize();
	};

	/**
	 * 終了処理
	 */
	Manipulator.prototype.destroy = function () {
		this.pcentity.destroy();
	};

	/**
	 * キャンバスのサイズが変わった場合など 
	 */
	Manipulator.prototype.resize = function () {
		let canvas = pc.app.graphicsDevice.canvas;
		this.canvasResolution = {
			width : canvas.width,
			height : canvas.height
		};
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
		this.rot_x_ = createHandle(xmat, MANIP_NAME_ROTX, Math.PI);
		this.rot_x_.pcentity.setLocalEulerAngles(0, 0, 90);

		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.rot_y_ = createHandle(ymat, MANIP_NAME_ROTY, Math.PI);

		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.rot_z_ = createHandle(zmat, MANIP_NAME_ROTZ, Math.PI);
		let a = new pc.Quat();
		let b = new pc.Quat();
		a.setFromAxisAngle(upaint.Constants.AxisZ, 90);
		b.setFromAxisAngle(upaint.Constants.AxisX, 90);
		this.rot_z_.pcentity.setLocalRotation(a.mul(b));

		let wmat = this.mat.clone();
		wmat.color.set(0.6, 0.6, 0.6, 0.2);
		wmat.blendType = pc.BLEND_NORMAL;
		this.rot_w_ = createHandle(wmat, MANIP_NAME_ROTW, Math.PI * 2, true);

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
		this.trans_x_ = createHandle(xmat, MANIP_NAME_TRANSX);
		for (let i = 0; i < this.trans_x_.length; ++i) {
			this.trans_x_[i].pcentity.setLocalEulerAngles(0, 0, 90);
		}
		this.trans_x_[0].pcentity.setLocalPosition(-0.6 * PivotSize, 0, 0);
		this.trans_x_[1].pcentity.setLocalPosition(-1.2 * PivotSize, 0, 0); // cone


		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.trans_y_ = createHandle(ymat, MANIP_NAME_TRANSY);
		this.trans_y_[0].pcentity.setLocalPosition(0, 0.6 * PivotSize, 0);
		this.trans_y_[1].pcentity.setLocalPosition(0, 1.2 * PivotSize, 0); // cone
		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.trans_z_ = createHandle(zmat, MANIP_NAME_TRANSZ);
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
	 * 更新
	 */
	Manipulator.prototype.update = (function () {
		let qa = new pc.Quat();
		let qb = new pc.Quat();
		return function (camera) {
			if (!this.target) return;
			this.camera = camera;
			let rot = this.target.getRotation().clone().invert();
			let cameraPos = camera.pcentity.getPosition();
			let targetPos = this.target.getPosition().clone();
			let eyeVec = targetPos.sub(cameraPos);
			let distanceScale = Math.max(PivotSize * eyeVec.length() / 2, PivotSize);
			let scale = [distanceScale, distanceScale, distanceScale];
			eyeVec.normalize();
			eyeVec = rot.clone().transformVector(eyeVec);

			qa.x = eyeVec.z;
			qa.y = 0.0;
			qa.z = -eyeVec.x;
			qa.w = 1.0 + eyeVec.y;
			qa.normalize();
			this.rot_w_.pcentity.setLocalRotation(qa);
			this.rot_w_.pcentity.setLocalScale(scale[0], scale[1], scale[2]);

			// rot_x
			qa.setFromAxisAngle(upaint.Constants.AxisZ, 
				pc.math.RAD_TO_DEG * Math.PI * 0.5);
			qb.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.y, -eyeVec.z));
			this.rot_x_.pcentity.setLocalRotation(qa.mul(qb));
			this.rot_x_.pcentity.setLocalScale(scale[0], scale[1], scale[2]);

			// rot_y
			qa.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.x, -eyeVec.z));
			this.rot_y_.pcentity.setLocalRotation(qa);
			this.rot_y_.pcentity.setLocalScale(scale[0], scale[1], scale[2]);

			// rot_z
			qa.setFromAxisAngle(upaint.Constants.AxisX, 
				pc.math.RAD_TO_DEG * Math.PI * 0.5);
			qb.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.x, eyeVec.y));
			this.rot_z_.pcentity.setLocalRotation(qa.mul(qb));
			this.rot_z_.pcentity.setLocalScale(scale[0], scale[1], scale[2]);

			// trans
			for (let i = 0; i < this.trans_x_.length; ++i) {
				this.trans_x_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
				this.trans_x_[i].pcentity.setLocalPosition(-0.6 * (i+1) * scale[0], 0, 0);
				this.trans_y_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
				this.trans_y_[i].pcentity.setLocalPosition(0, 0.6 * (i+1) * scale[1], 0);
				this.trans_z_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
				this.trans_z_[i].pcentity.setLocalPosition(0, 0, 0.6 * (i+1) * scale[2]);
			}
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
				// 移動できるやつだけ移動マニピュレーターを出す
				let canTrans = true;//entity.name === "Model";
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
	
	// 移動
	Manipulator.prototype.translate = (function () {
		let tempVec = new pc.Vec3();
		return function (name, entity, initialpos, prepos, curpos, initialVal, isDone) {
			let normals = [entity.right, entity.up, entity.forward];
			let sign = (TRANS_INDEX[name] === 2) ? -1 : 1;

			let rot = entity.getRotation();
			let diff = curpos.sub(prepos);
			diff = rot.invert().transformVector(diff);

			let newpos = entity.getPosition().clone();
			tempVec = normals[TRANS_INDEX[name]].clone();
			tempVec.scale(sign * Math.sign(diff.data[TRANS_INDEX[name]]) * diff.length())
			newpos.add(tempVec);
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
	}());

	// ローカル回転
	Manipulator.prototype.rotate = function (name, entity, initialpos, prepos, curpos, initialVal, isDone) 
	{
		let cameraPos = this.camera.pcentity.getPosition();
		let initialRay = new pc.Ray(cameraPos, initialpos.clone().sub(cameraPos).normalize());
		let startRay = new pc.Ray(cameraPos, prepos.clone().sub(cameraPos).normalize());
		let endRay = new pc.Ray(cameraPos, curpos.clone().sub(cameraPos).normalize());

		let entityPos = entity.getPosition().clone();
		let normals = [entity.right, entity.up, entity.forward];
		let sign = (ROT_INDEX[name] === 2) ? -1 : 1;
		let isVertical = Math.abs(initialRay.direction.dot(normals[ROT_INDEX[name]])) < 0.25;

		let startEndRot = 0.0;
		if (isVertical) {
			let diffStart = prepos.sub(entityPos);
			diffStart.normalize();
			let diffEnd = curpos.sub(entityPos);
			diffEnd.normalize();
			let side = new pc.Vec3().cross(normals[ROT_INDEX[name]], diffStart);

			let y = upaint.Util.clamp(diffEnd.dot(diffStart), -1.0, 1.0);
			let x = upaint.Util.clamp(diffEnd.dot(side), -1.0, 1.0);
			startEndRot = Math.atan2(x, y);
		} else {
			let plane = new pc.Plane(entityPos, normals[ROT_INDEX[name]]);
			let startPos = new pc.Vec3();
			let endPos = new pc.Vec3();
			let isHitStart = plane.intersectsRay(startRay, startPos);
			let isHitEnd = plane.intersectsRay(endRay, endPos);
			if (isHitStart && isHitEnd) {
				let diffStart = startPos.sub(entityPos);
				diffStart.normalize();
				let diffEnd = endPos.sub(entityPos);
				diffEnd.normalize();
				let side = new pc.Vec3().cross(normals[ROT_INDEX[name]], diffStart);

				let y = upaint.Util.clamp(diffEnd.dot(diffStart), -1.0, 1.0);
				let x = upaint.Util.clamp(diffEnd.dot(side), -1.0, 1.0);
				startEndRot = Math.atan2(x, y);
			}
		}
		let quat = new pc.Quat();
		quat.setFromAxisAngle(ROT_VEC[name], sign * startEndRot * pc.math.RAD_TO_DEG);

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
	};

	Manipulator.prototype.manipulate = function (meshInstance, initial, start, end, initialVal, isDone) {
		let name = meshInstance.mesh.name;
		let entity = Manipulator.GetEntity(meshInstance);
		let dist = entity.getPosition().sub(this.camera.pcentity.getPosition()).length();

		if (!meshInstance.mesh.entity) { return; }
		let targetEntity = meshInstance.mesh.entity.parent;
		if (!targetEntity) { return; }

		let initialpos = this.camera.pccamera.screenToWorld(
			initial.x, initial.y, dist- this.bbox_.halfExtents.z / 2.0, 
			this.canvasResolution.width, this.canvasResolution.height);

		let prepos = this.camera.pccamera.screenToWorld(
			start.x, start.y, dist- this.bbox_.halfExtents.z / 2.0, 
			this.canvasResolution.width, this.canvasResolution.height);

		let curpos = this.camera.pccamera.screenToWorld(
			end.x, end.y, dist - this.bbox_.halfExtents.z / 2.0, 
			this.canvasResolution.width, this.canvasResolution.height);

		if (ROT_INDEX.hasOwnProperty(name)) {
			this.rotate(name, targetEntity, initialpos, prepos, curpos, initialVal, isDone);
		} else if (TRANS_INDEX.hasOwnProperty(name)) {
			this.translate(name, targetEntity, initialpos, prepos, curpos, initialVal, isDone);
		}
	};

	Manipulator.IsManipulator = function (meshInstance) {
		let name = meshInstance.mesh.name;
		return TRANS_INDEX.hasOwnProperty(name) 
			|| ROT_INDEX.hasOwnProperty(name);
	};
	
	Manipulator.GetEntity = function (meshInstance) {
		return meshInstance.mesh.entity;
	};

	upaint.Manipulator = Manipulator;

}());