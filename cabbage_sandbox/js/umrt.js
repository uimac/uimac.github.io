/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
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

	UMRT.prototype.shade = function (primitive, ray, shader_parameter) {

	};

	UMRT.prototype.trace = function (scene, ray, shader_parameter, x, y) {
		var info = {
				result : -1,
				closest_distance : Infinity
			},
			prim;

		if (scene.bvh.intersects(scene.bvh.root, info, ray.org, ray.dir)) {
			prim = scene.bvh.primitive_list[info.result];
			return { r : info.color[0], g : info.color[1], b : info.color[2], a : info.color[3] }
		}
		return { r : 1.0, g : 0.5, b : 0.5, a : 1.0 }
	};

	UMRT.prototype.render = function (scene, canvas, render_canvas) {
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
			index,
			canvas_image = ctx.getImageData(0, 0, width, height);
			ray = new UMRay();

		render_canvas.width = width;
		render_canvas.height = height;
		console.log("width:", width, "height:", height);
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
			}
		}
		ctx.putImageData(canvas_image, 0, 0);
	};

	function init() {
		umrt = new UMRT();

		if (document.getElementById('tool_render')) {
			document.getElementById('tool_render').onclick = function (evt) {
				var render_canvas = document.getElementById('render_canvas');
				var canvas = document.getElementById('canvas');
				console.time('render');
				umrt.render(window.umgl.get_scene(), canvas, render_canvas);
				console.timeEnd('render');
			}
		}
	}

	window.umrt = {};
	window.umrt.init = init;
	window.umrt.UMRT = UMRT;
}(window.ummath));
