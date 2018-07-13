(function () {
	"use strict";

	/**
	 * 
	 */
	function createFromMesh (pcmesh, pcmat = null) {
		let node = new pc.GraphNode();
		let mat;
		if (pcmat) {
			mat = pcmat;
		} else {
			mat = new pc.BasicMaterial();
		}
		let instance = new pc.MeshInstance(node, pcmesh, mat);
		let pcmodel = new pc.Model();
		pcmodel.graph = node;
		pcmodel.meshInstances = [ instance ];
		pc.app.scene.addModel(pcmodel);
		return pcmodel;
	};

	/**
	 * スケルトン操作＆描画用クラス
	 * @param {} rootEntity スケルトンのルートにあたるentity
	 */
	let Skeleton = function (rootEntity) {
		EventEmitter.call(this);
		this.pcentity_ = rootEntity;
	};

	Skeleton.prototype.update = function () {
		let pcmodel = this.initSpheres();
		let entity = new pc.Entity('Skeleton')
		entity.addComponent('model');
		this.pcentity_.addChild(entity);
	}

	Skeleton.prototype.initSpheres = function () {
		// let mesh = pc.createSphere(pc.app.graphicsDevice);
		// createFromMesh(mesh);
	}

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
