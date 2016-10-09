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
		tool_pen,
		tool_raypen;

	tool_camera = `
import cabbage
from cabbage import *

class CameraTool:
	def __init__(self):
		self.camera = camera()
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

import cabbage
from cabbage import *
import math


def pos(x, y):
	dir = camera().ray_dir(x, camera().height() - y)
	org = camera().position()

	point = bvh().intersects(org, dir)

	if point != -1:
		return point
	return org.add(dir * 100.0);

class SimplePen:
	def __init__(self):
		self.mesh = None
		self.is_dragging = False
		self.pre_dir = None
		self.pre_point = None
		self.pre_points = None
		self.count = 0

	def circle_point(self, p0, p1):
		dir = (p1 - p0).normalized()
		dp = dir.dot(p1)
		dir11 = (vec3(dp / dir[0], 0, 0) - p1).normalized()
		dir12 = (vec3(0, dp / dir[1], 0) - p1).normalized()
		dir13 = (vec3(0, 0, dp / dir[2]) - p1).normalized()
		v10 = p1 + dir11 * 3
		v11 = p1 + dir12 * 3
		v12 = p1 + dir13 * 3
		self.pre_points = (v10, v11, v12)
		return (v10, v11, v12)

	def circle_points(self, p0, p1):
		dir = (p1 - p0).normalized()
		dp = dir.dot(p1)
		if not self.pre_dir:
			self.pre_dir = dir
		dpp = self.pre_dir.dot(p0)
		dir11 = vec3((1.0, 0.0, 0.0))
		if math.fabs(dir[0]) > 0.001:
			dir11 = (vec3((dp / dir[0], 0.0, 0.0)) - p1).normalized()
		elif math.fabs(dir[1]) > 0.001:
			dir11 = (vec3((0.0, dp / dir[1], 0.0)) - p1).normalized()
		elif math.fabs(dir[2]) > 0.001:
			dir11 = (vec3((0.0, 0.0, dp / dir[2])) - p1).normalized()
		else:
			print("oops")
		dir12 = dir.cross(dir11).normalized()
		dir13 = dir.cross(dir12).normalized()
		v00 = self.pre_points[0]
		v01 = self.pre_points[1]
		v02 = self.pre_points[2]
		v10 = (p1 + dir11 * 0.5)
		v11 = (p1 + dir12 * 0.5)
		v12 = (p1 + dir13 * 0.5)
		self.pre_dir = dir
		self.pre_points = (v10, v11, v12)
		return [(v00, v10, v01), (v01, v10, v11),\
			(v01, v11, v02), (v02, v11, v12),\
			(v02, v12, v00), (v00, v12, v10)]

	def start_stroke(self, v):
		self.start_point = v
		self.count = self.count + 1
		print("start stroke")

	def on_stroke(self, v):
		if self.start_point:
			p = self.circle_point(self.start_point, v)
			self.mesh = add_mesh()
			self.pre_point = self.start_point
			self.start_point = None

		if self.mesh:
			p0 = self.pre_point
			p1 = v
			ps = self.circle_points(p0, p1)
			for p in ps:
				self.mesh.add_triangle(p[2], p[1], p[0])
		self.pre_point = v

	def end_stroke(self, v):
		self.mesh = None
		print("end stroke")

	def mousemove(self, x, y, button):
		if self.is_dragging:
			self.on_stroke(pos(x, y))

	def mousedown(self, x, y, button):
		if button == 0:
			self.is_dragging = True
			self.start_stroke(pos(x, y))

	def mouseup(self, x, y, button):
		if self.is_dragging:
			self.end_stroke(pos(x,y))
			self.is_dragging = False

tool = SimplePen()

def mousemove(x, y, button):
	tool.mousemove(x, y, button)

def mousedown(x, y, button):
	tool.mousedown(x, y, button)

def mouseup(x, y, button):
	tool.mouseup(x, y, button)

print("python pen tool loaded")
	`;


	tool_raypen = `
import cabbage
from cabbage import *
import math

def pos(x, y):
	dir = camera().ray_dir(x, camera().height() - y).normalized()
	org = camera().position()
	point = bvh().intersects(org, dir)

	if point != -1:
		return point

	# plane intersection
	p = vec3(0.0, 0.0, 0.0)
	n = vec3(0.0, 1.0, 0.0)
	angle = n.dot(dir)
	if angle < 0.0:
		dist = n.dot(p - org) / angle
		print("dist", dist)
		if dist > 0.001:
			return org + dir * dist

	return org + (dir * 100.0)

class DuplicatePen:
	def __init__(self):
		self.mesh = None
		self.is_dragging = False
		self.pre_dir = None
		self.pre_point = None
		self.pre_points = None
		self.count = 0
		self.start_point = None

	def start_stroke(self, v):
		self.start_point = v
		if v != None:
			self.mesh = duplicate_mesh(-1, v)
		print("start stroke", self.mesh)

	def on_stroke(self, v):
		if self.start_point:
			self.pre_point = self.start_point
			self.start_point = None

		if self.mesh:
			self.mesh = duplicate_mesh(0)
		self.pre_point = v

	def end_stroke(self, v):
		self.mesh = None
		print("end stroke")

	def mousemove(self, x, y, button):
		if self.is_dragging:
			self.on_stroke(pos(x, y))

	def mousedown(self, x, y, button):
		if button == 0:
			self.is_dragging = True
			self.start_stroke(pos(x, y))

	def mouseup(self, x, y, button):
		if self.is_dragging:
			self.end_stroke(pos(x,y))
			self.is_dragging = False

tool = DuplicatePen()

def mousemove(x, y, button):
	tool.mousemove(x, y, button)

def mousedown(x, y, button):
	tool.mousedown(x, y, button)

def mouseup(x, y, button):
	tool.mouseup(x, y, button)

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

	function execute_script() {
		var editor = ace.edit("editor"),
			myPromise = Sk.misceval.asyncToPromise(function () {
				var module;
				clear_output();

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
			} else if (evt.tool.id === 'tool_raypen') {
				editor.setValue(tool_raypen, 1);
			}
			execute_script();
		});
	}

	function init() {
		var editor = ace.edit("editor"),
			canvas = document.getElementById('canvas'),
			getPos,
			getTouchPos;

		document.getElementById('editor').style.height = "100%";
		editor.getSession().setMode("ace/mode/python");
		editor.setTheme("ace/theme/chrome");

		Sk.pre = "output";
		Sk.configure({output : builtinOutput, read : builtinRead});

		Sk.externalLibraries = {
			"cabbage" : {
				path: 'js/pycabbage.js'
			}
		};

		console.log("Sk.builtins", Sk.builtins);

		getPos = function (evt) {
			var rect = canvas.getBoundingClientRect();
			return [evt.clientX - rect.left - canvas.clientLeft,
					evt.clientY - rect.top - canvas.clientTop]
		};
		getTouchPos = function (evt) {
			var rect = canvas.getBoundingClientRect();
			return [evt.changedTouches[0].clientX - rect.left - canvas.clientLeft,
					evt.changedTouches[0].clientY - rect.top - canvas.clientTop]
		};

		canvas.addEventListener('mousedown', function (evt) {
			var pos = getPos(evt);
			mousedown(pos[0], pos[1], evt.button);
		});
		window.addEventListener('mouseup', function (evt) {
			var pos = getPos(evt);
			mouseup(pos[0], pos[1], evt.button);
		});
		canvas.addEventListener('mousemove', function (evt) {
			var pos = getPos(evt);
			mousemove(pos[0], pos[1], evt.button);
		});
		window.addEventListener('keydown', function (evt) {
			keydown(evt.shiftKey, evt.ctrlKey);
		});
		window.addEventListener('keyup', function (evt) {
			keyup();
		});
		canvas.addEventListener('touchstart', function (evt) {
			var pos = getTouchPos(evt);
			mousedown(pos[0], pos[1], 0);
		});
		canvas.addEventListener('touchmove', function (evt) {
			var pos = getTouchPos(evt);
			mousemove(pos[0], pos[1], 0);
			evt.preventDefault();
		});
		canvas.addEventListener('touchend', function (evt) {
			var pos = getTouchPos(evt);
			mouseup(pos[0], pos[1], 0);
		});

		if (window.ongesturestart !== undefined) {
			var gesturePos = null;
			canvas.addEventListener("gesturestart", function (evt) {
				var rect = canvas.getBoundingClientRect();
				gesturePos = rect.top + (rect.bottom - rect.top) / 2;
				mousedown(0, gesturePos, 2);
			}, false);
			canvas.addEventListener("gesturechange", function (evt) {
				if (gesturePos) {
					gesturePos = gesturePos + 10 * e.scale;
					mousedown(0, gesturePos, 2);
				}
			}, false);
			canvas.addEventListener("gestureend", function (evt) {
				mouseup(0, gesturePos, 2);
				gesturePos = null;
			}, false);
		}

		document.getElementById('execute_button').onclick = execute_script;

		editor.$blockScrolling = Infinity;
		editor.setValue(tool_camera, 1);

		init_mainview_event();
		execute_script();
	}

	window.umeditor = {};
	window.umeditor.init = init;

}(window.umgl));
