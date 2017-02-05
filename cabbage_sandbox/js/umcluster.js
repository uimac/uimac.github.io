/*jslint devel:true*/
/*global Float32Array */
(function (ummath, ummesh, umnode) {
	"use strict";
	var UMCluster;

	UMCluster = function (gl, weights, indices, node, geo) {
		this.weights = [];
		this.indices = [];
		this.link_node = null;
		this.link_geometry = null;

	};

	UMCluster.prototype.update = function (weights, indices, link_node, link_geometry) {

		if (weights && weights.length > 0) {
			this.weights = weights;
		}
		if (indices && indices.length > 0) {
			this.indices = indices;
		}
		if (link_node) {
			this.link_node = link_node;
		}
		if (link_geometry) {
			this.link_geometry = link_geometry;
		}
	};

	UMCluster.prototype.update_geometry = function () {
		var i, k, n, m,
			index,
			weight,
			original_vertex,
			original_normal,
			vertex,
			normal;
		if (!this.link_geometry) { return; }
		if (!this.link_node) { return; }
		if (this.weights.length === 0) { return; }
		if (this.indices.length === 0) { return; }
		
		var geo = this.link_geometry;

		var gt = new ummath.UMMat44d(this.link_node.global_transform);

		var igt = new ummath.UMMat44d(this.link_node.initial_global_transform);
		var igt_inv = igt.inverted();

		var deform_mat = igt_inv.multiply(gt);

		ummath.um_matrix_remove_trans(gt);
		ummath.um_matrix_remove_trans(igt_inv);
		var normal_deform_mat = igt_inv.multiply(gt);

		for (i = 0; i < this.indices.length; i = i + 1) {
			index = this.indices[i];
			weight = this.weights[i];
			original_vertex = new ummath.UMVec3d(
				geo.original_verts[index * 3 + 0],
				geo.original_verts[index * 3 + 1],
				geo.original_verts[index * 3 + 2]
			);
			vertex = deform_mat.multiply(original_vertex);

			geo.deform_verts[index * 3 + 0] += vertex.xyz[0] * weight
			geo.deform_verts[index * 3 + 1] += vertex.xyz[1] * weight
			geo.deform_verts[index * 3 + 2] += vertex.xyz[2] * weight
//console.log(this.link_node.name, index, weight, vertex.scale(weight).xyz, gt.m)

			if (geo.original_normals.length > geo.original_verts.length) {
				var filist = geo.vertex_index_to_face_index_map[index];

				for (k = 0; k < filist.length; k = k + 1) {
					var fi = filist[k];
					original_normal = new ummath.UMVec3d(
						geo.original_normals[fi * 3 + 0],
						geo.original_normals[fi * 3 + 1],
						geo.original_normals[fi * 3 + 2]
					);
					normal = normal_deform_mat.multiply(original_normal);
					geo.deform_normals[fi * 3 + 0] += normal.xyz[0] * weight;
					geo.deform_normals[fi * 3 + 1] += normal.xyz[1] * weight;
					geo.deform_normals[fi * 3 + 2] += normal.xyz[2] * weight;
				}
			} else {
				var original_normal = new ummath.UMVec3d(
					geo.original_normals[index * 3 + 0],
					geo.original_normals[index * 3 + 1],
					geo.original_normals[index * 3 + 2]
				);
				normal = normal_deform_mat.multiply(original_normal);
				geo.deform_normals[index * 3 + 0] += normal.xyz[0] * weight;
				geo.deform_normals[index * 3 + 1] += normal.xyz[1] * weight;
				geo.deform_normals[index * 3 + 2] += normal.xyz[2] * weight;
			}
		}

	};

	UMCluster.prototype.draw = function () {

	};

	window.umcluster = {};
	window.umcluster.UMCluster = UMCluster;

}(window.ummath, window.ummesh, window.umnode));
