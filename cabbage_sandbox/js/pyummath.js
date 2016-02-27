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

		$loc.dot = new Sk.builtin.func(function (self, src) {
			return Sk.builtin.float_(self.vec.dot(src.vec));
		});

		$loc.scale = new Sk.builtin.func(function (self, scale) {
			self.vec.scale(scale.v);
			return self;
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

		$loc.sub = new Sk.builtin.func(function (self, src) {
			var dst = Sk.misceval.callsim(mod.vec3);
			dst.vec = self.vec.sub(src.vec);
			return dst;
		});
	};

	mod.vec3 = Sk.misceval.buildClass(mod, vec3, 'vec3', []);
	return mod;
};
