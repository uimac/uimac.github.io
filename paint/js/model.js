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
	 * 終了処理
	 */
	Model.prototype.destroy = function () {
		this.pcentity.destroy();		
	};

	/**
	 * visibleの設定
	 * @param {*} visible 
	 */
	Model.prototype.setVisible = function (visible) {
		if (visible) {
			this.pcmodelcomp.show();
		} else {
			this.pcmodelcomp.hide();
		}
	};

	/// pc.Modelを再帰的に探して返す
	function findModel(root) {
		if (root.model) {
			return root.model.model;
		}
		for (let i = 0; i < root.children.length; ++i) {
			let model = findModel(root.children[i]);
			if (model) {
				return model;
			}
		}
		return null;
	}

	/// pc.ModelComponentを再帰的に探して返す
	function findModelComponent(root) {
		if (root.model) {
			return root.model;
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
	 * playcanvas material
	 */
	Object.defineProperty(Model.prototype, 'pcmaterial', {
		get: function (index = 0) {
			if (this.pcmodel_ && this.pcmodel_.meshInstances.length > index) {
				return this.pcmodel_.meshInstances[index].material;
			}
			return null;
		},
		set : function (mat, index = 0) {
			if (this.pcmodel_ && this.pcmodel_.meshInstances.length > index) {
				return this.pcmodel_.meshInstances[index].material = mat;
			}
		}
	});

	/**
	 * playcanvas model
	 */
	Object.defineProperty(Model.prototype, 'pcmodel', {
		get: function () {
			if (!this.pcmodel_) {
				this.pcmodel_ = findModel(this.pcentity);
			}
			return this.pcmodel_;
		}
	});

	/**
	 * playcanvas modelcomponent
	 */
	Object.defineProperty(Model.prototype, 'pcmodelcomp', {
		get: function () {
			if (!this.pcmodelcomp_) {
				this.pcmodelcomp_ = findModelComponent(this.pcentity);
			}
			return this.pcmodelcomp_;
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

	/**
	 * pcmeshからModelを作成して返す
	 */
	Model.createModelFromMesh = function (pcmesh, pcmat = null) {
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

	window.upaint.Model = Model;
}());
