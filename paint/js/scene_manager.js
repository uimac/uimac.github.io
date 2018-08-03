(function () {
	"use strict";
	/**
	 * コンストラクタ
	 * @param {} gui 
	 */
	let SceneManager = function (store, action) {
		let app = store.pcapp;
		app.setCanvasResolution(pc.RESOLUTION_AUTO);
		app.setCanvasFillMode(pc.FILLMODE_NONE);
		// これを行うと解像度変更したときにpickがずれる
		//app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
		app.start();
		app.root.addComponent("script", { enabled: true });

		this.pick = new upaint.Pick(store, action);

		this.pick.on(upaint.Pick.EVENT_MANIP_ROTATE, function (err, type, manip) {
			this.captureImage(150, 100, function (err, data) {
				action.addKeyFrame({
					frameData : {
						image : data
					}
				});
			})
		}.bind(this));

		// function createMenu() {
		// 	let menu = new pc.Entity();
		// 	menu.name = "Menu";
		// 	menu.addComponent("screen", {resolution: new pc.Vec2(640,480), screenSpace: true});
		// 	menu.screen.scaleMode = "blend";
		// 	menu.screen.referenceResolution = new pc.Vec2(1280,720);
		// 	let container = new pc.Entity();
		// 	container.name = "Container";
		// 	container.addComponent("element", {
		// 		type: "image",
		// 		anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
		// 		pivot: new pc.Vec2(0.5, 0.5),
		// 		width: 900,
		// 		height: 400,
		// 		opacity: 1,
		// 		color: new pc.Color(0.1, 0.7, 1.0),
		// 		mask: false
		// 	});
		// 	container.drawOrder = -1000;
		// 	app.root.addChild(menu);
		// 	menu.addChild(container);
		// 	menu.screen.syncDrawOrder();
		// 	return container;
		// };
		// createMenu();

		this.sceneList_ = []; // upaint.Sceneのリスト
	};

	/**
	 * 終了処理
	 */
	SceneManager.prototype.destroy = function () {
		if (this.pick) {
			this.pick.destroy();
		}
		for (let i = 0; i < this.sceneList.length; ++i) {
			this.deleteScene(this.sceneList[i]);
		}
		this.sceneList_ = [];
		this.currentScene = null;
	};

	/**
	 * 新規シーンを作成してカレントシーンに設定する
	 */
	SceneManager.prototype.newScene = function () {
		let scene = new upaint.Scene();
		this.sceneList.push(scene);
		this.currentScene = scene;
		return scene;
	};

	/**
	 * シーンを削除する
	 * カレントシーンを消した場合、別のシーンをカレントにする
	 * @param {*} scene 
	 */
	SceneManager.prototype.deleteScene = function (scene) {
		let isCurrentScene = (this.currentScene === scene);
		pc.app.root.removeChild(scene.pcentity);
		scene.destroy();
		this.sceneList.splice(this.sceneList.indexOf(scene), 1);
		if (isCurrentScene && this.sceneList.length > 1) {
			this.currentScene = this.sceneList[0];
		}
	};

	/**
	 * 現在のシーンをキャプチャして返す
	 */
	SceneManager.prototype.captureImage = function (width, height, callback) {
		let dummyCanvas = document.createElement("canvas");
		let canvas = pc.app.graphicsDevice.canvas;
		let preW = canvas.width;
		let preH = canvas.height;
		dummyCanvas.width = width;
		dummyCanvas.height = height;
		let captureFunc =  function() {
			pc.app.off('frameend', captureFunc);
			let bigData = canvas.toDataURL();
			let bigImage = new Image();
			bigImage.onload = function () {
				let ctx = dummyCanvas.getContext('2d');
				ctx.drawImage(bigImage, 0, 0, width, height);
				let smallData = dummyCanvas.toDataURL();
				let smallImage = new Image();
				smallImage.onload = function () {
					if (callback) {
						callback(null, smallImage)
					}
				};
				smallImage.src = smallData;
				bigImage = null;
			};
			bigImage.src = bigData;
		}
		pc.app.on('frameend', captureFunc);
	};
	
	/**
	 * FPSを表示
	 */
	SceneManager.prototype.showFPS = function () {
		upaint.Util.showFPS();
	};

	/**
	 * Manipulatorを表示
	 */
	SceneManager.prototype.showManipulator = function (visible) {
		if (this.pick) {
			this.pick.showManipulator(visible);
		}
	};

	/**
	 * カレントシーン
	 */
	Object.defineProperty(SceneManager.prototype, 'currentScene', {
		get: function () {
			return this.currentScene_;
		},
		set: function (scene) {
			if (scene) {
				pc.app.scene = scene.pcscene;
				pc.app.scene.layers = pc.app.defaultLayerComposition;
				pc.app.root.addChild(scene.pcentity);
				this.currentScene_ = scene;
				this.pick.init(scene.cameraList[0], scene);
			} else {
				pc.app.scene = null;
				this.currentScene_ = null;
			}
		}
	});

	/**
	 * シーンリスト
	 */
	Object.defineProperty(SceneManager.prototype, 'sceneList', {
		get: function () {
			return this.sceneList_;
		}
	});

	window.upaint.SceneManager = SceneManager;
}());
