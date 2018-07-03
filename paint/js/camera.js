(function () {
	"use strict";
	/**
	 * コンストラクタ
	 */
	let Camera = function () {
		EventEmitter.call(this);

		this.pcentity_ = new pc.Entity('Camera');
		this.pcentity.addComponent('camera', {
			clearColor: new pc.Color(0.8, 0.5, 0.5),
			fov : 55
		});
		this.pcentity.setPosition(0, 0, 50);	
		this.emit(window.upaint.Camera.EVENT_LOADED, null);
		this.pcentity.addComponent("script", { enabled: true }); // scriptを追加できるようにする.
		pc.app.loader.load("lib/playcanvas/orbit-camera.js", "script", function (err, script) {
			pc.app.loader.load("lib/playcanvas/orbit-camera-input-mouse.js", "script", function (err, script) {
				pc.app.loader.load("lib/playcanvas/orbit-camera-input-touch.js", "script", function (err, script) {
					this.pcentity.script.create("orbitCamera", {
						attributes: {
							maxElevation: 89,
						}
					});
					this.pcentity.script.create("orbitCameraInputMouse", {
						attributes: {
							orbitSensitivity : 0.3
						}
					});
					this.pcentity.script.create("orbitCameraInputTouch", {
						attributes: {
							orbitSensitivity : 0.3
						}
					});
					// 初期化完了
					this.emit(window.upaint.Camera.EVENT_LOADED, null);
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};
	Camera.prototype = Object.create(EventEmitter.prototype);

	/**
	 * playcanvas entity
	 */
	Object.defineProperty(Camera.prototype, 'pcentity', {
		get: function () {
			return this.pcentity_;
		}
	});

	Camera.EVENT_LOADED = "loaded";

	window.upaint.Camera = Camera;
}());