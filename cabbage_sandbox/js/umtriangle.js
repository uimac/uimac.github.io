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
			ray_dir_inv = new ummath.UMVec3d(-ray_dir.xyz[0], -ray_dir.xyz[1], -ray_dir.xyz[2]),
			v,
			w,
			inv_dir;

		ab = b.sub(a);
		ac = c.sub(a);
		n = ab.cross(ac);

		// ray is parallel or no reach
		d = ray_dir_inv.dot(n);
		if (d < 0) { return false; }

		ao = ray_org.sub(a);
		t = ao.dot(n);
		if (t < 0) { return false; }

		inv_dir = 1.0 / d;
		distance = t * inv_dir;
		if (distance < ummath.EPSILON) { false; }

		// inside triangle ?
		barycentric = ray_dir_inv.cross(ao);
		v = ac.dot(barycentric);
		if (v < 0 || v > d) { return false; }
		ab.scale(-1);
		w = ab.dot(barycentric);
		if (w < 0 || (v + w) > d) { return false; }

		if (ray_dir.dot(n) < 0.0)
		{
			info.uvw = [];
			info.uvw.lenght = 3;
			// v
			info.uvw[1] = v * inv_dir;
			// w
			info.uvw[2] = w * inv_dir;
			// u
			info.uvw[0] = 1.0 - info.uvw[1] - info.uvw[2];

			info.distance = distance;
			info.intersect_point = ray_org.add(ray_dir_inv.scale(-distance));
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

		n0.scale(info.uvw[0]);
		n1.scale(info.uvw[1]);
		n2.scale(info.uvw[2]);
		info.normal = (n0.add(n1).add(n2)).normalized();
		mat = this.mesh_.material_list[0];
		info.color = mat.diffuse().xyzw;
		if (this.mesh_.uvs.length > 0 && mat.diffuse_texture_image) {
			var uv0 = this.mesh_.get_uv(this.face_index_, 0),
				uv1 = this.mesh_.get_uv(this.face_index_, this.mesh_.is_cw ? 2 : 1),
				uv2 = this.mesh_.get_uv(this.face_index_, this.mesh_.is_cw ? 1 : 2);

			info.uv = [
				ummath.um_clip(uv0[0] * info.uvw[0] + uv1[0] * info.uvw[1] + uv2[0] * info.uvw[2], 0.0, 1.0),
				ummath.um_clip(uv0[1] * info.uvw[0] + uv1[1] * info.uvw[1] + uv2[1] * info.uvw[2], 0.0, 1.0)
			];
			x = Math.floor(mat.diffuse_texture_image.width * info.uv[0] + 0.5);
			y = Math.floor(mat.diffuse_texture_image.height * info.uv[1] + 0.5);
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
			this.box.extendByVec(this.mesh_.get_vert(this.face_index_, i));
		}
	};

	window.umtriangle = {};
	window.umtriangle.UMTriangle = UMTriangle;

}(window.ummath));
