(function () {
	"use strict";

	/**
	 * ピック操作
	 * 現状LAYERID_IMMEDIATEレイヤーを対象とする
	 * @param {*} gui 
	 */
	let Pick = function (gui) {
		this.initialized = false;
		this.picker = new pc.Picker(pc.app, gui.canvas.width, gui.canvas.height);

		pc.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
		pc.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
		pc.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);

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

		// MeshInstanceのlist
		let hits = this.picker.getSelection(event.x, event.y);
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

		// MeshInstanceのlist
		let hits = this.picker.getSelection(event.x, event.y);
		if (hits.length > 0) {
			if (upaint.Skeleton.IsSkeleton(hits[0])) {
				hits[0].material.color.set(1, 0, 0);
				this.hoverList.push(hits[0]);
			}
		}

		if (this.pos) {
			if (this.manip && this.camera) {
				let mx = event.x - this.pos.x;
				let my = event.y - this.pos.y;
				let entity = upaint.Manipulator.GetEntity(this.manip);

				let dist = entity.getPosition().sub(this.camera.pcentity.getPosition()).length();

				let downpos = this.camera.pccamera.screenToWorld(
					this.pos.x, this.pos.y, dist, 
					this.picker.width, this.picker.height);

				let curpos = this.camera.pccamera.screenToWorld(
					event.x, event.y, dist, 
					this.picker.width, this.picker.height);
	
				let wpos = this.camera.pccamera.screenToWorld(
					event.x, event.y, this.camera.pccamera.farClip,
					this.picker.width, this.picker.height);
				
				let cameraPos = this.camera.pcentity.getPosition();
				let dir = wpos.sub(cameraPos);
				dir.normalize();
				let ray = new pc.Ray(cameraPos, dir);
				
				//upaint.Manipulator.Trans(this.manip, downpos, curpos);
				upaint.Manipulator.Trans(this.manip, downpos, curpos);
			}
			this.pos.x = event.x;
			this.pos.y = event.y;
		}

	};
	
	Pick.prototype.onMouseUp = function (event) {
		if (!this.initialized) return;
		this.pos = null;
	};

	upaint.Pick = Pick;

}());