(function () {
	"use strict";
	let PivotSize = 0.2;

	let Manipulator = function () {
		this.manipEntity_ = new pc.Entity('Manip');
		this.target_ = null;

		// ハンドル用マテリアル
		this.mat = new pc.BasicMaterial();
		this.mat.cull = pc.CULLFACE_NONE;
		this.mat.depthTest = false;
		this.mat.blendType = pc.BLEND_NORMAL;
		this.mat.update();

		// ハンドルMesh
		let createHandle = function (mat) {
			let mesh = upaint.Util.createCylinderNoCap(pc.app.graphicsDevice, {
				heightSegments  : 1,
				capSegments  : 32
			});
			let model = upaint.Model.createModelFromMesh(mesh,  mat);
			let layer = pc.app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
			if (layer) {
				layer.addMeshInstances(model.pcmodel.meshInstances);
			}
			model.pcentity.setLocalScale(PivotSize, PivotSize / 20, PivotSize);
			return model;
		};

		let xmat = this.mat.clone();
		xmat.color.set(1, 0, 0, 1);
		this.xaxis_ = createHandle(xmat);

		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.yaxis_ = createHandle(ymat);
		let a = new pc.Quat();
		let b = new pc.Quat();
		a.setFromAxisAngle(new pc.Vec3(0, 0, 1), 90);
		b.setFromAxisAngle(new pc.Vec3(1, 0, 0), 90);
		this.yaxis_.pcentity.setLocalRotation(a.mul(b));
		
		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.zaxis_ = createHandle(zmat);
		this.zaxis_.pcentity.setLocalEulerAngles(0, 0, 90);

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

	upaint.Manipulator = Manipulator;
	
}());