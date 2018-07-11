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
	
	Model.prototype.updateSkeleton = function () {
		if (!this.skeleton_) {
			this.skeleton_ = new upaint.Skeleton(this.pcentity);
		}
		this.skeleton.update();
	};

	/**
	 * skeleton
	 */
	Object.defineProperty(Model.prototype, 'skeleton', {
		get: function () {
			return this.skeleton_;
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

}());
