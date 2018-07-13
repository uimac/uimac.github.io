(function () {
	"use strict";

	function init() {
		let gui = new upaint.GUI();
		gui.on(upaint.GUI.EVENT_INITIALIZE, function () {
			if (gui.canvas) {
				let sceneManager = new upaint.SceneManager(gui);
				let scene = sceneManager.newScene();
				
				let gltfIO = new upaint.ModelIO.GLTF();
				gltfIO.on('loaded', function (err, model) {
					scene.addModel(model);
					scene.addAnimation(new upaint.ModelAnimation(model));
				});
				gltfIO.load("data/AliciaSolid.vrm");
		
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
