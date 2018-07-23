(function () {
	"use strict";
	
	let Util = {};

	// changed from playcanvas/engine/blob/master/src/scene/procedural.js
	Util.createConeData = function (baseRadius, peakRadius, height, heightSegments, capSegments) {
		// Variable declarations
		var primitiveUv1Padding = 4.0 / 64;
		var primitiveUv1PaddingScale = 1.0 - primitiveUv1Padding * 2;
		var i, j;
		var x, y, z, u, v;
		var pos = new pc.Vec3();
		var bottomToTop = new pc.Vec3();
		var norm = new pc.Vec3();
		var top, bottom, tangent;
		var positions = [];
		var normals = [];
		var uvs = [];
		var uvs1 = [];
		var indices = [];
		var theta, cosTheta, sinTheta;
		var phi, sinPhi, cosPhi;
		var first, second, third, fourth;
		var offset;
	
		// Define the body of the cone/cylinder
		if (height > 0) {
			for (i = 0; i <= heightSegments; i++) {
				for (j = 0; j <= capSegments; j++) {
					// Sweep the cone body from the positive Y axis to match a 3DS Max cone/cylinder
					theta = (j / capSegments) * 2.0 * Math.PI - Math.PI;
					sinTheta = Math.sin(theta);
					cosTheta = Math.cos(theta);
					bottom = new pc.Vec3(sinTheta * baseRadius, -height / 2.0, cosTheta * baseRadius);
					top    = new pc.Vec3(sinTheta * peakRadius,  height / 2.0, cosTheta * peakRadius);
					pos.lerp(bottom, top, i / heightSegments);
					bottomToTop.sub2(top, bottom).normalize();
					tangent = new pc.Vec3(cosTheta, 0.0, -sinTheta);
					norm.cross(tangent, bottomToTop).normalize();
	
					positions.push(pos.x, pos.y, pos.z);
					normals.push(norm.x, norm.y, norm.z);
					u = j / capSegments;
					v = i / heightSegments;
					uvs.push(u, v);
	
					// Pack UV1 to 1st third
					var _v = v;
					v = u;
					u = _v;
					u /= 3;
					u = u * primitiveUv1PaddingScale + primitiveUv1Padding;
					v = v * primitiveUv1PaddingScale + primitiveUv1Padding;
					uvs1.push(u, v);
	
					if ((i < heightSegments) && (j < capSegments)) {
						first   = ((i))     * (capSegments + 1) + ((j));
						second  = ((i))     * (capSegments + 1) + ((j + 1));
						third   = ((i + 1)) * (capSegments + 1) + ((j));
						fourth  = ((i + 1)) * (capSegments + 1) + ((j + 1));
	
						indices.push(first, second, third);
						indices.push(second, fourth, third);
					}
				}
			}
		}
	
		return {
			positions: positions,
			normals: normals,
			uvs: uvs,
			uvs1: uvs1,
			indices: indices
		};
	};

	// from playcanvas/engine/blob/master/src/scene/procedural.js
	Util.createCylinderNoCap = function (device, opts) {
		// #ifdef DEBUG
		if (opts && opts.hasOwnProperty('baseRadius') && !opts.hasOwnProperty('radius')) {
			console.warn('DEPRECATED: "baseRadius" in arguments, use "radius" instead');
		}
		// #endif
	
		// Check the supplied options and provide defaults for unspecified ones
		var radius = opts && (opts.radius || opts.baseRadius);
		radius = radius !== undefined ? radius : 0.5;
		var height = opts && opts.height !== undefined ? opts.height : 1.0;
		var heightSegments = opts && opts.heightSegments !== undefined ? opts.heightSegments : 5;
		var capSegments = opts && opts.capSegments !== undefined ? opts.capSegments : 20;
	
		// Create vertex data for a cone that has a base and peak radius that is the same (i.e. a cylinder)
		var options = Util.createConeData(radius, radius, height, heightSegments, capSegments);
	
		if (pc.precalculatedTangents) {
			options.tangents = pc.calculateTangents(options.positions, options.normals, options.uvs, options.indices);
		}
		return pc.createMesh(device, options.positions, options);
	}

	Util.createImeddiateModel = function (mesh, mat) {
		let model = upaint.Model.createModelFromMesh(mesh,  mat);
		let layer = pc.app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
		if (layer) {
			layer.addMeshInstances(model.pcmodel.meshInstances);
		}
		return model;
	}


	upaint.Util = Util;
}());