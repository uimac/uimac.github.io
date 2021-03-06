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

	UMSnaxel = function (edge, is_forward, t) {
		this.edge = edge;
		this.is_forward = is_forward;
		this.va = null;
		this.vb = null;
		this.t = t;
		this.point = null;
		this.is_need_fanout = false;
	};

	UMSnaxel.prototype.update = function () {
		this.t = this.t + 0.1;
		this.is_need_fanout = this.t > 1.0;
	};

	UMSnaxels = function (scene, mesh, winged_edge) {
		this.snaxels = [];
		this.scene = scene;
		this.mesh = mesh;
		this.winged_edge = winged_edge;
		this.lines = {};
		this.mark_list = {};
	};

	UMSnaxels.prototype.va = function (snaxel) {
		var vi = snaxel.is_forward ? snaxel.edge.v0 : snaxel.edge.v1;
		return [this.mesh.verts[vi * 3 + 0],
			this.mesh.verts[this.mesh.is_cw ? vi * 3 + 2 : vi * 3 + 1],
			this.mesh.verts[this.mesh.is_cw ? vi * 3 + 1 : vi * 3 + 2]];
	};

	UMSnaxels.prototype.vb = function (snaxel) {
		var vi = snaxel.is_forward ? snaxel.edge.v1 : snaxel.edge.v0;
		return [this.mesh.verts[vi * 3 + 0],
			this.mesh.verts[this.mesh.is_cw ? vi * 3 + 2 : vi * 3 + 1],
			this.mesh.verts[this.mesh.is_cw ? vi * 3 + 1 : vi * 3 + 2]];
	};

	UMSnaxels.prototype.v = function (snaxel) {
		var ta = 1-snaxel.t,
			tb = snaxel.t,
			a = [snaxel.va[0] * ta, snaxel.va[1] * ta, snaxel.va[2] * ta],
			b = [snaxel.vb[0] * tb, snaxel.vb[1] * tb, snaxel.vb[2] * tb];
		return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
	};

	UMSnaxels.prototype.add_snaxel = function (snaxel_group, snaxel, insert_index) {
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

		set_point_line(snaxel);;
		//console.log("add snaxel")
		snaxel_group.splice(insert_index, 0, snaxel);
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
			remove_size,
			line,
			line_group = [],
			size;
		if (this.lines.hasOwnProperty(group_index)) {
			line_group = this.lines[group_index];
			if (line_group.length < snaxel_group.length) {
				console.log("added size::", snaxel_group.length - line_group.length)
				for (i = 0, size = snaxel_group.length - line_group.length; i < size; i = i + 1) {
					this.add_line(line_group, null, null);
				}
			} else if (line_group.length > snaxel_group.length) {
				remove_size = line_group.length - snaxel_group.length;
				for (i = 0; i < remove_size; i = i + 1) {
					line_group[i].dispose();
					this.scene.line_list.splice(this.scene.line_list.indexOf(line_group[i]), 1);
				}
				line_group.splice(0, remove_size);
			}
			//console.log("snaxel_group.length;", snaxel_group.length)
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

	UMSnaxels.prototype.split = function (snaxel_group) {
		var i,
			k,
			pre,
			post,
			snaxel_group,
			snaxel,
			comp,
			initial_len;

		initial_len = snaxel_group.length;
		for (i = 0; i < snaxel_group.length; i = i + 1) {
			snaxel = snaxel_group[i];
			for (k = 0; k < snaxel_group.length; k = k + 1) {
				comp = snaxel_group[k];
				if (i !== k) {
					if (snaxel.hash === comp.hash) {
						comp.to_be_remove = true;
						snaxel.to_be_remove = true;
					}
					if (snaxel.is_need_fanout) {
						if (comp.is_need_fanout && snaxel.vib === comp.vib) {
							snaxel.to_be_remove = true;
						}
					}
				}
			}
		}
		for (k = snaxel_group.length - 1; k >= 0; k = k - 1) {
			if (snaxel_group[k].to_be_remove !== undefined) {
				this.delete_snaxel(snaxel_group, snaxel_group[k]);
			}
		}
	};

	UMSnaxels.prototype.update = function () {
		var i,
			k,
			color,
			snaxel_group,
			snaxel,
			v,
			pre,
			post,
			line,
			index;

		for (i = 0; i < this.snaxels.length; i = i + 1) {
			snaxel_group = this.snaxels[i];
			color = new ummath.UMVec4d(
				(i * 20 % 255) / 255.0,
				0.3,
				1.0 - (i * 30 % 255) / 255.0,
				1.0);

			var initial_len = snaxel_group.length;
			// update
			for (k = snaxel_group.length - 1; k >= 0; k = k - 1) {
				snaxel = snaxel_group[k];
				snaxel.update();
			}
			// split
			//this.split(snaxel_group);
			// fanout
			for (k = snaxel_group.length - 1; k >= 0; k = k - 1) {
				snaxel = snaxel_group[k];
				//console.log(pre, post, snaxel_group[pre], snaxel_group[post])
				if (snaxel.is_need_fanout) {
					pre = k - 1;
					post = k + 1;
					if (post > snaxel_group.length - 1) {
						post = 0;
					}
					if (pre > snaxel_group.length - 1) {
						pre = 0;
					}
					if (post < 0) {
						post = snaxel_group.length - 1;
					}
					if (pre < 0) {
						pre = snaxel_group.length - 1;
					}
					//console.log("presize", snaxel_group.length);
					//this.delete_snaxel(snaxel_group, snaxel_group[post]);
					if (this.fan_out(snaxel.edge, snaxel_group, k)) {
						//this.delete_snaxel(snaxel_group, snaxel);
						//console.log("postsize", snaxel_group.length);
					}
					//this.delete_snaxel(snaxel_group, snaxel_group[pre]);
				}
			}
			// update
			for (k = snaxel_group.length - 1; k >= 0; k = k - 1) {
				snaxel = snaxel_group[k];
				snaxel.point.update(this.v(snaxel));
			}
			this.update_line(i, snaxel_group);
		}
	};

	function energy() {

	}

	function calc_contour() {

	}

	UMSnaxels.prototype.fan_out = function (src_edge, snaxel_group, insert_index) {
		var i,
			k,
			target_vi,
			vartex_index,
			wface,
			edge,
			doneEdges = {};

		target_vi = src_edge.v1;
		for (i = 0; i < this.winged_edge.faceList.length; i = i + 1) {
			wface = this.winged_edge.faceList[i];
			for (k = 0; k < wface.edges.length; k = k + 1) {
				if (!wface.edges[k]) {
					continue;
				}
				if (doneEdges.hasOwnProperty(wface.edges[k])) {
					continue;
				}
				edge = this.winged_edge.edgeList[wface.edges[k]];
				if (edge.v0 === target_vi) {
					doneEdges[wface.edges[k]] = 1
					this.add_snaxel(snaxel_group, new UMSnaxel(edge, true, 0.1), insert_index);
				}
			}
		}
		return true;
	}

	function find_initial_snaxels(scene, mesh, winged_edge) {
		var i,
			k,
			n,
			nv,
			vi,
			compares,
			doneVi = {},
			target_vi,
			target_n,
			target_nv,
			found,
			wface,
			edge,
			camera_dir = scene.camera.view_matrix().transposed().multiply(new ummath.UMVec3d(0, 0, -1)).normalized(),
			snaxel_group,
			snaxels = new UMSnaxels(scene, mesh, winged_edge);

		//vpmrot.m[3][0] = vpmrot.m[3][1] = vpmrot.m[3][2] = 0.0;
		//vpm = vpm.transposed();
		console.time('find_initial_snaxels');
		console.log("camera_dir", camera_dir)

		for (i = 0; i < winged_edge.faceList.length; i = i + 1) {
			wface = winged_edge.faceList[i];
			for (k = 0; k < wface.edges.length; k = k + 1) {
				if (!wface.edges[k]) {
					continue;
				}
				found = true;
				edge = winged_edge.edgeList[wface.edges[k]];
				if (!edge.e3) {
					continue;
				}

				target_vi = edge.v0;
				target_n = new ummath.UMVec3d(
					mesh.normals[target_vi * 3 + 0],
					mesh.normals[mesh.is_cw ? target_vi * 3 + 2 : target_vi * 3 + 1],
					mesh.normals[mesh.is_cw ? target_vi * 3 + 1 : target_vi * 3 + 2]);
				target_nv = target_n.dot(camera_dir);
				if (target_nv > 0.0) { continue; }

				compares = [edge.v1, winged_edge.edgeList[edge.e0].v0, winged_edge.edgeList[edge.e3].v1];
				for (n = 0; n < compares.length; n = n + 1) {
					vi = compares[n];
					n = new ummath.UMVec3d(
						mesh.normals[vi * 3 + 0],
						mesh.normals[mesh.is_cw ? vi * 3 + 2 : vi * 3 + 1],
						mesh.normals[mesh.is_cw ? vi * 3 + 1 : vi * 3 + 2]);
					nv = n.dot(camera_dir);
					if (nv < target_nv) {
						found = false;
						break;
					}
				}
				if (found && !doneVi.hasOwnProperty(target_vi)) {
					doneVi[target_vi] = 1;

					snaxel_group = snaxels.create_group();
					console.log("add snaxel");
					snaxels.add_snaxel(snaxel_group, new UMSnaxel(edge, true, 0.1), 0);
					snaxels.add_snaxel(snaxel_group, new UMSnaxel(winged_edge.edgeList[edge.e0], true, 0.1), 0);
					snaxels.add_snaxel(snaxel_group, new UMSnaxel(winged_edge.edgeList[edge.e3], false, 0.1), 0);

					winged_edge.triangles[wface.face].mark = true;
					if (snaxels.snaxels.length > 0) {
						console.timeEnd('find_initial_snaxels');
						return snaxels;
					}
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
			if (i >= 5) {
				clearInterval(id);
				window.umgl.stop_mainloop();
			}
		}, 500);

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
