(function () {
	"use strict";
	/**
	 * コンストラクタ
	 */
	let Camera = function () {
		EventEmitter.call(this);
		this.pcentity_ = new pc.Entity('Camera');
		this.pcentity_.setPosition(0, 10, -50);
		this.pcentity.addComponent('camera', {
			clearColor: upaint.Constants.ClearColor,
			fov : 55
		});
		this.emit(window.upaint.Camera.EVENT_LOADED, null);
		this.pcentity.addComponent("script", { enabled: true }); // scriptを追加できるようにする.
		pc.app.loader.load("lib/playcanvas/extras/camera/orbit-camera.js", "script",  function (err, script) {
			pc.app.loader.load("lib/playcanvas/extras/camera/orbit-camera-input-mouse.js", "script", function (err, script) {
				pc.app.loader.load("lib/playcanvas/extras/camera/orbit-camera-input-touch.js", "script", function (err, script) {
					this.pcentity.script.create("orbitCamera", {
						attributes: {
							maxElevation: 89
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
					this.setTarget(0, 0.8, 0);
					// 初期化完了
					this.emit(window.upaint.Camera.EVENT_LOADED, null);
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};
	Camera.prototype = Object.create(EventEmitter.prototype);

	function findCameraComponent(root) {
		if (root.camera) {
			return root.camera.camera;
		}
		for (let i = 0; i < root.children.length; ++i) {
			let cameraComponent = findCameraComponent(root.children[i]);
			if (cameraComponent) {
				return cameraComponent;
			}
		}
		return null;
	}

	// 微妙
	Camera.prototype.setTarget = function (x, y, z) {
		this.pcentity_.script.orbitCamera.pivotPoint = new pc.Vec3(x, y, z)
	};
	
	Camera.prototype.setPosition = function (x, y, z) {
		this.pcentity_.setPosition(x, y, z);
	};

	/**
	 * playcanvas cameracomponent
	 */
	Object.defineProperty(Camera.prototype, 'pccamera', {
		get: function () {
			if (!this.pccamera_) {
				this.pccamera_ = findCameraComponent(this.pcentity);
			}
			return this.pccamera_;
		}
	});

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