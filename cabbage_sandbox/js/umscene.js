/*jslint devel:true*/
/*global Float32Array, Uint8Array */
(function (ummath, umline, ummesh, umboxlist, umnode, ummaterial, umcamera, umshader,
	umbvh, umloader) {
	"use strict";
	var UMScene,
		now = window.performance && (
	    performance.now ||
	    performance.mozNow ||
	    performance.msNow ||
	    performance.oNow ||
	    performance.webkitNow );

	UMScene = function (gl) {
		this.gl = gl;
		this.camera = null;
		this.shader_list = [];
		this.shader = null;
		this.grid = null;
		this.test_mesh = null;
		this.mesh_list = [];
		this.line_list = [];
		this.point_list = [];
		this.nurbs_list = [];
		this.box_list = [];
		this.node_list = [];
		this.cluster_list = [];
		this.update_func_list = [];
		this.primitive_list = [];
		this.wedge_list = [];
		this.width = 800;
		this.height = 600;
		this.current_time = 0;
		this.is_playing = false;
		this.is_pausing = false;
		this.is_cw = false;
		this.loader = new umloader.UMLoader(gl);
		this.bvh = new umbvh.UMBvh();

		this.node_map = {};
			
		if (window && window.process && window.process.type) {
			var umiomap = require('umiomap')
			this.update_func_list.push(function () {
				var bosdata = umiomap.load("testmmap");
				var bos = umbos.load(new Uint8Array(bosdata), true);
				var id;
				var src, dst;
				var i, bosnode, node;
				for (id in bos.skeleton_map) {
					src = bos.skeleton_map[id];
					if (this.node_map.hasOwnProperty(src.name)) {
						dst = this.node_map[src.name];
						if (!dst.parent) continue;
						//dst.initial_local_transform = new ummath.UMMat44d(src.local_transform);
						//dst.local_transform = new ummath.UMMat44d(src.local_transform);
						dst.global_transform = new ummath.UMMat44d(src.global_transform);
						//dst.initial_global_transform = new ummath.UMMat44d(src.global_transform);
						if (dst.name === "uparm.L") {
							console.log(src.global_transform);
						}
						//dst.update();
					} else {
						console.log(src.name)
					}
					/*
					else {
						var node_map = {}
						for (i in bos.skeleton_map) {
							bosnode = bos.skeleton_map[i];
							node = new umnode.UMNode(this.gl);
							node.global_transform = new ummath.UMMat44d(bosnode.global_transform);
							node.local_transform = new ummath.UMMat44d(bosnode.local_transform);
							node.initial_global_transform = new ummath.UMMat44d(bosnode.global_transform);
							node.initial_local_transform = new ummath.UMMat44d(bosnode.local_transform);
							node.id = bosnode.id;
							node.name = bosnode.name;
							node_map[node.id] = node;
							this.node_list.push(node);
							this.node_map[node.name] = node;
						}
						for (i in bos.skeleton_map) {
							bosnode = bos.skeleton_map[i];
							if (node_map.hasOwnProperty(bosnode.parent_id)) {
								node_map[i].parent = node_map[bosnode.parent_id];
								node_map[bosnode.parent_id].children.push(node_map[i]);
							}
						}
						for (i in node_map) {
							node_map[i].update();
							if (!node_map[i].parent) {
								//node_map[i].local_transform = mesh_matrix.multiply(node_map[i].local_transform);
								node_map[i].update_transform();
							}
						}
					}
					*/
				}
				/*
				for (name in this.node_map) {
					if (!this.node_map[name].parent) {
						this.node_map[name].update_transform();
					}
				}
				*/
			}.bind(this));
		}
	};

	function create_test_mesh(gl) {
		var mesh,
			verts = [
				0, 0, 0,
				10, 0, 0,
				10, 10, 0,
				0, 0, 0,
				10, 10, 0,
				0, 10, 0
			],
			normals = [
				0, 0, 1,
				0, 0, 1,
				0, 0, 1,
				0, 0, 1,
				0, 0, 1,
				0, 0, 1
			],
			uvs = [
				0, 1,
				1, 1,
				1, 0,
				0, 1,
				1, 0,
				0, 0
			],
			mesh_mat;
		mesh = new ummesh.UMMesh(gl, "test", verts, normals, uvs);
		mesh_mat = new ummaterial.UMMaterial(gl);
		mesh_mat.set_polygon_count(2);
		mesh.material_list.push(mesh_mat);
		return mesh;
	}

	function create_grid(gl) {
		var line_list = [],
			i,
			k,
			quarter = 10,
			offset,
			line1,
			line2,
			line_size = 25.0,
			delta = line_size / quarter,
			line,
			linemat,
			linemat_x,
			linemat_y,
			linemat_z;

		for (i = 0; i < 4; i = i + 1) {
			if (i === 1) {
				offset = new ummath.UMVec3d(-line_size, 0, 0);
			} else if (i === 2) {
				offset = new ummath.UMVec3d(-line_size, 0, -line_size);
			} else if (i === 3) {
				offset = new ummath.UMVec3d(0, 0, -line_size);
			} else {
				offset = new ummath.UMVec3d(0, 0, 0);
			}
			for (k = 0; k <= quarter; k = k + 1) {
				line1 = [new ummath.UMVec3d(k * delta, 0, 0), new ummath.UMVec3d(k * delta, 0, line_size)];
				line2 = [new ummath.UMVec3d(0, 0, k * delta), new ummath.UMVec3d(line_size, 0, k * delta)];
				line1[0] = line1[0].add(offset);
				line1[1] = line1[1].add(offset);
				line2[0] = line2[0].add(offset);
				line2[1] = line2[1].add(offset);
				line_list = line_list.concat(line1[0].value());
				line_list = line_list.concat(line1[1].value());
				line_list = line_list.concat(line2[0].value());
				line_list = line_list.concat(line2[1].value());
			}
		}
		line = new umline.UMLine(gl, line_list);
		linemat_z = new ummaterial.UMMaterial(gl);
		linemat_z.set_polygon_count(1);
		linemat_z.set_constant_color(new ummath.UMVec4d(0.3, 0.3, 0.9, 1.0));
		line.material_list.push(linemat_z);
		linemat_x = new ummaterial.UMMaterial(gl);
		linemat_x.set_polygon_count(1);
		linemat_x.set_constant_color(new ummath.UMVec4d(0.9, 0.3, 0.3, 1.0));
		line.material_list.push(linemat_x);
		linemat = new ummaterial.UMMaterial(gl);
		linemat.set_polygon_count(line_list.length / 3 / 2 - 2);
		linemat.set_constant_color(new ummath.UMVec4d(1.0, 1.0, 1.0, 1.0));
		line.material_list.push(linemat);
		return line;
	}

	function get_time() {
		return ( now && now.call( performance ) ) || ( new Date().get_time() );
	}

	UMScene.prototype.play = function () {
		if (this.is_pausing) {
			this.is_pausing = false;
		} else {
			this.current_time = 0;
		}
		this.last_time = get_time();
		this.is_playing = true;
	};

	UMScene.prototype.stop = function () {
		var i;
		this.current_time = 0;
		this.is_playing = false;
		for (i = 0; i < this.update_func_list.length; i = i + 1) {
			this.update_func_list[i]();
		}
	};

	UMScene.prototype.pause = function () {
		this.is_pausing = true;
		this.is_playing = false;
	};

	UMScene.prototype.clear = function () {
		if (this.gl) {
			this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		}
	};

	UMScene.prototype.update = function () {
		var i,
			time,
			step;

		this.camera.update();
		if (this.is_playing) {
			time = get_time();
			step = time - this.last_time;
			this.current_time = this.current_time + step;
			for (i = 0; i < this.update_func_list.length; i = i + 1) {
				this.update_func_list[i]();
			}
			this.last_time = time;
			console.log(this.current_time);
		}
	};

	UMScene.prototype.set_front_face = function (is_cw) {
		var gl = this.gl;
		if (!this.gl) { return; }
		if (this.is_cw !== is_cw) {
			this.is_cw = is_cw;
			if (this.is_cw) {
				gl.frontFace(gl.CW);
			} else {
				gl.frontFace(gl.CCW);
			}
		}
	};

	UMScene.prototype.draw = function () {
		var i,
			gl = this.gl;

		if (this.test_mesh) {
			this.test_mesh.draw(this.current_shader, this.camera);
		}
		for (i = 0; i < this.mesh_list.length; i = i + 1) {
			this.set_front_face(this.mesh_list[i].is_cw);
			if (this.mesh_list[i].material_list.length > 0 && 
				this.mesh_list[i].material_list[0].diffuse_texture) 
			{
				this.mesh_list[i].draw(this.shader_list[0], this.camera);
			} else {
				this.mesh_list[i].draw(this.shader_list[4], this.camera);
			}
		}
		for (i = 0; i < this.line_list.length; i = i + 1) {
			this.line_list[i].draw(this.shader_list[3], this.camera);
		}
		for (i = 0; i < this.point_list.length; i = i + 1) {
			this.point_list[i].draw(this.shader_list[3], this.camera);
		}
		for (i = 0; i < this.box_list.length; i = i + 1) {
			if (this.box_list[i].isLine) {
				this.box_list[i].draw(this.shader_list[3], this.camera);
			} else {
				this.box_list[i].draw(this.current_shader, this.camera);
			}
		}
		for (i = 0; i < this.node_list.length; i = i + 1) {
			this.node_list[i].draw(this.shader_list[0], this.camera);
		}
		for (i = 0; i < this.cluster_list.length; i = i + 1) {
			this.cluster_list[i].draw(this.shader_list[0], this.camera);
		}
		for (i = 0; i < this.nurbs_list.length; i = i + 1) {
			this.set_front_face(true);
			this.nurbs_list[i].draw(this.shader_list[2], this.camera);
		}
		this.grid.draw(this.shader_list[3], this.camera);
	};

	UMScene.prototype.init = function () {
		var gl = this.gl,
			initial_shader,
			shader;
		this.camera = new umcamera.UMCamera(gl, this.width, this.height);
		initial_shader = new umshader.UMShader(gl);
		initial_shader.create_shader_from_id('vertex_shader', 'fragment_shader');
		this.shader_list.push(initial_shader);
		this.current_shader = initial_shader;

		shader = new umshader.UMShader(gl);
		shader.create_shader_from_id('edge_vertex_shader', 'edge_fragment_shader');
		this.shader_list.push(shader);

		shader = new umshader.UMShader(gl);
		shader.create_shader_from_id('nurbs_vertex_shader', 'nurbs_fragment_shader');
		this.shader_list.push(shader);

		shader = new umshader.UMShader(gl);
		shader.create_shader_from_id('vertex_shader', 'fragment_shader_constant');
		this.shader_list.push(shader);

		shader = new umshader.UMShader(gl);
		shader.create_shader_from_id('vertex_shader', 'fragment_shader_notex');
		this.shader_list.push(shader);

		this.grid = create_grid(gl);

		var boxlist = new umboxlist.UMBoxList(gl, []);
		this.box_list.push(boxlist);
	};

	UMScene.prototype.change_shader = function (shader_number) {
		var i;
		for (i = 0; i < this.mesh_list.length; i = i + 1) {
			this.mesh_list[i].reset_shader_location();
		}
		for (i = 0; i < this.box_list.length; i = i + 1) {
			this.box_list[i].reset_shader_location();
		}
		for (i = 0; i < this.node_list.length; i = i + 1) {
			this.node_list[i].reset_shader_location();
		}
		this.camera.reset_shader_location();
		this.current_shader = this.shader_list[shader_number];
	};

	UMScene.prototype.resize = function (width, height) {
		this.width = width;
		this.height = height;
		this.camera.resize(width, height);
	};

	UMScene.prototype.add_mesh_to_primitive_list = function (mesh, build) {
		console.time('create primitive list');
		this.primitive_list = this.primitive_list.concat(mesh.create_primitive_list());
		//Array.prototype.push.apply(this.primitive_list, mesh.create_primitive_list());
		console.timeEnd('create primitive list');

		console.time('create winged edge');
		//this.wedge_list = this.wedge_list.concat(mesh.create_winged_edge());
		console.timeEnd('create winged edge');

		console.time('bvh build');
		if (build) {
			this.bvh.build(this.primitive_list);
		}
		console.timeEnd('bvh build');

		//this.bvh.boxlist(this.box_list[0]);
		//this.box_list[0].update();
	};

	UMScene.prototype.load_obj = function (name, obj_text) {
		this.loader.load_obj(name, obj_text, function (result) {
			Array.prototype.push.apply(this.mesh_list, result.mesh_list);
			var i;
			for (i = 0; i < result.mesh_list.length; i = i + 1) {
				this.add_mesh_to_primitive_list(result.mesh_list[i], true);
			}
		}.bind(this));
	};

	UMScene.prototype.load_bos = function (name, arrayBuf, texture_files, endCallback) {
		this.loader.load_bos(name, arrayBuf, texture_files, function (result) {
			Array.prototype.push.apply(this.mesh_list, result.mesh_list);
			Array.prototype.push.apply(this.node_list, result.node_list);
			Array.prototype.push.apply(this.cluster_list, result.cluster_list);

			var root_nodes = [];
			var arm = null;
			var node;
			for (var i = 0; i < result.node_list.length; i = i + 1) {
				node = result.node_list[i];
				/*
				if (node.name === "neck" || node.name === "spine1_bb_" || node.name === "Bone.001") {
			//		if (result.node_list[i].name === "Bone.001") {
					arm = node;
				}
				*/
				if (!node.parent) {
					root_nodes.push(node);
				}
				this.node_map[node.name] = node;
			}
			
			var maxrot = 2
			var currot = 0;
			var unit = 1;
			this.update_func_list.push((function (arm, roots, result) {
					return function () {
						var mesh;
						var vtof;
						if (arm) {
							currot += unit;
							if (Math.abs(currot) > maxrot) {
								unit = -unit;
							}
							var rad = ummath.um_to_radian(10 * unit);
							var rot = new ummath.UMMat44d([
								Math.cos(rad), -Math.sin(rad), 0, 0,
								Math.sin(rad), Math.cos(rad), 0,             0,
								0, 0, 1, 0,
								0, 0, 0,             1
							])
							var mat = arm.local_transform ;
							var trans = new ummath.UMVec3d(mat.m[3][0], mat.m[3][1], mat.m[3][2])
							ummath.um_matrix_remove_trans(mat);
							mat = mat.multiply(rot);
							mat.m[3][0] = trans.xyz[0];
							mat.m[3][1] = trans.xyz[1];
							mat.m[3][2] = trans.xyz[2];
							arm.local_transform = mat;
						}
						var i, k, n, m;
						/*
						for (i = 0; i < roots.length; i = i + 1) {
							roots[i].update_transform();
						}
						*/
						for (i = 0; i < result.node_list.length; i = i + 1) {
							result.node_list[i].update();
						}
						for (i = 0; i < result.mesh_list.length; i = i + 1) {
							mesh = result.mesh_list[i]
							for (k = 0; k < mesh.deform_verts.length; ++k) {
								mesh.deform_verts[k] = 0;
								mesh.deform_normals[k] = 0;
							}
							if (!mesh.vertex_index_to_face_index_map) {
								mesh.vertex_index_to_face_index_map = {};
								for (k = 0; k < mesh.indices.length; k = k + 1) {
									vtof = mesh.vertex_index_to_face_index_map[mesh.indices[k]];
									if (vtof === undefined) {
										mesh.vertex_index_to_face_index_map[mesh.indices[k]] = [];
										vtof = mesh.vertex_index_to_face_index_map[mesh.indices[k]];
									}
									vtof.push(k);
								}
							}
						}
						for (i = 0; i < result.cluster_list.length; i = i + 1) {
							result.cluster_list[i].update_geometry();
						}
						for (i = 0; i < result.mesh_list.length; i = i + 1) {
							mesh = result.mesh_list[i];
							for (k = 0; k < mesh.deform_normals.length / 3; ++k) {
								n = new ummath.UMVec3d(
									mesh.deform_normals[k * 3 + 0],
									mesh.deform_normals[k * 3 + 1],
									mesh.deform_normals[k * 3 + 2]).normalized();
								mesh.deform_normals[k * 3 + 0] = n.xyz[0];
								mesh.deform_normals[k * 3 + 1] = n.xyz[1];
								mesh.deform_normals[k * 3 + 2] = n.xyz[2];
							}
							mesh.update(
								result.mesh_list[i].deform_verts, 
								result.mesh_list[i].deform_normals, 
								null, 
								result.mesh_list[i].indices);
						}
					};
				}(arm, root_nodes, result)));

			endCallback();
		}.bind(this));
	};

	UMScene.prototype.load_gltf = function (name, text) {
		this.loader.load_bos(name, text, function (result) {
			Array.prototype.push.apply(this.mesh_list, result.mesh_list);
			var i;
			for (i = 0; i < result.mesh_list.length; i = i + 1) {
				this.add_mesh_to_primitive_list(result.mesh_list[i], true);
			}
		}.bind(this));
	};

	UMScene.prototype._load_abc_curve = function (abcio, abcpath) {
		var abccurve,
			i,
			n,
			m,
			curve,
			path_list,
			material;

		path_list = abcio.get_curve_path_list(abcpath);
		console.log(path_list);
		for (i = 0; i < path_list.length; i = i + 1) {
			abccurve = abcio.get_curve(abcpath, path_list[i]);
			console.log(abccurve);
		}
	};

	UMScene.prototype._load_abc_nurbs = function (abcio, abcpath) {
		var abcnurbs,
			i,
			n,
			m,
			nurbs,
			path_list,
			material;

		path_list = abcio.get_nurbs_path_list(abcpath);
		console.log(path_list);
		for (i = 0; i < path_list.length; i = i + 1) {
			abcnurbs = abcio.get_nurbs(abcpath, path_list[i], true);
			//console.log(abcio.get_nurbs(abcpath, path_list[i]));
			if (abcnurbs && abcnurbs.hasOwnProperty("position")) {
				nurbs = new umnurbs.UMNurbs(this.gl, new Float32Array(abcnurbs.position));
				console.log(abcnurbs.global_transform);
				material = new ummaterial.UMMaterial(this.gl);
				material.set_polygon_count(abcnurbs.position.length / 3 / 3);
				nurbs.material_list.push(material);
				this.nurbs_list.push(nurbs);
			}
		}
	};

	UMScene.prototype._update_abc_nurbs = function (abcio, abcpath) {
		var abcnurbs,
			i,
			n,
			m,
			nurbs,
			path_list,
			material;
		path_list = abcio.get_nurbs_path_list(abcpath);
		for (i = 0; i < path_list.length; i = i + 1) {
			abcnurbs = abcio.get_nurbs(abcpath, path_list[i], true);
			nurbs = this.nurbs_list[i];

			if (abcnurbs && abcnurbs.hasOwnProperty("position")) {
				nurbs.update(abcnurbs.position);
			}
		}
	};

	UMScene.prototype.load_mtlx = function (mtlxpath, text, endCallback) {
		this.loader.load_mtlx(this.mesh_list, mtlxpath, text, endCallback);
	};

	UMScene.prototype.load_mtl = function (mtlname, text, texture_files, endCallback) {
		this.loader.load_mtl(this.mesh_list, mtlname, text, texture_files, endCallback);
	};

	UMScene.prototype._load_abc_mesh = function (abcio, abcpath) {
		var abcmesh,
			i,
			n,
			m,
			mesh,
			path_list,
			material;
		path_list = abcio.get_mesh_path_list(abcpath);
		console.log(path_list);
		for (i = 0; i < path_list.length; i = i + 1) {
			abcmesh = abcio.get_mesh(abcpath, path_list[i], true);
			console.log(abcmesh);
			if (abcmesh && abcmesh.hasOwnProperty("vertex")) {
				console.log(abcmesh);
				mesh = new ummesh.UMMesh(this.gl, path_list[i], abcmesh.vertex, abcmesh.normal, abcmesh.uv, abcmesh.index);
				mesh.is_cw = true;
				console.log(abcmesh.global_transform);
				material = new ummaterial.UMMaterial(this.gl);
				if (abcmesh.index.length > 0) {
					material.set_polygon_count(abcmesh.index.length / 3);
				} else {
					material.set_polygon_count(abcmesh.vertex.length / 3 / 3);
				}
				mesh.material_list.push(material);
				this.mesh_list.push(mesh);
				if (i === path_list.length - 1) {
					this.add_mesh_to_primitive_list(mesh, true);
					console.log(this.primitive_list);
				} else {
					this.add_mesh_to_primitive_list(mesh, false);
				}
			}
		}
	};

	UMScene.prototype._update_abc_mesh = function (abcio, abcpath) {
		var abcinfo,
			abcmesh,
			i,
			n,
			m,
			mesh,
			path_list,
			material;
		path_list = abcio.get_mesh_path_list(abcpath);

		for (i = 0; i < path_list.length; i = i + 1) {
			abcinfo = abcio.get_information(abcpath, path_list[i]);
			if (abcinfo.has_changed) {
				abcmesh = abcio.get_mesh(abcpath, path_list[i], true);
				mesh = this.mesh_list[i];
				if (abcmesh && abcmesh.hasOwnProperty("vertex")) {
					mesh.update(abcmesh.vertex, abcmesh.normal, abcmesh.uv, abcmesh.index);
				}
			}
		}
	};

	UMScene.prototype._load_abc_point = function (abcio, abcpath) {
		var abcpoint,
			i,
			n,
			m,
			point,
			path_list,
			material;
		path_list = abcio.get_point_path_list(abcpath);
		console.log(path_list);
		for (i = 0; i < path_list.length; i = i + 1) {
			abcpoint = abcio.get_point(abcpath, path_list[i]);
			console.log(abcpoint);
			if (abcpoint && abcpoint.hasOwnProperty("position")) {
				console.log(abcpoint);
				point = new umpoint.UMPoint(this.gl, abcpoint.position, abcpoint.normal, abcpoint.color);
				console.log(abcpoint.global_transform);
				for (n = 0; n < 4; n = n + 1) {
					for (m = 0; m < 4; m = m + 1) {
						point.global_matrix.m[n][m] = abcpoint.global_transform[n * 4 + m];
					}
				}
				material = new ummaterial.UMMaterial(this.gl);
				material.set_polygon_count(abcpoint.position.length / 3 / 3);
				point.material_list.push(material);
				this.point_list.push(point);
			}
		}
	};

	UMScene.prototype._update_abc_point = function (abcio, abcpath) {
		var abcinfo,
			abcpoint,
			i,
			n,
			m,
			point,
			path_list,
			material;
		path_list = abcio.get_point_path_list(abcpath);
		for (i = 0; i < path_list.length; i = i + 1) {
			abcinfo = abcio.get_information(abcpath, path_list[i]);
			if (abcinfo.has_changed) {
				abcpoint = abcio.get_point(abcpath, path_list[i]);
				point = this.point_list[i];

				if (abcpoint && abcpoint.hasOwnProperty("position")) {
					point.update(abcpoint.position, abcpoint.normal, abcpoint.color);
					for (n = 0; n < 4; n = n + 1) {
						for (m = 0; m < 4; m = m + 1) {
							point.global_matrix.m[n][m] = abcpoint.global_transform[n * 4 + m];
						}
					}
				}
			}
		}
	};

	UMScene.prototype._load_abc_camera = function (abcio, abcpath) {
		var abccamera,
			i,
			n,
			m,
			camera,
			viewmat,
			path_list;

		path_list = abcio.get_camera_path_list(abcpath);
		console.log("_load_abc_camera", path_list);
		for (i = 0; i < path_list.length; i = i + 1) {
			abccamera = abcio.get_camera(abcpath, path_list[i]);
			console.log("abccamera.global_transform", abccamera.global_transform);
			viewmat = new ummath.UMMat44d(abccamera.global_transform).inverted();
			for (n = 0; n < 4; n = n + 1) {
				for (m = 0; m < 4; m = m + 1) {
					this.camera.view_matrix_.m[n][m] = viewmat.m[n][m];
				}
			}
			this.camera.position.xyz[0] = abccamera.global_transform[4 * 3 + 0];
			this.camera.position.xyz[1] = abccamera.global_transform[4 * 3 + 1];
			this.camera.position.xyz[2] = abccamera.global_transform[4 * 3 + 2];
			this.camera.update();
		}
	};

	UMScene.prototype._update_abc_camera = function (abcio, abcpath) {
		var abcinfo,
			abccamera,
			i,
			n,
			m,
			camera,
			viewmat,
			path_list;

		path_list = abcio.get_camera_path_list(abcpath);
		for (i = 0; i < path_list.length; i = i + 1) {
			abcinfo = abcio.get_information(abcpath, path_list[i]);
			if (abcinfo.has_changed) {
				abccamera = abcio.get_camera(abcpath, path_list[i]);
				//console.log(abccamera.global_transform);
				viewmat = new ummath.UMMat44d(abccamera.global_transform).inverted();
				for (n = 0; n < 4; n = n + 1) {
					for (m = 0; m < 4; m = m + 1) {
						this.camera.view_matrix_.m[n][m] = viewmat.m[n][m];
					}
				}
				this.camera.update();
			}
		}
	};

	UMScene.prototype.load_abc = function (abcpath) {
		var abcio = require('alembic'),
			update_func;

		try {
			abcio.load(abcpath);
		} catch (e) {
			console.log(e);
		}
		this._load_abc_mesh(abcio, abcpath);
		this._load_abc_curve(abcio, abcpath);
		this._load_abc_nurbs(abcio, abcpath);
		this._load_abc_point(abcio, abcpath);
		this._load_abc_camera(abcio, abcpath);
		update_func = (function (self) {
			return function () {
				abcio.set_time(abcpath, self.current_time);
				self._update_abc_mesh(abcio, abcpath);
				self._update_abc_point(abcio, abcpath);
				//self._update_abc_nurbs(abcio, abcpath);
				self._update_abc_camera(abcio, abcpath);
			}
		}(this));
		this.update_func_list.push(update_func);
	};

	UMScene.prototype.add_mesh = function () {
		var mesh = new ummesh.UMMesh(this.gl, null, null, null, null),
			meshmat;

		meshmat = new ummaterial.UMMaterial(this.gl);
		meshmat.set_polygon_count(0);
		mesh.material_list.push(meshmat);
		this.mesh_list.push(mesh);
		return mesh;
	};

	UMScene.prototype.duplicate_mesh = function (mesh_index, pos) {
		var index = mesh_index.v,
			srcmat,
			i;
		if (index < this.mesh_list.length) {
			var src = this.mesh_list[(index < 0) ? this.mesh_list.length - 1 : index],
				mesh = new ummesh.UMMesh(this.gl, null, null, null, null),
				meshmat;

			console.log(mesh, src, pos)
			for (i = 0; i < src.material_list.length; i = i + 1) {
				srcmat = src.material_list[i];
				meshmat = new ummaterial.UMMaterial(this.gl);
				meshmat.set_polygon_count(srcmat.polygon_count());
				meshmat.diffuse_ = srcmat.diffuse_;
				meshmat.specular_ = srcmat.specular_;
				meshmat.ambient_ = srcmat.ambient_;
				meshmat.set_texture(srcmat.diffuse_texture, srcmat.diffuse_texture_image);
				mesh.global_matrix.m[3][0] = pos.x();
				mesh.global_matrix.m[3][1] = pos.y();
				mesh.global_matrix.m[3][2] = pos.z();
				mesh.material_list.push(meshmat);
			}
			mesh.update(src.verts, src.normals, src.uvs, null);
			this.mesh_list.push(mesh);
			return mesh;
		}
		return false;
	};

	UMScene.prototype.dispose = function () {
		var i = 0;
		this.primitive_list = [];
		this.wedge_list = [];
		for (i = 0; i < this.mesh_list.length; i = i + 1) {
			this.mesh_list[i].dispose();
		}
		for (i = 0; i < this.line_list.length; i = i + 1) {
			this.line_list[i].dispose();
		}
		for (i = 0; i < this.point_list.length; i = i + 1) {
			this.point_list[i].dispose();
		}
		for (i = 0; i < this.box_list.length; i = i + 1) {
			this.box_list[i].dispose();
		}
		for (i = 0; i < this.node_list.length; i = i + 1) {
			this.node_list[i].dispose();
		}
		for (i = 0; i < this.cluster_list.length; i = i + 1) {
			this.cluster_list[i].dispose();
		}
		for (i = 0; i < this.nurbs_list.length; i = i + 1) {
			this.nurbs_list[i].dispose();
		}
		if (this.grid) {
			this.grid.dispose();
		}
		if (this.test_mesh) {
			this.test_mesh.dispose();
		}
		if (this.shader) {
			this.shader.dispose();
		}
	};

	window.umscene = {};
	window.umscene.UMScene = UMScene;

}(window.ummath, window.umline, window.ummesh, window.umboxlist, window.umnode,
  window.ummaterial, window.umcamera, window.umshader, window.umbvh, window.umloader));
