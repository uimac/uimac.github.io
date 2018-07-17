(function () {
	"use strict";

	let PivotSize = 0.1;

	/**
	 * スケルトン操作＆描画用クラス
	 * @param {} rootEntity スケルトンのルートにあたるentity
	 */
	let Skeleton = function (rootEntity) {
		EventEmitter.call(this);
		// スケルトン描画用entity
		this.pcentity_ = new pc.Entity('Skeleton');
		// スケルトンのルート
		this.root = rootEntity;

		this.gizmo_ = new pc.Entity('Gizmo')

		this.mat = new pc.BasicMaterial();
		this.mat.color.set(0, 0.5, 0);
		this.mat.depthTest = false;
		this.mat.update();
	};

	Skeleton.prototype.update = function () {
		this.addSphere(this.root);
	};

	Skeleton.prototype.addSphere = function (root) {
		if (!root) return;
		let mesh = pc.createSphere(pc.app.graphicsDevice);
		let model = upaint.Model.createModelFromMesh(mesh, this.mat.clone());

		for (let i = 0; i < root.children.length; ++i) {
			this.addSphere(root.children[i]);
		}
		let layer = pc.app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
		if (layer) {
			layer.addMeshInstances(model.pcmodel.meshInstances);
		}
		model.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize)
		root.addChild(model.pcentity);
	};

	Object.defineProperty(Skeleton.prototype, 'gizmo', {
		get: function () {
			return this.gizmo_;
		}
	});

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
