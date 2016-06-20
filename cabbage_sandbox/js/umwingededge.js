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
		this.edgeHeadList = {};
		this.faceList = [];
		this.faceHeadList = [];
	};

	UMWEdge = function () {
		this.hash = null;
		this.v0 = null;
		this.v1 = null;
		this.f0 = null;
		this.f1 = null;
		this.e0 = null;
		this.e1 = null;
		this.next = null;
	};

	UMWFace = function () {
		this.face = null;
		this.next = null;
	};

	function create(mesh) {
		var i,
			j,
			k,
			vi,
			vj,
			vk,
			vjk,
			triangles = mesh.primitive_list,
			vindex,
			hash,
			edge,
			size,
			wingedEdge = new UMWingedEdge(triangles),
			edgeHashMap = {},
			edgeHashCounter = 0,
			ecount = 0,
			fcount = 0,
			edgeList = wingedEdge.edgeList,
			edgeHeadList = wingedEdge.edgeHeadList,
			faceList = wingedEdge.faceList,
			faceHeadList = wingedEdge.faceHeadList,
			tri;

		faceList.length = 3 * triangles.length;
		faceHeadList.length = mesh.indices.length;
		edgeList.length = 3 * triangles.length;

		for (i = 0, size = triangles.length * 3; i < size; i = i + 1) {
			faceList[i] = new UMWFace();
			faceHeadList[i] = null;
			edgeList[i] = new UMWEdge();
		}
		for (i = 0; i < triangles.length; i = i + 1) {
			tri = triangles[i];
			vindex = tri.vindex();
			// vertex to faces
			for (k = 0; k < 3; k = k + 1) {
				vi = vindex[k];
				faceList[fcount].face = i
				faceList[fcount].next = faceHeadList[vi];
				faceHeadList[vi] = faceList[fcount];
				fcount = fcount + 1;
			}
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
						edgeList[ecount].hash = hash;
						edgeList[ecount].v0 = vindex[j];
						edgeList[ecount].v1 = vindex[k];
						edgeList[ecount].f0 = i;
						edgeList[ecount].e0 = j;
						// for non-manifold edge
						edgeList[ecount].next = edgeHeadList[hash];
						edgeHeadList[hash] = edgeList[ecount];
						ecount = ecount + 1;
						break;
					}
					// second face
					if (edge.hash  === hash) {
						edge.f1 = i;
						edge.e1 = j;
						break;
					}
				}
			}
		}
		faceList.length = fcount;
		edgeHeadList.length = edgeHashCounter + 1;
		edgeList.length = ecount;
		//console.log(edgeHeadList)
		//console.log(edgeList);
		return wingedEdge;
	};

	window.umwingededge = {};
	window.umwingededge.create = create;
}(window.ummath));
