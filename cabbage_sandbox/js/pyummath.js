/*jslint devel:true*/

$builtinmodule = function(name) {
	var mod = {},
		ummath = window.ummath;

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
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.cross(src.vec);
			return dst;
		});

		$loc.add = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec4);
			dst.vec = self.vec.add(src.vec);
			return dst;
		});

		$loc.sub = new Sk.builtin.func(function (self, src) {
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

		$loc.sub = new Sk.builtin.func(function (self, src) {
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

	return mod;
};
