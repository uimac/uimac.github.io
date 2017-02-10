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
		///if (!this.link_node.is_need_update_deform()) { return; }
		
		var geo = this.link_geometry;

		var vertex_deform_mat = this.link_node.vertex_deform_matrix();
		var normal_deform_mat = this.link_node.normal_deform_matrix();

		for (i = 0; i < this.indices.length; i = i + 1) {
			index = this.indices[i];
			weight = this.weights[i];
			vertex = vertex_deform_mat.multiply([
				geo.original_verts[index * 3 + 0],
				geo.original_verts[index * 3 + 1],
				geo.original_verts[index * 3 + 2],
				1.0
			]);

			geo.deform_verts[index * 3 + 0] += vertex[0] * weight
			geo.deform_verts[index * 3 + 1] += vertex[1] * weight
			geo.deform_verts[index * 3 + 2] += vertex[2] * weight
//console.log(this.link_node.name, index, weight, vertex.scale(weight).xyz, gt.m)

			if (geo.original_normals.length > geo.original_verts.length) {
				var filist = geo.vertex_index_to_face_index_map[index];
				if (!filist) continue;
				for (k = 0; k < filist.length; k = k + 1) {
					var fi = filist[k];
					normal = normal_deform_mat.multiply([
							geo.original_normals[fi * 3 + 0],
							geo.original_normals[fi * 3 + 1],
							geo.original_normals[fi * 3 + 2]
						]);
					geo.deform_normals[fi * 3 + 0] += normal[0] * weight;
					geo.deform_normals[fi * 3 + 1] += normal[1] * weight;
					geo.deform_normals[fi * 3 + 2] += normal[2] * weight;
				}
			} else {
				normal = normal_deform_mat.multiply([
					geo.original_normals[index * 3 + 0],
					geo.original_normals[index * 3 + 1],
					geo.original_normals[index * 3 + 2]
				]);
				geo.deform_normals[index * 3 + 0] += normal[0] * weight;
				geo.deform_normals[index * 3 + 1] += normal[1] * weight;
				geo.deform_normals[index * 3 + 2] += normal[2] * weight;
			}
		}

	};

	UMCluster.prototype.draw = function () {

	};

	window.umcluster = {};
	window.umcluster.UMCluster = UMCluster;

}(window.ummath, window.ummesh, window.umnode));
