/*jslint devel:true*/
/*global Float32Array */
(function (ummath, umoutline) {
	var UMRT,
		UMRay,
		umrt;

	UMRT = function () {}

	UMRay = function () {};

	function toIntColor(col) {
		return {
			r : Math.floor(col.r * 0xFF + 0.5),
			g : Math.floor(col.g * 0xFF + 0.5),
			b : Math.floor(col.b * 0xFF + 0.5),
			a : Math.floor(col.a * 0xFF + 0.5)
		}
	}

	UMRay.prototype.set = function (org, dir) {
		this.org = org;
		this.dir = dir;
	};

	UMRT.prototype.shade = function (scene, ray, shader_parameter, info) {
			var prim = scene.primitive_list[info.result];
		/*
		var vpm = scene.camera.view_projection_matrix();
		var vpmrot = new ummath.UMMat44d(vpm);
		n = vpmrot.multiply(n).normalized();
		var a = n.dot(new ummath.UMVec3d(0, 0, -1));
		if (a < 0.15) {
		return { r : 0.0,
				g : 0.0,
				b : 0.0,
				a : info.color[3] };
		}
		*/
		if (prim.mark !== undefined && prim.mark) {
			return { r : 0.0,
					g : 1.0,
					b : 0.0,
					a : 1.0 };
		} else {
			return { r : info.color[0],
					g : info.color[1],
					b : info.color[2],
					a : info.color[3] };
		}
				/*
		return { r : (n.xyz[0] + 1.0) * 0.5,
				g : (n.xyz[1] + 1.0) * 0.5,
				b : (n.xyz[2] + 1.0) * 0.5,
				a : 1.0 };
				*/
	};

	UMRT.prototype.trace = function (scene, ray, shader_parameter, x, y) {
		var info = {
				result : -1,
				closest_distance : Infinity
			},
			prim;

		if (scene.bvh.intersects3(scene.bvh.root, info, ray.org, ray.dir)) {
			return this.shade(scene, ray, shader_parameter, info);
		}
		return { r : 1.0, g : 0.5, b : 0.5, a : 1.0 }
	};

/*
	UMRT.prototype.outline = function (canvas_image, scene, result_params) {
		var ctx = render_canvas.getContext('2d'),
			width = scene.width,
			height = scene.height,
			x,
			y,
			index,
			p0, p1, p2, p3, p4, p5, p6, p7 ,p8, p9;

		for (y = 1; y < height - 1; y = y + 1) {
			for (x = 1; x < width - 1; x = x + 1) {
				param = result_params[y * height + x];
				if (param.result >= 0) {
					p0 = result_params[y * height + x];
					index = (x + y * width) * 4;
					canvas_image.data[index + 0] = 0;
					canvas_image.data[index + 1] = 0;
					canvas_image.data[index + 2] = 0;
					canvas_image.data[index + 3] = 255;
				}
			}
		}
	};
	*/

	UMRT.prototype.render = function (scene, canvas, render_canvas, progress_callback) {
		var ctx = render_canvas.getContext('2d'),
			width = scene.width,
			height = scene.height,
			x,
			y,
			org,
			dir,
			color,
			info,
			shader_parameter = {},
			result_params = {},
			param,
			index,
			canvas_image = ctx.getImageData(0, 0, width, height),
			ray = new UMRay(),
			gpufor_precision = 10000.0;

		render_canvas.width = width;
		render_canvas.height = height;
		console.log("width:", width, "height:", height);

		/*
		for (i = 0; i < scene.wedge_list.length; i = i + 1) {
			console.time('create outline');
			umoutline.create(scene, scene.mesh_list[i], scene.wedge_list[i]);
			console.timeEnd('create outline');
		}
		window.umgl.drawonce();
		*/
		console.log(canvas_image);
/*
		var buffer = gpufor({
				"float* A": A,
				"float* B": B,
				"float num": 0.01
			}, "n",
			`
			float result = 0.0;
			for(int i = 0; i < 10000; ++i) {
				result = sqrt(result+A[n]+B[n]+float(i));
			}
			return result;
			`
		);*/

		for (y = 0; y < height; y = y + 1) {
			for (x = 0; x < width; x = x + 1) {
				shader_parameter = {};
				ray.set(scene.camera.position, scene.camera.generate_ray_dir(x, height - y));
				color = toIntColor(this.trace(scene, ray, shader_parameter, x, height - y));

				index = (x + y * width) * 4;
				canvas_image.data[index + 0] = color.r;
				canvas_image.data[index + 1] = color.g;
				canvas_image.data[index + 2] = color.b;
				canvas_image.data[index + 3] = 255;
				//ctx.fillStyle = "rgb(" + color.r + "," + color.g + "," + color.b + ")"
				//ctx.fillRect(x, y, 1, 1);
				result_params[y * height + x] = JSON.parse(JSON.stringify(shader_parameter));
			}
			progress_callback(y / height, canvas_image);
		}
		ctx.putImageData(canvas_image, 0, 0);
		progress_callback(1, canvas_image);

		//this.outline(scene, result_params);
	};

	function render() {
		var render_canvas = document.getElementById('render_canvas');
		var canvas = document.getElementById('canvas');
		var progress_callback = function (progress) {

		};
		umrt.render(window.umgl.get_scene(), canvas, render_canvas, progress_callback);
	}

	function init() {
		umrt = new UMRT();
		var scene = window.umgl.get_scene(),
			count = 1,
			progress_callback = function (progress, canvas_image) {
				var canvas = document.getElementById('render_canvas'),
					ctx,
				 	time = new Date(),
					currentTime = time - window.start_time,
					data,
					out;
				console.log(currentTime + "ms", progress);
				if(Math.floor(currentTime / 29500) === count || progress === 1) {
					count = count + 1;
					ctx = canvas.getContext('2d');
					if (progress !== 1) {
						ctx.putImageData(canvas_image, 0, 0, 0, 0, scene.width, scene.height * progress);
					}
					data = canvas.toDataURL().split(',')[1];
					if (progress === 1) {
						require('fs').writeFileSync("out_final.png", data, 'base64');
					} else {
						require('fs').writeFileSync("out_" + (count-1) + ".png", data, 'base64');
					}
				}
				if (progress >= 1) {
					require('electron').remote.getCurrentWindow().close();
				}
			};

		if (document.getElementById('tool_render')) {
			document.getElementById('tool_render').onclick = function (evt) {
				var render_canvas = document.getElementById('render_canvas');
				var canvas = document.getElementById('canvas');
				console.time('render');
				umrt.render(window.umgl.get_scene(), canvas, render_canvas, progress_callback);
				console.timeEnd('render');
				//document.getElementById('tool_test2').click();
			}
		}

		var start_render = function () {
			var render_canvas = document.getElementById('render_canvas');
			var canvas = document.getElementById('canvas');
			console.time('render');
			umrt.render(window.umgl.get_scene(), canvas, render_canvas, progress_callback);
		}

		var honban = true;
		if (window && window.process && window.process.type && honban) {
			var canvas = document.getElementById('render_canvas');
			clearInterval(window.umgl.get_auto_resize_handle());
			//require('electron').remote.getCurrentWindow().maximize();
			setTimeout(function () {
				canvas.width = 1920;
				canvas.height = 1080;
				scene.resize(1920, 1080);
				scene.load_abc(require("path").join(__dirname, "abc/reiko5.abc"));
				scene.load_abc(require("path").join(__dirname, "abc/camera.abc"));
				var mtlx = require("path").join(__dirname, "abc/reiko.mtlx");
				require('fs').readFile(mtlx, function (err, data) {
					scene.load_mtlx(mtlx, String(data), function () {
						window.umgl.drawonce();
						setTimeout(function () {
							start_render();
						}, 100);
					});
				});
			}, 60);
		}
		if (window && window.process && window.process.type && !honban) {
			var canvas = document.getElementById('render_canvas');
			clearInterval(window.umgl.get_auto_resize_handle());
			setTimeout(function () {
				canvas.width = 1920;
				canvas.height = 1080;
				scene.resize(1920, 1080);
				scene.load_abc(require("path").join(__dirname, "abc/test.abc"));
				scene.load_abc(require("path").join(__dirname, "abc/camera.abc"));
				var mtlx = require("path").join(__dirname, "abc/test.mtlx");
				require('fs').readFile(mtlx, function (err, data) {
					scene.load_mtlx(mtlx, String(data), function () {
						window.umgl.drawonce();
						setTimeout(function () {
							start_render();
						}, 100);
					});
				});
			}, 60)
		}
	}

	window.umrt = {};
	window.umrt.init = init;
	window.umrt.render = render;
	window.umrt.UMRT = UMRT;
}(window.ummath, window.umoutline));
