(function () {
	"use strict";
	/**
	 * コンストラクタ
	 * @param {} gui 
	 */
	let SceneManager = function (store, gui) {
		// init application
		let app = new pc.Application(gui.canvas, {
			mouse: new pc.Mouse(gui.canvas),
			touch: !!('ontouchstart' in window) ? new pc.TouchDevice(gui.canvas) : null,
			keyboard: new pc.Keyboard(window)
		});
		app.setCanvasResolution(pc.RESOLUTION_AUTO);
		app.setCanvasFillMode(pc.FILLMODE_NONE);
		// これを行うと解像度変更したときにpickがずれる
		//app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
		app.start();
		pc.app.root.addComponent("script", { enabled: true });

		this.pick = new upaint.Pick(gui);

		gui.on(upaint.GUI.EVENT_RESIZE, function () {
			app.resizeCanvas();
			this.pick.update(gui);
		}.bind(this));
		gui.on(upaint.GUI.EVENT_ORIENTATION_CHANGE, function () {
			app.resizeCanvas();
			this.pick.update(gui);
		}.bind(this));

		this.pick.on(upaint.Pick.EVENT_MANIP_ROTATE, function (err, type, manip) {
			this.captureImage(150, 100, function (err, data) {
				store.addKeyFrame({
					image : data
				});
			})
		}.bind(this));

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
	}

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
