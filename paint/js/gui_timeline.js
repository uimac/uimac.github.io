(function () {
	"use strict";
	let GUITimeline;

	GUITimeline = function (store) {
		let id;
		this.store = store;
		this.root_ = document.createElement('div');
		this.canvas_ = document.createElement('canvas');
		this.menu_ =  document.createElement('div');
		this.menu_.style.width = "150px";
		this.menu_.style.height = "200px";
		this.root_.appendChild(this.menu_);
		this.root_.appendChild(this.canvas_);
		this.canvas_.style.position = "absolute";
		this.canvas_.style.left = "150px";
		this.canvas_.style.top = "0px";
		this.canvas_.style.width = "100%";
		this.canvas_.style.height = "100%";
		this.width = this.canvas_.width;
		this.height = this.canvas_.height;
		this.data = store.timelineData;
		this.keyRects = [];

		setInterval(function () {
			if (this.width !== this.canvas_.clientWidth || this.height !== this.canvas_.clientHeight) {
				this.width = this.canvas_.clientWidth;
				this.height = this.canvas_.clientHeight;
				this.canvas_.width = this.width;
				this.canvas_.height = this.height;
				this.menu_.style.height = this.height + "px";
				console.log(this.width, this.height);
				this.draw();
			}
		}.bind(this), 30);
		
		this.setting_ = {
			background: "rgb(55, 55, 55)",
			lineColor: "rgb(0, 0, 0)",
			spiltterColor: "rgb(80, 80, 80)",
			contentColor: "rgb(80, 80, 80)",
			propColor: "rgb(70, 70, 70)",
			keyColor: "rgb(200, 200, 200)",
			textColor: "rgb(255, 255, 255)",
			propTextColor: "rgb(200, 200, 200)",
			seekLineColor: "rgb(255, 255, 255)",
			propPaddingX: 5,
			lineWidth: 0.5,
			split: 0, // px
			headerSize: 50,
			contentSize: 100,
			propContentSize: 22,
			arrowRadius: 6,
			keyRadius: 3.5,
			spiltterSize: 3.0,
			scale: 10.0,
			offsetX: 0.0,
			offsetY: 0.0,
			measureHeight: 11.0
		};
		this.initMouse();
		
		this.draw();

		this.store.on(upaint.Store.EVENT_KEYFRAME_ADD, function (err, frame, prop) {
			this.draw();
		}.bind(this));
	};

	function intersects(rect1, rect2) {
		//console.log(rect1, rect2);
		let x1 = Math.max(rect1.x, rect2.x),
			y1 = Math.max(rect1.y, rect2.y),
			x2 = Math.min(rect1.x + rect1.w, rect2.x + rect2.w),
			y2 = Math.min(rect1.y + rect1.h, rect2.y + rect2.h);
		if (x1 < x2 && y1 < y2) {
			return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
		} else {
			return null;
		}
	}

	function drawLine(context, x1, y1, x2, y2, rect) {
		let irect,
			srect = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
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

	function drawImage(context, image, x1, y1) {
		context.drawImage(image, x1, y1);
	}

	function drawKey(context, x, y, r, rect) {
		let irect = intersects({ x: x - r, y: y - r, w: r * 2, h: r * 2 }, rect);
		if (irect) {
			context.save();
			context.beginPath();
			context.translate(x, y);
			context.rotate(Math.PI / 4);
			context.fillRect(- r, - r, r * 2, r * 2);
			context.strokeRect(- r, - r, r * 2, r * 2);
			context.restore();
			return true;
		} else {
			return false;
		}
	}

	function drawArrow(context, x, y, r, isClose, rect) {
		let irect = intersects({ x: x - r, y: y - r, w: r * 2, h: r * 2 }, rect);
		if (irect) {
			if (isClose) {
				context.beginPath();
				context.moveTo(x - r, y - r);
				context.lineTo(x + r, y);
				context.lineTo(x - r, y + r);
				context.lineTo(x - r, y - r);
				context.fill();
			} else {
				irect = intersects({ x: x - r, y: y - r, w: r * 2, h: r * 2 }, rect);
				context.save();
				context.beginPath();
				context.translate(x, y);
				context.rotate(Math.PI / 2);
				context.moveTo(- r, - r);
				context.lineTo(r, 0);
				context.lineTo(- r, r);
				context.lineTo(- r, - r);
				context.fill();
				context.restore();
			}
		}
	}

	function strokeRect(context, x, y, w, h, rect) {
		let irect = intersects({ x: x, y: y, w: w, h: h }, rect);
		if (irect) {
			context.strokeRect(x, y, w, h);
		}
	}

	function fillRect(context, x, y, w, h, rect) {
		let irect = intersects({ x: x, y: y, w: w, h: h }, rect);
		if (irect) {
			context.fillRect(irect.x, irect.y, irect.w, irect.h);
		}
	}

	function fillText(context, text, x, y, textSize, rect) {
		let irect = intersects({ x: x, y: y - textSize, w: textSize, h: textSize }, rect);
		if (irect) {
			context.fillText(text, x, y);
		}
	}

	GUITimeline.prototype.drawSplitter = function (rect) {
		let context = this.canvas_.getContext('2d'),
			splitx = this.splitX(),
			ss = this.setting_.spiltterSize,
			ss2 = ss / 2.0,
			x = splitx - ss,
			lw = this.setting_.lineWidth,
			lw2 = lw * 2.0;

		context.lineWidth = ss;
		context.strokeStyle = this.setting_.spiltterColor;
		drawLine(context, x, ss2, x, this.height - ss2, rect);
		context.lineWidth = lw2;
		context.strokeStyle = this.setting_.lineColor;
		drawLine(context, x - ss2 - lw2, ss2, x - ss2 - lw2, this.height - ss2, rect);
		context.lineWidth = lw;
		context.strokeStyle = this.setting_.lineColor;
		strokeRect(context, x - ss2, ss2, this.setting_.spiltterSize, this.height - ss2, rect);
	};

	GUITimeline.prototype.drawBounds = function (rect) {
		let context = this.canvas_.getContext('2d'),
			splitx = this.splitX(),
			lw = this.setting_.lineWidth,
			lw2 = lw * 2.0;

		context.lineWidth = lw;
		context.strokeStyle = this.setting_.lineColor;
		strokeRect(context, context, lw, lw, this.width - lw2, this.height - lw2, rect);
		//drawLine(context, splitx, 1, splitx, this.height - 2);
	};

	GUITimeline.prototype.drawMeasure = function (rect) {
		let context = this.canvas_.getContext('2d'),
			splitx = this.splitX(),
			scale = this.setting_.scale,
			offsetX = this.setting_.offsetX,
			mh = this.setting_.measureHeight,
			i,
			x,
			startFrame,
			endFrame,
			step,
			valueRect;

		startFrame = offsetX / scale;
		endFrame = (this.width + offsetX) / scale;

		step = 10;
		if (scale <= 3) {
			step = 50;
		}
		if (scale <= 0.8) {
			step = 100;
		}
		if (scale < 0.5) {
			step = 500;
		}

		valueRect = JSON.parse(JSON.stringify(rect));
		valueRect.x = splitx;

		startFrame = Math.floor(startFrame - startFrame % step);
		endFrame = Math.floor(endFrame - endFrame % step);

		for (i = startFrame; i < endFrame; i = i + step) {
			x = splitx + i * scale - offsetX - mh / 2;
			context.fillStyle = this.setting_.propTextColor;
			context.font = "normal " + mh + "px sans-serif";
			fillText(context, String(i), x, mh, mh, valueRect);
		}
	};

	GUITimeline.prototype.drawBackground = function (rect) {
		let context = this.canvas_.getContext('2d');
		context.fillStyle = this.setting_.background;
		fillRect(context, rect.x, rect.y, rect.w, rect.h, rect);
	};

	GUITimeline.prototype.calcPropRange = function (prop) {
		let i,
			result = { left: 0, right: 0 },
			splitx = this.splitX(),
			scale = this.setting_.scale,
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

	GUITimeline.prototype.drawProp = function (rect, ypos, content, prop) {
		let context = this.canvas_.getContext('2d'),
			i,
			height = 0,
			cs = this.setting_.propContentSize,
			cs2 = cs / 2.0,
			splitx = this.splitX(),
			splitx_inv = this.width - splitx,
			ss = this.setting_.spiltterSize,
			lw = this.setting_.lineWidth,
			lw2 = lw * 2.0,
			pdx = this.setting_.propPaddingX,
			kr = this.setting_.keyRadius,
			scale = this.setting_.scale,
			offsetX = this.setting_.offsetX,
			offsetY = this.setting_.offsetX,
			result = { x: 0, width: 0, height: 0 },
			valueRect;

		// keys
		context.fillStyle = this.setting_.propColor;
		fillRect(context, lw2, ypos + lw2, splitx - ss * 2 - lw2, cs, rect);
		context.strokeStyle = this.setting_.lineColor;
		context.lineWidth = lw / 2.0;
		strokeRect(context, lw2, ypos + lw2, splitx - ss * 2 - lw2, cs, rect);
		context.fillStyle = this.setting_.propTextColor;
		context.font = "normal 12px sans-serif";
		context.fillText(prop.name, pdx + lw2 + cs, ypos + cs - cs / 4);
		result.height = cs;

		// value bounds
		context.fillStyle = this.setting_.propColor;
		fillRect(context, splitx, ypos + lw2, splitx_inv - lw, cs, rect);
		context.strokeStyle = this.setting_.lineColor;
		context.lineWidth = lw;
		drawLine(context, splitx, ypos + lw2 + cs, this.width - lw, ypos + lw2 + cs, rect);

		valueRect = JSON.parse(JSON.stringify(rect));
		valueRect.x = splitx;

		// values
		context.lineWidth = lw;
		let prekey = null;
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

		context.fillStyle = this.setting_.keyColor;
		for (i in prop.data) {
			if (prop.data.hasOwnProperty(i)) {
				drawKey(context, splitx + i * scale - offsetX, ypos + cs2, kr, valueRect);
			}
		}

		return result;
	};

	GUITimeline.prototype.drawContent = function (rect, ypos, content) {
		let context = this.canvas_.getContext('2d'),
			i,
			props = content.props,
			prop,
			height = 0,
			offsetX = this.setting_.offsetX,
			offsetY = this.setting_.offsetX,
			cs = this.setting_.contentSize,
			cs2 = cs / 2.0,
			splitx = this.splitX(),
			splitx_inv = this.width - splitx,
			ss = this.setting_.spiltterSize,
			lw = this.setting_.lineWidth,
			lw2 = lw * 2.0,
			ar = this.setting_.arrowRadius,
			propRange = { min: Number.MAX_VALUE, max: Number.MIN_VALUE },
			bounds,
			valueRect;

		// keys
		// context.fillStyle = this.setting_.contentColor;
		// fillRect(context, lw2, ypos + lw2, splitx - ss * 2 - lw2, cs, rect);
		// context.strokeStyle = this.setting_.lineColor;
		// context.lineWidth = lw / 2.0;
		// strokeRect(context, lw2, ypos + lw2, splitx - ss * 2 - lw2, cs, rect);
		// context.fillStyle = this.setting_.textColor;
		// context.font = "normal 12px sans-serif";
		//context.fillText(content.name, lw2 + cs2, ypos + cs - cs / 4);
		// height = height + cs;
		// drawArrow(context, ar * 2, ypos + cs2, ar, content.closed, rect);

		this.keyRects.push({ x: lw2, y: ypos + lw2, w: cs, h: cs });

		// value bounds
		context.fillStyle = this.setting_.contentColor;
		fillRect(context, splitx, ypos + lw2, splitx_inv - lw, cs, rect);
		context.strokeStyle = this.setting_.lineColor;
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

		// draw image
		for (i = 0; i < props.length; i = i + 1) {
			prop = props[i];
			let keys = Object.keys(prop.data);
			for (let k = 0; k < keys.length; ++k) {
				let frame = keys[k];
				let data = prop.data[frame]
				let xpos = this.getFramePos(frame);
				if (xpos > 150 && k > 0 && k === (keys.length - 1)) {
					xpos = xpos - 150;
				}
				if (data.hasOwnProperty('image')) {
					drawImage(context, data.image, xpos, ypos + lw2);
				}
			}
		}
		
		return height;
	};

	GUITimeline.prototype.drawData = function (rect) {
		let i,
			k,
			contents = this.data.contents,
			content,
			height = this.setting_.measureHeight;

		this.keyRects = [];
		for (i = 0; i < contents.length; i = i + 1) {
			content = contents[i];
			height = height + this.drawContent(rect, height, content);
		}
	};

	GUITimeline.prototype.getFramePos = function (frame) {
		let splitx = this.splitX();
		let scale = this.setting_.scale;
		let offsetX = this.setting_.offsetX;
		return splitx + frame * scale - offsetX
	}

	GUITimeline.prototype.drawSeekLine = function (rect) {
		let context = this.canvas_.getContext('2d'),
			splitx = this.splitX(),
			offsetX = this.setting_.offsetX,
			scale = this.setting_.scale,
			lw = this.setting_.lineWidth,
			lw2 = lw * 2.0,
			valueRect = JSON.parse(JSON.stringify(rect));

		valueRect.x = splitx;
		valueRect.w = valueRect.w - splitx;

		context.strokeStyle = this.setting_.seekLineColor;
		context.lineWidth = 1.0;
		drawLine(context, 
			this.getFramePos(this.store.currentFrame),
			lw2,
			this.getFramePos(this.store.currentFrame),
			this.height - lw2, valueRect);
	};

	GUITimeline.prototype.draw = function (rect) {
		//console.time('timeline draw');
		if (!rect) {
			rect = { x: 0, y: 0, w: this.width, h: this.height };
		}
		this.drawBackground(rect);
		this.drawBounds(rect);
		this.drawMeasure(rect);
		this.drawData(rect);
		this.drawSplitter(rect);
		this.drawSeekLine(rect);

		//console.timeEnd('timeline draw');
	};

	GUITimeline.prototype.setData = function (data) {
		this.data = data;
		this.draw({ x: 0, y: 0, w: this.width, h: this.height });
	};

	GUITimeline.prototype.setCurrentFrame = function (frame) {
		this.store.currentFrame = Math.floor(frame + 0.5);
		if (frame < 0) {
			this.store.currentFrame = 0;
		}
		//console.log("frame:", this.store.currentFrame);
		this.draw();
	};

	GUITimeline.prototype.splitX = function () {
		return this.setting_.split;
	}

	GUITimeline.prototype.isOnSplitter = function (x, y) {
		let splitx = this.splitX();
		return x < splitx && x > (splitx - this.setting_.spiltterSize * 2) &&
			y >= 0 && y < this.height;
	};

	GUITimeline.prototype.moveSplit = function (x) {
		if (x > this.setting_.contentSize) {
			this.setting_.split = x;
			this.draw();
		}
	};

	GUITimeline.prototype.moveTimeline = function (mx, my) {
		this.setting_.offsetX = this.setting_.offsetX + mx;
		this.setting_.offsetY = this.setting_.offsetY + my;
		//console.log(this.setting_.offsetX, this.setting_.offsetY)
		this.draw();
	};

	GUITimeline.prototype.setScale = function (s) {
		console.log(s);
		if (s > 0 && s < 20.0) {
			this.setting_.scale = s;
			this.draw();
		}
	};

	GUITimeline.prototype.click = function (x, y) {
		let i,
			keyRect,
			isClosed,
			rect = { x: x - 1, y: y - 1, w: 2, h: 2 };

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

	GUITimeline.prototype.initMouse = function () {
		let is_key_changing = false,
			is_split_moving = false,
			is_middle_down = false,
			canvas = this.canvas_,
			mstate = {
				pre_x: 0
			},
			getPos = function (ev) {
				let rect = canvas.getBoundingClientRect();
				return [ev.clientX - rect.left - canvas.clientLeft,
				ev.clientY - rect.top - canvas.clientTop]
			},
			getTouchPos = function (ev) {
				let rect = canvas.getBoundingClientRect();
				return [ev.changedTouches[0].clientX - rect.left - canvas.clientLeft,
				ev.changedTouches[0].clientY - rect.top - canvas.clientTop]
			};

		this.onLeftDown = function (pos) {
			let x = pos[0],
				y = pos[1],
				splitx = this.splitX();
			if (x > splitx) {
				is_key_changing = true;
				this.setCurrentFrame((x - splitx + this.setting_.offsetX) / this.setting_.scale);
			} else if (this.isOnSplitter(x, y)) {
				is_split_moving = true;
				canvas.style.cursor = "e-resize";
			}
		}.bind(this);

		this.onLeftMove = function (pos) {
			let x = pos[0],
				y = pos[1],
				splitx;
			if (this.isOnSplitter(x, y)) {
				canvas.style.cursor = "e-resize";
			} else {
				canvas.style.cursor = "default";
			}
			if (is_key_changing) {
				splitx = this.splitX();
				this.setCurrentFrame((x - splitx + this.setting_.offsetX) / this.setting_.scale);
			} else if (is_split_moving) {
				this.moveSplit(x);
			}
		}.bind(this);

		this.onMouseUp = function () {
			is_key_changing = false;
			is_split_moving = false;
			is_middle_down = false;
			canvas.style.cursor = "default";
		}.bind(this);
		canvas.addEventListener('mouseup', this.onMouseUp);

		this.onClick = function (ev) {
			let pos = getPos(ev);
			this.click(pos[0], pos[1]);
		}.bind(this);
		canvas.addEventListener('click', this.onClick);

		this.onMouseDown = function (ev) {
			let x;
			if (ev.button === 0) {
				this.onLeftDown(getPos(ev));
			} else if (ev.button == 1) {
				x = getPos(ev)[0];
				mstate.pre_x = x;
				is_middle_down = true;
			}
		}.bind(this);
		canvas.addEventListener('mousedown', this.onMouseDown);

		this.onMouseMove = function (ev) {
			let x = getPos(ev)[0],
				mx = 0;
			if (ev.button === 0) {
				this.onLeftMove(getPos(ev));
			}
			if (is_middle_down && mstate.pre_x) {
				mx = -(x - mstate.pre_x);
				//console.log(mx, x, mstate.pre_x, mstate);
				this.moveTimeline(mx, 0);
			}
			mstate.pre_x = x;
		}.bind(this);
		canvas.addEventListener('mousemove', this.onMouseMove);

		this.onTouchStart = function (ev) {
			this.onLeftDown(getTouchPos(ev));
		}.bind(this);
		canvas.addEventListener('touchstart', this.onTouchStart);

		this.onTouchMove = function (ev) {
			this.onLeftMove(getTouchPos(ev));
			ev.preventDefault();
		}.bind(this);
		canvas.addEventListener('touchmove', this.onTouchMove);

		this.onTouchEnd =  function (ev) {
			let pos = getTouchPos(ev);
			this.click(pos[0], pos[1]);
			this.onMouseUp();
		}.bind(this);
		canvas.addEventListener('touchend', this.onTouchEnd); 

		this.onMouseWheel = function (ev) {
			let data = ev.wheelDelta;
			if (data > 0) {
				if (this.setting_.scale > 1.0) {
					this.setScale(this.setting_.scale + 1.0);
				} else {
					this.setScale(this.setting_.scale * 2.0);
				}
			} else {
				if (this.setting_.scale > 1.0) {
					this.setScale(this.setting_.scale - 1.0);
				} else if (this.setting_.scale > 0.125) {
					this.setScale(this.setting_.scale * 0.5);
				}
			}
		}.bind(this);
		canvas.addEventListener('mousewheel', this.onMouseWheel);
	}
	
	GUITimeline.prototype.destroy = function () {
		canvas.removeEventListener('touchstart', this.onTouchStart);
		canvas.removeEventListener('touchmove', this.onTouchMove);
		canvas.removeEventListener('touchend', this.onTouchEnd); 
		canvas.removeEventListener('click', this.onClick);
		canvas.removeEventListener('mousemove', this.onMouseMove);
		canvas.removeEventListener('mousedown', this.onMouseDown);
		canvas.removeEventListener('mouseup', this.onMouseUp);
		canvas.removeEventListener('mousewheel', this.onMouseWheel);
	};

	/**
	 * root element
	 */
	Object.defineProperty(GUITimeline.prototype, 'rootElement', {
		get: function () {
			return this.root_;
		}
	});
	
	upaint.GUITimeline = GUITimeline;
}());
