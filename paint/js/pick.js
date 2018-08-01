(function () {
	"use strict";

	/**
	 * ピック操作
	 * 現状LAYERID_IMMEDIATEレイヤーを対象とする
	 * @param {*} gui 
	 */
	let Pick = function (action) {
		EventEmitter.call(this);

		this.action = action;
		this.initialized = false;
		let canvas = pc.app.graphicsDevice.canvas;
		this.picker = new pc.Picker(pc.app, canvas.width, canvas.height);

		pc.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
		pc.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
		pc.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
		if (pc.app.touch) {
			pc.app.touch.on(pc.EVENT_TOUCHSTART, this.onMouseDown, this);
			pc.app.touch.on(pc.EVENT_TOUCHMOVE, this.onMouseMove, this);
			pc.app.touch.on(pc.EVENT_TOUCHEND, this.onMouseUp, this);
		}

		// ホバー中のEntityリスト
		this.hoverList = [];

		// マニピュレーター
		this.manipulator = new upaint.Manipulator(action);
		// 操作中のマニピュレータ
		this.manip = null;
		this.updateFunc = null;

		// カメラ参照
		this.pccamera = null;

		// マウス位置
		this.px = null;
		this.py = null;
	};
	Pick.prototype = Object.create(EventEmitter.prototype);

	/// カメラとシーンにより初期化する
	Pick.prototype.init = function (camera, scene) {
		if (this.updateFunc) {
			pc.app.off("update", this.updateFunc);
		}
		this.camera = camera;
		this.scene = scene;
		this.updateFunc = function (dt) {
			this.picker.prepare(camera.pccamera, scene.pcscene, scene.pcscene.layers.getLayerById(pc.LAYERID_IMMEDIATE));
			this.initialized = true;

			// マニピュレータの更新
			if (this.manipulator.target === null && this.scene.modelList.length > 0) {
				this.manipulator.target = this.scene.modelList[0].skeleton.pcentity;
			}
			this.manipulator.update(camera);
		}.bind(this);
		pc.app.on("update", this.updateFunc);
	};

	/**
	 * 終了処理
	 */
	Pick.prototype.destroy = function () {
		if (this.updateFunc) {
			pc.app.off("update", this.updateFunc);
		}
		this.hoverList = [];
	};

	Pick.prototype.update = function () {
		this.initialized = false;
		let canvas = pc.app.graphicsDevice.canvas;
		this.picker = new pc.Picker(pc.app, canvas.width, canvas.height);
	};

	Pick.prototype.onMouseDown = function (event) {
		if (!this.initialized) return;
		
		this.manipHandle = null;
		this.pos = {
			x : event.x,
			y : event.y
		};
		if (event.touches && event.touches.length === 1) {
			this.pos = {
				x :event.touches[0].x,
				y :event.touches[0].y
			}
		} else {
			// マウス
			if (event.button !== 0) return; // 左ボタンのみ
		}

		// MeshInstanceのlist
		let hits = this.picker.getSelection(this.pos.x, this.pos.y);
		for (let i = 0; i < hits.length; ++i) {
			// 選択Entity切り替え
			if (upaint.Skeleton.IsSkeleton(hits[i])) {
				this.manipulator.target = upaint.Skeleton.GetEntity(hits[i]);
			}
			// 選択マニピュレータ切り替え
			if (upaint.Manipulator.IsManipulator(hits[i])) {
				this.manipHandle = hits[i];
				let entity = upaint.Manipulator.GetEntity(this.manipHandle);
				this.initialVal = {
					pos : entity.getPosition().clone(),
					rot : entity.getRotation().clone()
				}
			}
		}
	};

	Pick.prototype.transform = function (px, py, isDone) {
		let mx = px - this.pos.x;
		let my = py - this.pos.y;
		let entity = upaint.Manipulator.GetEntity(this.manipHandle);

		let dist = entity.getPosition().sub(this.camera.pcentity.getPosition()).length();

		let downpos = this.camera.pccamera.screenToWorld(
			this.pos.x, this.pos.y, dist, 
			this.picker.width, this.picker.height);

		let curpos = this.camera.pccamera.screenToWorld(
			px, py, dist, 
			this.picker.width, this.picker.height);

		let cameraPos = this.camera.pcentity.getPosition();

		let startRay = new pc.Ray(cameraPos, downpos.clone().sub(cameraPos).normalize());
		let endRay = new pc.Ray(cameraPos, curpos.clone().sub(cameraPos).normalize());

		this.manipulator.manipulate(
			this.manipHandle, startRay, endRay, downpos, curpos, this.initialVal, isDone);
	};

	Pick.prototype.onMouseMove = function (event) {
		if (!this.initialized) return;
		
		for (let i = 0; i < this.hoverList.length; ++i) {
			this.hoverList[i].material.color.fromString(upaint.Constants.HandleColor)
		}
		this.hoverList = [];

		let px = event.x;
		let py = event.y;
		
		if (event.touches && event.touches.length === 1) {
			px = event.touches[0].x;
			py = event.touches[0].y;
		}


		// MeshInstanceのlist
		let hits = this.picker.getSelection(px, py);
		if (hits.length > 0) {
			if (upaint.Skeleton.IsSkeleton(hits[0])) {
				hits[0].material.color.set(1, 0, 0);
				this.hoverList.push(hits[0]);
			}
		}

		if (this.pos) {
			if (this.manipHandle && this.camera) {
				this.transform(px, py, false);
			}
			this.pos.x = px;
			this.pos.y = py;
		}

	};
	
	Pick.prototype.onMouseUp = function (event) {
		let px = event.x;
		let py = event.y;

		if (!this.initialized) return;
		if (this.manipHandle) {
			this.transform(px, py, true);
		}
		this.initialVal = null;
		this.manipHandle = null;
		this.pos = null;
	};
	
	Pick.prototype.showManipulator = function (visible) {
	} 

	Pick.EVENT_MANIP_ROTATE = "rotate"
	upaint.Pick = Pick;

}());