(function () {
	"use strict";

	let PivotSize = 0.1;

	/**
	 * スケルトン操作＆描画用クラス
	 * @param {} rootEntity スケルトンのルートにあたるentity
	 */
	let Skeleton = function (rootEntity) {
		EventEmitter.call(this);
		// スケルトン用entity
		this.pcentity_ = new pc.Entity('Skeleton');
		// スケルトンのルート
		this.root = rootEntity;

		// ハンドル用マテリアル
		this.mat = new pc.BasicMaterial();
		this.mat.color.set(0, 0.5, 0);
		this.mat.depthTest = false;
		this.mat.update();

		this.handleList = [];
		this.addSphere(this.root);
	};

	Skeleton.prototype.destroy = function () {
		let layer = pc.app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
		for (let i = 0; i < this.handleList.length; ++i) {
			let model = this.handleList[i];
			if (layer) {
				layer.removeMeshInstances(model.pcmodel.meshInstances)
			}
			model.destroy();
		}
		this.handleList = [];
		this.pcentity.destroy();
		this.mat.destroy();
	};

	Skeleton.prototype.addSphere = function (root) {
		if (!root) return;
		for (let i = 0; i < root.children.length; ++i) {
			this.addSphere(root.children[i]);
		}
		let mesh = pc.createSphere(pc.app.graphicsDevice);
		let model = upaint.Model.createModelFromMesh(mesh, this.mat.clone());
		model.pcentity.name = "Sphere"
		let layer = pc.app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
		if (layer) {
			layer.addMeshInstances(model.pcmodel.meshInstances);
		}
		model.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize)
		root.addChild(model.pcentity);
		this.handleList.push(model);
	};

	/**
	 * playcanvas entity
	 */
	Object.defineProperty(Skeleton.prototype, 'pcentity', {
		get: function () {
			return this.pcentity_;
		}
	});

	upaint.Skeleton = Skeleton;

}());
