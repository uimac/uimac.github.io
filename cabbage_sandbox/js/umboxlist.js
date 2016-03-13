/*jslint devel:true */
/*global Float32Array */
(function (ummath, ummesh) {
	"use strict";
	var UMBoxList;

	UMBoxList = function (gl, boxlist) {
		this.gl = gl;
		this.material_list = [];
		this.vertex_vbo = gl.createBuffer();

		this.boxlist = boxlist;
		this.update();

		this.mesh = new ummesh.UMMesh();

		this.position_attr = null;
		this.normal_attr = null;
		this.uv_attr = null;
		this.global_matrix = new ummath.UMMat44d();
		this.global_matrix_location_ = null;
	};

	UMBoxList.prototype.dispose = function () {
		var gl = this.gl;
		gl.DeleteBuffers(1, this.vertex_vbo);
		this.mesh.dispose();
	};

	UMBoxList.prototype.update = function () {
		var i,
			verts = [],
			normals = [],
			min,
			max,
			box;
		for (i = 0; i < this.boxlist.length; i = i + 1) {
			box = this.boxlist[i];
			min = box.min_;
			max = box.max_;
			verts.push(min.xyz[0], min.xyz[1], min.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], max.xyz[2]);
			verts.push(min.xyz[0], min.xyz[1], max.xyz[2]);

			verts.push(min.xyz[0], min.xyz[1], min.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], min.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], max.xyz[2]);

			verts.push(min.xyz[0], max.xyz[1], max.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], max.xyz[2]);
			verts.push(min.xyz[0], min.xyz[1], max.xyz[2]);

			verts.push(min.xyz[0], max.xyz[1], max.xyz[2]);
			verts.push(max.xyz[0], max.xyz[1], max.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], max.xyz[2]);

			verts.push(max.xyz[0], max.xyz[1], max.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], min.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], max.xyz[2]);

			verts.push(max.xyz[0], max.xyz[1], max.xyz[2]);
			verts.push(max.xyz[0], max.xyz[1], min.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], min.xyz[2]);

			verts.push(max.xyz[0], max.xyz[1], min.xyz[2]);
			verts.push(min.xyz[0], min.xyz[1], min.xyz[2]);
			verts.push(max.xyz[0], min.xyz[1], min.xyz[2]);

			verts.push(max.xyz[0], max.xyz[1], min.xyz[2]);
			verts.push(min.xyz[0], max.xyz[1], min.xyz[2]);
			verts.push(min.xyz[0], min.xyz[1], min.xyz[2]);

			verts.push(min.xyz[0], max.xyz[1], min.xyz[2]);
			verts.push(min.xyz[0], min.xyz[1], max.xyz[2]);
			verts.push(min.xyz[0], min.xyz[1], min.xyz[2]);

			verts.push(min.xyz[0], max.xyz[1], min.xyz[2]);
			verts.push(min.xyz[0], max.xyz[1], max.xyz[2]);
			verts.push(min.xyz[0], min.xyz[1], max.xyz[2]);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	};

	UMBoxList.prototype.draw = function (shader, camera) {
		this.mesh.draw(shader, camera);
	};

	UMBoxList.prototype.reset_shader_location = function () {
		this.global_matrix_location_ = null;
	};

	window.umline = {};
	window.umline.UMBoxList = UMBoxList;

}(window.ummath, window.ummesh));
