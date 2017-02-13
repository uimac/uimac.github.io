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

	function create_model_buffer() {
		return {
			mesh_list : [],
			line_list : [],
			curve_list : [],
			point_list : [],
			nurbs_list : [],
			node_list : [],
			cluster_list : [],
			bone_texture : null
		};
	}

	function create_bone_texture(gl, width, height, data) {
		var texture = gl.createTexture(gl.TEXTURE_2D);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,  gl.RGBA, gl.FLOAT, data);
		gl.bindTexture(gl.TEXTURE_2D, null);
		return texture;
	}

	function update_bone_texture(gl, width, height, texture, data) {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.FLOAT, data);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	UMScene = function (gl) {
		this.gl = gl;
		this.camera = null;
		this.shader_list = [];
		this.shader = null;
		this.grid = null;
		this.model_list = [create_model_buffer()];
		this.box_list = [];
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
			this.connect_mmap();
		} else {
			this.connect_ws();
		}
	};

	UMScene.prototype.assing_bos_nodes = function (bos) {
		//console.log("assing_bos_nodes")
		var id;
		var src, dst;
		var i, bosnode, node;
		for (id in bos.skeleton_map) {
			src = bos.skeleton_map[id];
			if (this.node_map.hasOwnProperty(src.name)) {
				dst = this.node_map[src.name];
				if (!dst.parent) continue;
				dst.local_transform = new ummath.UMMat44d(src.local_transform);
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
	}

	UMScene.prototype.connect_mmap = function () {
		var umiomap = require('umiomap')
		this.update_func_list.push(function () {
			var bosdata = umiomap.load("testmmap");
			var bos = umbos.load(new Uint8Array(bosdata), true);
			this.assing_bos_nodes(bos);
		}.bind(this));
	}

	var connection;
	function connect_ws_forever(messageCallback) {
		var isConnected = false;
		connection = new WebSocket('ws://localhost:8000')
		connection.onopen = function () {
			isConnected = true;
			console.log("WebSocket opened")
			setInterval(function () {
				connection.send('get_bones');
			}, 30);
		};
		connection.onerror = function (error) {
			console.log('WebSocket Error ' + error);
		};
		connection.onmessage = function (e) {
			//console.log('got data: ' + e.data);
			if (messageCallback) {
				messageCallback(e);
			}
		};
		connection.onclose = function () {
			if (!isConnected) {
				setTimeout(function () {
					connect_ws_forever();
				}, 2000);
			}
		};
	}

	UMScene.prototype.connect_ws = function () {
		connect_ws_forever(function (e) {
			if (this.node_list.length > 0) {
				var fileReader = new FileReader();
				fileReader.onload = function() {
					var arrayBuffer = fileReader.result;
					var bos = umbos.load(new Uint8Array(arrayBuffer), true);
					this.assing_bos_nodes(bos);
				}.bind(this);
				fileReader.readAsArrayBuffer(e.data);
			}
		}.bind(this));
	}

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
			this.update_func_list[i](this.current_time);
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
				this.update_func_list[i](this.current_time);
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
			k,
			buffer,
			gl = this.gl;

		for (k = 0; k < this.model_list.length; k = k + 1) {
			buffer = this.model_list[k];
			for (i = 0; i < buffer.mesh_list.length; i = i + 1) {
				this.set_front_face(buffer.mesh_list[i].is_cw);
				if (buffer.mesh_list[i].material_list.length > 0 && 
					buffer.mesh_list[i].material_list[0].diffuse_texture) 
				{
					buffer.mesh_list[i].draw(this.shader_list[0], this.camera);
				} else {
					buffer.mesh_list[i].draw(this.shader_list[4], this.camera);
				}
			}
			for (i = 0; i < buffer.line_list.length; i = i + 1) {
				buffer.line_list[i].draw(this.shader_list[3], this.camera);
			}
			for (i = 0; i < buffer.point_list.length; i = i + 1) {
				buffer.point_list[i].draw(this.shader_list[3], this.camera);
			}
			for (i = 0; i < buffer.nurbs_list.length; i = i + 1) {
				buffer.set_front_face(true);
				buffer.nurbs_list[i].draw(this.shader_list[2], this.camera);
			}
			for (i = 0; i < buffer.node_list.length; i = i + 1) {
				buffer.node_list[i].draw(this.shader_list[0], this.camera);
			}
			for (i = 0; i < buffer.cluster_list.length; i = i + 1) {
				buffer.cluster_list[i].draw(this.shader_list[0], this.camera);
			}
		}
		for (i = 0; i < this.box_list.length; i = i + 1) {
			if (this.box_list[i].isLine) {
				this.box_list[i].draw(this.shader_list[3], this.camera);
			} else {
				this.box_list[i].draw(this.current_shader, this.camera);
			}
		}
		this.grid.draw(this.shader_list[3], this.camera);
	};

	UMScene.prototype.init = function () {
		var gl = this.gl,
			initial_shader,
			shader;
		this.camera = new umcamera.UMCamera(gl, this.width, this.height);
		initial_shader = new umshader.UMShader(gl);
		initial_shader.create_shader_from_id('vertex_shader_vtf', 'fragment_shader');
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
		var i,
			k,
			buffer;

		for (k = 0; k < this.model_list.length; k = k + 1) {
			buffer = this.model_list[k];
			for (i = 0; i < buffer.mesh_list.length; i = i + 1) {
				buffer.mesh_list[i].reset_shader_location();
			}
			for (i = 0; i < buffer.node_list.length; i = i + 1) {
				buffer.node_list[i].reset_shader_location();
			}
		}
		for (i = 0; i < this.box_list.length; i = i + 1) {
			this.box_list[i].reset_shader_location();
		}
		this.camera.reset_shader_location();
		this.current_shader = this.shader_list[shader_number];
	};

	UMScene.prototype.change_visible = function (id, visible) {
		var i,
			k,
			buffer;
		if (id === "visible_bone") {
			for (k = 0; k < this.model_list.length; k = k + 1) {
				buffer = this.model_list[k];
				for (i = 0; i < buffer.node_list.length; i = i + 1) {
					buffer.node_list[i].set_visible_bone(visible);
				}
			}
		} else if (id === "visible_axis") {
			for (k = 0; k < this.model_list.length; k = k + 1) {
				buffer = this.model_list[k];
				for (i = 0; i < buffer.node_list.length; i = i + 1) {
					buffer.node_list[i].set_visible_axis(visible);
				}
			}
		}
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
			var model = create_model_buffer();
			Array.prototype.push.apply(model.mesh_list, result.mesh_list);
			var i;
			for (i = 0; i < result.mesh_list.length; i = i + 1) {
				this.add_mesh_to_primitive_list(result.mesh_list[i], true);
			}
			this.model_list.push(model);
		}.bind(this));
	};

	UMScene.prototype.load_bos = function (name, arrayBuf, texture_files, endCallback) {
		this.loader.load_bos(name, arrayBuf, texture_files, function (result) {
			var model = create_model_buffer();
			Array.prototype.push.apply(model.mesh_list, result.mesh_list);
			Array.prototype.push.apply(model.node_list, result.node_list);
			Array.prototype.push.apply(model.cluster_list, result.cluster_list);
			var bone_data = new Float32Array(4*64*64);
			model.bone_texture = create_bone_texture(this.gl, 64, 64, bone_data);
			this.model_list.push(model);

			var root_nodes = [];
			var node;
			for (var i = 0; i < model.node_list.length; i = i + 1) {
				node = model.node_list[i];
				node.number = i;
				if (!node.parent) {
					root_nodes.push(node);
				}
				this.node_map[node.name] = node;
			}
			
			this.update_func_list.push((function (self, roots, model, bone_data) {
					return function () {
						var mesh;
						var node;
						var vtof;
						var cluster;
						var i, k, n, m;

						for (i = 0; i < roots.length; i = i + 1) {
							roots[i].update_transform();
						}
						self.node_primitive_list = [];
						for (i = 0; i < model.node_list.length; i = i + 1) {
							node = model.node_list[i];
							var vertex_deform_mat = node.vertex_deform_matrix();
							// bone_texture用データを更新
							for (k = 0; k < 4; ++k) {
								bone_data[i * 12 + k] = vertex_deform_mat.m[k][0];
								bone_data[i * 12 + 4 + k] = vertex_deform_mat.m[k][1];
								bone_data[i * 12 + 8 + k] = vertex_deform_mat.m[k][2];
							}
							// nodeの見た目を更新
							node.update();
							// bvh用primitiveデータを作成
							Array.prototype.push.apply(self.node_primitive_list, node.mesh.create_primitive_list());
						}
						// bone_textureを更新
						update_bone_texture(self.gl, 64, 64, model.bone_texture, bone_data);

						console.time('bvh build');
						self.bvh.build(self.node_primitive_list);
						console.timeEnd('bvh build');
						
						console.time('aaa');
						for (i = 0; i < model.mesh_list.length; i = i + 1) {
							mesh = model.mesh_list[i];
							/*
							for (k = 0; k < mesh.deform_verts.length; ++k) {
								mesh.deform_verts[k] = 0;
								mesh.deform_normals[k] = 0;
							}
							*/
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
						for (i = 0; i < model.cluster_list.length; i = i + 1) {
							cluster = model.cluster_list[i];
							cluster.link_geometry.update_bone_data(cluster);
							cluster.link_geometry.bone_texture = model.bone_texture;
						}
						for (i = 0; i < model.mesh_list.length; i = i + 1) {
							mesh = model.mesh_list[i];
							mesh.update_bone_data_gpu();
						}
						console.timeEnd('aaa');
						/*
						console.time('bbb');
						for (i = 0; i < model.cluster_list.length; i = i + 1) {
							model.cluster_list[i].update_geometry();
						}
						console.timeEnd('bbb');
						console.time('ccc');
						for (i = 0; i < model.mesh_list.length; i = i + 1) {
							mesh = model.mesh_list[i];
							mesh.update(
								model.mesh_list[i].deform_verts, 
								model.mesh_list[i].deform_normals, 
								null, 
								model.mesh_list[i].indices);
						}
						console.timeEnd('ccc');
						*/
					};
				}(this, root_nodes, model, bone_data)));

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

	UMScene.prototype.load_mtlx = function (mtlxpath, text, endCallback) {
		for (k = this.model_list.length - 1; k >= 0; k = k - 1) {
			buffer = this.model_list[k];
			this.loader.load_mtlx(buffer.mesh_list, mtlxpath, text, endCallback);
		}
	};

	UMScene.prototype.load_mtl = function (mtlname, text, texture_files, endCallback) {
		for (k = this.model_list.length - 1; k >= 0; k = k - 1) {
			this.loader.load_mtl(buffer.mesh_list, mtlname, text, texture_files, endCallback);
		}
	};

	UMScene.prototype.load_abc = function (abcpath) {
		var result = this.loader.load_abc(abcpath, this.camera);
		var model = create_model_buffer();
		Array.prototype.push.apply(model.mesh_list, result.buffers.mesh);
		Array.prototype.push.apply(model.curve_list, result.buffers.curve);
		Array.prototype.push.apply(model.nurbs_list, result.buffers.nurbs);
		Array.prototype.push.apply(model.point_list, result.buffers.point);
		this.model_list.push(model);
		this.update_func_list.push(result.update_func);
	};

	UMScene.prototype.add_mesh = function (index) {
		var mesh = new ummesh.UMMesh(this.gl, null, null, null, null),
			meshmat;
		
		var model = this.model_list[index];
		meshmat = new ummaterial.UMMaterial(this.gl);
		meshmat.set_polygon_count(0);
		mesh.material_list.push(meshmat);
		model.mesh_list.push(mesh);
		return mesh;
	};

	UMScene.prototype.duplicate_mesh = function (model_index, mesh_index, pos) {
		var index = mesh_index.v,
			mindex = model_index.v,
			srcmat,
			i;

		var model = this.model_list[(mindex < 0) ? this.model_list.length - 1 : mindex];
		if (index < model.mesh_list.length) {
			var src = model.mesh_list[(index < 0) ? model.mesh_list.length - 1 : index],
				mesh = new ummesh.UMMesh(this.gl, null, null, null, null),
				meshmat;

			console.log(mesh, src, index, pos)
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
			model.mesh_list.push(mesh);
			return mesh;
		}
		return false;
	};

	UMScene.prototype.dispose = function () {
		var i = 0,
			k,
			buffer;
		this.primitive_list = [];
		this.wedge_list = [];

		for (k = 0; k < this.model_list.length; k = k + 1) {
			buffer = this.model_list[k];
			for (i = 0; i < buffer.mesh_list.length; i = i + 1) {
				buffer.mesh_list[i].dispose();
			}
			for (i = 0; i < buffer.line_list.length; i = i + 1) {
				buffer.line_list[i].dispose();
			}
			for (i = 0; i < buffer.point_list.length; i = i + 1) {
				buffer.point_list[i].dispose();
			}
			for (i = 0; i < buffer.nurbs_list.length; i = i + 1) {
				buffer.nurbs_list[i].dispose();
			}
			for (i = 0; i < buffer.node_list.length; i = i + 1) {
				buffer.node_list[i].dispose();
			}
			for (i = 0; i < buffer.cluster_list.length; i = i + 1) {
				buffer.cluster_list[i].dispose();
			}
		}
		for (i = 0; i < this.box_list.length; i = i + 1) {
			this.box_list[i].dispose();
		}
		if (this.grid) {
			this.grid.dispose();
		}
		if (this.shader) {
			this.shader.dispose();
		}
	};

	window.umscene = {};
	window.umscene.UMScene = UMScene;

}(window.ummath, window.umline, window.ummesh, window.umboxlist, window.umnode,
  window.ummaterial, window.umcamera, window.umshader, window.umbvh, window.umloader));
