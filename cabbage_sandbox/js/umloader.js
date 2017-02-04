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
		var i, k,
			bosmesh,
			bosmat,
			bosnode,
			mesh,
			node,
			meshmat,
			verts,
			normals,
			uvs,
			indices,
			loading = 0;
			
		var result = {
			mesh_list : [],
			node_list : []
		};

		var timeoutFunc = function (callback) {
			setTimeout(function () {
				if (loading < 0) {
					timeoutFunc(callback);
				} else {
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
		
		for (i in bos.mesh_map) {
			bosmesh = bos.mesh_map[i];
			indices = to_flat_list(bosmesh.vertex_index_list);
			verts = to_flat_list(bosmesh.vertex_list);
			normals = to_flat_list(bosmesh.layered_normal_list[0]);
			uvs = to_flat_list(bosmesh.layered_uv_list[0]);
			var flat_verts = [];
			mesh = new ummesh.UMMesh(this.gl, bosmesh.name, 
				verts, 
				normals, 
				uvs.length > 0 ? uvs : null, 
				indices);

			var mat_index_count = {};
			for (k = 0; k < bosmesh.material_index.length; ++k) {
				if (!mat_index_count[bosmesh.material_index[k]]) {
					mat_index_count[bosmesh.material_index[k]] = 0;
				}
				++mat_index_count[bosmesh.material_index[k]];
			}
			mesh.global_matrix = new ummath.UMVec4d(bosmesh.global_transform);
			result.mesh_list.push(mesh);
			for (k in mat_index_count) {
				bosmat = bosmesh.material_list[k];
				meshmat = new ummaterial.UMMaterial(this.gl);
				meshmat.set_polygon_count(mat_index_count[k]);
				meshmat.name = k;
				mesh.material_list.push(meshmat);
				assign_material(mesh, meshmat, bosmat, null);
				window.umlist.UMList.add(bosmat.name, "material");
			}
			window.umlist.UMList.update();
		}
		var skeleton_map = {}
		for (i in bos.skeleton_map) {
			bosnode = bos.skeleton_map[i];
			node = new umnode.UMNode(this.gl);
			node.global_transform = new ummath.UMMat44d(bosnode.global_transform);
			node.local_transform = new ummath.UMMat44d(bosnode.local_transform);
			node.initial_global_transform = new ummath.UMMat44d(bosnode.global_transform);
			node.initial_local_transform = new ummath.UMMat44d(bosnode.local_transform);
			node.id = bosnode.id;
			skeleton_map[node.id] = node;
			result.node_list.push(node);
		}
		for (i in bos.skeleton_map) {
			bosnode = bos.skeleton_map[i];
			if (skeleton_map.hasOwnProperty(bosnode.parent_id)) {
				skeleton_map[i].parent = skeleton_map[bosnode.parent_id];
			}
		}
		for (i in skeleton_map) {
			skeleton_map[i].update();
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

	window.umloader = {}
	window.umloader.UMLoader = UMLoader;

}(window.umbos, window.ummtlx, window.ummtl, window.umobj, window.umgltf));
