/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
	"use strict";
	var UMNurbs,
		patch_count = 16;

	function init_static_ibo(gl) {
		if (!this.static_ibo) {
			var div = patch_count,
				iu,
				iv,
				ibo_data,
				vbo_data,
				vid = 0;

			vbo_data = [];
			ibo_data = [];
			for (iu = 0; iu < div; iu = iu + 1) {
				for (iv = 0; iv < div; iv = iv + 1) {
					var u = iu/(div-1);
					var v = iv/(div-1);
					vbo_data.push(u);
					vbo_data.push(v);
					vbo_data.push(iu);
					vbo_data.push(iv);
					if (iu != 0 && iv != 0) {
						ibo_data.push(vid - div - 1);
						ibo_data.push(vid - div);
						ibo_data.push(vid);
						ibo_data.push(vid - 1);
						ibo_data.push(vid - div - 1);
						ibo_data.push(vid);
						this.triangle_count += 2;
					}
					vid = vid + 1;
				}
			}

			console.log("ibodata_length", ibo_data.length, ibo_data);
			this.static_ibo = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.static_ibo);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(ibo_data), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

			console.log("vbo_data_length", vbo_data.length);
			this.static_vbo = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, this.static_vbo);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vbo_data), gl.STATIC_DRAW);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			console.log("triangle_count", this.triangle_count);
		}
	}

	UMNurbs = function (gl, positions) {
		this.gl = gl;
		this.patch_count = 16;
		this.material_list = [];
		this.sampler_location_ = null;

		this.triangle_count = 0;
		init_static_ibo.bind(this)(gl);

		gl.activeTexture(gl.TEXTURE0);
		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		this.box = new ummath.UMBox();
		this.global_matrix = new ummath.UMMat44d();
		this.global_matrix_location_ = null;
		this.update(positions);
		this.update_box();
	};

	UMNurbs.prototype.update = function (positions) {
		var gl = this.gl;
		if (!gl) { return; }
		this.positions = positions;
		for (var i = 0; i < positions.length; ++i) {
			positions[i] = positions[i] * 10;
		}
		console.log("hoge",  positions);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 16, 1, 0, gl.RGB, gl.FLOAT, positions);
	};

	UMNurbs.prototype.dispose = function () {
		var gl = this.gl;
		gl.deleteTexture(this.texture);
	};

	UMNurbs.prototype.init_attrib = function (shader) {
		var gl = this.gl,
			position_attr,
			normal_attr,
			uv_attr;

		if (!gl) { return; }
		gl.bindBuffer(gl.ARRAY_BUFFER, this.static_vbo);
		uv_attr = gl.getAttribLocation(shader.program_object(), 'inUV');
		gl.enableVertexAttribArray(uv_attr);
		gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		if (!this.sampler_location_) {
			this.sampler_location_ = gl.getUniformLocation(shader.program_object(), "s_texture");
		}
	};

	UMNurbs.prototype.draw = function (shader, camera) {
		var i,
			gl = this.gl,
			index_count,
			index_offset = 0,
			material;

		if (!gl) { return; }
		gl.useProgram(shader.program_object());
		this.init_attrib(shader);

		if (!this.global_matrix_location_) {
			this.global_matrix_location_ = gl.getUniformLocation(shader.program_object(), "global_matrix");
		}
		gl.uniformMatrix4fv(this.global_matrix_location_, false, this.global_matrix.value());

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.uniform1i(this.sampler_location_, 0);

	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.static_ibo);
		for (i = 0; i < this.material_list.length; i = i + 1) {
			material = this.material_list[i];
			index_count = this.triangle_count * 3;
			console.log(index_count);

			camera.draw(shader);
			material.draw(shader);
			gl.drawElements(gl.TRIANGLES, index_count, gl.UNSIGNED_INT, index_offset);
			index_offset = index_offset + index_count;
		}
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	};

	UMNurbs.prototype.reset_shader_location = function () {
		var i;
		this.global_matrix_location_ = null;
		for (i = 0; i < this.material_list.length; i = i + 1) {
			this.material_list[i].reset_shader_location();
		}
	};

	UMNurbs.prototype.update_box = function () {
		var i,
			vlen;
		this.box.set_min(new ummath.UMVec3d(Infinity, Infinity, Infinity));
		this.box.set_max(new ummath.UMVec3d(-Infinity, -Infinity, -Infinity));
 		vlen = this.positions.length / 3;
		for (i = 0; i < vlen; i = i + 1) {
			this.box.extendByArray([this.positions[i * 3 + 0], this.positions[i * 3 + 1], this.positions[i * 3 + 2]]);
		}
		console.log("box updated", this.box.min(), this.box.max());
	};

	window.umnurbs = {};
	window.umnurbs.UMNurbs = UMNurbs;

}(window.ummath));
