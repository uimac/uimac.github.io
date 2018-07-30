(function () {
	"use strict";

	function init() {
		let store = new upaint.Store();
		let gui = new upaint.GUI(store);
		gui.on(upaint.GUI.EVENT_INITIALIZE, function () {
			if (gui.canvas) {
				let sceneManager = new upaint.SceneManager(store, gui);
				let scene = sceneManager.newScene();
				sceneManager.showFPS(true);
				sceneManager.showManipulator(true);

				let io = new upaint.ModelIO.VRM();
				io.on('loaded', function (err, data) {
					scene.addModel(data.model);
					scene.addAnimation(data.animation);
				});
				io.load("data/nakasis_naka.vrm");

				window.onunload = function () {
					gui.destroy();
					sceneManager.destroy();
				};
			}
		});
		gui.init();
	}
	
	window.onload = init;

}());
