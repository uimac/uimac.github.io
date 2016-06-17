/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
	"use strict";
	var UMWingedEdge,
		UMVFace;

	UMWingedEdge = function () {
		this.v0 = null;
		this.v1 = null;
		this.f0 = null;
		this.f1 = null;
		this.e0 = null;
		this.e1 = null;
		this.next = null;
	};

	UMVFace = function () {
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
			edgeList = [],
			edgeHeadList = [],
			faceList = [],
			faceHeadList = [],
			edgeHashMap = {},
			edgeHashCounter = 0,
			ecount = 0,
			fcount = 0,
			tri;

			console.log("create winged edge");

		return;

		faceList.length = 3 * triangles.length;
		faceHeadList.length = 3 * triangles.length;
		edgeList.length = 3 * triangles.length;
		edgeHeadList.length = 3 * triangles.length;

		for (i = 0, size = triangles.length * 3; i < size; i = i + 1) {
			faceList[i] = new UMVFace();
			faceHeadList[i] = null;
			edgeHeadList[i] = null;
			edgeList[i] = new UMWingedEdge();
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
			for (k = 0, j = 2; k < 2; j = k, k = k + 1) {
				vj = vindex[j];
				vk = vindex[k];
				if (vj > vk) {
					vk = [vj, vj = vk][0]; // swap
				}
				vjk = vj + "_" + vk;
				if (!edgeHashMap.hasOwnProperty(vjk)) {
					edgeHashMap[vjk] = edgeHashCounter++;
				}
				hash = edgeHashMap[vjk];
				for (edge = edgeHeadList[hash]; ; edge = edge.next) {
					// first face
					if (edge === null) {
						edgeList[ecount].v0 = vj;
						edgeList[ecount].v1 = vk;
						edgeList[ecount].f0 = i;
						edgeList[ecount].e0 = j;
						// for non-manifold edge
						edgeList[ecount].next = edgeHeadList[hash];
						edgeHeadList[hash] = edgeList[ecount];
						ecount = ecount + 1;
						break;
					}
					// second face
					if (edge.v0 === vj && edge.v1 === vk) {
						edge.f1 = i;
						edge.e1 = j;
						break;
					}
				}
			}
		}
		edgeHeadList.length = edgeHashCounter + 1;
		edgeList.length = ecount;
		console.log(edgeHeadList)
		console.log(edgeList);
	};

	window.umwingededge = {};
	window.umwingededge.create = create;
}(window.ummath));
