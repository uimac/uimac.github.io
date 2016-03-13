/*jslint devel:true */
/*global Float32Array */
(function (ummath, ummesh, ummaterial) {
	"use strict";
	var UMBoxList;

	UMBoxList = function (gl, boxlist) {
		this.gl = gl;
		this.mesh = new ummesh.UMMesh(gl);
		this.update(boxlist);
	};

	UMBoxList.prototype.dispose = function () {
		this.mesh.dispose();
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

	UMBoxList.prototype.update = function (boxlist) {
		var i,
			k,
			verts = [],
			normals = [],
			edges = [],
			barycentric = [],
			min,
			max,
			box;

		this.boxlist = boxlist;
		for (i = 0; i < this.boxlist.length; i = i + 1) {
			box = this.boxlist[i];
			min = box.min_;
			max = box.max_;

			verts = verts.concat([min.xyz[0], min.xyz[1], min.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], max.xyz[2]]);
			verts = verts.concat([min.xyz[0], min.xyz[1], max.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(0));

			verts = verts.concat([min.xyz[0], min.xyz[1], min.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], min.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], max.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(2));
			for (k = 0; k < 6; k = k + 1) {
				normals = normals.concat([0, -1, 0]);
			}

			verts = verts.concat([min.xyz[0], max.xyz[1], max.xyz[2]]);
			verts = verts.concat([min.xyz[0], min.xyz[1], max.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], max.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(2));

			verts = verts.concat([min.xyz[0], max.xyz[1], max.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], max.xyz[2]]);
			verts = verts.concat([max.xyz[0], max.xyz[1], max.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(0));
			for (k = 0; k < 6; k = k + 1) {
				normals = normals.concat([0, 0, 1]);
			}

			verts = verts.concat([max.xyz[0], max.xyz[1], max.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], max.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], min.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(2));

			verts = verts.concat([max.xyz[0], max.xyz[1], max.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], min.xyz[2]]);
			verts = verts.concat([max.xyz[0], max.xyz[1], min.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(0));
			for (k = 0; k < 6; k = k + 1) {
				normals = normals.concat([1, 0, 0]);
			}

			verts = verts.concat([max.xyz[0], max.xyz[1], min.xyz[2]]);
			verts = verts.concat([max.xyz[0], min.xyz[1], min.xyz[2]]);
			verts = verts.concat([min.xyz[0], min.xyz[1], min.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(2));

			verts = verts.concat([max.xyz[0], max.xyz[1], min.xyz[2]]);
			verts = verts.concat([min.xyz[0], min.xyz[1], min.xyz[2]]);
			verts = verts.concat([min.xyz[0], max.xyz[1], min.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(0));
			for (k = 0; k < 6; k = k + 1) {
				normals = normals.concat([0, 0, -1]);
			}

			verts = verts.concat([min.xyz[0], max.xyz[1], min.xyz[2]]);
			verts = verts.concat([min.xyz[0], min.xyz[1], min.xyz[2]]);
			verts = verts.concat([min.xyz[0], min.xyz[1], max.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(2));

			verts = verts.concat([min.xyz[0], max.xyz[1], min.xyz[2]]);
			verts = verts.concat([min.xyz[0], min.xyz[1], max.xyz[2]]);
			verts = verts.concat([min.xyz[0], max.xyz[1], max.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(0));
			for (k = 0; k < 6; k = k + 1) {
				normals = normals.concat([-1, 0, 0]);
			}

			verts = verts.concat([min.xyz[0], max.xyz[1], min.xyz[2]]);
			verts = verts.concat([min.xyz[0], max.xyz[1], max.xyz[2]]);
			verts = verts.concat([max.xyz[0], max.xyz[1], max.xyz[2]]);
			barycentric = barycentric.concat(hideEdge(2));

			verts = verts.concat([min.xyz[0], max.xyz[1], min.xyz[2]]);
			verts = verts.concat([max.xyz[0], max.xyz[1], max.xyz[2]]);
			verts = verts.concat([max.xyz[0], max.xyz[1], min.xyz[2]]);
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
	};

	UMBoxList.prototype.reset_shader_location = function () {
		this.mesh.reset_shader_location();
	};

	UMBoxList.prototype.draw = function (shader, camera) {
		this.mesh.draw(shader, camera);
	};

	UMBoxList.prototype.reset_shader_location = function () {
		this.mesh.reset_shader_location();
	};

	window.umboxlist = {};
	window.umboxlist.UMBoxList = UMBoxList;

}(window.ummath, window.ummesh, window.ummaterial));
