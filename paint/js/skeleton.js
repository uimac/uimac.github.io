(function () {
	"use strict";

	let HandleSize = upaint.Constants.SkeletonHandleSize;

	/**
	 * スケルトン操作＆描画用クラス
	 * @param {} rootEntity スケルトンのルートにあたるentity
	 */
	let Skeleton = function (rootEntity) {
		EventEmitter.call(this);
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

	Skeleton.prototype.addSphere = function (root) {
		if (!root) return;
		for (let i = 0; i < root.children.length; ++i) {
			this.addSphere(root.children[i]);
		}
		let mesh = pc.createSphere(pc.app.graphicsDevice);
		mesh.name = Skeleton.HANDLE_NAME;
		mesh.entity = root;
		
		let model = upaint.Util.createImeddiateModel(mesh, this.mat.clone());
		model.pcentity.setLocalScale(HandleSize, HandleSize, HandleSize);
		root.addChild(model.pcentity);

		this.handleList.push(model);
	};

	Skeleton.prototype.setIKHandle = function (entity, iteration = 2) {
		for (let i = 0; i < this.handleList.length; ++i) {
			let model = this.handleList[i];
			for (let k = 0; k < model.pcmodels.length; ++k) {
				let skeletonHandleEntity = model.pcmodels[k].meshInstances[0].mesh.entity;
				if (skeletonHandleEntity === entity) {
					let parent = model.pcentity.parent;
					model.pcentity.name = "IKTarget"
					model.pcentity.reparent(this.root)
					model.pcentity.setPosition(parent.getPosition());
					model.pcentity.setLocalScale(HandleSize * 1.5, HandleSize * 1.5, HandleSize * 1.5);
					model.pcmaterial.color.set(0, 1, 1);
					model.pcentity.iteration = iteration;
					model.pcentity.ikeffector = skeletonHandleEntity;
					model.pcmodels[k].meshInstances[0].mesh.entity = model.pcentity
				}
			}
		}
	};

	Skeleton.prototype.setVisible = function (entity, visible) {
		for (let i = 0; i < this.handleList.length; ++i) {
			let model = this.handleList[i];
			for (let k = 0; k < model.pcmodels.length; ++k) {
				let skeletonHandleEntity = model.pcmodels[k].meshInstances[0].mesh.entity;
				if (skeletonHandleEntity === entity) {
					model.setVisible(visible);
				}
			}
		}
	};

	/**
	 * playcanvas entity
	 */
	Object.defineProperty(Skeleton.prototype, 'pcentity', {
		get: function () {
			return this.root;
		}
	});

	Skeleton.HANDLE_NAME = "skeleton_handle"
	Skeleton.IsSkeleton = function (meshInstance) {
		let name = meshInstance.mesh.name;
		return (name === Skeleton.HANDLE_NAME);
	};
	Skeleton.IsIKHandle = function (meshInstance) {
		return (meshInstance.mesh.entity.ikeffector !== undefined);
	};
	Skeleton.GetEntity = function (meshInstnace) {
		return meshInstnace.mesh.entity;
	}
	upaint.Skeleton = Skeleton;

}());
