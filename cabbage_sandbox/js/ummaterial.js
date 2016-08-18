/*jslint devel:true nomen:true */
(function (ummath) {
	"use strict";
	var UMMaterial,
		toFloat = 1.0 / 0xFF,
		counter = 0;

	UMMaterial = function (gl) {
		this.gl = gl;
		this.diffuse_ = new ummath.UMVec4d(0.7, 0.7, 0.7, 1.0);
		this.constant_color_ = new ummath.UMVec4d(1.0, 0.7, 0.7, 1.0);
		this.specular_ = new ummath.UMVec4d(0.9, 0.9, 0.9, 1.0);
		this.ambient_ = new ummath.UMVec4d(0.3, 0.3, 0.3, 1.0);
		this.flag_ = new ummath.UMVec4d(0, 0, 0, 0);
		this.constant_color_location_ = null;
		this.diffuse_location_ = null;
		this.ambient_location_ = null;
		this.flag_location_ = null;
		this.sampler_location_ = null;
		this.polygon_count_ = 0;
		this.diffuse_texture = null;
		this.diffuse_texture_image = null;
		this.diffuse_texture_assigned = false;
		this.video_ = null;
		this.canvas_ = null;
		this.name = "mat_" + String(counter);
	};

	UMMaterial.prototype.draw = function (shader) {
		var gl = this.gl;
		if (!this.constant_color_location_) {
			this.constant_color_location_ = gl.getUniformLocation(shader.program_object(), "constant_color");
		}
		if (!this.diffuse_location_) {
			this.diffuse_location_ = gl.getUniformLocation(shader.program_object(), "mat_diffuse");
		}
		if (!this.ambient_location_) {
			this.ambient_location_ = gl.getUniformLocation(shader.program_object(), "mat_ambient");
		}
		if (!this.flag_location_) {
			this.flag_location_ = gl.getUniformLocation(shader.program_object(), "mat_flags");
		}
		if (this.diffuse_texture) {
			if (!this.sampler_location_) {
				this.sampler_location_ = gl.getUniformLocation(shader.program_object(), "s_texture");
			}
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.diffuse_texture);
			if (!this.diffuse_texture_assigned) {
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.diffuse_texture_image);

				this.canvas_.width = this.diffuse_texture_image.width;
				this.canvas_.height = this.diffuse_texture_image.height;
				var ctx = this.canvas_.getContext('2d');
				ctx.drawImage(this.diffuse_texture_image, 0, 0);
				this.texture = ctx.getImageData(0, 0, this.canvas_.width, this.canvas_.height).data;

				this.diffuse_texture_assigned = true;
			}
			gl.uniform1i(this.sampler_location_, 0);
		}
		if (this.video_) {
			if (!this.sampler_location_) {
				this.sampler_location_ = gl.getUniformLocation(shader.program_object(), "s_texture");
			}
			gl.activeTexture(gl.TEXTURE0);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.video_);
			gl.uniform1i(this.sampler_location_, 0);
		}
		if (this.flag_.xyzw[1] > 0.5) {
			gl.uniform4f(this.constant_color_location_,
				this.constant_color_.xyzw[0],
				this.constant_color_.xyzw[1],
				this.constant_color_.xyzw[2],
				this.constant_color_.xyzw[3]);
		} else {
			gl.uniform4f(this.diffuse_location_,
				this.diffuse_.xyzw[0],
				this.diffuse_.xyzw[1],
				this.diffuse_.xyzw[2],
				this.diffuse_.xyzw[3]);

			if (this.ambient_location_ && this.ambient_location_ >= 0) {
				gl.uniform4f(this.ambient_location_,
					this.ambient_.xyzw[0],
					this.ambient_.xyzw[1],
					this.ambient_.xyzw[2],
					this.ambient_.xyzw[3]);
			}
		}

		gl.uniform4f(this.flag_location_,
			this.flag_.xyzw[0],
			this.flag_.xyzw[1],
			this.flag_.xyzw[2],
			this.flag_.xyzw[3]);

		//gl.bindTexture(gl.TEXTURE_2D, null);
	};

	UMMaterial.prototype.polygon_count = function () {
		return this.polygon_count_;
	};

	UMMaterial.prototype.set_polygon_count = function (c) {
		this.polygon_count_ = c;
	};

	UMMaterial.prototype.set_diffuse = function (r, g, b, a) {
		this.diffuse_.xyzw[0] = r;
		this.diffuse_.xyzw[1] = g;
		this.diffuse_.xyzw[2] = b;
		this.diffuse_.xyzw[3] = a;
	};

	UMMaterial.prototype.set_specular = function (r, g, b) {
		this.specular_.xyzw[0] = r;
		this.specular_.xyzw[1] = g;
		this.specular_.xyzw[2] = b;
	};

	UMMaterial.prototype.specular = function () {
		return this.specular_;
	};

	UMMaterial.prototype.diffuse = function () {
		return this.diffuse_;
	};

	UMMaterial.prototype.ambient = function () {
		return this.ambient_;
	};

	UMMaterial.prototype.set_ambient = function (r, g, b) {
		this.ambient_.xyzw[0] = r;
		this.ambient_.xyzw[1] = g;
		this.ambient_.xyzw[2] = b;
	};

	UMMaterial.prototype.set_constant_color = function (color) {
		this.constant_color_ = color;
		this.flag_.xyzw[1] = 1.0;
	};

	UMMaterial.prototype.set_texture = function (texture, image) {
		this.diffuse_texture = texture;
		this.diffuse_texture_image = image;
		this.flag_.xyzw[0] = 1.0;
		this.canvas_ = document.createElement( 'canvas' );
	};

	UMMaterial.prototype.get_diffuse_texture_pixel = function (x, y) {
		var w = this.diffuse_texture_image.width,
			h = this.diffuse_texture_image.height;

		return [
			this.texture[ (y * w + x) * 4 + 0] * toFloat,
			this.texture[ (y * w + x) * 4 + 1] * toFloat,
			this.texture[ (y * w + x) * 4 + 2] * toFloat,
			this.texture[ (y * w + x) * 4 + 3] * toFloat];
	};

	UMMaterial.prototype.set_video_texture = function (texture, video) {
		this.diffuse_texture = texture;
		this.video_ = video;
		this.flag_.xyzw[0] = 1.0;
	};

	UMMaterial.prototype.reset_shader_location = function () {
		this.constant_color_location_ = null;
		this.diffuse_location_ = null;
		this.flag_location_ = null;
		this.sampler_location_ = null;
	};

	window.ummaterial = {};
	window.ummaterial.UMMaterial = UMMaterial;

}(window.ummath));
