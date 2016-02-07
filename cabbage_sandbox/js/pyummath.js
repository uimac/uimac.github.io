/*jslint devel:true*/

$builtinmodule = function(name) {
	var mod = {},
		Test;

	Test = function ($gbl, $loc) {
		$loc.__init__ = new Sk.builtin.func(function (self) {});

		$loc.testfunc = new Sk.builtin.func(function() {
			return "hogehoge";
		});
	}

	mod.Test = Sk.misceval.buildClass(mod, Test, 'Test', []);
	return mod;
};
