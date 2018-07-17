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
		this.pcscene.destroy();
	};

	/**
	 * モデルの追加
	 * @param {*} model 
	 */
	Scene.prototype.addModel = function (model) {
		this.modelList_.push(model);
		this.pcentity.addChild(model.pcentity);
		if (model.pcmodel) {
			if (!this.pcscene.containsModel(model.pcmodel)) {
				this.pcscene.addModel(model.pcmodel);
			}
		}
	};
	
	/**
	 * アニメーションの追加
	 * @param {*} model 
	 */
	Scene.prototype.addAnimation = function (animation) {
		this.animationList_.push(animation);
		this.pcentity.addChild(animation.pcentity);
	};

	/**
	 * カメラの追加
	 * @param {*} camera 
	 */
	Scene.prototype.addCamera = function (camera) {
		this.cameraList_.push(camera);
		this.pcentity.addChild(camera.pcentity);
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