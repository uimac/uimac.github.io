(function () {
	"use strict";

	function init() {
		let action = new upaint.Action();
		let store = new upaint.Store(action);
		let gui = new upaint.GUI(store, action);

		window.onunload = function () {
			if (gui) { gui.destroy(); }
			if (store) { store.destroy(); }
			if (action) { action.destroy(); }
		};
	}
	
	window.onload = init;

}());
