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

		this.cameraList = []; //upaint.Cameraのリスト
		this.modelList = []; //upaint.Modelのリスト
		this.animationList = []; //upaint.*Animationのリスト

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
		this.modelList.push(model);
		this.pcentity.addChild(model.pcentity);
	};
	
	/**
	 * アニメーションの追加
	 * @param {*} model 
	 */
	Scene.prototype.addAnimation = function (animation) {
		this.animationList.push(animation);
	};

	/**
	 * カメラの追加
	 * @param {*} camera 
	 */
	Scene.prototype.addCamera = function (camera) {
		this.cameraList.push(camera);
		this.pcentity.addChild(camera.pcentity);
	};

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