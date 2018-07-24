(function () {
	"use strict";
	let PivotSize = 0.2;

	let Manipulator = function () {
		// xyz軸ハンドルの親
		this.manipEntity_ = new pc.Entity('Manip');
		this.target_ = null;

		// ハンドル用マテリアル
		this.mat = new pc.BasicMaterial();
		this.mat.cull = pc.CULLFACE_NONE;
		this.mat.depthTest = false;
		this.mat.blendType = pc.BLEND_NORMAL;
		this.mat.update();

		// ハンドルMesh
		let createHandle = function (mat, name) {
			let mesh = upaint.Util.createCylinderNoCap(pc.app.graphicsDevice, {
				heightSegments: 1,
				capSegments: 32
			});
			mesh.name = name;
			let model = upaint.Util.createImeddiateModel(mesh, mat);
			model.pcentity.setLocalScale(PivotSize, PivotSize / 20, PivotSize);
			mesh.entity = this.manipEntity_;
			return model;
		}.bind(this);

		let xmat = this.mat.clone();
		xmat.color.set(1, 0, 0, 1);
		this.xaxis_ = createHandle(xmat, Manipulator.MANIP_NAME_ROTX);
		this.xaxis_.pcentity.setLocalEulerAngles(0, 0, 90);

		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.yaxis_ = createHandle(ymat, Manipulator.MANIP_NAME_ROTY);

		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.zaxis_ = createHandle(zmat, Manipulator.MANIP_NAME_ROTZ);
		let a = new pc.Quat();
		let b = new pc.Quat();
		a.setFromAxisAngle(new pc.Vec3(0, 0, 1), 90);
		b.setFromAxisAngle(new pc.Vec3(1, 0, 0), 90);
		this.zaxis_.pcentity.setLocalRotation(a.mul(b));

		this.manipEntity_.addChild(this.xaxis_.pcentity);
		this.manipEntity_.addChild(this.yaxis_.pcentity);
		this.manipEntity_.addChild(this.zaxis_.pcentity);
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
			if (this.target_) {
				this.target_.addChild(this.manipEntity_);
			}
		}
	});

	Manipulator.MANIP_NAME_ROTX = "mainp_rotx";
	Manipulator.MANIP_NAME_ROTY = "mainp_roty";
	Manipulator.MANIP_NAME_ROTZ = "mainp_rotz";
	const AXISNUM = {
		"mainp_rotx": 0,
		"mainp_roty": 1,
		"mainp_rotz": 2
	};
	const AXISVEC = {
		"mainp_rotx": new pc.Vec3(1, 0, 0),
		"mainp_roty": new pc.Vec3(0, 1, 0),
		"mainp_rotz": new pc.Vec3(0, 0, 1)
	};
	Manipulator.IsManipulator = function (meshInstance) {
		let name = meshInstance.mesh.name;
		return (name === Manipulator.MANIP_NAME_ROTX ||
			name === Manipulator.MANIP_NAME_ROTY ||
			name === Manipulator.MANIP_NAME_ROTZ);
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
			prePos.data[AXISNUM[name]] += diff.data[AXISNUM[name]]
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
			let plane = new pc.Plane(pos, normals[AXISNUM[name]]);
			let startPos = new pc.Vec3();
			let endPos = new pc.Vec3();
			let isHitStart = plane.intersectsRay(startRay, startPos);
			let isHitEnd = plane.intersectsRay(endRay, endPos);
			if (isHitStart && isHitEnd) {
				let diffStart = startPos.sub(pos);
				diffStart.normalize();
				let diffEnd = endPos.sub(pos);
				diffEnd.normalize();
				let side = new pc.Vec3().cross(AXISVEC[name], diffStart);

				let y = upaint.Util.clamp(diffEnd.dot(diffStart), -1.0, 1.0);
				let x = upaint.Util.clamp(diffEnd.dot(side), -1.0, 1.0);
				let rot = Math.atan2(x, y);
				
				let quat = new pc.Quat();
				quat.setFromAxisAngle(AXISVEC[name], rot * pc.math.RAD_TO_DEG);
				let preRot = entity.getRotation();
				entity.setRotation(preRot.mul(quat));
			}
		}
	};
	upaint.Manipulator = Manipulator;

}());