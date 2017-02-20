/*jslint devel:true*/

$builtinmodule = function(name) {
	"use strict";
	var mod = {},
		ummath = window.ummath,
		umscene = window.umgl.get_scene(),
		vec3,
		vec4,
		mat44,
		camera,
		mesh,
		bvh,
		bone_bvh;

	vec3 = function ($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function (self, x, y, z) {
			if (x && y && z) {
				self.vec = new ummath.UMVec3d(x.v, y.v, z.v);
			} else {
				self.vec = new ummath.UMVec3d(0, 0, 0);
			}
		});

		$loc.__getitem__ = new Sk.builtin.func(function (self, key) {
			return Sk.builtin.float_(self.vec.xyz[key.v]);
		});

		$loc.__setitem__ = new Sk.builtin.func(function (self, key, value) {
			self.vec.xyz[key.v] = value.v;
		});

		$loc.__len__ = new Sk.builtin.func(function (self) {
			return Sk.builtin.int_(3);
		});

		$loc.dot = new Sk.builtin.func(function (self, src) {
			return Sk.builtin.float_(self.vec.dot(src.vec));
		});

		$loc.cross = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = self.vec.cross(src.vec);
			return dst;
		});

		$loc.add = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = self.vec.add(src.vec);
			return dst;
		});

		$loc.__add__ =  new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = self.vec.add(src.vec);
			return dst;
		});

		$loc.sub = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = self.vec.sub(src.vec);
			return dst;
		});

		$loc.__sub__ = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = self.vec.sub(src.vec);
			return dst;
		});

		$loc.multiply = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = self.vec.multiply(src.vec);
			return dst;
		});

		$loc.scale = new Sk.builtin.func(function (self, scale) {
			self.vec.scale(scale.v);
			return self;
		});

		$loc.__mul__ = new Sk.builtin.func(function (self, src) {
			if (src.v) {
				self.vec.scale(src.v);
				return self;
			} else {
				var dst = Sk.misceval.callsim(mod.vec3);
				dst.vec = self.vec.multiply(src.vec);
				return dst;
			}
		});

		$loc.normalized = new Sk.builtin.func(function (self) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = self.vec.normalized(self.vec);
			return dst;
		});

		$loc.vlength = new Sk.builtin.func(function (self) {
			return Sk.builtin.float_(self.vec.length());
		});

		$loc.vlength_sq = new Sk.builtin.func(function (self) {
			return Sk.builtin.float_(self.vec.length_sq());
		});
	};
	mod.vec3 = Sk.misceval.buildClass(mod, vec3, 'vec3', []);

	vec4 = function ($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function (self, x, y, z, w) {
			if (x && y && z && w) {
				self.vec = new ummath.UMVec3d(x.v, y.v, z.v, w.v);
			} else {
				self.vec = new ummath.UMVec3d(0, 0, 0, 0);
			}
		});

		$loc.__getitem__ = new Sk.builtin.func(function (self, key) {
			return Sk.builtin.float_(self.vec.xyz[key.v]);
		});

		$loc.__setitem__ = new Sk.builtin.func(function (self, key, value) {
			self.vec.xyz[key.v] = value.v;
		});
		
		$loc.__len__ = new Sk.builtin.func(function (self) {
			return Sk.builtin.int_(4);
		});

		$loc.dot = new Sk.builtin.func(function (self, src) {
			return Sk.builtin.float_(self.vec.dot(src.vec));
		});

		$loc.cross = new Sk.builtin.func(function (self, src1, src2) {
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.cross(src1.vec, src2.vec);
			return dst;
		});

		$loc.add = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.add(src.vec);
			return dst;
		});

		$loc.__add__ =  new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.add(src.vec);
			return dst;
		});

		$loc.sub = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.sub(src.vec);
			return dst;
		});

		$loc.__sub__ = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.sub(src.vec);
			return dst;
		});

		$loc.multiply = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.multiply(src.vec);
			return dst;
		});

		$loc.scale = new Sk.builtin.func(function (self, scale) {
			self.vec.scale(scale.v);
			return self;
		});

		$loc.__mul__ = new Sk.builtin.func(function (self, src) {
			if (src.v) {
				self.vec.scale(src.v);
				return self;
			} else {
				var dst = Sk.misceval.callsim(mod.vec4);
				dst.vec = self.vec.multiply(src.vec);
				return dst;
			}
		});

		$loc.normalized = new Sk.builtin.func(function (self) {
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.normalized(self.vec);
			return dst;
		});

		$loc.vlength = new Sk.builtin.func(function (self) {
			return Sk.builtin.float_(self.vec.length());
		});

		$loc.vlength_sq = new Sk.builtin.func(function (self) {
			return Sk.builtin.float_(self.vec.length_sq());
		});
	};
	mod.vec4 = Sk.misceval.buildClass(mod, vec4, 'vec4', []);

	mat44 = function ($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function (self, mat) {
			if (mat) {
				self.mat = new ummath.UMMat44d(mat.v);
			} else {
				self.mat = new ummath.UMMat44d();
			}
		});

		$loc.__getitem__ = new Sk.builtin.func(function (self, key) {
			return Sk.builtin.float_(self.mat.m[key.v]);
		});

		$loc.__setitem__ = new Sk.builtin.func(function (self, key, value) {
			self.mat.m[key.v] = value.v;
		});

	};
	mod.mat44 = Sk.misceval.buildClass(mod, mat44, 'mat44', []);

	// -----------------------------------------------------------------------
	// -----------------------------------------------------------------------

	camera = function ($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function (self) {
		});
		$loc.dolly = new Sk.builtin.func(function (self, mx, my) {
			umscene.camera.dolly(mx.v, my.v);
		});
		$loc.rotate = new Sk.builtin.func(function (self, mx, my) {
			umscene.camera.rotate(mx.v, my.v);
		});
		$loc.pan = new Sk.builtin.func(function (self, mx, my) {
			umscene.camera.pan(mx.v, my.v);
		});
		$loc.ray_dir = new Sk.builtin.func(function (self, px, py) {
			var dir = umscene.camera.generate_ray_dir(px.v, py.v);
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = dir;
			return dst;
		});
		$loc.position = new Sk.builtin.func(function (self) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = umscene.camera.position;
			return dst;
		});
		$loc.width = new Sk.builtin.func(function (self) {
			return Sk.builtin.float_(umscene.camera.width);
		});
		$loc.height = new Sk.builtin.func(function (self) {
			return Sk.builtin.float_(umscene.camera.height);
		});
	};
	mod.camera = Sk.misceval.buildClass(mod, camera, 'camera', []);

	// -----------------------------------------------------------------------

	mesh = function ($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function (self, ummesh) {
			self.mesh = ummesh;
		});

		$loc.add_triangle = new Sk.builtin.func(function (self, v1, v2, v3, min_time, max_time) {
			var min = min_time ? min_time.v : null;
			var max = max_time ? max_time.v : null;
			self.mesh.add_triangle(v1.vec, v2.vec, v3.vec, min, max);
			umscene.box_list[0].add(self.mesh.box);
		});
	};
	var create_mesh = Sk.misceval.buildClass(mod, mesh, 'mesh', []);

	mod.add_mesh = new Sk.builtin.func(function () {
		var mesh = umscene.add_mesh(0),
			dst;

		dst = Sk.misceval.callsim(create_mesh);
		dst.mesh = mesh;
		return dst;
	});

	mod.duplicate_mesh = new Sk.builtin.func(function (model_index, mesh_index, pos) {
		if (pos !== undefined) {
			var mesh = umscene.duplicate_mesh(model_index, mesh_index, pos.vec),
				dst;

			dst = Sk.misceval.callsim(create_mesh);
			dst.mesh = mesh;
			return dst;
		}
		return null;
	});

	mod.reset_node_color = new Sk.builtin.func(function (model_index) {
		var nodes = umscene.model_list[model_index.v].node_list;
		var i;
		for (i = 0; i < nodes.length; ++i) {
			if (nodes[i].mesh.material_list.length > 0) {
				nodes[i].mesh.material_list[0].set_diffuse(0.7, 0.7, 0.7, 1.0);
			}
		}
	});
	
	mod.change_node_color = new Sk.builtin.func(function (model_index, node_index, r, g, b) {
		var mat = umscene.model_list[model_index.v].node_list[node_index.v].mesh.material_list[0];
		mat.set_diffuse(r.v, g.v, b.v, 1.0);
	});

	// -----------------------------------------------------------------------
	bvh = function ($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function (self) {
		});
		$loc.intersects = new Sk.builtin.func(function (self, origin, dir) {
			var info = {
				result : -1,
				closest_distance : Infinity
			};
			console.log("dir", origin.vec.xyz, dir.vec.xyz)
			if (umscene.bvh.intersects(umscene.bvh.root, info, origin.vec, dir.vec)) {
				//console.log(info);
				var dst = Sk.misceval.callsim(mod.vec3);
				console.log(info);
				dst.vec = new ummath.UMVec3d(
					info.intersect_point[0],
					info.intersect_point[1],
					info.intersect_point[2]);
				return dst;
			} else {
				return Sk.builtin.int_(-1);
			}
		});
	};
	mod.bvh = Sk.misceval.buildClass(mod, bvh, 'bvh', []);

	// -----------------------------------------------------------------------
	bone_bvh = function ($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function (self) {
		});
		$loc.intersects = new Sk.builtin.func(function (self, origin, dir) {
			var info = {
				result : -1,
				closest_distance : Infinity
			};
			console.log("dir", origin.vec.xyz, dir.vec.xyz, umscene.bone_bvh)
			if (umscene.bone_bvh.intersects(umscene.bone_bvh.root, info, origin.vec, dir.vec)) {
				console.log(info);
				var ret = new Sk.builtin.dict([]);
				var point = Sk.misceval.callsim(mod.vec3);
				point.vec = new ummath.UMVec3d(
					info.intersect_point[0],
					info.intersect_point[1],
					info.intersect_point[2]);
				ret.mp$ass_subscript(new Sk.builtin.str("vec"), point);
				ret.mp$ass_subscript(new Sk.builtin.str("hit"), Sk.builtin.bool.true$);
				ret.mp$ass_subscript(new Sk.builtin.str("node_number"), Sk.builtin.int_(info.extra_info.node_number));
				return ret;
			} else {
				var ret = new Sk.builtin.dict([]);
				ret.mp$ass_subscript(new Sk.builtin.str("hit"), Sk.builtin.bool.false$);
				return ret;
			}
		});
	};
	mod.bone_bvh = Sk.misceval.buildClass(mod, bone_bvh, 'bone_bvh', []);

	return mod;
};
