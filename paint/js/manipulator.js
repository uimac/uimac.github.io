(function () {
	"use strict";
	let PivotSize = 0.2;

	let Manipulator = function () {
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
	};

	Manipulator.prototype.initRotationHandles = function () {
		let createHandle = function (mat, name) {
			let mesh = pc.createTorus(pc.app.graphicsDevice, {
				tubeRadius : 0.03, 
				ringRadius : 0.8
			});
			mesh.name = name;
			let model = upaint.Util.createImeddiateModel(mesh, mat);
			model.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
			mesh.entity = this.manipEntity_;
			return model;
		}.bind(this);

		let xmat = this.mat.clone();
		xmat.color.set(1, 0, 0, 1);
		this.rot_x_ = createHandle(xmat, Manipulator.MANIP_NAME_ROTX);
		this.rot_x_.pcentity.setLocalEulerAngles(0, 0, 90);

		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.rot_y_ = createHandle(ymat, Manipulator.MANIP_NAME_ROTY);

		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.rot_z_ = createHandle(zmat, Manipulator.MANIP_NAME_ROTZ);
		let a = new pc.Quat();
		let b = new pc.Quat();
		a.setFromAxisAngle(new pc.Vec3(0, 0, 1), 90);
		b.setFromAxisAngle(new pc.Vec3(1, 0, 0), 90);
		this.rot_z_.pcentity.setLocalRotation(a.mul(b));

		this.manipEntity_.addChild(this.rot_x_.pcentity);
		this.manipEntity_.addChild(this.rot_y_.pcentity);
		this.manipEntity_.addChild(this.rot_z_.pcentity);
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
		a.setFromAxisAngle(new pc.Vec3(0, 0, 1), 90);
		b.setFromAxisAngle(new pc.Vec3(1, 0, 0), 90);
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
			
			let canTrans = entity.name === "Model";
			for (let i = 0; i < this.trans_x_.length; ++i) {
				this.trans_x_[i].setVisible(canTrans);
				this.trans_y_[i].setVisible(canTrans);
				this.trans_z_[i].setVisible(canTrans);
			}
			if (this.target_) {
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
	Manipulator.IsManipulator = function (meshInstance) {
		let name = meshInstance.mesh.name;
		return TRANS_INDEX.hasOwnProperty(name) 
			|| ROT_INDEX.hasOwnProperty(name);
	};
	Manipulator.GetManipulatorType = function (meshInstance) {
		return meshInstance.mesh.name;
	};
	Manipulator.GetEntity = function (meshInstance) {
		return meshInstance.mesh.entity;
	};
	
	// 移動
	Manipulator.Trans = function (meshInstance, downpos, curpos) {
		let name = meshInstance.mesh.name;
		if (meshInstance.mesh.entity) {
			let entity = meshInstance.mesh.entity.parent;
			let pos = entity.getPosition();

			let diff = curpos.sub(downpos);
			let prePos = entity.getPosition();
			prePos.data[TRANS_INDEX[name]] += diff.data[TRANS_INDEX[name]]
			entity.setPosition(prePos);
		}
	};

	// ローカル回転
	Manipulator.Rot = function (meshInstance,  startRay, endRay) {
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
				let preRot = entity.getRotation();
				entity.setRotation(preRot.mul(quat));
			}
		}
	};

	Manipulator.Manipulate = function (meshInstance, startRay, endRay, downpos, curpos) {
		let name = meshInstance.mesh.name;
		if (ROT_INDEX.hasOwnProperty(name)) {
			Manipulator.Rot(meshInstance, startRay, endRay);
		} else if (TRANS_INDEX.hasOwnProperty(name)) {
			Manipulator.Trans(meshInstance, downpos, curpos);
		}
	};
	upaint.Manipulator = Manipulator;

}());