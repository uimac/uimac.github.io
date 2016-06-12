/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
	"use strict";
	var UMWingedEdge;

	UMWingedEdge = function () {
		this.v0 = null;
		this.v1 = null;
		this.f0 = null;
		this.f1 = null;
		this.e0 = null;
		this.e1 = null;
		this.next = null;
	};

	function create(mesh) {
		var i,
			j,
			k,
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
			edgeHashMap = {},
			edgeHashCounter = 0,
			tri,
			count = 0;

			console.log("create winged edge");

		edgeList.length = 3 * triangles.length;
		edgeHeadList.length = 3 * triangles.length;

		for (i = 0, size = triangles.length * 3; i < size; i = i + 1) {
			edgeHeadList[i] = null;
			edgeList[i] = new UMWingedEdge();
		}

		for (i = 0; i < triangles.length; i = i + 1) {
			tri = triangles[i];
			vindex = tri.vindex();
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
						edgeList[count].v0 = vj;
						edgeList[count].v1 = vk;
						edgeList[count].f0 = i;
						edgeList[count].e0 = j;
						// for non-manifold edge
						edgeList[count].next = edgeHeadList[hash];
						edgeHeadList[hash] = edgeList[count];
						count = count + 1;
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
		edgeList.length = count;
		console.log(edgeHeadList)
		console.log(edgeList);
	};

	window.umwingededge = {};
	window.umwingededge.create = create;
}(window.ummath));
