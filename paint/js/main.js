(function () {
	"use strict";

	function init() {
		let gui = new upaint.GUI();
		let sceneManager = new upaint.SceneManager(gui);
		let scene = sceneManager.newScene();
		
		let gltfIO = new upaint.ModelIO.GLTF();
		gltfIO.on('loaded', function (err, model) {
			scene.addModel(model);
			scene.addAnimation(new upaint.ModelAnimation(model));
		});
		gltfIO.load("data/CesiumMan.glb");

		window.onunload = function () {
			gui.destroy();
			sceneManager.destroy();
		};
	}
	
	window.onload = init;

}());
