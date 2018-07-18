(function () {
	"use strict";

	/**
	 * コンストラクタ
	 * @param {*} pcscene playcanvasシーン
	 */
	let Scene = function () {
		this.pcentity_ = new pc.Entity("Scene");

		this.pcscene_ = new pc.Scene();
		this.pcscene.gammaCorrection = pc.GAMMA_SRGB;
		this.pcscene.toneMapping = pc.TONEMAP_LINEAR;

		this.cameraList_ = []; //upaint.Cameraのリスト
		this.modelList_ = []; //upaint.Modelのリスト
		this.animationList_ = []; //upaint.*Animationのリスト

		// デフォルトカメラの追加
		this.addCamera(new upaint.Camera());
		pc.app.scene.ambientLight = new pc.Color(1, 1, 1);
	};

	/**
	 * 終了処理
	 */
	Scene.prototype.destroy = function () {
		for (let i = this.cameraList_.length - 1; i >= 0; --i) {
			this.deleteCamera(this.cameraList_[i]);
		}
		for (let i = this.modelList_.length - 1; i >= 0; --i) {
			this.deleteModel(this.modelList_[i]);
		}
		for (let i = this.animationList_.length - 1; i >= 0; --i) {
			this.deleteAnimation(this.animationList_[i]);
		}
		this.cameraList_ = [];
		this.modelList_ = [];
		this.animationList_ = [];
		this.pcentity.destroy();
		this.pcscene.destroy();
	};

	/**
	 * モデルを保持しているか
	 * @param {*} model 
	 */
	Scene.prototype.hasModel = function (model) {
		return (this.modelList_.indexOf(model) >= 0);
	};

	/**
	 * モデルの追加
	 * @param {*} model 
	 */
	Scene.prototype.addModel = function (model) {
		if (this.hasModel(model)) return;
		this.modelList_.push(model);
		this.pcentity.addChild(model.pcentity);
		if (model.pcmodel) {
			if (!this.pcscene.containsModel(model.pcmodel)) {
				this.pcscene.addModel(model.pcmodel);
			}
		}
	};

	/**
	 * モデルを取り除く
	 * @param {*} model 
	 */
	Scene.prototype.removeModel = function (model) {
		if (this.hasModel(model)) {
			this.modelList_.splice(this.modelList_.indexOf(model), 1);
			this.pcentity.removeChild(model.pcentity);
			if (model.pcmodel) {
				if (this.pcscene.containsModel(model.pcmodel)) {
					this.pcscene.removeModel(model.pcmodel);
				}
			}
		}
	};
	
	/**
	 * モデルの削除
	 * @param {*} model 
	 */
	Scene.prototype.deleteModel = function (model) {
		if (this.hasModel(model)) {
			this.removeModel(model);
			model.destroy();
		}
	};

	/**
	 * アニメーションを保持しているか
	 * @param {*} animation 
	 */
	Scene.prototype.hasAnimation = function (animation) {
		return (this.animationList_.indexOf(animation) >= 0);
	};

	/**
	 * アニメーションの追加
	 * @param {*} animation 
	 */
	Scene.prototype.addAnimation = function (animation) {
		if (this.hasAnimation(animation)) return;
		this.animationList_.push(animation);
		this.pcentity.addChild(animation.pcentity);
	};

	/**
	 * アニメーションを取り除く
	 * @param {*} animation 
	 */
	Scene.prototype.removeAnimation = function (animation) {
		if (this.hasAnimation(animation)) {
			this.animationList_.splice(this.modelList_.indexOf(animation), 1);
			this.pcentity.removeChild(animation.pcentity);
		}
	};
	
	/**
	 * アニメーションを削除
	 * @param {*} animation 
	 */
	Scene.prototype.deleteAnimation = function (animation) {
		if (this.hasAnimation(animation)) {
			this.removeAnimation(animation);
			animation.destroy();
		}
	};

	/**
	 * カメラを保持しているか
	 * @param {*} camera 
	 */
	Scene.prototype.hasCamera = function (camera) {
		return (this.cameraList_.indexOf(camera) >= 0);
	};

	/**
	 * カメラの追加
	 * @param {*} camera 
	 */
	Scene.prototype.addCamera = function (camera) {
		if (this.hasCamera(camera)) return;
		this.cameraList_.push(camera);
		this.pcentity.addChild(camera.pcentity);
	};

	/**
	 * カメラを取り除く
	 * @param {*} camera 
	 */
	Scene.prototype.removeCamera = function (camera) {
		if (this.hasCamera(camera)) {
			this.cameraList_.splice(this.cameraList_.indexOf(camera), 1);
			this.pcentity.removeChild(camera.pcentity);
		}
	};

	/**
	 * カメラの削除
	 * @param {*} camera 
	 */
	Scene.prototype.deleteCamera = function (camera) {
		if (this.hasCamera(camera)) {
			this.removeCamera(camera);
			camera.destroy();
		}
	};

	/**
	 * カメラリストを返す
	 */
	Object.defineProperty(Scene.prototype, 'cameraList', {
		get : function () {
			return this.cameraList_;
		}
	});

	/**
	 * アニメーションリストを返す
	 */
	Object.defineProperty(Scene.prototype, 'animationList', {
		get : function () {
			return this.animationList_;
		}
	});

	/**
	 * playcanvas entity
	 */
	Object.defineProperty(Scene.prototype, 'pcentity', {
		get: function () {
			return this.pcentity_;
		}
	});

	/**
	 * playcanvas scene
	 */
	Object.defineProperty(Scene.prototype, 'pcscene', {
		get: function () {
			return this.pcscene_;
		}
	});

	window.upaint.Scene = Scene;
}());