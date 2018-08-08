(function () {
	"use strict";
	let GUIMenu;

	GUIMenu = function (store, action) {
		this.store = store;
		this.action = action;

		this.root_ = document.createElement('div');
		this.root_.innerText = "GLAM"
		this.root_.style.color = "gray"
		this.root_.style.fontSize = "24px"
		this.root_.style.margin = "5px"
		this.root_.style.marginLeft = "8px"
	};

	/**
	 * root element
	 */
	Object.defineProperty(GUIMenu.prototype, 'rootElement', {
		get: function () {
			return this.root_;
		}
	});

	upaint.GUIMenu = GUIMenu;
}());
