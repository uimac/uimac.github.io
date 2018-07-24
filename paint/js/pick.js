(function () {
	"use strict";

	/**
	 * ピック操作
	 * 現状LAYERID_IMMEDIATEレイヤーを対象とする
	 * @param {*} gui 
	 */
	let Pick = function (gui) {
		EventEmitter.call(this);
		this.initialized = false;
		this.picker = new pc.Picker(pc.app, gui.canvas.width, gui.canvas.height);

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
		this.updateFunc = function (dt) {
			this.picker.prepare(camera.pccamera, scene.pcscene, scene.pcscene.layers.getLayerById(pc.LAYERID_IMMEDIATE));
			this.initialized = true;
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

	Pick.prototype.update = function (gui) {
		this.initialized = false;
		this.picker = new pc.Picker(pc.app, gui.canvas.width, gui.canvas.height);
	};

	Pick.prototype.onMouseDown = function (event) {
		if (!this.initialized) return;
		
		this.manip = null;
		this.pos = {
			x : event.x,
			y : event.y
		};
		if (event.touches && event.touches.length === 1) {
			this.pos = {
				x :event.touches[0].x,
				y :event.touches[0].y
			}
		}

		// MeshInstanceのlist
		let hits = this.picker.getSelection(this.pos.x, this.pos.y);
		if (hits.length > 0) {
			// 選択Entity切り替え
			if (upaint.Skeleton.IsSkeleton(hits[0])) {
				upaint.Skeleton.ShowManipulator(hits[0]);
			}
			// 選択マニピュレータ切り替え
			if (upaint.Manipulator.IsManipulator(hits[0])) {
				this.manip = hits[0];
				let entity = upaint.Manipulator.GetEntity(this.manip);
				this.preRot = entity.getRotation();
			}
		}
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
			if (this.manip && this.camera) {
				let mx = px - this.pos.x;
				let my = py - this.pos.y;
				let entity = upaint.Manipulator.GetEntity(this.manip);

				let dist = entity.getPosition().sub(this.camera.pcentity.getPosition()).length();

				let downpos = this.camera.pccamera.screenToWorld(
					this.pos.x, this.pos.y, dist, 
					this.picker.width, this.picker.height);

				let curpos = this.camera.pccamera.screenToWorld(
					px, py, dist, 
					this.picker.width, this.picker.height);
	
				let cameraPos = this.camera.pcentity.getPosition();

				let startRay = new pc.Ray(cameraPos, downpos.sub(cameraPos).normalize());
				let endRay = new pc.Ray(cameraPos, curpos.sub(cameraPos).normalize());
	
				//upaint.Manipulator.Trans(this.manip, downpos, curpos);
				upaint.Manipulator.Rot(this.manip, startRay, endRay);
			}
			this.pos.x = px;
			this.pos.y = py;
		}

	};
	
	Pick.prototype.onMouseUp = function (event) {
		if (!this.initialized) return;
		if (this.manip) {
			let type = upaint.Manipulator.GetManipulatorType(this.manip);
			this.emit(Pick.EVENT_MANIP_ROTATE, null, type, this.manip);
		}
		this.pos = null;
	};

	Pick.EVENT_MANIP_ROTATE = "rotate"
	upaint.Pick = Pick;

}());