/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
	"use strict";
	var UMTriangle;

	UMTriangle = function (mesh, face_index) {
		this.mesh_ = mesh;
		this.face_index_ = face_index;
		this.box = new ummath.UMBox();
		this.box.init();
		this.update_box();
	};

	function cross(va, vb) {
		return [
			va[1] * vb[2] - va[2] * vb[1],
			va[2] * vb[0] - va[0] * vb[2],
			va[0] * vb[1] - va[1] * vb[0]
		];
	}

	function sub(va, vb) {
		return [
			va[0] - vb[0],
			va[1] - vb[1],
			va[2] - vb[2]
		];
	}

	function add(va, vb) {
		return [
			va[0] + vb[0],
			va[1] + vb[1],
			va[2] + vb[2]
		];
	}

	function scale(va, b) {
		return [
			va[0] * b,
			va[1] * b,
			va[2] * b
		];
	}

	function dot(va, vb) {
		return va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2];
	}

	function normalize(v) {
		var dst = [v[0], v[1], v[2]],
			a = v[0] * v[0] + v[1] * v[1] + v[2] * v[2],
			b;
		if (a > window.ummath.EPSILON) {
			b = 1.0 / Math.sqrt(a);
			dst[0] = v[0] * b;
			dst[1] = v[1] * b;
			dst[2] = v[2] * b;
		} else {
			dst[0] = dst[1] = dst[2] = 0;
		}
		return dst;
	}

	/**
	 * @param ray_org UMVec3d
	 * @param ray_dir UMVec3d
	 */
	UMTriangle.prototype.intersects = function (ray_org, ray_dir, info) {
		var a = this.mesh_.get_vert(this.face_index_, 0),
			b = this.mesh_.get_vert(this.face_index_, this.mesh_.is_cw ? 2 : 1),
			c = this.mesh_.get_vert(this.face_index_, this.mesh_.is_cw ? 1 : 2),
			ab,
			ac,
			ao,
			n,
			d,
			t,
			distance,
			barycentric,
			ray_dir_inv = [-ray_dir.xyz[0], -ray_dir.xyz[1], -ray_dir.xyz[2]],
			v,
			w,
			inv_dir;

		ab = sub(b, a);
		ac = sub(c, a);
		n = cross(ab, ac);

		// ray is parallel or no reach
		d = dot(ray_dir_inv, n);
		if (d < 0) { return false; }

		ao = sub(ray_org.xyz, a);
		t = dot(ao, n);
		if (t < 0) { return false; }

		inv_dir = 1.0 / d;
		distance = t * inv_dir;
		if (distance < ummath.EPSILON) { false; }

		// inside triangle ?
		barycentric = cross(ray_dir_inv, ao);
		v = dot(ac, barycentric);
		if (v < 0 || v > d) { return false; }
		ab[0] = -ab[0];
		ab[1] = -ab[1];
		ab[2] = -ab[2];
		w = dot(ab, barycentric);
		if (w < 0 || (v + w) > d) { return false; }

		if (dot(ray_dir.xyz, n) < 0.0)
		{
			info.uvw = [];
			info.uvw.length = 3;
			// v
			info.uvw[1] = v * inv_dir;
			// w
			info.uvw[2] = w * inv_dir;
			// u
			info.uvw[0] = 1.0 - info.uvw[1] - info.uvw[2];

			info.distance = distance;
			info.intersect_point = add(ray_org.xyz, scale(ray_dir_inv, -distance));
			//info.face_normal = n.normalized();
			return true;
		}
		return false;
	};

	UMTriangle.prototype.calcMaterial = function (info) {
		var mat,
			width,
			height,
			ctx,
			x,
			y,
			col,
			n0 = this.mesh_.get_normal(this.face_index_, 0),
			n1 = this.mesh_.get_normal(this.face_index_, this.mesh_.is_cw ? 2 : 1),
			n2 = this.mesh_.get_normal(this.face_index_, this.mesh_.is_cw ? 1 : 2);

		n0 = scale(n0, info.uvw[0]);
		n1 = scale(n1, info.uvw[1]);
		n2 = scale(n2, info.uvw[2]);
		info.normal = normalize(add(add(n0, n1), n2));
		mat = this.mesh_.material_list[0];
		info.color = mat.diffuse().xyzw;
		if (this.mesh_.uvs.length > 0 && mat.diffuse_texture_image) {
			var uv0 = this.mesh_.get_uv(this.face_index_, 0),
				uv1 = this.mesh_.get_uv(this.face_index_, this.mesh_.is_cw ? 2 : 1),
				uv2 = this.mesh_.get_uv(this.face_index_, this.mesh_.is_cw ? 1 : 2);

			info.uv = [
				ummath.um_fract(uv0[0] * info.uvw[0] + uv1[0] * info.uvw[1] + uv2[0] * info.uvw[2]),
				ummath.um_fract(uv0[1] * info.uvw[0] + uv1[1] * info.uvw[1] + uv2[1] * info.uvw[2])
			];

			x = Math.floor(mat.diffuse_texture_image.width * info.uv[0]);
			y = Math.floor(mat.diffuse_texture_image.height * info.uv[1]);
			info.color = mat.get_diffuse_texture_pixel(x, y);
		}
	};

	UMTriangle.prototype.vertex = function () {
		return [
			this.mesh_.get_vert(this.face_index_, 0),
			this.mesh_.get_vert(this.face_index_, this.mesh_.is_cw ? 2 : 1),
			this.mesh_.get_vert(this.face_index_, this.mesh_.is_cw ? 1 : 2)
		];
	};

	UMTriangle.prototype.vertex_raw = function () {
		return [
			this.mesh_.get_vert(this.face_index_, 0).xyz,
			this.mesh_.get_vert(this.face_index_, this.mesh_.is_cw ? 2 : 1).xyz,
			this.mesh_.get_vert(this.face_index_, this.mesh_.is_cw ? 1 : 2).xyz
		];
	};

	UMTriangle.prototype.normal = function () {
		return [
			this.mesh_.get_normal(this.face_index_, 0),
			this.mesh_.get_normal(this.face_index_, this.mesh_.is_cw ? 2 : 1),
			this.mesh_.get_normal(this.face_index_, this.mesh_.is_cw ? 1 : 2)
		];
	};

	UMTriangle.prototype.vindex = function () {
		return this.mesh_.get_vindex(this.face_index_);
	};

	UMTriangle.prototype.update_box = function() {
		var i,
			mesh = this.mesh_;
		this.box.init();
		for (i = 0; i < 3; i = i + 1) {
			this.box.extend(this.mesh_.get_vert(this.face_index_, i));
		}
	};

	window.umtriangle = {};
	window.umtriangle.UMTriangle = UMTriangle;

}(window.ummath));
