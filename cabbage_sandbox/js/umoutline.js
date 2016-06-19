/*jslint devel:true*/
/*global Float32Array */
(function (ummath, umline, umpoint) {
	"use strict";
	var UMOutline,
		UMSnaxel,
		UMSnaxels,
		ENERGY_MIN = 0.001;

	function create_linemat(scene) {
		var linemat = new ummaterial.UMMaterial(scene.gl);
		linemat.set_polygon_count(1);
		linemat.set_constant_color(new ummath.UMVec4d(0.0, 0.3, 0.9, 1.0));
		return linemat;
	}

	function create_pointmat(scene) {
		var pointmat = new ummaterial.UMMaterial(scene.gl);
		pointmat.set_polygon_count(1);
		pointmat.set_constant_color(new ummath.UMVec4d(1.0, 0.3, 0.3, 1.0));
		return pointmat;
	}

	UMOutline = function () {
	};

	UMSnaxel = function (via, vib, t) {
		this.via = via;
		this.vib = vib;
		this.va = null;
		this.vb = null;
		this.t = t;
		this.point = null;
	};

	UMSnaxel.prototype.update = function () {
		this.t = this.t + 0.1;
		return this.t > 1.0;
	};

	UMSnaxels = function (scene, mesh, winged_edge) {
		this.snaxels = [];
		this.scene = scene;
		this.mesh = mesh;
		this.winged_edge = winged_edge;
		this.lines = {};
	};

	UMSnaxels.prototype.va = function (snaxel) {
		return [this.mesh.verts[snaxel.via * 3 + 0],
			this.mesh.verts[this.mesh.is_cw ? snaxel.via * 3 + 2 : snaxel.via * 3 + 1],
			this.mesh.verts[this.mesh.is_cw ? snaxel.via * 3 + 1 : snaxel.via * 3 + 2]];
	};

	UMSnaxels.prototype.vb = function (snaxel) {
		return [this.mesh.verts[snaxel.vib * 3 + 0],
			this.mesh.verts[this.mesh.is_cw ? snaxel.vib * 3 + 2 : snaxel.vib * 3 + 1],
			this.mesh.verts[this.mesh.is_cw ? snaxel.vib * 3 + 1 : snaxel.vib * 3 + 2]];
	};

	UMSnaxels.prototype.v = function (snaxel) {
		var ta = 1-snaxel.t,
			tb = snaxel.t,
			a = [snaxel.va[0] * ta, snaxel.va[1] * ta, snaxel.va[2] * ta],
			b = [snaxel.vb[0] * tb, snaxel.vb[1] * tb, snaxel.vb[2] * tb];
		return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
	};

	UMSnaxels.prototype.add_snaxel = function (snaxel_group, snaxel) {
		var set_point_line = function (snaxel) {
				var va = this.va(snaxel),
					vb  = this.vb(snaxel),
					v,
					verts,
					line,
					point;

				snaxel.va = va;
				snaxel.vb = vb;
				v = this.v(snaxel);

				point = new umpoint.UMPoint(this.scene.gl, v, null);
				point.material_list.push(create_pointmat(this.scene));
				this.scene.point_list.push(point);
				snaxel.point = point;
			}.bind(this),
			i;

		set_point_line(snaxel);
		snaxel_group.push(snaxel);
		snaxel.id = this.snaxels.indexOf(snaxel_group);
	};

	UMSnaxels.prototype.delete_snaxel = function (snaxel_group, snaxel) {
		var index = snaxel_group.indexOf(snaxel),
			point_index = this.scene.point_list.indexOf(snaxel.point);

		snaxel.point.dispose();
		snaxel.point = null;
		this.scene.point_list.splice(point_index, 1);
		snaxel_group.splice(index, 1);
	};

	UMSnaxels.prototype.create_group = function () {
		var group = [];
		this.snaxels.push(group);
		return group;
	};

	UMSnaxels.prototype.add_line = function (line_group, sa, sb) {
		var verts,
			line;

		if (sa && sb) {
			verts = this.v(sa).concat(this.v(sb));
			line = new umline.UMLine(this.scene.gl, verts);
		} else {
			line = new umline.UMLine(this.scene.gl, null);
		}
		line.material_list.push(create_linemat(this.scene));
		this.scene.line_list.push(line);

		line_group.push(line);
	};

	UMSnaxels.prototype.update_line = function (group_index, snaxel_group) {
		var i,
			k,
			sa,
			sb,
			verts,
			line,
			line_group = [],
			size;
		if (this.lines.hasOwnProperty(group_index)) {
			line_group = this.lines[group_index];
			if (line_group.length !== snaxel_group.length) {
				for (i = 0, size = snaxel_group.length - line_group.length; i < size; i = i + 1) {
					this.add_line(line_group, null, null);
				}
			}
			for (i = 0, size = snaxel_group.length; i < size; i = i + 1) {
				if (i === snaxel_group.length - 1) {
					sa = snaxel_group[i];
					sb = snaxel_group[0];
				} else {
					sa = snaxel_group[i];
					sb = snaxel_group[i+1];
				}
				line = line_group[i];
				verts = this.v(sa).concat(this.v(sb));
				line.update(verts);
			}
		} else {
			// create new lines
			for (i = 0, size = snaxel_group.length; i < size; i = i + 1) {
				if (i === snaxel_group.length - 1) {
					sa = snaxel_group[i];
					sb = snaxel_group[0];
				} else {
					sa = snaxel_group[i];
					sb = snaxel_group[i+1];
				}
				this.add_line(line_group, sa, sb);
			}
			this.lines[group_index] = line_group;
		}
	};

	UMSnaxels.prototype.update = function () {
		var i,
			k,
			color,
			snaxel_group,
			snaxel,
			v,
			line,
			index,
			need_fan_out;

		for (i = 0; i < this.snaxels.length; i = i + 1) {
			snaxel_group = this.snaxels[i];
			color = new ummath.UMVec4d(
				(i * 20 % 255) / 255.0,
				0.3,
				1.0 - (i * 30 % 255) / 255.0,
				1.0);
			for (k = snaxel_group.length - 1; k >= 0; k = k - 1) {
				snaxel = snaxel_group[k];
				need_fan_out = snaxel.update();
				if (need_fan_out) {
					var via = snaxel.via;
					var vib = snaxel.vib;
					this.delete_snaxel(snaxel_group, snaxel);
					this.fan_out(vib, snaxel_group, via);
				} else {
					v = this.v(snaxel);
					snaxel.point.update(v);
					//snaxel.line.update([].concat(this.va(snaxel)).concat(v));
					//snaxel.line.material_list[0].set_constant_color(color);
				}
			}
			this.update_line(i, snaxel_group);
		}
	};

	function energy() {

	}

	function calc_contour() {

	}

	UMSnaxels.prototype.fan_out_size = function (target_vi, exclude_vi_list) {
		var tri,
			vindex,
			k,
			added = {},
			wface;
		for (wface = this.winged_edge.faceHeadList[target_vi]; wface; wface = wface.next) {
			tri = this.winged_edge.triangles[wface.face];
			vindex = tri.vindex();
			for (k = 0; k < vindex.length; k = k + 1) {
				if (added.hasOwnProperty(vindex[k])) {
					continue;
				}
				if (vindex[k] !== target_vi && exclude_vi_list.indexOf(vindex[k]) < 0) {
					added[vindex[k]] = 1;
				}
			}
		}
		return Object.keys(added).length;
	}

	UMSnaxels.prototype.fan_out = function (target_vi, snaxel_group, exclude_vi_list) {
		var k,
			vartex_index,
			fan_out_size = this.fan_out_size(target_vi, exclude_vi_list),
			wface,
			added_edge = {},
			edge,
			vindex,
			tri,
			vj, vk,
			hash,
			next_face = null;

		while (snaxel_group.length < fan_out_size) {
			var found_nextface = false;
			for (wface = this.winged_edge.faceHeadList[target_vi]; wface; wface = wface.next) {
				if (next_face && next_face !== wface.face) {
					continue;
				}
				tri = this.winged_edge.triangles[wface.face];
				vindex = tri.vindex();
				for (k = 0; k < vindex.length; k = k + 1) {
					if (next_face && next_face !== wface.face) {
						continue;
					}
					if (vindex[k] === target_vi || exclude_vi_list.indexOf(vindex[k]) >= 0) {
						continue;
					}
					vj = target_vi;
					vk = vindex[k];
					if (vj > vk) {
						vk = [vj, vj = vk][0]; // swap
					}
					hash = vj + "_" + vk;
					if (added_edge.hasOwnProperty(hash)) {
						continue;
					}
					found_nextface = true;
					for (edge = this.winged_edge.edgeHeadList[hash]; edge; edge = edge.next) {
						if (edge.v0 === vj && edge.v1 === vk) {
							if (wface.face === edge.f0) {
								next_face = edge.f1;
								this.add_snaxel(snaxel_group, new UMSnaxel(target_vi, vindex[k], 0.1));
								added_edge[hash] = 1;
								break;
							} else if (wface.face === edge.f1) {
								next_face = edge.f0;
								this.add_snaxel(snaxel_group, new UMSnaxel(target_vi, vindex[k], 0.1));
								added_edge[hash] = 1;
								break;
							} else {
								console.error(wface.face, edge);
							}
						}
					}
				}
				if (!found_nextface) {
					next_face = null;
				}
			}
		}
	}

	function find_initial_snaxels(scene, mesh, winged_edge) {
		var i,
			k,
			tri,
			normals,
			vindex,
			vertex,
			n,
			nv,
			target_vi,
			target_n,
			target_nv,
			found,
			wface,
			edge,
			next_face,
			camera_dir = scene.camera.view_matrix().transposed().multiply(new ummath.UMVec3d(0, 0, -1)).normalized(),
			snaxels = new UMSnaxels(scene, mesh, winged_edge);

		//vpmrot.m[3][0] = vpmrot.m[3][1] = vpmrot.m[3][2] = 0.0;
		//vpm = vpm.transposed();
		console.time('find_initial_snaxels');

		for (i = 0; i < mesh.indices.length; i = i + 1) {
			found = true;
			target_vi = mesh.indices[i];
			target_n = new ummath.UMVec3d(
				mesh.normals[target_vi * 3 + 0],
				mesh.normals[mesh.is_cw ? target_vi * 3 + 2 : target_vi * 3 + 1],
				mesh.normals[mesh.is_cw ? target_vi * 3 + 1 : target_vi * 3 + 2]);
			target_nv = target_n.dot(camera_dir);
			//console.log(mesh.normals, target_n.xyz, camera_dir.xyz, target_nv)
			if (target_nv >= 0.0) { continue; }
			var added = {};
			var wfaces = [];
			//console.log("search", target_v.xyz, target_n.xyz, target_nv);
			for (wface = winged_edge.faceHeadList[target_vi]; wface; wface = wface.next) {
				tri = winged_edge.triangles[wface.face];
				normals = tri.normal();
				vertex = tri.vertex();
				vindex = tri.vindex();
				for (k = 0; k < vindex.length; k = k + 1) {
					if (added.hasOwnProperty(vindex[k])) {
						continue;
					}
					if (vindex[k] !== target_vi) {
						n = normals[k];
						if (found) {
							nv = n.dot(camera_dir);
							if (nv < target_nv) {
								found = false;
								break;
							}
						}
					}
				}
				if (!found) { break; }
			}
			if (found) {
				//console.log(founds)
				//console.log("wface", wfaces);
				//console.log(target_nv, target_v.xyz);
				snaxels.fan_out(target_vi, snaxels.create_group(), []);

				tri = winged_edge.triangles[parseInt(i / 3, 10)];
				tri.mark = true;
				if (snaxels.snaxels.length > 100) {
					break;
				}
			}
		}
		console.timeEnd('find_initial_snaxels');
		return snaxels;
	}

	function create(scene, mesh, winged_edge) {
		var snaxels,
			min_energy;

		snaxels = find_initial_snaxels(scene, mesh, winged_edge);

		window.umgl.start_mainloop();
		var i = 0, id = setInterval(function () {
			snaxels.update();
			i = i + 1;
			if (i >= 8) {
				clearInterval(id);
				window.umgl.stop_mainloop();
			}
		}, 100);

		/*
		while (true) {
			min_energy = calc_contour();
			if (min_energy === pre_energy || Math.abs(min_energy) < ENERGY_MIN) {
				break;
			} else {
				pre_energy = min_energy;
			}
		}
		*/
	};

	window.umoutline = {};
	window.umoutline.create = create;
}(window.ummath, window.umline, window.umpoint));
