(function () {
	"use strict";
	let PivotSize = 0.1;

	let Manipulator = function () {
		this.manipEntity_ = new pc.Entity('Manip');
		this.target_ = null;

		// ハンドル用マテリアル
		this.mat = new pc.BasicMaterial();
		this.mat.color.set(1, 0.5, 0);
		this.mat.depthTest = false;
		this.mat.update();
		let mesh = pc.createBox(pc.app.graphicsDevice);
		this.manipModel_ = upaint.Model.createModelFromMesh(mesh, this.mat.clone());
		let layer = pc.app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
		if (layer) {
			layer.addMeshInstances(this.manipModel_.pcmodel.meshInstances);
		}
		this.manipModel_.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
		this.manipEntity_.addChild(this.manipModel_.pcentity);
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