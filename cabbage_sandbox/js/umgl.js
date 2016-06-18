/*jslint devel:true bitwise:true */
/*global URL, Float32Array, Uint8Array */
(function (umscene) {
	"use strict";
	var gl = null,
		target_fps = 60.0,
		scene,
		current_tool,
		stats = null,
		mainloop_handle = null,
		is_drawing = false;

	function main_loop() {
		var canvas = document.getElementById('canvas');
		if (!is_drawing) {
			is_drawing = true;
			if (stats) {
				stats.begin();
			}

			scene.clear();
			scene.update();
			scene.draw();
			if (stats) {
				stats.end();
			}
			cancelAnimationFrame(mainloop_handle);
			mainloop_handle = requestAnimationFrame(main_loop, canvas);
			is_drawing = false;
		}
	}

	function drawonce() {
		if (!is_drawing) {
			mainloop_handle = requestAnimationFrame(function () {
				main_loop();
				cancelAnimationFrame(mainloop_handle);
			});
		}
	}

	function resize() {
		var canvas = document.getElementById('canvas'),
			mainview = document.getElementById('mainview');
		canvas.width = mainview.clientWidth;
		canvas.height = mainview.clientHeight;
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		console.log(mainview.clientWidth, mainview.clientHeight);
		scene.resize(canvas.width, canvas.height);
		drawonce();
	}

	function init_edit_tool() {
		var i,
			edit_tool = document.getElementById('tool_edit'),
			scriptview = document.getElementById('scriptview'),
			clickfunc = function (evt) {
				if (evt.target.className === 'other_tool selected') {
					evt.target.className = "other_tool";
					scriptview.style.display = "none";
				} else {
					evt.target.className = "other_tool selected";
					scriptview.style.display = "block";
				}
			};
		edit_tool.onclick = clickfunc;
	}

	function load_file(file) {
		var filename = file.name,
			splitted,
			ext,
			mtl,
			reader;

		if (!filename) {
			return;
		}
		splitted = filename.split('.');
		if (splitted.length > 0) {
			ext = splitted[splitted.length-1].toLowerCase();
			if (ext === "abc") {
				scene.load_abc(file.path);

				var paths = file.path.split('.');
				paths.pop();
				paths.push('mtl')
				mtl = paths.join('.');
				require('fs').readFile(mtl, function (err, data) {
					if (err) {
						drawonce();
						return;
					}
					scene.load_mtl(mtl, String(data), function () {
						console.log("end")
						drawonce();
					});
				});
			} else if (ext === "obj") {
				reader = new FileReader();
				reader.readAsText(file);
				reader.onload = function(ev) {
					scene.load_obj(splitted[splitted.length-2], reader.result);
					drawonce();
				};
			}
		}
	}

	function init_open_tool() {
		document.getElementById('tool_open').onchange = function (evt) {
			load_file(evt.target.files[0])
		};
	}

	function init_tools() {
		var i,
			tools = document.getElementsByClassName('tool'),
			clickfunc = function (evt) {
				var tool_change_event,
					mainview = document.getElementById('mainview');
				if (evt.target.className.indexOf("selected") < 0) {
					if (current_tool) {
						current_tool.className = "tool";
					}
					evt.target.className = "tool selected";
					current_tool = evt.target;

					// ツール変更イベントを送る.
					tool_change_event = document.createEvent('UIEvents');
					tool_change_event.initEvent('change_tool', false, false);
					tool_change_event.tool = current_tool;
					mainview.dispatchEvent(tool_change_event);
				}
			};

		for (i = 0; i < tools.length; i = i + 1) {
			tools[i].onclick = clickfunc;
		}
		current_tool = document.getElementById('tool_camera');
	}

	function init_shader_tools() {
		var i,
			tools = document.getElementsByClassName('shader_tool'),
			clickfunc = function (evt) {
				var i;
				for (i = 0; i < tools.length; i = i + 1) {
					tools[i].className = "shader_tool";
				}
				if (evt.target.className.indexOf("selected") < 0) {
					evt.target.className = "shader_tool selected";
					if (evt.target.id === "tool_surface") {
						scene.change_shader(0);
					} else if (evt.target.id === "tool_surface_edge") {
						scene.change_shader(1);
					}
				} else {
					evt.target.className = "shader_tool";
				}
			};

		for (i = 0; i < tools.length; i = i + 1) {
			tools[i].onclick = clickfunc;
		}
	}

	function start_mainloop() {
		mainloop_handle = requestAnimationFrame(main_loop);
	}

	function stop_mainloop() {
		cancelAnimationFrame(mainloop_handle);
		drawonce();
	}

	function init() {
		var canvas = document.getElementById('canvas'),
			line,
			pre_x,
			pre_y,
			is_dragging = false,
			is_shift_down = false,
			is_ctrl_down = false,
			is_middle_down = false,
			is_right_down = false,
			ext;

		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		if (!gl) {
			alert("init failed");
			return;
		}

		ext = gl.getExtension("OES_element_index_uint");
		if (!ext) {
			alert("No OES_element_index_uint support");
			return;
		}
		ext = gl.getExtension('OES_standard_derivatives');
		if (!ext) {
			alert("No OES_standard_derivatives support");
			return;
		}
		ext = gl.getExtension('OES_texture_float');
		if (!ext) {
			alert("No OES_texture_float support");
			return;
		}
		ext = gl.getExtension('ANGLE_instanced_arrays');
		if (!ext) {
			alert("No ANGLE_instanced_arrays support");
			return;
		}


		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LESS);
		gl.enable(gl.CULL_FACE);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(0.25, 0.25, 0.25, 1.0);

		scene = new umscene.UMScene(gl);
		scene.init();
		resize();

/*
		(function () {
			stats = new Stats();
			stats.setMode( 1 ); // 0: fps, 1: ms, 2: mb

			// align top-left
			stats.domElement.style.position = 'absolute';
			stats.domElement.style.left = '0px';
			stats.domElement.style.top = '0px';
			document.body.appendChild( stats.domElement );
		}());
*/

		canvas.addEventListener('touchstart', function (evt) {
			/*
			is_dragging = true;
			pre_x = evt.changedTouches[0].pageX;
			pre_y = evt.changedTouches[0].pageY;
			*/
			if (!scene.is_playing) {
				mainloop_handle = requestAnimationFrame(main_loop);
			}
		});
		/*
		canvas.addEventListener('touchmove', function (evt) {
			var mx = evt.changedTouches[0].pageX - pre_x,
				my = evt.changedTouches[0].pageY - pre_y;
			if (is_dragging && current_tool.id === 'tool_camera') {
				if (is_shift_down || is_middle_down) {
					scene.camera.pan(mx, my);
				} else if (is_ctrl_down || is_right_down) {
					scene.camera.dolly(mx, my);
				} else {
					scene.camera.rotate(mx, my);
				}
			}
			pre_x = evt.changedTouches[0].pageX;
			pre_y = evt.changedTouches[0].pageY;
			evt.preventDefault();
		});
		*/
		canvas.addEventListener('touchend', function (evt) {
			if (!scene.is_playing) {
				cancelAnimationFrame(mainloop_handle);
			}
			is_drawing = false;
		});

		window.addEventListener('mousedown', function (evt) {
			/*
			is_dragging = true;
			is_middle_down = (evt.button === 1);
			is_right_down = (evt.button === 2);
			pre_x = evt.pageX;
			pre_y = evt.pageY;
			*/
			if (!scene.is_playing) {
				mainloop_handle = requestAnimationFrame(main_loop);
			}
		});
		window.addEventListener('mouseup', function (evt) {
			/*
			is_dragging = false;
			is_middle_down = false;
			is_right_down = false;
			*/
			if (!scene.is_playing) {
				cancelAnimationFrame(mainloop_handle);
			}
			is_drawing = false;
		});
			/*
		window.addEventListener('mousemove', function (evt) {
			var mx = evt.pageX - pre_x,
				my = evt.pageY - pre_y;
			if (is_dragging && current_tool.id === 'tool_camera') {
				if (is_shift_down || is_middle_down) {
					scene.camera.pan(mx, my);
				} else if (is_ctrl_down || is_right_down) {
					scene.camera.dolly(mx, my);
				} else {
					scene.camera.rotate(mx, my);
				}
			}
			pre_x = evt.pageX;
			pre_y = evt.pageY;
		});
		window.addEventListener('keydown', function (evt) {
			if (evt.shiftKey) {
				is_shift_down = true;
			}
			if (evt.ctrlKey) {
				is_ctrl_down = true;
			}
		});
		window.addEventListener('keyup', function (evt) {
			is_shift_down = false;
			is_ctrl_down = false;
		});
		*/
		document.oncontextmenu = function (evt) {
			evt.preventDefault();
			return false;
		};
		window.addEventListener('resize', function (event) {
			resize();
		});
		if (document.getElementById('tool_play')) {
			document.getElementById('tool_play').onclick = function (evt) {
				scene.play();
				start_mainloop();
			};
		}
		if (document.getElementById('tool_stop')) {
			document.getElementById('tool_stop').onclick = function (evt) {
				scene.stop();
				stop_mainloop();
			};
		}
		if (document.getElementById('tool_pause')) {
			document.getElementById('tool_pause').onclick = function (evt) {
				scene.pause();
				cancelAnimationFrame(mainloop_handle);
			};
		}
		setInterval(function () {
			var mainview = document.getElementById('mainview');
			if (mainview.clientWidth !== canvas.clientWidth || mainview.clientHeight !== canvas.clientHeight) {
				resize();
			}
		}, 30);

		document.body.ondragover = function (ev) {
			ev.preventDefault();
		}

		document.body.ondrop = function (ev) {
			ev.preventDefault();
			if (event.dataTransfer.files.length <= 0) {
				return;
			}
			var f = event.dataTransfer.files[0];
			load_file(f);
		}

		init_tools();
		init_edit_tool();
		init_open_tool();
		init_shader_tools();

		drawonce();
	}

	function dispose() {
		scene.dispose();
	}

	window.umgl = {};
	window.umgl.init = init;
	window.umgl.dispose = dispose;
	window.umgl.drawonce = drawonce;
	window.umgl.start_mainloop = start_mainloop;
	window.umgl.stop_mainloop = stop_mainloop;
	window.umgl.get_scene = function () { return scene; };
}(window.umscene));
