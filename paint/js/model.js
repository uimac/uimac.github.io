(function () {
	"use strict";

	let Model = function (entity) {
		EventEmitter.call(this);
		this.pcentity_ = entity;
		if (!this.pcentity) {
			this.pcentity_ = new pc.Entity("Model");
		}

		this.skeleton_ = null;
		this.pcmodel_ = null; // pc.ModelComponent
	};
	Model.prototype = Object.create(EventEmitter.prototype);

	/**
	 * destruct
	 */
	Model.prototype.destroy = function () {
		this.pcentity.destroy();		
	};

	function findModelComponent(root) {
		if (root.model) {
			return root.model.model;
		}
		for (let i = 0; i < root.children.length; ++i) {
			let modelComponent = findModelComponent(root.children[i]);
			if (modelComponent) {
				return modelComponent;
			}
		}
		return null;
	}

	/**
	 * skeleton
	 */
	Object.defineProperty(Model.prototype, 'skeleton', {
		get: function () {
			return this.skeleton_;
		},
		set : function (skeleton) {
			this.skeleton_ = skeleton;
		}
	});

	/**
	 * playcanvas modelcomponent
	 */
	Object.defineProperty(Model.prototype, 'pcmodel', {
		get: function () {
			if (!this.pcmodel_) {
				this.pcmodel_ = findModelComponent(this.pcentity);
			}
			return this.pcmodel_;
		}
	});

	/**
	 * playcanvas entity
	 */
	Object.defineProperty(Model.prototype, 'pcentity', {
		get: function () {
			return this.pcentity_;
		}
	});

	window.upaint.Model = Model;

	/**
	 * pcmeshからModelを作成して返す
	 */
	window.upaint.Model.createModelFromMesh = function (pcmesh, pcmat = null) {
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
		let model = new Model();
		model.pcentity.addComponent('model')
		model.pcentity.model.model = pcmodel;
		return model;
	};
}());
