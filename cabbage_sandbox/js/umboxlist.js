/*jslint devel:true */
/*global Float32Array */
(function (ummath, ummesh, umline, ummaterial) {
	"use strict";
	var UMBoxList;

	UMBoxList = function (gl, boxlist) {
		this.gl = gl;
		this.mesh = new ummesh.UMMesh(gl);
		this.line = new umline.UMLine(gl);
		this.boxlist = boxlist;
		this.isLine = true;
		this.update(boxlist);
	};

	UMBoxList.prototype.dispose = function () {
		this.mesh.dispose();
		this.line.dispose();
	};

	function hideEdge(hide) {
		var dist = 10000.0
		if (hide === 0) {
			return [1.0, dist, dist,
					dist, 1.0, dist,
					0.0, 0.0, 1.0];
		} else if (hide === 1) {
			return [1.0, 0.0, 0.0,
					dist, 1.0, dist,
					dist, dist, 1.0];
		} else {
			return [1.0, dist, dist,
					0.0, 1.0, 0.0,
					dist, dist, 1.0];
		}
	}

	UMBoxList.prototype.update = function () {
		var i,
			k,
			verts = [],
			normals = [],
			edges = [],
			barycentric = [],
			min,
			max,
			data,
			box;

		if (this.isLine) {
			for (i = 0; i < this.boxlist.length; i = i + 1) {
				box = this.boxlist[i];
				min = box.min_;
				max = box.max_;
				data = [[min[0], min[1], min[2]],
						[max[0], min[1], min[2]],
						[max[0], min[1], min[2]],
						[max[0], min[1], max[2]],
						[max[0], min[1], max[2]],
						[min[0], min[1], max[2]],
						[min[0], min[1], max[2]],
						[min[0], min[1], min[2]],

						[min[0], max[1], min[2]],
						[min[0], max[1], max[2]],
						[min[0], max[1], max[2]],
						[max[0], max[1], max[2]],
						[max[0], max[1], max[2]],
						[max[0], max[1], min[2]],
						[max[0], max[1], min[2]],
						[min[0], max[1], min[2]],

						[min[0], max[1], min[2]],
						[min[0], min[1], min[2]],

						[min[0], max[1], max[2]],
						[min[0], min[1], max[2]],

						[max[0], max[1], max[2]],
						[max[0], min[1], max[2]],

						[max[0], max[1], min[2]],
						[max[0], min[1], min[2]]];

				for (k = 0; k < data.length; k = k + 1) {
					verts[(24 * 3 * i + 3 * k) + 0] = data[k][0];
					verts[(24 * 3 * i + 3 * k) + 1] = data[k][1];
					verts[(24 * 3 * i + 3 * k) + 2] = data[k][2];
				}
			}
			this.line.update(verts);

			if (this.line.material_list.length === 0) {
				var linemat = new ummaterial.UMMaterial(this.gl);
				linemat.set_polygon_count(verts.length / 2 / 3);
				linemat.set_diffuse(new ummath.UMVec4d(0.7, 0.7, 0.7, 0.5));
				this.line.material_list.push(linemat);
			} else {
				this.line.material_list[0].set_polygon_count(verts.length / 2 / 3);
			}
		} else {
			for (i = 0; i < this.boxlist.length; i = i + 1) {
				box = this.boxlist[i];
				min = box.min_;
				max = box.max_;

				verts = verts.concat([min[0], min[1], min[2]]);
				verts = verts.concat([max[0], min[1], max[2]]);
				verts = verts.concat([min[0], min[1], max[2]]);
				barycentric = barycentric.concat(hideEdge(0));

				verts = verts.concat([min[0], min[1], min[2]]);
				verts = verts.concat([max[0], min[1], min[2]]);
				verts = verts.concat([max[0], min[1], max[2]]);
				barycentric = barycentric.concat(hideEdge(2));
				for (k = 0; k < 6; k = k + 1) {
					normals = normals.concat([0, -1, 0]);
				}

				verts = verts.concat([min[0], max[1], max[2]]);
				verts = verts.concat([min[0], min[1], max[2]]);
				verts = verts.concat([max[0], min[1], max[2]]);
				barycentric = barycentric.concat(hideEdge(2));

				verts = verts.concat([min[0], max[1], max[2]]);
				verts = verts.concat([max[0], min[1], max[2]]);
				verts = verts.concat([max[0], max[1], max[2]]);
				barycentric = barycentric.concat(hideEdge(0));
				for (k = 0; k < 6; k = k + 1) {
					normals = normals.concat([0, 0, 1]);
				}

				verts = verts.concat([max[0], max[1], max[2]]);
				verts = verts.concat([max[0], min[1], max[2]]);
				verts = verts.concat([max[0], min[1], min[2]]);
				barycentric = barycentric.concat(hideEdge(2));

				verts = verts.concat([max[0], max[1], max[2]]);
				verts = verts.concat([max[0], min[1], min[2]]);
				verts = verts.concat([max[0], max[1], min[2]]);
				barycentric = barycentric.concat(hideEdge(0));
				for (k = 0; k < 6; k = k + 1) {
					normals = normals.concat([1, 0, 0]);
				}

				verts = verts.concat([max[0], max[1], min[2]]);
				verts = verts.concat([max[0], min[1], min[2]]);
				verts = verts.concat([min[0], min[1], min[2]]);
				barycentric = barycentric.concat(hideEdge(2));

				verts = verts.concat([max[0], max[1], min[2]]);
				verts = verts.concat([min[0], min[1], min[2]]);
				verts = verts.concat([min[0], max[1], min[2]]);
				barycentric = barycentric.concat(hideEdge(0));
				for (k = 0; k < 6; k = k + 1) {
					normals = normals.concat([0, 0, -1]);
				}

				verts = verts.concat([min[0], max[1], min[2]]);
				verts = verts.concat([min[0], min[1], min[2]]);
				verts = verts.concat([min[0], min[1], max[2]]);
				barycentric = barycentric.concat(hideEdge(2));

				verts = verts.concat([min[0], max[1], min[2]]);
				verts = verts.concat([min[0], min[1], max[2]]);
				verts = verts.concat([min[0], max[1], max[2]]);
				barycentric = barycentric.concat(hideEdge(0));
				for (k = 0; k < 6; k = k + 1) {
					normals = normals.concat([-1, 0, 0]);
				}

				verts = verts.concat([min[0], max[1], min[2]]);
				verts = verts.concat([min[0], max[1], max[2]]);
				verts = verts.concat([max[0], max[1], max[2]]);
				barycentric = barycentric.concat(hideEdge(2));

				verts = verts.concat([min[0], max[1], min[2]]);
				verts = verts.concat([max[0], max[1], max[2]]);
				verts = verts.concat([max[0], max[1], min[2]]);
				barycentric = barycentric.concat(hideEdge(0));
				for (k = 0; k < 6; k = k + 1) {
					normals = normals.concat([0, 1, 0]);
				}
			}
			this.mesh.update(verts, normals, null, null, barycentric);

			if (this.mesh.material_list.length === 0) {
				var meshmat = new ummaterial.UMMaterial(this.gl);
				meshmat.set_polygon_count(verts.length / 3 / 3);
				meshmat.set_diffuse(new ummath.UMVec4d(0.7, 0.7, 0.7, 0.5));
				this.mesh.material_list.push(meshmat);
			} else {
				this.mesh.material_list[0].set_polygon_count(verts.length / 3 / 3);
			}
		}
	};

	UMBoxList.prototype.add = function (box) {
		this.boxlist.push(box);
	};

	UMBoxList.prototype.reset_shader_location = function () {
		this.mesh.reset_shader_location();
		this.line.reset_shader_location();
	};

	UMBoxList.prototype.draw = function (shader, camera) {
		this.gl.disable(this.gl.CULL_FACE);
		this.mesh.draw(shader, camera);
		this.gl.enable(this.gl.CULL_FACE);
		this.line.draw(shader, camera);
	};

	UMBoxList.prototype.reset_shader_location = function () {
		this.mesh.reset_shader_location();
		this.line.reset_shader_location();
	};

	window.umboxlist = {};
	window.umboxlist.UMBoxList = UMBoxList;

}(window.ummath, window.ummesh, window.umline, window.ummaterial));
