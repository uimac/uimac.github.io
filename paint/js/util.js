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
					top = new pc.Vec3(sinTheta * peakRadius, height / 2.0, cosTheta * peakRadius);
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
						first = ((i)) * (capSegments + 1) + ((j));
						second = ((i)) * (capSegments + 1) + ((j + 1));
						third = ((i + 1)) * (capSegments + 1) + ((j));
						fourth = ((i + 1)) * (capSegments + 1) + ((j + 1));

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

	Util.createTorus = function (device, opts) {
		// Check the supplied options and provide defaults for unspecified ones
		var rc = opts && opts.tubeRadius !== undefined ? opts.tubeRadius : 0.2;
		var rt = opts && opts.ringRadius !== undefined ? opts.ringRadius : 0.3;
		var segments = opts && opts.segments !== undefined ? opts.segments : 30;
		var sides = opts && opts.sides !== undefined ? opts.sides : 20;
		var radius = opts && opts.radius !== undefined ? opts.radius : 2.0 * Math.PI;
		var calculateTangents = opts && opts.calculateTangents !== undefined ? opts.calculateTangents : false;
	
		// Variable declarations
		var i, j;
		var x, y, z, nx, ny, nz, u, v;
		var positions = [];
		var normals = [];
		var uvs = [];
		var indices = [];
	
		for (i = 0; i <= sides; i++) {
			for (j = 0; j <= segments; j++) {
				x  = Math.cos(radius * j / segments) * (rt + rc * Math.cos(2.0 * Math.PI * i / sides));
				y  = Math.sin(2.0 * Math.PI * i / sides) * rc;
				z  = Math.sin(radius * j / segments) * (rt + rc * Math.cos(2.0 * Math.PI * i / sides));
	
				nx = Math.cos(radius * j / segments) * Math.cos(2.0 * Math.PI * i / sides);
				ny = Math.sin(2.0 * Math.PI * i / sides);
				nz = Math.sin(radius * j / segments) * Math.cos(2.0 * Math.PI * i / sides);
	
				u = i / sides;
				v = 1.0 - j / segments;
	
				positions.push(x, y, z);
				normals.push(nx, ny, nz);
				uvs.push(u, v);
	
				if ((i < sides) && (j < segments)) {
					var first, second, third, fourth;
					first   = ((i))     * (segments + 1) + ((j));
					second  = ((i + 1)) * (segments + 1) + ((j));
					third   = ((i))     * (segments + 1) + ((j + 1));
					fourth  = ((i + 1)) * (segments + 1) + ((j + 1));
	
					indices.push(first, second, third);
					indices.push(second, fourth, third);
				}
			}
		}
	
		var options = {
			normals: normals,
			uvs: uvs,
			indices: indices
		};
	
		if (calculateTangents) {
			options.tangents = pc.calculateTangents(positions, normals, uvs, indices);
		}
	
		return pc.createMesh(device, positions, options);
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

	Util.createImeddiateModel = function (mesh, mat, isTransparent = false) {
		let model = upaint.Model.createModelFromMesh(mesh, mat);
		let layer = pc.app.scene.layers.getLayerById(pc.LAYERID_IMMEDIATE);
		if (isTransparent) {
			layer = pc.app.scene.layers[pc.app.scene.layers.getTransparentIndex(layer)];
		}
		if (layer) {
			for (let i = 0; i < model.pcmodels.length; ++i) {
				layer.addMeshInstances(model.pcmodels[i].meshInstances);
			}
		}
		return model;
	}

	// polyfill
	// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Math/sign
	Math.sign = Math.sign || function (x) {
		x = +x; // convert to a number
		if (x === 0 || isNaN(x)) {
			return x;
		}
		return x > 0 ? 1 : -1;
	}

	function orthogonal(v) {
		let x = Math.abs(v.x)
		let y = Math.abs(v.y)
		let z = Math.abs(v.z)
		let other = x < y
			? ( x < z
				? pc.Vec3.RIGHT
				: pc.Vec3.FORWARD )
			: ( y < z
				? pc.Vec3.UP
				: pc.Vec3.FORWARD );
		return new pc.Vec3().cross(v, other)
	}
	
	pc.Quat.prototype.fromToRotation = function(from, to) {
		let fromDotTo = from.dot(to);
		if (fromDotTo <= -0.999) {
			this.w = 0;
			let v = orthogonal(from).normalize();
			this.x = v.x;
			this.y = v.y;
			this.z = v.z;
			return this;
		}
		let half = from.clone().add(to).scale(0.5);
		this.w = from.dot(half);
		let cross = new pc.Vec3().cross(from, half);
		this.x = cross.x;
		this.y = cross.y;
		this.z = cross.z;
		return this.normalize();
	}
	
	Util.showFPS = function () {
		let Fps = pc.createScript('fps');
		Fps.prototype.initialize = function () {
			this.isShow = true;
			this.stats = new Stats();
			this.stats.showPanel(0);
			this.stats.domElement.style.position = "absolute";
			this.stats.domElement.style.left = "auto";
			this.stats.domElement.style.top = "unset";
			this.stats.domElement.style.width = "80px"
			this.stats.domElement.style.height = "50px";
			this.stats.domElement.style.right = "3px";
			this.stats.domElement.style.bottom = "0px";
			document.body.appendChild( this.stats.dom );
		};
		Fps.prototype.update = function (dt) {
			this.stats.update();
		};
		Fps.prototype.show = function (isShow) {
			if (isShow) {
				this.stats.dom.style.display = "block";
			} else {
				this.stats.dom.style.display = "none";
			}
			this.isShow = isShow;
		};
		pc.app.root.script.create("fps", {});
	};

	Util.clamp = function (a, b, c) { return Math.max(b, Math.min(c, a)); }

	upaint.Util = Util;
}());