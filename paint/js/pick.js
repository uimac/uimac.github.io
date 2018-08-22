(function () {
	"use strict";

	/**
	 * ピック操作
	 * 現状LAYERID_IMMEDIATEレイヤーを対象とする
	 * @param {*} gui 
	 */
	let Pick = function (store, action) {
		EventEmitter.call(this);

		this.store = store;
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
		this.manipulator = new upaint.Manipulator(store, action);
		// 操作中のマニピュレータ
		this.manip = null;
		this.updateFunc = null;

		// カメラ参照
		this.pccamera = null;

		// マウス位置
		this.px = null;
		this.py = null;

		store.on(upaint.Store.EVENT_RESIZE, function (err) {
			this.resize();
		}.bind(this));
		
		store.on(upaint.Store.EVENT_ORIENTATION_CHANGE, function (err) {
			this.resize();
		}.bind(this));
	};
	Pick.prototype = Object.create(EventEmitter.prototype);

	/// カメラとシーンにより初期化する
	Pick.prototype.init = function (camera, scene) {
		if (this.updateFunc) {
			pc.app.off("update", this.updateFunc);
		}
		this.camera = camera;
		this.scene = scene;
		this.manipulator.init(camera);
		this.updateFunc = function (dt) {
			this.picker.prepare(camera.pccamera, scene.pcscene, scene.pcscene.layers.getLayerById(pc.LAYERID_IMMEDIATE));
			this.initialized = true;

			// マニピュレータの更新
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

	Pick.prototype.resize = function () {
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

		this.mouseDownPos = {
			x : this.pos.x,
			y : this.pos.y
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
				if (this.manipHandle) {
					this.manipulator.manipulate(
						this.manipHandle, this.mouseDownPos, this.pos, this.pos, this.initialVal, false, "down");
				}
			}
		}
		if (hits.length === 0) {
			this.manipulator.target = null;
		}
	};

	Pick.prototype.onMouseMove = function (event) {
		if (!this.initialized) return;
		
		for (let i = 0; i < this.hoverList.length; ++i) {
			if (upaint.Skeleton.IsIKHandle(this.hoverList[i])) {
				this.hoverList[i].material.color.fromString(upaint.Constants.IKHandleColor)
			} else {
				this.hoverList[i].material.color.fromString(upaint.Constants.HandleColor)
			}
		}
		this.hoverList = [];

		let curPos = {
			x : event.x,
			y : event.y
		};
		
		if (event.touches && event.touches.length === 1) {
			curPos.x = event.touches[0].x;
			curPos.y = event.touches[0].y;
		}

		// MeshInstanceのlist
		let hits = this.picker.getSelection(curPos.x, curPos.y);
		if (hits.length > 0) {
			if (upaint.Skeleton.IsSkeleton(hits[0])) {
				hits[0].material.color.set(1, 0, 0);
				this.hoverList.push(hits[0]);
			}
		}

		if (this.pos) {
			if (this.manipHandle) {
				this.manipulator.manipulate(
					this.manipHandle, this.mouseDownPos, this.pos, curPos, this.initialVal, false, "move");
			}
			this.pos.x = curPos.x;
			this.pos.y = curPos.y;
		}
	};
	
	Pick.prototype.onMouseUp = function (event) {
		if (!this.initialized) return;
		
		let curPos = {
			x : event.x,
			y : event.y
		};
		if (this.manipHandle) {
			this.manipulator.manipulate(
				this.manipHandle, this.mouseDownPos, this.pos, curPos, this.initialVal, true, "up");
		}
		this.initialVal = null;
		this.manipHandle = null;
		this.pos = null;
		this.mouseDownPos = null;
	};
	
	Pick.prototype.showManipulator = function (visible) {
	} 

	Pick.EVENT_MANIP_ROTATE = "rotate"
	upaint.Pick = Pick;

}());