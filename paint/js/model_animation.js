(function () {
	"use strict";

	function findAnimation(root) {
		if (root.script && root.script.anim) {
			return root.script.anim.animComponent;
		}
		for (let i = 0; i < root.children.length; ++i) {
			let anim = findAnimation(root.children[i]);
			if (anim) {
				return anim;
			}
		}
		return null;
	}

	let ModelAnimation = function (model) {
		EventEmitter.call(this);
		this.pcentity_ = new pc.Entity("ModelAnimation");
		this.refarence_model_ = model;
	
		this.anim = findAnimation(model.pcentity);
		
		// 初期状態は全停止.
		if (this.anim) {
			for (let clipName in this.anim.animClips) {
				let clip = this.anim.animClips[clipName];
				clip.stop();
				clip.loop = false;
				this.targets = clip.getAnimTargets();
			}
		}

		// スキン
		let pcmodel = model.pcmodel;
		for (let i = 0; i < pcmodel.skinInstances.length; ++i) {
			this.skin = pcmodel.skinInstances[i];
		}
	};
	ModelAnimation.prototype = Object.create(EventEmitter.prototype);

	/**
	 * 終了処理
	 */
	ModelAnimation.prototype.destroy = function () {
		this.pcentity.destroy();
		this.refarence_model_.skeleton.destroy();
	};

	/**
	 * アニメーション対象のモデル
	 */
	Object.defineProperty(ModelAnimation.prototype, 'refarence_model', {
		get: function () {
			return this.refarence_model_;
		}
	});

	/**
	 * playcanvas entity
	 */
	Object.defineProperty(ModelAnimation.prototype, 'pcentity', {
		get: function () {
			return this.pcentity_;
		}
	});

	window.upaint.ModelAnimation = ModelAnimation;

}());