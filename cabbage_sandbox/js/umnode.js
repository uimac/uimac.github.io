/*jslint devel:true */
/*global Float32Array */
(function (ummath, ummesh, ummaterial) {
	"use strict";
	var UMNode;

	UMNode = function (gl) {
		this.gl = gl;
		this.mesh = new ummesh.UMMesh(gl);
		this.local_transform = new ummath.UMMat44d();
		this.global_transform = new ummath.UMMat44d();
		this.initial_local_transform = new ummath.UMMat44d();
		this.initial_global_transform = new ummath.UMMat44d();
		this.parent = null;
		this.children = [];
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

	UMNode.prototype.update = function () {
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
		ummath.um_matrix_remove_scale(global, global);
		ummath.um_matrix_remove_scale(parent_global, parent_global);

		var start = new ummath.UMVec3d(parent_global.m[3][0], parent_global.m[3][1], parent_global.m[3][2]);
		var end = new ummath.UMVec3d(global.m[3][0], global.m[3][1], global.m[3][2]);
		var global_rot = new ummath.UMMat44d(parent_global);
		global_rot.m[3][0] = global_rot.m[3][1] = global_rot.m[3][2] = 0.0;
		var len = (end.sub(start)).length();
		if (len <= ummath.EPSILON) { len = 1.0; }
		var dir = (end.sub(start)).normalized();
		var middle = (start.add(end)).scale(0.5).sub(new ummath.UMVec3d(dir.xyz[0], dir.xyz[1], dir.xyz[2]).scale(len * 0.2));
		var global_y = new ummath.UMVec3d(global_rot.m[1][0], global_rot.m[1][1], global_rot.m[1][2]);
		var global_z = new ummath.UMVec3d(global_rot.m[2][0], global_rot.m[2][1], global_rot.m[2][2]);

		if (dir.length() == 0) {
			return;
		}

		var dst_octahedron = [];
		dst_octahedron[0] = end;
		dst_octahedron[1] = middle.add(dir.cross(global_z).scale(0.1 * len));
		dst_octahedron[2] = middle.add(dir.cross(dir.cross(global_z)).scale(0.1 * len));
		dst_octahedron[3] = start;
		dst_octahedron[4] = middle.sub(dir.cross(global_z).scale(0.1 * len));
		dst_octahedron[5] = middle.sub(dir.cross(dir.cross(global_z)).scale(0.1 * len));
	
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
		this.mesh.update_box();

		if (this.mesh.material_list.length === 0) {
			var meshmat = new ummaterial.UMMaterial(this.gl);
			meshmat.set_polygon_count(verts.length / 3 / 3);
			meshmat.set_diffuse(0.7, 0.7, 0.7, 1.0);
			this.mesh.material_list.push(meshmat);
		} else {
			this.mesh.material_list[0].set_polygon_count(verts.length / 3 / 3);
		}
	};

	UMNode.prototype.add = function (box) {
		this.boxlist.push(box);
	};

	UMNode.prototype.reset_shader_location = function () {
		this.mesh.reset_shader_location();
	};

	UMNode.prototype.draw = function (shader, camera) {
		if (this.mesh && this.mesh.verts.length > 0) {
			this.gl.disable(this.gl.DEPTH_TEST);
			//this.gl.disable(this.gl.CULL_FACE);
			this.mesh.draw(shader, camera);
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
