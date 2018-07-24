(function () {
	"use strict";

	let PivotSize = 0.05;

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
		this.mat.blendType = pc.BLEND_NORMAL;
		this.mat.color.fromString(upaint.Constants.HandleColor)
		this.mat.depthTest = false;
		this.mat.update();

		this.handleList = [];
		this.addSphere(this.root);

		this.manip = new upaint.Manipulator();
		this.showManipulator(this.root);
	};
	Skeleton.prototype = Object.create(EventEmitter.prototype);

	/**
	 * 終了処理
	 */
	Skeleton.prototype.destroy = function () {
		this.deleteHandleList();
		this.pcentity.destroy();
		this.mat.destroy();
	};

	Skeleton.prototype.deleteHandleList = function () {
		let layer = pc.app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
		for (let i = 0; i < this.handleList.length; ++i) {
			let model = this.handleList[i];
			if (layer) {
				layer.removeMeshInstances(model.pcmodel.meshInstances)
			}
			model.destroy();
		}
		this.handleList = [];
	};

	Skeleton.prototype.showManipulator = function (pcentity) {
		this.manip.target = pcentity;
	};

	Skeleton.prototype.addSphere = function (root) {
		if (!root) return;
		for (let i = 0; i < root.children.length; ++i) {
			this.addSphere(root.children[i]);
		}
		let mesh = pc.createSphere(pc.app.graphicsDevice);
		let model = upaint.Model.createModelFromMesh(mesh, this.mat.clone());
		mesh.name = Skeleton.HANDLE_NAME;
		mesh.skeleton = this;
		mesh.entity = root;
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

	Skeleton.HANDLE_NAME = "skeleton_handle"
	Skeleton.IsSkeleton = function (meshInstance) {
		let name = meshInstance.mesh.name;
		return (name === Skeleton.HANDLE_NAME);
	};
	Skeleton.ShowManipulator = function (meshInstnace) {
		let skeleton = meshInstnace.mesh.skeleton;
		skeleton.showManipulator(meshInstnace.mesh.entity);
	}
	upaint.Skeleton = Skeleton;

}());
