/*jslint devel:true*/
/*global Float32Array */
(function (ummath, umtriangle) {
	"use strict";
	var UMMesh;

	UMMesh = function (gl, id, verts, normals, uvs, indices) {
		this.gl = gl;
		this.material_list = [];
		this.vertex_vbo = gl ? gl.createBuffer() : null;
		this.normal_vbo = gl ? gl.createBuffer() : null;
		this.verts = [];
		this.normals = [];
		this.uvs = [];
		this.original_verts = [];
		this.original_normals = [];
		this.deform_verts = [];
		this.deform_normals = [];
		this.indices = [];
		this.bone_indices = [];
		this.bone_weights = [];
		this.id = "";

		if (id) {
			this.id = id;
		}
		this.uv_vbo = null;
		this._create_uv_vbo(indices, verts, uvs);

		this.bone_texture = null;
		this.bone_indices_vbo = null;
		this.bone_weights_vbo = null;
		this.barycentric_vbo = null;

		this.box = new ummath.UMBox();
		this.global_matrix = new ummath.UMMat44d();
		this.global_matrix_location_ = null;
		this.update(verts, normals, uvs, indices);
		this.update_box();
		this.is_cw = false;
		this.vertex_index_to_face_index_map = null;
	};

	UMMesh.prototype._create_uv_vbo = function (indices, verts, uvs) {
		if (!this.gl) { return; }
		if (uvs && uvs.length > 0) {
			if (indices && indices.length > 0) {
				if (indices.length * 2 === uvs.length) {
					this.uv_vbo = this.gl.createBuffer();
				}
			} else if (verts.length / 3 * 2 === uvs.length) {
				this.uv_vbo = this.gl.createBuffer();
			}
		}
	};

	UMMesh.prototype.update = function (verts, normals, uvs, indices, barycentric) {
		var gl = this.gl,
			size,
			i;

		if (indices && indices.length > 0) {
			this.indices = indices;
			this.bone_indices_vbo = this.gl.createBuffer();
			this.bone_weights_vbo = this.gl.createBuffer();
		}

		if (verts) {
			if (indices && indices.length > 0) {
				this.verts.length = indices.length * 3;
				for (i = 0; i < indices.length; i = i + 1) {
					this.verts[i * 3 + 0] = verts[indices[i] * 3 + 0];
					this.verts[i * 3 + 1] = verts[indices[i] * 3 + 1];
					this.verts[i * 3 + 2] = verts[indices[i] * 3 + 2];
				}
			} else {
				this.verts = verts;
			}
			if (this.original_verts.length === 0) {
				this.original_verts = JSON.parse(JSON.stringify(verts));
				this.deform_verts = JSON.parse(JSON.stringify(verts));
			}
			if (gl) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vertex_vbo);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.verts), gl.STATIC_DRAW);
				gl.bindBuffer(gl.ARRAY_BUFFER, null);
			}
		}

		if (normals) {
			if (indices && indices.length > 0 && normals.length === verts.length) {
				this.normals.length = indices.length * 3;
				for (i = 0; i < indices.length; i = i + 1) {
					this.normals[i * 3 + 0] = normals[indices[i] * 3 + 0];
					this.normals[i * 3 + 1] = normals[indices[i] * 3 + 1];
					this.normals[i * 3 + 2] = normals[indices[i] * 3 + 2];
				}
			} else {
				this.normals = normals;
			}
			if (this.original_normals.length === 0) {
				this.original_normals = JSON.parse(JSON.stringify(normals));
				this.deform_normals = JSON.parse(JSON.stringify(normals));
			}

			if (gl) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.normal_vbo);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
				gl.bindBuffer(gl.ARRAY_BUFFER, null);
			}
		}

		if (uvs && uvs.length > 0) {
			if (!this.uv_vbo) {
				this._create_uv_vbo(indices, verts, uvs);
			}
			if (indices && indices.length > 0 && (uvs.length / 2) === (verts.length / 3)) {
				this.uvs.length = indices.length * 3;
				for (i = 0; i < indices.length; i = i + 1) {
					this.uvs[i * 2 + 0] = uvs[indices[i] * 2 + 0];
					this.uvs[i * 2 + 1] = uvs[indices[i] * 2 + 1];
				}
			} else {
				this.uvs = uvs;
			}
			if (this.uv_vbo && gl) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_vbo);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.uvs), gl.STATIC_DRAW);
				gl.bindBuffer(gl.ARRAY_BUFFER, null);
			}
		}
		if (gl) {
			if (barycentric && barycentric.length > 0) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentric_vbo);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(barycentric), gl.STATIC_DRAW);
				gl.bindBuffer(gl.ARRAY_BUFFER, null);
				this.barycentric = barycentric;
			} else {
				this.barycentric_vbo = gl.createBuffer();
				this.barycentric = new Float32Array(this.verts.length);
				for (i = 0, size = this.verts.length / 3; i < size; i = i + 1) {
					this.barycentric[i * 3 + 0] = ((i % 3) == 0) ? 1 : 0;
					this.barycentric[i * 3 + 1] = ((i % 3) == 1) ? 1 : 0;
					this.barycentric[i * 3 + 2] = ((i % 3) == 2) ? 1 : 0;
				}
				gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentric_vbo)
				gl.bufferData(gl.ARRAY_BUFFER, this.barycentric, gl.STATIC_DRAW);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
			}
		}
		//this.update_box();
	}

	UMMesh.prototype.dispose = function () {
		var gl = this.gl;
		if (!gl) { return; }
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
		if (this.barycentric_vbo) {
			gl.deleteBuffer(this.barycentric_vbo);
		}
	};

	UMMesh.prototype.init_attrib = function (shader) {
		var gl = this.gl,
			position_attr,
			normal_attr,
			uv_attr,
			barycentric_attr,
			barycentric,
			bone_indices_attr,
			bone_weights_attr,
			i;

		if (!gl) { return; }

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

		if (this.bone_indices_vbo) {
			bone_indices_attr = gl.getAttribLocation(shader.program_object(), 'bone_indices');
			if (bone_indices_attr >= 0) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.bone_indices_vbo);
				gl.enableVertexAttribArray(bone_indices_attr);
				gl.vertexAttribPointer(bone_indices_attr, 4, gl.FLOAT, false, 0, 0);
			}
		}
		if (this.bone_weights_vbo) {
			bone_weights_attr = gl.getAttribLocation(shader.program_object(), 'bone_weights');
			if (bone_weights_attr >= 0) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.bone_weights_vbo);
				gl.enableVertexAttribArray(bone_weights_attr);
				gl.vertexAttribPointer(bone_weights_attr, 4, gl.FLOAT, false, 0, 0);
			}
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
			if (uv_attr && uv_attr >= 0) {
				gl.enableVertexAttribArray(uv_attr);
				gl.vertexAttribPointer(uv_attr, 2, gl.FLOAT, false, 0, 0);
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		} else {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.uv_vbo);
			uv_attr = gl.getAttribLocation(shader.program_object(), 'a_uv');
			if (uv_attr && uv_attr >= 0) {
				gl.disableVertexAttribArray(uv_attr);
			}
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
	};

	UMMesh.prototype.draw = function (shader, camera) {
		var i,
			gl = this.gl,
			index_count,
			index_offset = 0,
			material;

		if (gl) {

			if (!this.vertex_vbo) { return; }

			gl.useProgram(shader.program_object());
			this.init_attrib(shader);

			if (!this.global_matrix_location_) {
				this.global_matrix_location_ = gl.getUniformLocation(shader.program_object(), "global_matrix");
			}
			gl.uniformMatrix4fv(this.global_matrix_location_, false, this.global_matrix.value());

			if (this.bone_texture) {
				if (!this.bone_texture_location_) {
					this.bone_texture_location_ = gl.getUniformLocation(shader.program_object(), "bone_texture");
				}
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this.bone_texture);
				gl.uniform1i(this.bone_texture_location_, 1);
			}

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
			if (this.bone_indices_vbo) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.bone_indices_vbo);
			}
			if (this.bone_weights_vbo) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.bone_weights_vbo);
			}
		}

		for (i = 0; i < this.material_list.length; i = i + 1) {
			material = this.material_list[i];
			index_count = material.polygon_count() * 3;

			camera.draw(shader);
			material.draw(shader);
			if (gl) {
				gl.drawArrays(gl.TRIANGLES, index_offset, index_count);
			}
			index_offset = index_offset + index_count;
		}
		if (gl) {
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		}
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

	UMMesh.prototype.update_bone_data = function (cluster) {
		var i, k,
			index,
			weight;

		if (cluster.link_geometry !== this) { return; }
		
		if (this.bone_indices.length === 0) {
			this.bone_indices.length = this.indices.length * 4;
			this.bone_weights.length = this.indices.length * 4;
			for (i = 0; i < this.indices.length * 4; ++i) {
				this.bone_indices[i] = 0;	
				this.bone_weights[i] = 0;	
			}
		}

		for (i = 0; i < cluster.indices.length; i = i + 1) {
			index = cluster.indices[i];
			weight = cluster.weights[i];
			var filist = this.vertex_index_to_face_index_map[index];
			if (!filist) continue;
			for (k = 0; k < filist.length; k = k + 1) {
				var fi = filist[k];
				if (!this.bone_indices[fi * 4 + 0]) {
					this.bone_indices[fi * 4 + 0] = cluster.link_node.number + 1;
					this.bone_weights[fi * 4 + 0] = weight;
				} else if (!this.bone_indices[fi * 4 + 1]) {
					this.bone_indices[fi * 4 + 1] = cluster.link_node.number + 1;
					this.bone_weights[fi * 4 + 1] = weight;
				} else if (!this.bone_indices[fi * 4 + 2]) {
					this.bone_indices[fi * 4 + 2] = cluster.link_node.number + 1;
					this.bone_weights[fi * 4 + 2] = weight;
				} else if (!this.bone_indices[fi * 4 + 3]) {
					this.bone_indices[fi * 4 + 3] = cluster.link_node.number + 1;
					this.bone_weights[fi * 4 + 3] = weight;
				}
			}
		}
	};

	UMMesh.prototype.update_bone_data_gpu = function () {
		var gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.bone_indices_vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.bone_indices), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.bone_weights_vbo);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.bone_weights), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	};

	UMMesh.prototype.get_vert = function (faceindex, i) {
		if (this.global_matrix) {
			return this.global_matrix.multiply([
					this.verts[(faceindex * 3 + i) * 3 + 0],
					this.verts[(faceindex * 3 + i) * 3 + 1],
					this.verts[(faceindex * 3 + i) * 3 + 2],
					1.0
			]);
		}
		return 
	};

	UMMesh.prototype.get_normal = function (faceindex, i) {
		return [
			this.normals[(faceindex * 3 + i) * 3 + 0],
			this.normals[(faceindex * 3 + i) * 3 + 1],
			this.normals[(faceindex * 3 + i) * 3 + 2]
		];
	};

	UMMesh.prototype.get_uv = function (faceindex, i) {
		return [
			this.uvs[(faceindex * 3 + i) * 2 + 0],
			this.uvs[(faceindex * 3 + i) * 2 + 1]
		];
	};

	UMMesh.prototype.get_vindex = function (faceindex) {
		return [(faceindex * 3 + 0),
				this.is_cw ? (faceindex * 3 + 2) : (faceindex * 3 + 1),
				this.is_cw ? (faceindex * 3 + 1) : (faceindex * 3 + 2)];
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
		this.material_list[0].diffuse_.xyzw[0] = 0.3;
		this.material_list[0].diffuse_.xyzw[1] = 0.3;
		this.material_list[0].diffuse_.xyzw[2] = 0.5;
		this.material_list[0].ambient_.xyzw[0] = 0.0;
		this.material_list[0].ambient_.xyzw[1] = 0.0;
		this.material_list[0].ambient_.xyzw[2] = 0.0;
		this.update(this.verts, this.normals);
		this.update_box();
	};

	function vertexCompare(va, vb) {
		if (vb[0] > va[0] || vb[1] > va[1] || vb[2] > va[2]) {
			return -1;
		} else {
			return 1;
		}
	}

	UMMesh.prototype.create_mesh_index = function () {
		console.time('create mesh index');
		var i,
			verts = [],
			verts_link = [],
			size,
			vraw,
			vi;

		console.time('initial time');
		verts.length = this.verts.length / 3;
		verts_link.length = verts.length / 3;
		for (i = 0, size = this.verts.length / 3 / 3; i < size; i = i + 1) {
			vi = [(i * 3 + 0), (i * 3 + 1), (i * 3 + 2)];
			verts[vi[0]] = [
				this.verts[vi[0] * 3 + 0],
				this.verts[vi[0] * 3 + 1],
				this.verts[vi[0] * 3 + 2],
				[vi[0] * 3 + 0, vi[0] * 3 + 1, vi[0] * 3 + 2],
				vi[0], null];
			verts[vi[1]] = [
				this.verts[vi[1] * 3 + 0],
				this.verts[vi[1] * 3 + 1],
				this.verts[vi[1] * 3 + 2],
				[vi[1] * 3 + 0, vi[1] * 3 + 1, vi[1] * 3 + 2],
				vi[1], null];
			verts[vi[2]] = [
				this.verts[vi[2] * 3 + 0],
				this.verts[vi[2] * 3 + 1],
				this.verts[vi[2] * 3 + 2],
				[vi[2] * 3 + 0, vi[2] * 3 + 1, vi[2] * 3 + 2],
				vi[2], null];
			verts_link[i] = [verts[vi[0]], verts[vi[1]], verts[vi[2]]];
		}
		console.timeEnd('initial time');
		console.time('sort time');
		var sorted = verts.sort();
		console.timeEnd('sort time');
		console.log(sorted, verts_link)
		console.log(this.normals);
		if (sorted.length > 0) {
			sorted[0][5] = sorted[0][4];
			var current = sorted[0];
			for (i = 0; i < sorted.length - 1; i = i + 1) {
				var left = sorted[i];
				var right = sorted[i + 1];
				var r = new ummath.UMVec3d([right[0], right[1], right[2]]);
				var l = new ummath.UMVec3d([left[0], left[1], left[2]]);
				var dist2 = Math.abs(r.sub(l).length_sq());
				/*
				console.log("left",
				this.verts[left[3][0]], this.verts[left[3][1]], this.verts[left[3][2]],
				this.normals[left[3][0]], this.normals[left[3][1]], this.normals[left[3][2]]);

				console.log("right",
				this.verts[right[3][0]], this.verts[right[3][1]], this.verts[right[3][2]],
				this.normals[right[3][0]], this.normals[right[3][1]], this.normals[right[3][2]])
				*/
				if (dist2 < 0.01 ) {
					right[5] = left[5];
					this.normals[current[3][0]] += this.normals[right[3][0]];
					this.normals[current[3][1]] += this.normals[right[3][1]];
					this.normals[current[3][2]] += this.normals[right[3][2]];
				} else {
					var n = new ummath.UMVec3d(
						this.normals[current[3][0]],
						this.normals[current[3][1]],
						this.normals[current[3][2]]);
					n  = n.normalized();
					this.normals[current[3][0]] = n.xyz[0];
					this.normals[current[3][1]] = n.xyz[1];
					this.normals[current[3][2]] = n.xyz[2];
					right[5] = right[4];
					current = left;
				}
			}

			/*
			var newverts = [];
			var pre = null;
			for (i = 0; i < sorted.length; i = i + 1) {
				if (pre !== sorted[i][4]) {
					Array.prototype.push.apply(newverts, [
						sorted[i][0],
						sorted[i][1],
						sorted[i][2]
					]);
				}
				pre = sorted[i][4];
			}
			*/
			this.indices = [];
			this.indices.length = verts_link.length * 3;
			for (i = 0, size = verts_link.length; i < size; i = i + 1) {
				//console.log(verts_link)
				this.indices[i * 3] = (verts_link[i][0][5]);
				this.indices[i * 3 + 1] = (verts_link[i][1][5]);
				this.indices[i * 3 + 2] = (verts_link[i][2][5]);
			}
			//this.verts = newverts;
		}
		console.timeEnd('create mesh index');
		//console.log(sorted);
	};

	UMMesh.prototype.create_primitive_list = function () {
		var i,
			polycount,
			tri,
			primitive_list = [];

		if (this.indices && this.indices.length > 0) {
			polycount = this.indices.length / 3;
			primitive_list.length = polycount;
			for (i = 0; i < polycount; i = i + 1) {
				tri = new umtriangle.UMTriangle(this, i);
				primitive_list[i] = tri;
			}
		} else if (this.verts && this.verts.length > 0) {
			/*
			this.create_mesh_index();
			polycount = this.indices.length / 3;
			console.log(polycount);
			primitive_list.length = polycount;
			for (i = 0; i < polycount; i = i + 1) {
				tri = new umtriangle.UMTriangle(this, i);
				primitive_list[i] = tri;
			}
			*/
			polycount = this.verts.length / 3 / 3;
			for (i = 0; i < polycount; i = i + 1) {
				tri = new umtriangle.UMTriangle(this, i);
				primitive_list[i] = tri;
			}
		}
		this.primitive_list = primitive_list;

		return primitive_list;
	};

	window.ummesh = {};
	window.ummesh.UMMesh = UMMesh;

}(window.ummath, window.umtriangle));
