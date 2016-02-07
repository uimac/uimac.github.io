/*jslint devel:true*/
/*global Float32Array */
(function () {
	var UMTimeline;

	UMTimeline = function (canvas, setting) {
		var id;
		this.canvas = canvas;
		this.setting = setting;
		this.width = canvas.width;
		this.height = canvas.height;
		this.data = null;
		this.keyRects = [];
		this.currentframe = 0;

		setInterval(function () {
			if (this.width !== canvas.clientWidth || this.height !== canvas.clientHeight) {
				this.width = canvas.clientWidth;
				this.height = canvas.clientHeight;
				canvas.width = this.width;
				canvas.height = this.height;
				console.log(this.width, this.height);
				this.draw();
			}
		}.bind(this), 30);
	};

	function intersects(rect1, rect2) {
		//console.log(rect1, rect2);
		var x1 = Math.max(rect1.x, rect2.x),
			y1 = Math.max(rect1.y, rect2.y),
			x2 = Math.min(rect1.x + rect1.w, rect2.x + rect2.w),
			y2 = Math.min(rect1.y + rect1.h, rect2.y + rect2.h);
		if (x1 < x2 && y1 < y2) {
			return { x : x1, y : y1, w : x2 - x1, h : y2 - y1 };
		} else {
			return null;
		}
	}

	function drawLine(context, x1, y1, x2, y2, rect) {
		var irect,
			srect = { x : x1, y : y1, w : x2 - x1, h : y2 - y1 };
		if (x1 < x2 && y1 < y2) {
			irect = intersects(srect, rect);
			if (irect) {
				context.beginPath();
				context.moveTo(irect.x, irect.y);
				context.lineTo(irect.x + irect.w, irect.y + irect.h);
				context.stroke();
			} else {
				return irect;
			}
		} else {
			if (x1 === x2) { srect.x = x2 - 1.0; srect.w = 1.0; }
			if (y1 === y2) { srect.y = y2 - 1.0; srect.h = 1.0; }
			irect = intersects(srect, rect);
			if (irect) {
				context.beginPath();
				context.moveTo(x1, y1);
				context.lineTo(x2, y2);
				context.stroke();
				return rect;
			} else {
				return irect;
			}
		}
	}

	function drawKey(context, x, y, r, rect) {
		var irect = intersects({ x : x - r, y : y - r, w : r * 2, h : r * 2}, rect);
		if (irect) {
			context.save();
			context.beginPath();
			context.translate(x, y);
			context.rotate(Math.PI / 4);
			context.fillRect(- r, - r, r * 2, r * 2);
			context.restore();
			return true;
		} else {
			return false;
		}
	}

	function drawArrow(context, x, y, r, isClose, rect) {
		var irect = intersects({ x : x - r, y : y - r, w : r * 2, h : r * 2}, rect);
		if (irect) {
			if (isClose) {
				context.beginPath();
				context.moveTo(x - r, y - r);
				context.lineTo(x + r, y);
				context.lineTo(x - r, y + r);
				context.lineTo(x - r, y - r);
				context.fill();
			} else {
				irect = intersects({ x : x - r, y : y - r, w : r * 2, h : r * 2}, rect);
				context.save();
				context.beginPath();
				context.translate(x, y);
	    		context.rotate(Math.PI / 2);
				context.moveTo(- r, - r);
				context.lineTo(  r,   0);
				context.lineTo(- r,   r);
				context.lineTo(- r, - r);
				context.fill();
				context.restore();
			}
		}
	}

	function strokeRect(context, x, y, w, h, rect) {
		var irect = intersects({ x : x, y : y, w : w, h : h}, rect);
		if (irect) {
			context.strokeRect(x, y, w, h);
		}
	}

	function fillRect(context, x, y, w, h, rect) {
		var irect = intersects({ x : x, y : y, w : w, h : h}, rect);
		if (irect) {
			context.fillRect(irect.x, irect.y, irect.w, irect.h);
		}
	}

	UMTimeline.prototype.drawSplitter = function (rect) {
		var context = this.canvas.getContext('2d'),
			splitx = this.splitX(),
			ss = this.setting.spiltterSize,
			ss2 = ss / 2.0,
			x = splitx - ss,
			lw = this.setting.lineWidth,
			lw2 = lw * 2.0;

		context.lineWidth = ss;
		context.strokeStyle = this.setting.spiltterColor;
		drawLine(context, x, ss2, x, this.height - ss2, rect);
		context.lineWidth = lw2;
		context.strokeStyle = this.setting.lineColor;
		drawLine(context, x - ss2 - lw2, ss2, x - ss2 - lw2, this.height - ss2, rect);
		context.lineWidth = lw;
		context.strokeStyle = this.setting.lineColor;
		strokeRect(context, x - ss2, ss2, this.setting.spiltterSize, this.height - ss2, rect);
	};

	UMTimeline.prototype.drawBounds = function (rect) {
		var context = this.canvas.getContext('2d'),
			splitx = this.splitX(),
			lw = this.setting.lineWidth,
			lw2 = lw * 2.0;

		context.lineWidth = lw;
		context.strokeStyle = this.setting.lineColor;
		strokeRect(context, context, lw, lw, this.width - lw2, this.height - lw2, rect);
		//drawLine(context, splitx, 1, splitx, this.height - 2);
	};

	UMTimeline.prototype.drawBackground = function (rect) {
		var context = this.canvas.getContext('2d');
		context.fillStyle = this.setting.background;
		fillRect(context, rect.x, rect.y, rect.w, rect.h, rect);
	};

	UMTimeline.prototype.calcPropRange = function (prop) {
		var result = { left : 0, right : 0 },
			splitx = this.splitX(),
			scale = this.setting.scale,
			prekey = null;

		for (i in prop.data) {
			if (prekey) {
				result.right = splitx + i * scale;
			} else {
				result.left = splitx + i * scale;
			}
			prekey = i;
		}
		return result;
	}

	UMTimeline.prototype.drawProp = function (rect, ypos, content, prop) {
		var context = this.canvas.getContext('2d'),
			i,
			height = 0,
			cs = this.setting.contentSize,
			cs2 = cs / 2.0,
			splitx = this.splitX(),
			splitx_inv = this.width - splitx,
			ss = this.setting.spiltterSize,
			lw = this.setting.lineWidth,
			lw2 = lw * 2.0,
			pdx = this.setting.propPaddingX,
			kr = this.setting.keyRadius,
			scale = this.setting.scale,
			offsetX = this.setting.offsetX,
			offsetY = this.setting.offsetX,
			result = { x : 0, width : 0, height : 0 },
			valueRect;

		// keys
		context.fillStyle = this.setting.propColor;
		fillRect(context, lw2, ypos + lw2, splitx - ss * 2 - lw2, cs, rect);
		context.strokeStyle = this.setting.lineColor;
		context.lineWidth = lw / 2.0;
		strokeRect(context, lw2, ypos + lw2, splitx - ss * 2 - lw2, cs, rect);
		context.fillStyle = this.setting.propTextColor;
		context.font = "normal 12px sans-serif";
		context.fillText(prop.name, pdx + lw2 + cs, ypos + cs - cs / 4);
		result.height = cs;

		// value bounds
		context.fillStyle = this.setting.propColor;
		fillRect(context, splitx, ypos + lw2, splitx_inv - lw, cs, rect);
		context.strokeStyle = this.setting.lineColor;
		context.lineWidth = lw;
		drawLine(context, splitx, ypos + lw2 + cs, this.width - lw, ypos + lw2 + cs, rect);

		valueRect = JSON.parse(JSON.stringify(rect));
		valueRect.x = splitx;

		// values
		context.lineWidth = lw;
		var prekey = null;
		for (i in prop.data) {
			if (prekey) {
				context.fillStyle = content.propColor;
				fillRect(context, splitx + prekey * scale - offsetX, ypos + lw2, (i - prekey) * scale, cs - lw2, valueRect);
				result.right = splitx + i * scale;
			} else {
				result.left = splitx + i * scale;
			}
			prekey = i;
		}

		context.fillStyle = this.setting.keyColor;
		for (i in prop.data) {
			if (prop.data.hasOwnProperty(i)) {
				drawKey(context, splitx + i * scale - offsetX, ypos + cs2, kr, valueRect);
			}
		}

		return result;
	};

	UMTimeline.prototype.drawContent = function (rect, ypos, content) {
		var context = this.canvas.getContext('2d'),
			i,
			props = content.props,
			prop,
			height = 0,
			offsetX = this.setting.offsetX,
			offsetY = this.setting.offsetX,
			cs = this.setting.contentSize,
			cs2 = cs / 2.0,
			splitx = this.splitX(),
			splitx_inv = this.width - splitx,
			ss = this.setting.spiltterSize,
			lw = this.setting.lineWidth,
			lw2 = lw * 2.0,
			ar = this.setting.arrowRadius,
			propRange = { min : Number.MAX_VALUE, max : Number.MIN_VALUE },
			bounds,
			valueRect;

		// keys
		context.fillStyle = this.setting.contentColor;
		fillRect(context, lw2, ypos + lw2, splitx - ss * 2 - lw2, cs, rect);
		context.strokeStyle = this.setting.lineColor;
		context.lineWidth = lw / 2.0;
		strokeRect(context, lw2, ypos + lw2, splitx - ss * 2 - lw2, cs, rect);
		context.fillStyle = this.setting.textColor;
		context.font = "normal 12px sans-serif";
		context.fillText(content.name, lw2 + cs, ypos + cs - cs / 4);
		height = height + cs;
		drawArrow(context, cs2, ypos + cs2, ar, content.closed, rect);

		this.keyRects.push({ x : lw2, y : ypos + lw2, w : cs, h : cs });

		// value bounds
		context.fillStyle = this.setting.contentColor;
		fillRect(context, splitx, ypos + lw2, splitx_inv - lw, cs, rect);
		context.strokeStyle = this.setting.lineColor;
		context.lineWidth = lw;
		drawLine(context, splitx, ypos + lw2 + cs, this.width - lw, ypos + lw2 + cs, rect);

		valueRect = JSON.parse(JSON.stringify(rect));
		valueRect.x = splitx;

		if (!content.closed) {
			for (i = 0; i < props.length; i = i + 1) {
				prop = props[i];
				//console.log(height);
				bounds = this.drawProp(rect, ypos + height, content, prop);
				propRange.min = Math.min(propRange.min, bounds.left);
				propRange.max = Math.max(propRange.max, bounds.right);
				height = height + bounds.height;
			}
		} else {
			for (i = 0; i < props.length; i = i + 1) {
				prop = props[i];
				bounds = this.calcPropRange(prop);
				propRange.min = Math.min(propRange.min, bounds.left);
				propRange.max = Math.max(propRange.max, bounds.right);
			}
		}

		// prop range
		context.fillStyle = content.color;
		fillRect(context, propRange.min - offsetX, ypos + lw2, propRange.max - propRange.min, cs - lw2, valueRect);

		return height;
	};

	UMTimeline.prototype.drawData = function (rect) {
		var i,
			k,
			contents = this.data.contents,
			content,
			height = 0;

		this.keyRects = [];
		for (i = 0; i < contents.length; i = i + 1) {
			content = contents[i];
			height = height + this.drawContent(rect, height, content);
		}
	};

	UMTimeline.prototype.drawSeekLine = function (rect) {
		var context = this.canvas.getContext('2d'),
			splitx = this.splitX(),
			offsetX = this.setting.offsetX,
			scale = this.setting.scale,
			lw = this.setting.lineWidth,
			lw2 = lw * 2.0,
			valueRect = JSON.parse(JSON.stringify(rect));

		valueRect.x = splitx;
		valueRect.w = valueRect.w - splitx;

		context.strokeStyle = this.setting.seekLineColor;
		context.lineWidth = 1.0;
		drawLine(context, splitx + this.currentframe * scale - offsetX, lw2, splitx + this.currentframe * scale- offsetX, this.height - lw2, valueRect);
	};

	UMTimeline.prototype.draw = function (rect) {
		console.time('timeline draw');
		if (!rect) {
			rect = { x : 0, y : 0, w : this.width, h : this.height };
		}
		this.drawBackground(rect);
		this.drawBounds(rect);
		this.drawData(rect);
		this.drawSplitter(rect);
		this.drawSeekLine(rect);

		console.timeEnd('timeline draw');
	};

	UMTimeline.prototype.setData = function (data) {
		this.data = data;
		this.draw({ x : 0, y : 0, w : this.width, h : this.height});
	};

	UMTimeline.prototype.setCurrentFrame = function (frame) {
		this.currentframe = Math.floor(frame + 0.5);
		if (frame < 0) {
			this.currentframe = 0;
		}
		console.log("frame:", this.currentframe);
		this.draw();
	};

	UMTimeline.prototype.splitX = function () {
		return this.setting.split;
	}

	UMTimeline.prototype.isOnSplitter = function (x, y) {
		var splitx = this.splitX();
		return x < splitx && x > (splitx - this.setting.spiltterSize * 2) &&
				y >= 0 && y < this.height;
	};

	UMTimeline.prototype.moveSplit = function (x) {
		if (x > this.setting.contentSize) {
			this.setting.split = x;
			this.draw();
		}
	};

	UMTimeline.prototype.moveTimeline = function (mx, my) {
		this.setting.offsetX = this.setting.offsetX + mx;
		this.setting.offsetY = this.setting.offsetY + my;
		//console.log(this.setting.offsetX, this.setting.offsetY)
		this.draw();
	};

	UMTimeline.prototype.setScale = function (s) {
		console.log(s);
		if (s > 0 && s < 20.0) {
			this.setting.scale = s;
			this.draw();
		}
	};

	UMTimeline.prototype.click = function (x, y) {
		var i,
			keyRect,
			isClosed,
			rect = { x : x - 1, y : y - 1, w : 2, h : 2 };

		//console.log(x, y, rect);
		for (i = 0; i < this.keyRects.length; i = i + 1) {
			keyRect = this.keyRects[i];
			if (intersects(keyRect, rect)) {
				isClosed = this.data.contents[i].closed;
				this.data.contents[i].closed = !isClosed;
				this.draw();
				break;
			}
		}
	};

	function initMouse(canvas, timeline) {
		var is_key_changing = false,
			is_split_moving = false,
			is_middle_down = false,
			mstate = {
				pre_x : 0
			};

		canvas.addEventListener('click', function (ev) {
			var rect = ev.target.getBoundingClientRect();
				x = ev.clientX - rect.left;
				y = ev.clientY - rect.top;
			timeline.click(x, y);
		});
		canvas.addEventListener('mousedown', (function (mstate) {
			return function (ev) {
				var rect,
					splitx,
					x, y;
				if (ev.button === 0) {
					rect = ev.target.getBoundingClientRect();
					x = ev.clientX - rect.left;
					y = ev.clientY - rect.top;
					splitx = timeline.splitX();
					if (x > splitx) {
						is_key_changing = true;
						timeline.setCurrentFrame( (x - splitx + timeline.setting.offsetX) / timeline.setting.scale);
					} else if (timeline.isOnSplitter(x, y)) {
						is_split_moving = true;
						canvas.style.cursor = "e-resize";
					}
				} else if (ev.button == 1) {
					mstate.pre_x = x;
					is_middle_down = true;
				}
			};
		}(mstate)));
		canvas.addEventListener('mousemove', (function (mstate) {
			return function (ev) {
				var splitx,
					rect = ev.target.getBoundingClientRect();
					x = ev.clientX - rect.left;
					y = ev.clientY - rect.top,
					mx = 0;
				if (timeline.isOnSplitter(x, y)) {
					canvas.style.cursor = "e-resize";
				} else {
					canvas.style.cursor = "default";
				}
				if (is_key_changing) {
					splitx = timeline.splitX();
					timeline.setCurrentFrame( (x - splitx + timeline.setting.offsetX) / timeline.setting.scale );
				} else if (is_split_moving) {
					rect = ev.target.getBoundingClientRect();
					x = ev.clientX - rect.left;
					timeline.moveSplit(x);
				} else if (is_middle_down && mstate.pre_x) {
					mx = -(x - mstate.pre_x);
					//console.log(mx, x, mstate.pre_x, mstate);
					timeline.moveTimeline(mx, 0);
				}
				mstate.pre_x = x;
			};
		}(mstate)));
		canvas.addEventListener('mouseup', function (ev) {
			is_left_down = false;
			is_key_changing = false;
			is_split_moving = false;
			is_middle_down = false;
			canvas.style.cursor = "default";
		});
		canvas.addEventListener('mousewheel', function (ev) {
			var data = ev.wheelDelta;
			if (data > 0) {
				timeline.setScale(timeline.setting.scale + 2.0);
			} else {
				timeline.setScale(timeline.setting.scale - 1.0);
			}
		});
	}

	function init() {
		var setting = {
				background : "rgb(55, 55, 55)",
				lineColor : "rgb(0, 0, 0)",
				spiltterColor : "rgb(80, 80, 80)",
				contentColor : "rgb(80, 80, 80)",
				propColor : "rgb(70, 70, 70)",
				keyColor : "rgb(200, 200, 200)",
				textColor : "rgb(255, 255, 255)",
				propTextColor : "rgb(200, 200, 200)",
				seekLineColor : "rgb(255, 255, 255)",
				propPaddingX : 5,
				lineWidth : 0.5,
				split : 200, // px
				headerSize : 50,
				contentSize : 22,
				arrowRadius : 4,
				keyRadius : 3.5,
				spiltterSize : 3.0,
				scale : 10.0,
				offsetX : 0.0,
				offsetY : 0.0
			},
			data = {
				contents : [
					{
						name : "test",
						closed : false,
						color : "rgb(100, 100, 200)",
						propColor : "rgba(100, 100, 200, 0.7)",
						props : [
							{
								name : "hogehoge",
								data : {
									10 : 100,
									20 : 120,
									25 : 150
								}
							},
							{
								name : "piropiro",
								data : {
									30 : 100,
									50 : 220,
									95 : 150
								}
							}
						]
					},
					{
						name : "munimuni",
						closed : false,
						color : "rgb(200, 100, 100)",
						propColor : "rgba(200, 100, 100, 0.7)",
						props : [
							{
								name : "piropiro",
								data : {
									5 : 100,
									40 : 220,
									60 : 150
								}
							}
						]
					},
					{
						name : "aaa",
						closed : true,
						color : "rgb(100, 200, 100)",
						propColor : "rgba(100, 200, 100, 0.7)",
						props : [
							{
								name : "piropiro",
								data : {
									50 : 100,
									80 : 220,
									90 : 150
								}
							}
						]
					}
				]
			},
			canvas = document.getElementById('timeline'),
			timeline = new UMTimeline(canvas, setting);

		for (var i = 0; i < 1000; i = i + 1) {
			data.contents[0].props[0].data[i] = i;
		}

		console.time('timer1');
		timeline.setData(data);
		timeline.draw();
		console.timeEnd('timer1');

		initMouse(canvas, timeline);

	}

	window.umtimeline = {};
	window.umtimeline.UMTimeline = UMTimeline;
	window.umtimeline.init = init;

}());
