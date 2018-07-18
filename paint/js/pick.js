(function () {

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

		// ホバー中のEntityリスト
		this.hoverList = [];
		this.updateFunc = null;
	};

	/// カメラとシーンにより初期化する
	Pick.prototype.init = function (pccamera, pcscene) {
		if (this.updateFunc) {
			pc.app.off("update", this.updateFunc);
		}
		this.updateFunc = function (dt) {
			this.picker.prepare(pccamera, pcscene, pcscene.layers.getLayerById(pc.LAYERID_IMMEDIATE));
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
		// MeshInstance
		let hits = this.picker.getSelection(event.x, event.y);
		if (hits.length > 0) {
			if (hits[0].mesh.name === "Sphere") {
				let skeleton = hits[0].mesh.skeleton;
				skeleton.showManipulator(hits[0].mesh.entity);
			}
		}
	};

	Pick.prototype.onMouseMove = function (event) {
		if (!this.initialized) return;
		
		for (let i = 0; i < this.hoverList.length; ++i) {
			this.hoverList[i].material.color.set(0, 0.5, 0);
		}
		this.hoverList = [];

		let hits = this.picker.getSelection(event.x, event.y);
		if (hits.length > 0) {
			if (hits[0].mesh.name === "Sphere") {
				hits[0].material.color.set(1, 0, 0);
				this.hoverList.push(hits[0]);
			}
		}
	};

	upaint.Pick = Pick;

}());