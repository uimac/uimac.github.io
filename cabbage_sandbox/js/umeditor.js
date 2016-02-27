/*jslint devel:true nomen:true */
/*global ace, Sk */

(function (umgl) {
	"use strict";
	var py_mousemove,
		py_mousedown,
		py_mouseup,
		py_keydown,
		py_keyup,
		tool_camera,
		tool_pen;

	tool_camera = `


import ummath
from ummath import *

u = vec3(1, 2, 3)
v = vec3(0, 1, 2)
a = u.cross(v)
b = u.add(v)
c = u.sub(v)
print(a[0], a[1], a[2])
print(b[0], b[1], b[2])
print(c[0], c[1], c[2])

class CameraTool:
	def __init__(self):
		self.camera = Camera()
		self.is_dragging = False
		self.is_middle_down = False
		self.is_right_down = False
		self.is_shift_down = False
		self.is_ctrl_down = False
		self.pre_x = 0
		self.pre_y = 0

	def mousemove(self, x, y, button):
		mx = x - self.pre_x
		my = y - self.pre_y
		if self.is_dragging:
			if self.is_shift_down or self.is_middle_down:
				self.camera.pan(mx, my)
			elif self.is_ctrl_down or self.is_right_down:
				self.camera.dolly(mx, my)
			else:
				self.camera.rotate(mx, my)
		self.pre_x = x
		self.pre_y = y

	def mousedown(self, x, y, button):
		self.is_dragging = True
		self.is_middle_down = (button == 1)
		self.is_right_down = (button == 2)
		self.pre_x = x
		self.pre_y = y

	def mouseup(self, x, y, button):
		self.is_dragging = False
		self.is_middle_down = False
		self.is_right_down = False

	def keydown(self, shiftdown, ctrldown):
		self.is_shift_down = shiftdown
		self.is_ctrl_down = ctrldown

	def keyup(self):
		self.is_shift_down = False
		self.is_ctrl_down = False

tool = CameraTool()

def mousemove(x, y, button):
	tool.mousemove(x, y, button)

def mousedown(x, y, button):
	tool.mousedown(x, y, button)

def mouseup(x, y, button):
	tool.mouseup(x, y, button)

def keydown(shiftdown, ctrldown):
	tool.keydown(shiftdown, ctrldown)

def keyup():
	tool.keyup()

print("python camera tool loaded")
`;

	tool_pen = `
def mousemove(x, y, button):
	return

def mousedown(x, y, button):
	print(x, y, button)

def mouseup(x, y, button):
	print(x, y, button)

print("python pen tool loaded")
	`;

	function builtinOutput(text) {
		var output = document.getElementById("output");
		output.innerHTML = output.innerHTML + text;
	}

	function clear_output() {
		var output = document.getElementById("output");
		output.innerHTML = "";
	}

	function builtinRead(x) {
		if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined) {
			throw "File not found: '" + x + "'";
		}
		return Sk.builtinFiles.files[x];
	}

	function mousemove(x, y, button) {
		if (py_mousemove) {
			Sk.misceval.callsim(py_mousemove, Sk.builtin.float_(x), Sk.builtin.float_(y), Sk.builtin.int_(button));
		}
	}

	function mousedown(x, y, button) {
		if (py_mousedown) {
			Sk.misceval.callsim(py_mousedown, Sk.builtin.float_(x), Sk.builtin.float_(y), Sk.builtin.int_(button));
		}
	}

	function mouseup(x, y, button) {
		if (py_mouseup) {
			Sk.misceval.callsim(py_mouseup, Sk.builtin.float_(x), Sk.builtin.float_(y), Sk.builtin.int_(button));
		}
	}

	function keydown(shiftKey, ctrlKey) {
		if (py_keydown) {
			Sk.misceval.callsim(py_keydown, Sk.builtin.bool(shiftKey), Sk.builtin.bool(ctrlKey));
		}
	}

	function keyup() {
		if (py_keyup) {
			Sk.misceval.callsim(py_keyup);
		}
	}

	var Camera = function () {
		if (!(this instanceof Sk.builtin.Camera)) {
			return new Sk.builtin.Camera();
		}
		return this;
	};
	Sk.builtin.Camera = Camera;
	Sk.abstr.setUpInheritance("Camera", Camera, Sk.builtin.object);
	Sk.builtin.Camera.prototype.pan = new Sk.builtin.func(function (self, mx, my) {
		umgl.get_scene().camera.pan(mx.v, my.v);
	});
	Sk.builtin.Camera.prototype.dolly = new Sk.builtin.func(function (self, mx, my) {
		umgl.get_scene().camera.dolly(mx.v, my.v);
	});
	Sk.builtin.Camera.prototype.rotate = new Sk.builtin.func(function (self, mx, my) {
		umgl.get_scene().camera.rotate(mx.v, my.v);
	});

	function execute_script() {
		var editor = ace.edit("editor"),
			myPromise = Sk.misceval.asyncToPromise(function () {
				var module;
				clear_output();
				Sk.builtins.Camera = Sk.builtin.Camera;

				module = Sk.importMainWithBody("<stdin>", false, editor.getValue(), true);
				py_mousemove = module.tp$getattr('mousemove');
				py_mousedown = module.tp$getattr('mousedown');
				py_mouseup = module.tp$getattr('mouseup');
				py_keydown = module.tp$getattr('keydown');
				py_keyup = module.tp$getattr('keyup');
				return module;
			});

		myPromise.then(function (mod) {
			console.log('python execution success');
		}, function (err) {
			console.error(err);
		});
	}

	function init_mainview_event() {
		var mainview = document.getElementById('mainview');
		mainview.addEventListener('change_tool', function (evt) {
			var editor = ace.edit("editor");
			console.log("change tool");
			if (evt.tool.id === 'tool_camera') {
				editor.setValue(tool_camera, 1);
			} else if (evt.tool.id === 'tool_pen') {
				editor.setValue(tool_pen, 1);
			}
			execute_script();
		});
	}

	function init() {
		var editor = ace.edit("editor"),
			canvas = document.getElementById('canvas');

		document.getElementById('editor').style.height = "100%";
		editor.getSession().setMode("ace/mode/python");
		editor.setTheme("ace/theme/chrome");

		Sk.pre = "output";
		Sk.configure({output : builtinOutput, read : builtinRead});

		Sk.externalLibraries = {
			"ummath" : {
				path: 'js/pyummath.js',
			}
		};

		console.log("Sk.builtins", Sk.builtins);

		canvas.addEventListener('mousedown', function (evt) {
			mousedown(evt.pageX, evt.pageY, evt.button);
		});
		window.addEventListener('mouseup', function (evt) {
			mouseup(evt.pageX, evt.pageY, evt.button);
		});
		canvas.addEventListener('mousemove', function (evt) {
			mousemove(evt.pageX, evt.pageY, evt.button);
		});
		window.addEventListener('keydown', function (evt) {
			keydown(evt.shiftKey, evt.ctrlKey);
		});
		window.addEventListener('keyup', function (evt) {
			keyup();
		});

		document.getElementById('execute_button').onclick = execute_script;

		editor.$blockScrolling = Infinity;
		editor.setValue(tool_camera, 1);

		init_mainview_event();
		execute_script();
	}

	window.umeditor = {};
	window.umeditor.init = init;

}(window.umgl));
