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
				loadGlb(arrayBuffer, pc.app.graphicsDevice, function (pcmodel, json, resources) {
					let model = new upaint.Model();
					console.log(json)
					model.pcentity.addComponent('model');
					model.pcentity.model.model = pcmodel;
					//pcmodel.generateWireframe();
					// pcmodel.meshInstances.forEach(function (mi) {
					// 	mi.renderStyle = pc.RENDERSTYLE_WIREFRAME;
					// 	mi.material = mi.material.clone();
					// 	mi.material.diffuse.set(0,0,0,0);
					// 	mi.material.specular.set(0,0,0,0);
					// 	mi.material.shininess = 0;
					// 	mi.material.emissive.set(0.5,0.5,0.5,1);
					// 	mi.material.update();
					// });
					  
					model.pcmodelcomps.forEach(function (pcmodelcomp) {
						pcmodelcomp.receiveShadows = true;
						pcmodelcomp.castShadows = true;
						pcmodelcomp.castShadowsLightmap = true;
					});
					model.skeleton = new upaint.Skeleton(model.pcentity);
					let data = {
						model : model,
						animation : new upaint.ModelAnimation(model)
					};
					this.emit(ModelIO.EVENT_LOADED, null, data, json, resources);
				}.bind(this));
			}
		}.bind(this);
		req.send(null);
	};

	ModelIO.EVENT_LOADED = "loaded"
	window.upaint.ModelIO = ModelIO;
}());