// client side parser using messagepack-lite
(function (umbos, ummtlx, ummtl, umobj) {
	function to_flat_list(list) {
		var i,
			flat_list = [];
		for (i = 0; i < list.length; i = i + 1) {
			Array.prototype.push.apply(flat_list, list[i]);
		}
		return flat_list;
	}

	function UMLoader(gl) {
		this.gl = gl;
		this.images = {};
		this.textures = {};
	};

	UMLoader.prototype.assign_texture = function (material, image, tex) {
		var gl = this.gl;
		if (gl) {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		material.set_texture(tex, image);
	};
	
	UMLoader.prototype.load_bos = function (name, arrayBuf, texture_files, endCallback) {
		var bos = umbos.load(new Uint8Array(arrayBuf), true);
		console.log(bos);
		var i, k, n, m,
			bosmesh,
			bosmat,
			bosnode,
			mesh,
			node,
			meshmat,
			verts,
			normals,
			uvs,
			bosskin,
			cluster,
			index,
			weight,
			boscluster,
			indices,
			loading = 0;
			
		var result = {
			mesh_list : [],
			node_list : [],
			cluster_list : []
		};

		var timeoutFunc = function (callback) {
			setTimeout(function () {
				if (loading < 0) {
					timeoutFunc(callback);
				} else {
					console.log(this)
					callback(this);
				}
			}.bind(result), 100);
		};

		var assign_material = function (mesh, material, param, callback) {
			var k,
				img,
				tex,
				id;

			id = mesh.id;
			material.set_diffuse(param.diffuse[0], param.diffuse[1], param.diffuse[2], param.diffuse[3]);
			material.set_specular(param.specular[0], param.specular[1], param.specular[2], param.specular[3]);
			material.set_ambient(param.ambient[0], param.ambient[1], param.ambient[2], param.ambient[3]);

			if (param.texture_list.length > 0) {
				var temp = param.texture_list[0].file_name.split('/');
				temp = temp[temp.length - 1].split('\\');
				var texture_name = temp[temp.length - 1]
				if (bos.embedded_file_map.hasOwnProperty(texture_name)) {
					if (this.images.hasOwnProperty(texture_name)) {
						img = this.images[texture_name];
						tex = this.textures[texture_name];
						this.assign_texture(material, img, tex);
						return;
					} else {
						img = new Image();
						tex = this.gl ? this.gl.createTexture() : null;
						this.images[texture_name] = img;
						this.textures[texture_name] = tex;
						loading = loading + 1;
						img.onload = (function (self, mesh, material, img, tex) {
							return function () {
								self.assign_texture(material, img, tex);
								loading = loading  - 1;
							};
						}(this, mesh, material, img, tex));
					}
					img.src = window.URL.createObjectURL(bos.embedded_file_map[texture_name]);
				}
			}
		}.bind(this);
		
		// mesh
		var mesh_map = {}
		for (i in bos.mesh_map) {
			bosmesh = bos.mesh_map[i];
			var mesh_matrix = new ummath.UMMat44d(bosmesh.global_transform);
			indices = to_flat_list(bosmesh.vertex_index_list);
			verts = bosmesh.vertex_list;
			normals = bosmesh.layered_normal_list[0];
			for (k = 0; k < verts.length; k = k + 1) {
				verts[k] = mesh_matrix.multiply(new ummath.UMVec3d(verts[k])).xyz;
			}
			for (k = 0; k < normals.length; k = k + 1) {
				normals[k] = mesh_matrix.multiply(new ummath.UMVec3d(normals[k])).xyz;
			}
			verts = to_flat_list(verts);
			normals = to_flat_list(normals);
			uvs = to_flat_list(bosmesh.layered_uv_list[0]);
			var flat_verts = [];
			mesh = new ummesh.UMMesh(this.gl, bosmesh.name, 
				verts, 
				normals, 
				uvs.length > 0 ? uvs : null, 
				indices);

			// material
			var mat_index_count = {};
			for (k = 0; k < bosmesh.material_index.length; ++k) {
				if (!mat_index_count[bosmesh.material_index[k]]) {
					mat_index_count[bosmesh.material_index[k]] = 0;
				}
				++mat_index_count[bosmesh.material_index[k]];
			}
			//mesh.global_transform = new ummath.UMMat44d(bosmesh.global_transform);
			mesh.reset_shader_location();
			result.mesh_list.push(mesh);
			for (k in mat_index_count) {
				bosmat = bosmesh.material_list[k];
				meshmat = new ummaterial.UMMaterial(this.gl);
				meshmat.set_polygon_count(mat_index_count[k]);
				meshmat.name = k;
				mesh.material_list.push(meshmat);
				if (bosmat) {
					assign_material(mesh, meshmat, bosmat, null);
					window.umlist.UMList.add(bosmat.name, "material");
				}
			}
			mesh_map[i] = mesh;
			window.umlist.UMList.update();
		}
		// nodes
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
			result.node_list.push(node);
		}
		for (i in bos.skeleton_map) {
			bosnode = bos.skeleton_map[i];
			if (node_map.hasOwnProperty(bosnode.parent_id)) {
				node_map[i].parent = node_map[bosnode.parent_id];
				node_map[bosnode.parent_id].children.push(node_map[i]);
			}
		}
		for (i in node_map) {
			if (!node_map[i].parent) {
				node_map[i].local_transform = new ummath.UMMat44d(node_map[i].initial_global_transform);
				node_map[i].update_transform();
			}
		}
		for (i in node_map) {
			node_map[i].update();
		}

		// normalize weights
		var normalized_weights = {};
		for (i in bos.mesh_map) {
			bosmesh = bos.mesh_map[i];
			for (k in bosmesh.skin_list) {
				bosskin = bosmesh.skin_list[k];
				if (mesh_map.hasOwnProperty(bosskin.geometry_node_id)) {
					for (n = 0; n < bosskin.cluster_list.length; n = n + 1) {
						boscluster = bosskin.cluster_list[n];
						for (m = 0; m < boscluster.index_list.length; m = m + 1) {
							index = boscluster.index_list[m];
							weight = boscluster.weight_list[m];
							if (!normalized_weights.hasOwnProperty(index)) {
								normalized_weights[index] = 0.0;
							}
							normalized_weights[index] = normalized_weights[index] + weight;
						}
					}
				}
			}
		}

		// cluster
		for (i in bos.mesh_map) {
			bosmesh = bos.mesh_map[i];
			for (k in bosmesh.skin_list) {
				bosskin = bosmesh.skin_list[k];
				if (mesh_map.hasOwnProperty(bosskin.geometry_node_id)) {
					for (n = 0; n < bosskin.cluster_list.length; n = n + 1) {
						boscluster = bosskin.cluster_list[n];
						if (boscluster.index_list.length > 0) {
							if (node_map.hasOwnProperty(boscluster.link_node_id)) {
								cluster = new umcluster.UMCluster();
								var weight_list = [];
								for (m = 0; m < boscluster.index_list.length; m = m + 1) {
									weight_list[m] = 
										boscluster.weight_list[m] /
											normalized_weights[boscluster.index_list[m]];
								}
								cluster.update(
									boscluster.weight_list,
									boscluster.index_list,
									node_map[boscluster.link_node_id],
									mesh_map[bosskin.geometry_node_id]
									);
								result.cluster_list.push(cluster);
							} else {
								console.error("not found link_node_id :", boscluster.link_node_id)
							}
						}
					}
				} else {
					console.error("not found geometry_node_id :", bosskin.geometry_node_id)
				}
			}
		}
		timeoutFunc(endCallback);
	};

	UMLoader.prototype.load_mtlx = function (mesh_list, mtlxpath, text, endCallback) {
		var parser = new DOMParser(),
			i,
			mtlx,
			name,
			param,
			temp,
			mesh_index = 0,
			loading = 0;

		mtlx = ummtlx.load(parser.parseFromString(text, 'text/xml'));

		var timeoutFunc = function (callback) {
			setTimeout(function () {
				if (loading < 0) {
					timeoutFunc(callback);
				} else {
					callback();
				}
			}, 100);
		};

		var assign_material = function (i, target, param, callback) {
			var img,
				tex,
				id,
				mesh;

			if (i >= mesh_list.length) { return; }
			id = mesh_list[i].id;
			mesh = mesh_list[i];
			if (id.indexOf(target) >= 0) {
				mesh.material_list[0].set_diffuse(param.diffuse[0], param.diffuse[1], param.diffuse[2], param.diffuse[3]);
				mesh.material_list[0].set_specular(param.specular[0], param.specular[1], param.specular[2], param.specular[3]);
				mesh.material_list[0].set_ambient(param.ambient[0], param.ambient[1], param.ambient[2], param.ambient[3]);

				if (param.diffuse_texture.length > 0) {
					var path = require('path');
					var file = path.join(path.dirname(mtlxpath), param.diffuse_texture);

					if (this.images.hasOwnProperty(file)) {
						img = this.images[file];
						tex = this.textures[file];
						this.assign_texture(mesh.material_list[0], img, tex);
					} else {
						img = new Image();
						tex = this.gl ? this.gl.createTexture() : null;
						this.images[file] = img;
						this.textures[file] = tex;
						loading = loading + 1;
						img.onload = (function (self, mesh, img, tex) {
							return function () {
								self.assign_texture(mesh.material_list[0], img, tex);
								loading = loading  - 1;
							};
						}(this, mesh, img, tex));
						img.src = require('electron').nativeImage.createFromPath(file).toDataURL();
					}
				}
			}
			assign_material(i + 1, target, param, callback);
		}.bind(this);

		for (name in mtlx.materials) {
			param = mtlx.materials[name];
			assign_material(0, name.split(".").join("_"), param, null);
		}
		timeoutFunc(endCallback);
	};

	UMLoader.prototype.load_mtl = function (mesh_list, mtlname, text, texture_files, endCallback) {
		var i,
			mtl,
			name,
			param,
			temp,
			mesh_index = 0,
			loading = 0;

		console.log(mtlname, texture_files)
		mtl = ummtl.load(text);

		var timeoutFunc = function (callback) {
			setTimeout(function () {
				if (loading < 0) {
					timeoutFunc(callback);
				} else {
					callback();
				}
			}, 100);
		};

		var assignFunc = function (material_name, param, callback) {
			var k,
				img,
				tex,
				id,
				mesh,
				material = null;

			mesh = mesh_list[mesh_list.length - 1];
			id = mesh.id;
			for (k = 0; k < mesh.material_list.length; k = k + 1) {
				if (mesh.material_list[k].name === material_name) {
					material = mesh.material_list[k];
					break;
				}
			}
			if (!material) { return; }
			material.set_diffuse(param.diffuse[0], param.diffuse[1], param.diffuse[2], param.diffuse[3]);
			material.set_specular(param.specular[0], param.specular[1], param.specular[2], param.specular[3]);
			material.set_ambient(param.ambient[0], param.ambient[1], param.ambient[2], param.ambient[3]);

			if (param.diffuse_texture.length > 0) {
				var texture_name = param.diffuse_texture;
				var texture = null;
				for (k = 0; k < texture_files.length; ++k) {
					if (texture_files[k].name === texture_name) {
						texture = texture_files[k];
						break;
					}
				}
				if (texture) {
					if (this.images.hasOwnProperty(texture_name)) {
						img = this.images[texture_name];
						tex = this.textures[texture_name];
						this.assign_texture(material, img, tex);
					} else {
						img = new Image();
						tex = this.gl ? this.gl.createTexture() : null;
						this.images[texture_name] = img;
						this.textures[texture_name] = tex;
						loading = loading + 1;
						img.onload = (function (self, mesh, img, tex) {
							return function () {
								self.assign_texture(material,  img, tex);
								loading = loading  - 1;
							};
						}(this, mesh, img, tex));
					}
					var mtlreader = new FileReader();
					mtlreader.readAsDataURL(texture);
					mtlreader.onload = (function(reader) {
						return function (ev) {
							img.src = reader.result;
						}
					}(mtlreader));
				}
			}
		}.bind(this);

		for (name in mtl.materials) {
			param = mtl.materials[name];
			console.log(param)
			assignFunc(name, param, null);
		}
		timeoutFunc(endCallback);
	};

	UMLoader.prototype.load_obj = function (name, obj_text, endCallback) {
		var obj = umobj.load(obj_text),
			mesh = new ummesh.UMMesh(this.gl, name, obj.vertices, obj.normals, obj.uvs),
			i,
			meshmat;

		for (i = 0; i < obj.materials.length; i = i + 1) {
			meshmat = new ummaterial.UMMaterial(this.gl);
			meshmat.name = obj.materials[i].name;
			meshmat.set_polygon_count(obj.materials[i].index_count / 3);
			mesh.material_list.push(meshmat);
		}
		endCallback({
			mesh_list : [mesh]
		});
	};

	UMLoader.prototype.load_gltf = function (name, text, endCallback) {
		var obj = umgltf.load(text),
			mesh = new ummesh.UMMesh(this.gl, name, obj.vertices, obj.normals, obj.uvs),
			i,
			meshmat;

		for (i = 0; i < obj.materials.length; i = i + 1) {
			meshmat = new ummaterial.UMMaterial(this.gl);
			meshmat.name = obj.materials[i].name;
			meshmat.set_polygon_count(obj.materials[i].index_count / 3);
			mesh.material_list.push(meshmat);
		}
		endCallback({
			mesh_list : [mesh]
		});
	};

	UMLoader.prototype._load_abc_curve = function (buffers, abcio, abcpath) {
		var abccurve,
			i,
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

	UMLoader.prototype._load_abc_nurbs = function (buffers, abcio, abcpath) {
		var abcnurbs,
			i,
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
				buffers.nurbs.push(nurbs);
			}
		}
	};

	UMLoader.prototype._update_abc_nurbs = function (buffers, abcio, abcpath) {
		var abcnurbs,
			i,
			nurbs,
			path_list,
			material;
		path_list = abcio.get_nurbs_path_list(abcpath);
		for (i = 0; i < path_list.length; i = i + 1) {
			abcnurbs = abcio.get_nurbs(abcpath, path_list[i], true);
			nurbs = buffers.nurbs[i];

			if (abcnurbs && abcnurbs.hasOwnProperty("position")) {
				nurbs.update(abcnurbs.position);
			}
		}
	};

	UMLoader.prototype._load_abc_mesh = function (buffers, abcio, abcpath) {
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
				buffers.mesh.push(mesh);
			}
		}
	};

	UMLoader.prototype._update_abc_mesh = function (buffers, abcio, abcpath) {
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
				mesh = buffers.mesh[i];
				if (abcmesh && abcmesh.hasOwnProperty("vertex")) {
					mesh.update(abcmesh.vertex, abcmesh.normal, abcmesh.uv, abcmesh.index);
				}
			}
		}
	};

	UMLoader.prototype._load_abc_point = function (buffers, abcio, abcpath) {
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
				buffers.point.push(point);
			}
		}
	};

	UMLoader.prototype._update_abc_point = function (buffers, abcio, abcpath) {
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
				point = buffers.point[i];

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

	UMLoader.prototype._load_abc_camera = function (buffers, abcio, abcpath) {
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
			buffers.camera.view_matrix_ = new ummath.UMMat44d(viewmat);
			buffers.camera.position = new ummath.UMVec3d();
			buffers.camera.position.xyz[0] = abccamera.global_transform[4 * 3 + 0];
			buffers.camera.position.xyz[1] = abccamera.global_transform[4 * 3 + 1];
			buffers.camera.position.xyz[2] = abccamera.global_transform[4 * 3 + 2];
			buffers.camera.update();
		}
	};

	UMLoader.prototype._update_abc_camera = function (buffers, abcio, abcpath) {
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
				buffers.camera.view_matrix_ = new ummath.UMMat44d(viewmat);
				buffers.camera.update();
			}
		}
	};

	UMLoader.prototype.load_abc = function (abcpath, camera) {
		var abcio = require('alembic');
		try {
			abcio.load(abcpath);
		} catch (e) {
			console.log(e);
		}
		var buffers = {
			mesh : [],
			curve : [],
			nurbs : [],
			point : [],
			camera : camera
		};
		this._load_abc_mesh(buffers, abcio, abcpath);
		this._load_abc_curve(buffers, abcio, abcpath);
		this._load_abc_nurbs(buffers, abcio, abcpath);
		this._load_abc_point(buffers, abcio, abcpath);
		this._load_abc_camera(buffers, abcio, abcpath);

		var update_func = (function (self, buffers) {
			return function (current_time) {
				abcio.set_time(abcpath, current_time);
				self._update_abc_mesh(buffers, abcio, abcpath);
				self._update_abc_point(buffers, abcio, abcpath);
				//self._update_abc_nurbs(abcio, abcpath);
				self._update_abc_camera(buffers, abcio, abcpath);
			};
		}(this, buffers));

		return {
			buffers : buffers,
			update_func : update_func
		};
	};

	window.umloader = {}
	window.umloader.UMLoader = UMLoader;

}(window.umbos, window.ummtlx, window.ummtl, window.umobj, window.umgltf));
