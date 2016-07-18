/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
	"use strict";
	var UMWingedEdge,
		UMWEdge,
		UMWFace;

	UMWingedEdge = function (triangles) {
		this.triangles = triangles;
		this.edgeList = [];
		this.faceList = [];
	};

	/**
			e1		e2
				v1
		f0		v0		f1
			e0		e3
	 */
	UMWEdge = function () {
		this.hash = null;
		this.v0 = null;
		this.v1 = null;
		this.f0 = null;
		this.f1 = null;
		this.e0 = null;
		this.e1 = null;
	};

	UMWFace = function () {
		this.face = null;
		this.edges = [null, null, null];
		this.next = null;
	};

	function create(mesh) {
		var i,
			j,
			k,
			n,
			vi,
			vj,
			vk,
			vjk,
			pre_edge,
			post_edge,
			triangles = mesh.primitive_list,
			vindex,
			hash,
			edge,
			size,
			wingedEdge = new UMWingedEdge(triangles),
			edgeHashMap = {},
			edgeHashCounter = 0,
			ecount = 0,
			edgeList = wingedEdge.edgeList,
			edgeHeadList = {},
			faceList = wingedEdge.faceList,
			tri;

		faceList.length = triangles.length;
		edgeList.length = 3 * triangles.length;

		for (i = 0, size = triangles.length * 3; i < size; i = i + 1) {
			faceList[i] = new UMWFace();
			edgeList[i] = new UMWEdge();
		}
		for (i = 0; i < triangles.length; i = i + 1) {
			tri = triangles[i];
			vindex = tri.vindex();

			faceList[i].face = i;
			// edge to faces
			for (k = 0, j = 2; k < 3; j = k, k = k + 1) {
				vj = vindex[j]; // 2 0 1
				vk = vindex[k]; // 0 1 2
				if (vj > vk) {
					vk = [vj, vj = vk][0]; // swap
				}
				hash = vj + "_" + vk;
				if (!edgeHeadList.hasOwnProperty(hash)) {
					edgeHeadList[hash] = null;
				}
				for (edge = edgeHeadList[hash]; ; edge = edge.next) {
					// first face
					if (edge === null) {
						// face to edges
						faceList[i].edges[k] = ecount;
						edgeList[ecount].hash = hash;
						edgeList[ecount].index = ecount;
						edgeList[ecount].v0 = vindex[j];
						edgeList[ecount].v1 = vindex[k];
						edgeList[ecount].f0 = i;
						edgeHeadList[hash] = edgeList[ecount];
						ecount = ecount + 1;
						break;
					} else {
						// face to edges
						faceList[i].edges[k] = edge.index;
						edge.f1 = i;
						break;
					}
				}
			}
			for (n = 0, j = 1, k = 2; n < 3; j = k, k = n, n = n + 1) {
				pre_edge = edgeList[faceList[i].edges[k]];
				post_edge = edgeList[faceList[i].edges[j]];
				if (edgeList[faceList[i].edges[n]].f0 === i) {
					edgeList[faceList[i].edges[n]].e0 = pre_edge.index;
					edgeList[faceList[i].edges[n]].e1 = post_edge.index;
				} else if (edgeList[faceList[i].edges[n]].f1 === i) {
					edgeList[faceList[i].edges[n]].e2 = pre_edge.index;
					edgeList[faceList[i].edges[n]].e3 = post_edge.index;
				}
			}
		}
		edgeList.length = ecount;
		//console.log(edgeHeadList)
		//console.log(edgeList);
		return wingedEdge;
	};

	window.umwingededge = {};
	window.umwingededge.create = create;
}(window.ummath));
