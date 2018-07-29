(function () {
	"use strict";

	let Model = function (entity) {
		EventEmitter.call(this);
		this.pcentity_ = entity;
		if (!this.pcentity) {
			this.pcentity_ = new pc.Entity("Model");
		}

		this.skeleton_ = null;
		this.pcmodels_ = null; // list of pc.Model
		this.pcmodelcomps_ = null; // list of pc.ModelComponent
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
			for (let i = 0; i < this.pcmodelcomps.length; ++i) {
				this.pcmodelcomps[i].show();
			}
		} else {
			for (let i = 0; i < this.pcmodelcomps.length; ++i) {
				this.pcmodelcomps[i].hide();
			}
		}
	};

	/// pc.Modelを再帰的に探して返す
	function findModels(dstModelList, root) {
		if (root.model) {
			dstModelList.push(root.model.model)
			return root.model.model;
		}
		for (let i = 0; i < root.children.length; ++i) {
			let model = findModels(dstModelList, root.children[i]);
			if (model) {
				return model;
			}
		}
		return null;
	}

	/// pc.ModelComponentを再帰的に探して返す
	function findModelComponents(dstModelCompList, root) {
		if (root.model) {
			dstModelCompList.push(root.model)
			return root.model;
		}
		for (let i = 0; i < root.children.length; ++i) {
			let modelComponent = findModelComponents(dstModelCompList, root.children[i]);
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
	 * list of playcanvas model
	 */
	Object.defineProperty(Model.prototype, 'pcmodels', {
		get: function () {
			if (!this.pcmodels_) {
				this.pcmodels_= [];
				findModels(this.pcmodels_, this.pcentity);
			}
			return this.pcmodels_;
		}
	});

	/**
	 * list of playcanvas modelcomponent
	 */
	Object.defineProperty(Model.prototype, 'pcmodelcomps', {
		get: function () {
			if (!this.pcmodelcomps_) {
				this.pcmodelcomps_= [];
				findModelComponents(this.pcmodelcomps_, this.pcentity);
			}
			return this.pcmodelcomps_;
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
