(function () {
	"use strict";

	let ModelIO = {};
	
	/**
	 * usage:
	 * let io = new upaint.ModelIO.GLTF();
	 * io.on('loaded', function (err, model) {} );
	 * io.load(url);
	 */
	ModelIO.GLTF = function () {
		EventEmitter.call(this);
	};
	ModelIO.GLTF.prototype = Object.create(EventEmitter.prototype);

	ModelIO.GLTF.prototype.load = function (url) {
		let req = new XMLHttpRequest();
		req.open("GET", url, true);
		req.responseType = "arraybuffer";
		req.onload = function (oEvent) {
			let arrayBuffer = req.response;
			if (arrayBuffer) {
				loadGlb(arrayBuffer, pc.app.graphicsDevice, function (roots, json) {
					let model = new upaint.Model();
					roots.forEach(function (root) {
						for (let i = 0; i < root.children.length; ++i) {
							let child = root.children[i];
							if (child.model) {
								child.model.receiveShadows = true;
								child.model.castShadows = true;
								child.model.castShadowsLightmap = true;
							}
						}
						model.pcentity.addChild(root);
					}.bind(this));
					model.skeleton = new upaint.Skeleton(model.pcentity);
					let data = {
						model : model,
						animation : new upaint.ModelAnimation(model)
					};
					this.emit(ModelIO.EVENT_LOADED, null, data, json);
				}.bind(this));
			}
		}.bind(this);
		req.send(null);
	};

	/**
	 * usage:
	 * let io = new upaint.ModelIO.VRM();
	 * io.on('loaded', function (err, model) {} );
	 * io.load(url);
	 */
	ModelIO.VRM = function () {
		EventEmitter.call(this);
	};
	ModelIO.VRM.prototype = Object.create(EventEmitter.prototype);

	ModelIO.VRM.prototype.load = function (url) {
		let gltfIO = new upaint.ModelIO.GLTF();
		gltfIO.on('loaded', function (err, data, json) {
			if (json.hasOwnProperty('extensions')) {
				let VRM = json.extensions.VRM;
				console.log(VRM);
			}
		});
		gltfIO.load(url);
	};


	ModelIO.EVENT_LOADED = "loaded"
	window.upaint.ModelIO = ModelIO;
}());