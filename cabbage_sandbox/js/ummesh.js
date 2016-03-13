/*jslint devel:true*/
/*global Float32Array */
(function (ummath, umtriangle) {
	"use strict";
	var UMMesh;

	UMMesh = function (gl, verts, normals, uvs, indices) {
		this.gl = gl;
		this.material_list = [];
		this.vertex_vbo = gl.createBuffer();
		this.normal_vbo = gl.createBuffer();
		this.verts = [];
		this.normals = [];
		this.uvs = [];
		this.indices = [];

		if (uvs && uvs.length > 0) {
			this.uv_vbo = gl.createBuffer();
		} else {
			this.uv_vbo = null;
		}

		if (indices && indices.length > 0) {
			this.index_buffer = gl.createBuffer();
		}

		this.barycentric_vbo = null;

		this.box = new ummath.UMBox();
		this.global_matrix = new ummath.UMMat44d();
		this.global_matrix_location_ = null;
		this.update(verts, normals, uvs, indices);
		this.update_box();
		this.is_cw = false;
	};

	UMMesh.prototype.update = function (verts, normals, uvs, indices, barycentric) {
		var gl = this.gl,
			size,
			i;

		if (verts) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_vbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			this.verts = verts;
		}

		if (normals) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_vbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			this.normals = normals;
		}

		if (uvs && uvs.length > 0) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_vbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			this.uvs = uvs;
		}

		if (indices && indices.length > 0) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
			this.indices = indices;
		}

		if (barycentric && barycentric.length > 0) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentric_vbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(barycentric), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			this.barycentric = barycentric;
		} else {
			this.barycentric_vbo = gl.createBuffer();
			if (this.indices && this.indices.length > 0) {
				this.barycentric = new Float32Array(this.indices.length * 3 * 3);
				for (i = 0; i < this.indices.length; i = i + 1) {
					this.barycentric[i * 3 + 0] = ((i % 3) == 0) ? 1 : 0;
					this.barycentric[i * 3 + 1] = ((i % 3) == 1) ? 1 : 0;
					this.barycentric[i * 3 + 2] = ((i % 3) == 2) ? 1 : 0;
				}
			} else {
				this.barycentric = new Float32Array(this.verts.length);
				for (i = 0, size = this.verts.length / 3; i < size; i = i + 1) {
					this.barycentric[i * 3 + 0] = ((i % 3) == 0) ? 1 : 0;
					this.barycentric[i * 3 + 1] = ((i % 3) == 1) ? 1 : 0;
					this.barycentric[i * 3 + 2] = ((i % 3) == 2) ? 1 : 0;
				}
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentric_vbo)
			gl.bufferData(gl.ARRAY_BUFFER, this.barycentric, gl.STATIC_DRAW);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
		}

		//this.update_box();
	}

	UMMesh.prototype.dispose = function () {
		var gl = this.gl;
		if (this.vertex_vbo) {
			gl.deleteBuffer(this.vertex_vbo);
		}
		if (this.normal_vbo) {
			gl.deleteBuffer(this.normal_vbo);
		}
		if (this.uv_vbo) {
			gl.deleteBuffer(this.uv_vbo);
		}
		if (this.index_buffer) {
			gl.deleteBuffer(this.index_buffer);
		}
		//glDeleteBuffers(1, &vertex_index_vbo_);
	};

	UMMesh.prototype.init_attrib = function (shader) {
		var gl = this.gl,
			position_attr,
			normal_attr,
			uv_attr,
			barycentric_attr,
			barycentric,
			i;

		if (this.vertex_vbo) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_vbo);
			position_attr = gl.getAttribLocation(shader.program_object(), 'a_position');
			gl.enableVertexAttribArray(position_attr);
			gl.vertexAttribPointer(position_attr, 3, gl.FLOAT, false, 0, 0);
		}

		if (this.normal_vbo) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_vbo);
			normal_attr = gl.getAttribLocation(shader.program_object(), 'a_normal');
			gl.enableVertexAttribArray(normal_attr);
			gl.vertexAttribPointer(normal_attr, 3, gl.FLOAT, false, 0, 0);
		}

		if (this.barycentric_vbo) {
			barycentric_attr = gl.getAttribLocation(shader.program_object(), 'a_barycentric');
			if (barycentric_attr >= 0) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentric_vbo);
				gl.enableVertexAttribArray(barycentric_attr);
				gl.vertexAttribPointer(barycentric_attr, 3, gl.FLOAT, false, 0, 0);
			}
		}

		if (this.uv_vbo) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_vbo);
			uv_attr = gl.getAttribLocation(shader.program_object(), 'a_uv');
			gl.enableVertexAttribArray(uv_attr);
			gl.vertexAttribPointer(uv_attr, 2, gl.FLOAT, false, 0, 0);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		} else {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_vbo);
			uv_attr = gl.getAttribLocation(shader.program_object(), 'a_uv');
			gl.disableVertexAttribArray(uv_attr);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
	};

	UMMesh.prototype.draw = function (shader, camera) {
		var i,
			gl = this.gl,
			index_count,
			index_offset = 0,
			material;

		if (!this.vertex_vbo) { return; }

		gl.useProgram(shader.program_object());
		this.init_attrib(shader);

		if (!this.global_matrix_location_) {
			this.global_matrix_location_ = gl.getUniformLocation(shader.program_object(), "global_matrix");
		}
		gl.uniformMatrix4fv(this.global_matrix_location_, false, this.global_matrix.value());

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_vbo);

		if (this.normal_vbo) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_vbo);
		}
		if (this.uv_vbo) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_vbo);
		}
		if (this.barycentric_vbo) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentric_vbo);
		}

		for (i = 0; i < this.material_list.length; i = i + 1) {
			material = this.material_list[i];
			index_count = material.polygon_count() * 3;

			camera.draw(shader);
			material.draw(shader);

			if (this.index_buffer) {
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
				gl.drawElements(gl.TRIANGLES, index_count, gl.UNSIGNED_INT, index_offset);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
			} else {
				gl.drawArrays(gl.TRIANGLES, index_offset, index_count);
			}
			index_offset = index_offset + index_count;
		}
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	};

	UMMesh.prototype.reset_shader_location = function () {
		var i;
		this.global_matrix_location_ = null;
		for (i = 0; i < this.material_list.length; i = i + 1) {
			this.material_list[i].reset_shader_location();
		}
	};

	UMMesh.prototype.update_box = function () {
		var i,
			vlen;

		if (this.verts.length > 0) {
			this.box.set_min(new ummath.UMVec3d(Infinity, Infinity, Infinity));
			this.box.set_max(new ummath.UMVec3d(-Infinity, -Infinity, -Infinity));
	 		vlen = this.verts.length / 3;
			for (i = 0; i < vlen; i = i + 1) {
				this.box.extend([this.verts[i * 3 + 0], this.verts[i * 3 + 1], this.verts[i * 3 + 2]]);
			}
		}
	};

	UMMesh.prototype.get_vert = function (faceindex, i) {
		if (this.indices && this.indices.length > 0) {
			return new ummath.UMVec3d(
				this.verts[this.indices(faceindex * 3 + i) * 3 + 0],
				this.verts[this.indices(faceindex * 3 + i) * 3 + 1],
				this.verts[this.indices(faceindex * 3 + i) * 3 + 2]
			);
		} else {
			return new ummath.UMVec3d(
				this.verts[(faceindex * 3 + i) * 3 + 0],
				this.verts[(faceindex * 3 + i) * 3 + 1],
				this.verts[(faceindex * 3 + i) * 3 + 2]
			);
		}
	};

	UMMesh.prototype.add_triangle = function (v1, v2, v3, min_time, max_time) {
		var normal;

		this.verts = this.verts.concat(v1.xyz);
		this.verts = this.verts.concat(v2.xyz);
		this.verts = this.verts.concat(v3.xyz);

		normal = (v1.sub(v2)).cross(v2.sub(v3)).normalized();
		this.normals = this.normals.concat(normal.xyz);
		this.normals = this.normals.concat(normal.xyz);
		this.normals = this.normals.concat(normal.xyz);

		this.material_list[0].set_polygon_count(this.verts.length / 3 / 3);
		this.update(this.verts, this.normals);
		this.update_box();
	};

	UMMesh.prototype.create_primitive_list = function () {
		var i,
			polycount,
			tri,
			primitive_list = [];
		if (this.indices && this.indices.length > 0) {
			for (i = 0, polycount = this.indices.length / 3; i < polycount; i = i + 1) {
				tri = new umtriangle.UMTriangle(this, i);
				primitive_list.push(tri);
			}
		} else if (this.verts && this.verts.length > 0){
			for (i = 0, polycount = this.verts.length / 3; i < polycount; i = i + 1) {
				tri = new umtriangle.UMTriangle(this, i);
				primitive_list.push(tri);
			}
		}
		return primitive_list;
	};

	window.ummesh = {};
	window.ummesh.UMMesh = UMMesh;

}(window.ummath, window.umtriangle));
