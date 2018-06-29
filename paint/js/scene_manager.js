(function () {
	"use strict";
	/**
	 * コンストラクタ
	 * @param {} gui 
	 */
	let SceneManager = function (gui) {
		
		// init application
		let app = new pc.Application(gui.canvas, {
			mouse: new pc.Mouse(gui.canvas),
			touch: !!('ontouchstart' in window) ? new pc.TouchDevice(gui.canvas) : null,
			keyboard: new pc.Keyboard(window)
		});
		app.setCanvasResolution(pc.RESOLUTION_AUTO);
		app.setCanvasFillMode(pc.FILLMODE_NONE);
		app.graphicsDevice.maxPixelRatio = window.devicePixelRatio;
		app.start();
		// ensure canvas is resized when window changes size

		this.onReize = function () {
			app.resizeCanvas();
		};
		this.onOrientationChange = function () {
			app.resizeCanvas();
		};
		window.addEventListener('resize', this.onReize);
		window.addEventListener('orientationchange', this.onOrientationChange);

		this.sceneList_ = []; // upaint.Sceneのリスト
	};

	/**
	 * 終了処理
	 */
	SceneManager.prototype.destroy = function () {
		for (let i = 0; i < this.sceneList.length; ++i) {
			this.deleteScene(this.sceneList[i]);
		}
		this.currentScene = null;
		window.removeEventListener('resize', this.onReize);
		window.removeEventListener('orientationchange', this.onOrientationChange);
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
			} else {
				pc.app.scene = null;
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