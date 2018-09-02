(function () {
	"use strict";
	let GUIToolMenu;

	GUIToolMenu = function (store, action) {
		this.store = store;
		this.action = action;

		this.root_ = document.createElement('div');
		this.root_.style.position = "absolute";
		this.root_.style.top = "0px";
		this.root_.style.left = "0px";
		this.root_.style.width = "100%";
		this.root_.style.height = "100%";

		this.tools = [{
			id : "skeleton",
			onclick : function () {
				action.toggleSkeleton();
			},
			img : "url('img/bone_move.png')",
			elem : document.createElement('div')
		}];

		this.toolDict = {};

		for (let i = 0; i < this.tools.length; ++i) {
			let tool = this.tools[i];
			this.toolDict[tool.id] = tool;

			let text = document.createElement('span');
			text.style.fontSize = "14px"
			text.style.color = "lightgray";

			let elem = tool.elem;
			elem.appendChild(text);
			elem.className = "gui_menu_button";
			elem.style.backgroundImage = tool.img;

			if (tool.hasOwnProperty("onclick")) {
				elem.onclick = tool.onclick;
			}

			this.root_.appendChild(elem);
		}

		store.on(upaint.Store.EVENT_TOGGLE_SKELETON, function (err, isShow) {
			let elem = this.toolDict.skeleton.elem;
			if (isShow) {
				elem.style.borderWidth = "2px";
				elem.style.opacity = "1";
			} else {
				this.toolDict.skeleton.elem.style.borderWidth = "1px";
				elem.style.opacity = "0.5";
			}
		}.bind(this));
	};

	/**
	 * root element
	 */
	Object.defineProperty(GUIToolMenu.prototype, 'rootElement', {
		get: function () {
			return this.root_;
		}
	});

	upaint.GUIToolMenu = GUIToolMenu;
}());
