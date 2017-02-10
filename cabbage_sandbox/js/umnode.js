/*jslint devel:true */
/*global Float32Array */
(function (ummath, ummesh, ummaterial) {
	"use strict";
	var UMNode;
	var linemat_x = null;
	var linemat_y = null;
	var linemat_z = null;

	UMNode = function (gl) {
		this.gl = gl;
		this.mesh = new ummesh.UMMesh(gl);
		this.local_transform = new ummath.UMMat44d();
		this.global_transform = new ummath.UMMat44d();
		this.initial_local_transform = new ummath.UMMat44d();
		this.initial_global_transform = new ummath.UMMat44d();
		this.parent = null;
		this.children = [];
		this.is_need_update_deform_ = false;
		this.vertex_deform_mat = new ummath.UMMat44d();
		this.normal_deform_mat = new ummath.UMMat44d();
		
		if (!linemat_x) {
			linemat_x = new ummaterial.UMMaterial(gl);
			linemat_x.set_polygon_count(1);
			linemat_x.set_constant_color(new ummath.UMVec4d(0.9, 0.3, 0.3, 1.0));
		}
		if (!linemat_y) {
			linemat_y = new ummaterial.UMMaterial(gl);
			linemat_y.set_polygon_count(1);
			linemat_y.set_constant_color(new ummath.UMVec4d(0.3, 0.9, 0.3, 1.0));
		}
		if (!linemat_z) {
			linemat_z = new ummaterial.UMMaterial(gl);
			linemat_z.set_polygon_count(1);
			linemat_z.set_constant_color(new ummath.UMVec4d(0.3, 0.3, 0.9, 1.0));
		}

		this.line = new umline.UMLine(gl, null);
		this.line.material_list.push(linemat_x);
		this.line.material_list.push(linemat_y);
		this.line.material_list.push(linemat_z);
	};

	UMNode.prototype.dispose = function () {
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
	
	UMNode.prototype.update_mesh = function () {
		var i,
			k,
			v0, v1, v2, n,
			verts = [],
			normals = [];

		var global = new ummath.UMMat44d(this.global_transform);
		var parent_global;
		if (this.parent) {
			parent_global = new ummath.UMMat44d(this.parent.global_transform);
		} else {
			parent_global = new ummath.UMMat44d(this.global_transform);
		}
		//ummath.um_matrix_remove_scale(global, global);
		//ummath.um_matrix_remove_scale(parent_global, parent_global);

		var start = new ummath.UMVec3d(parent_global.m[3][0], parent_global.m[3][1], parent_global.m[3][2]);
		var end = new ummath.UMVec3d(global.m[3][0], global.m[3][1], global.m[3][2]);
		var global_rot = new ummath.UMMat44d(parent_global);
		ummath.um_matrix_remove_trans(global_rot);
		var len = (end.sub(start)).length();
		if (len <= ummath.EPSILON) { len = 1.0; }
		var base_start = new ummath.UMVec3d(0, 0, 0);
		var base_end = global_rot.inverted().multiply((end.sub(start)).normalized().scale(len));
		var dir = base_end.normalized();
		
		var middle = (new ummath.UMVec3d(base_end.xyz[0], base_end.xyz[1], base_end.xyz[2])).scale(0.5).sub(new ummath.UMVec3d(dir.xyz[0], dir.xyz[1], dir.xyz[2]).scale(len * 0.2));
		var global_x = new ummath.UMVec3d(global_rot.m[0][0], global_rot.m[0][1], global_rot.m[0][2]);
		var global_y = new ummath.UMVec3d(global_rot.m[1][0], global_rot.m[1][1], global_rot.m[1][2]);
		var global_z = new ummath.UMVec3d(global_rot.m[2][0], global_rot.m[2][1], global_rot.m[2][2]);

		if (dir.length() == 0) {
			return;
		}
		
		var dst_octahedron = [];
		var diff1 = dir.cross(global_z).scale(0.1 * len);
		var diff2 = dir.cross(diff1);
		dst_octahedron[0] = base_end;
		dst_octahedron[1] = middle.add(diff1);
		dst_octahedron[2] = middle.add(diff2);
		dst_octahedron[3] = base_start;
		dst_octahedron[4] = middle.sub(diff1);
		dst_octahedron[5] = middle.sub(diff2);
	
		var triangles = [
			dst_octahedron[0],
			dst_octahedron[1],
			dst_octahedron[2],

			dst_octahedron[3],
			dst_octahedron[2],
			dst_octahedron[1],

			dst_octahedron[0],
			dst_octahedron[5],
			dst_octahedron[1],

			dst_octahedron[3],
			dst_octahedron[1],
			dst_octahedron[5],

			dst_octahedron[0],
			dst_octahedron[4],
			dst_octahedron[5],
				
			dst_octahedron[3],
			dst_octahedron[5],
			dst_octahedron[4],
				
			dst_octahedron[0],
			dst_octahedron[2],
			dst_octahedron[4],
				
			dst_octahedron[3],
			dst_octahedron[4],
			dst_octahedron[2]
		];

		for (i = 0; i < triangles.length; i = i + 1) {
			Array.prototype.push.apply(verts, triangles[i].xyz);
		}
		
		for (i = 0; i < triangles.length / 3; i = i + 1) {
			v0 = triangles[i * 3];
			v1 = triangles[i * 3 + 1];
			v2 = triangles[i * 3 + 2];
			n = v2.sub(v1).cross( v0.sub(v1) ).normalized();
			if (n.x() === 0 && n.y() === 0 && n.z() === 0) {
				n = v2.sub(v1).scale(10000).cross( v0.sub(v1).scale(10000) ).normalized();
			}
			Array.prototype.push.apply(normals, n.value());
			Array.prototype.push.apply(normals, n.value());
			Array.prototype.push.apply(normals, n.value());
		}
		this.mesh.update(verts, normals, null, null, null);
		this.mesh.global_matrix = parent_global;
		this.mesh.reset_shader_location();
		this.mesh.update_box();

		if (this.mesh.material_list.length === 0) {
			var meshmat = new ummaterial.UMMaterial(this.gl);
			meshmat.set_polygon_count(verts.length / 3 / 3);
			meshmat.set_diffuse(0.7, 0.7, 0.7, 1.0);
			this.mesh.material_list.push(meshmat);
		} else {
			this.mesh.material_list[0].set_polygon_count(verts.length / 3 / 3);
		}

		// line
		var line_size = 0.3;
		var line_verts = [
			base_start,
			base_start.add(new ummath.UMVec3d(line_size, 0, 0)),
			base_start,
			base_start.add(new ummath.UMVec3d(0, line_size, 0)),
			base_start,
			base_start.add(new ummath.UMVec3d(0, 0, line_size))
		];
		var lines = [];
		for (i = 0; i < line_verts.length; i = i + 1) {
			Array.prototype.push.apply(lines, line_verts[i].xyz);
		}
		this.line.global_matrix = parent_global;
		this.line.reset_shader_location();
		this.line.update(lines);
	};

	UMNode.prototype.update = function () {
		if (this.mesh.verts.length === 0) {
			this.update_mesh();
		} else {
			if (this.parent) {
				this.mesh.global_matrix = this.parent.global_transform;
				this.line.global_matrix = this.parent.global_transform;
			} else {
				this.mesh.global_matrix = this.global_transform;
				this.line.global_matrix = this.global_transform;
			}
		}
	};
	
	UMNode.prototype.update_transform = function () {
		var pre = JSON.stringify(this.global_transform);
		var i;
		if (this.parent) {
			this.global_transform = this.local_transform.multiply(this.parent.global_transform);
		} else {
			this.global_transform = this.local_transform;
		}
		this.is_need_update_matrix = (pre !== JSON.stringify(this.global_matrix));
		if (this.is_need_update_matrix) {
			var gt = new ummath.UMMat44d(this.global_transform);
			var igt_inv = this.initial_global_transform.inverted();
			this.vertex_deform_mat = igt_inv.multiply(gt);
			this.normal_deform_mat = this.vertex_deform_mat.inverted().transposed();
		}
		for (var i = 0; i < this.children.length; i = i + 1) {
			this.children[i].update_transform();
		}
	};

	UMNode.prototype.is_need_update_deform = function () {
		return this.is_need_update_deform_;
	};

	UMNode.prototype.vertex_deform_matrix = function () {
		return this.vertex_deform_mat;
	};

	UMNode.prototype.normal_deform_matrix = function () {
		return this.normal_deform_mat;
	};

	UMNode.prototype.add = function (box) {
		this.boxlist.push(box);
	};

	UMNode.prototype.reset_shader_location = function () {
		this.mesh.reset_shader_location();
	};

	UMNode.prototype.draw = function (shader, camera) {
		if (this.mesh || this.line) {
			this.gl.disable(this.gl.DEPTH_TEST);
			//this.gl.disable(this.gl.CULL_FACE);
			if (this.mesh && this.mesh.verts.length > 0) {
				this.mesh.draw(shader, camera);
			}
			if (this.line) {
				this.line.draw(shader, camera);
			}
			//this.gl.enable(this.gl.CULL_FACE);
			this.gl.enable(this.gl.DEPTH_TEST);
		}
	};

	UMNode.prototype.reset_shader_location = function () {
		this.mesh.reset_shader_location();
	};

	window.umnode = {};
	window.umnode.UMNode = UMNode;

}(window.ummath, window.ummesh, window.ummaterial));
