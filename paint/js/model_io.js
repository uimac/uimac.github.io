(function () {

	let ModelIO = {};
	
	/**
	 * usage:
	 * let gltfIO = new upaint.ModelIO.GLTF();
	 * gltfIO.on('loaded', function (err, model) {} );
	 * gltfIO.load(url);
	 */
	ModelIO.GLTF = function () {
		EventEmitter.call(this);
	};
	ModelIO.GLTF.prototype = Object.create(EventEmitter.prototype);

	ModelIO.GLTF.prototype.load = function (url) {
		let model = new upaint.Model();
		let req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.responseType = "arraybuffer";
		req.onload = function (oEvent) {
			let arrayBuffer = req.response;
			if (arrayBuffer) {
				loadGlb(arrayBuffer, pc.app.graphicsDevice, function (roots) {
					roots.forEach(function (root) {
						if (root.model) {
							root.model.receiveShadows = true;
							root.model.castShadows = true;
							root.model.castShadowsLightmap = true;
						}
						model.pcentity.addChild(root);
					}.bind(this));
					
					this.emit(ModelIO.GLTF.EVENT_LOADED, null, model);
				}.bind(this));
			}
		}.bind(this);
		req.send(null);
	};
	ModelIO.GLTF.EVENT_LOADED = "loaded"

	window.upaint.ModelIO = ModelIO;
}());