(function () {
	"use strict";

	// 

	let Action = upaint.Action;

	let Store = function (action) {
		EventEmitter.call(this);

		this.currentFrame_ = 0;
		this.app_ = null;
		this.timelineData_ = {
			contents: []
		};

		this.action = action;
		this.contentKeyToIndex = {}
		this.sceneManager = null;
		this.scene_ = null;

		this.undoBuffer = [];
		this.redoBuffer = [];

		this._initEvents();
	};
	Store.prototype = Object.create(EventEmitter.prototype);

	Store.prototype.destroy = function () {
		this.sceneManager.destroy();
	};	

	Store.prototype._initEvents = function () {
		for (let i in Action) {
			if (i.indexOf('EVENT') >= 0) {
				this.action.on(Action[i], (function (self, method) {
					return function (err, data) {
						if (self[method]) {
							if (method !== "_redo" && method !== "_undo") {
								self.redoBuffer = [];
							}
							self[method](data);
						}
					}.bind(self);
				}(this, '_' + Action[i])));
			}
		}
	};

	Store.prototype._init = function (canvas) {
		// init application
		this.app_ = new pc.Application(canvas, {
			mouse: new pc.Mouse(canvas),
			touch: !!('ontouchstart' in window) ? new pc.TouchDevice(canvas) : null,
			keyboard: new pc.Keyboard(window)
		});
		this.sceneManager = new upaint.SceneManager(this, this.action);
		this.scene_ = this.sceneManager.newScene();
		this.sceneManager.showFPS(true);
		this.sceneManager.showManipulator(true);
		this.action.loadModel("data/nakasis_naka.vrm");
		this._initKeyEvents();
	};

	Store.prototype._initKeyEvents = function () {
		let isControlPressed = false;
		this.app_.keyboard.on(pc.EVENT_KEYDOWN, function (event) {
			if (event.key === pc.KEY_CONTROL) {
				isControlPressed = true;
			}
			if (isControlPressed && event.key === pc.KEY_Z) {
				this.action.undo();
			}
			if (isControlPressed && event.key === pc.KEY_Y) {
				this.action.redo();
			}
		}.bind(this), this);
		this.app_.keyboard.on(pc.EVENT_KEYUP, function (event) {
			if (event.key === pc.KEY_CONTROL) {
				isControlPressed = false;
			}
		}.bind(this), this);
	};
	
	Store.prototype._undo = function () {
		console.log("_undo")
		let command = this.undoBuffer.pop();
		if (command) {
			command.undo();
			this.redoBuffer.push(command);
			this.emit(Store.EVENT_UNDO, null, command);
		}
	};

	Store.prototype._redo = function () {
		console.log("_redo")
		let command = this.redoBuffer.pop();
		if (command) {
			command.redo();
			this.undoBuffer.push(command);
			this.emit(Store.EVENT_REDO, null, command);
		}
	};

	Store.prototype._loadModel = function (url) {
		let io;
		if (url.indexOf('.vrm') > 0) {
			io = new upaint.ModelIO.VRM();
		} else {
			io = new upaint.ModelIO.GLTF();
		}
		io.on('loaded', function (err, data, json) {
			this.scene_.addModel(data.model);
			this.scene_.addAnimation(data.animation);

			this.emit(Store.EVENT_MODEL_ADD, null, data.model);

			let title = data.model.pcentity.name;
			// for VRM
			if (json.hasOwnProperty("extensions")
				&& json.extensions.hasOwnProperty('VRM'))
			{
				let meta = json.extensions.VRM.meta;
				title = meta.title;
			}
			this.currentContentKey = url;
			this.currentPropKey = "all";
			this._addTimelineContent({
				contentName : title,
				contentKey : this.currentContentKey
			});
			this._addTimelineProp({
				contentKey : this.currentContentKey,
				propName : "全身",
				propKey : this.currentPropKey
			});
		}.bind(this));
		io.load(url);
	};

	Store.prototype._orientationchange = function () {
		this.app_.resizeCanvas();
		this.emit(Store.EVENT_ORIENTATION_CHANGE, null);
		this.sceneManager.pick.update();
	};

	Store.prototype._resize = function () {
		this.app_.resizeCanvas();
		this.emit(Store.EVENT_RESIZE, null);
	};

	Store.prototype._changeCurrentFrame = function (frame) {
		this.currentFrame_ = frame;
	};

	Store.prototype._addTimelineContent = function (data) {
		let contentName = data.contentName;
		let contentKey = data.contentKey;
		this.timelineData_.contents.push({
			name : contentName,
			contentKey : contentKey,
			closed: true,
			color: "rgb(100, 100, 200)",
			propColor: "rgba(100, 100, 200, 0.7)",
			props : []
		});
		this.contentKeyToIndex[contentKey] = this.timelineData_.contents.length - 1;
	};

	Store.prototype._addTimelineProp = function (data) {
		let contentKey = data.contentKey;
		let propName = data.propName;
		let propKey = data.propKey;

		let content = this.getContent(contentKey);
		if (content) {
			content.props.push({
				name : propName,
				propKey : propKey,
				data : {}
			});
		}
	};
	
	// data = { frameData, contentKey, propKey, frame }
	Store.prototype._addKeyFrame = function (data) {
		if (!data.hasOwnProperty('contentKey')) {
			data.contentKey = this.currentContentKey;
		}
		if (!data.hasOwnProperty('propKey')) {
			data.propKey = this.currentPropKey;
		}
		if (!data.hasOwnProperty('frame')) {
			data.frame = this.currentFrame;
		}
		let prop = this.getProp(data.contentKey, data.propKey);
		console.log(data);
		if (prop) {
			prop.data[data.frame] = data.frameData;
			this.emit(Store.EVENT_KEYFRAME_ADD, null, data.frame, prop);
		}
	};
	
	Store.prototype._rotateEntity = function (data) {
		if (!data.hasOwnProperty('entity')) return;
		if (!data.hasOwnProperty('rot')) return;
		if (!data.hasOwnProperty('preRot')) return;
		this.undoBuffer.push({
			undo : function (rot) {
				this.entity.setLocalRotation(rot)
			}.bind(data, data.preRot), 
			redo : function (rot) {
				this.entity.setLocalRotation(rot)
			}.bind(data, data.rot)
		});
		data.entity.setLocalRotation(data.rot);
		this.emit(Store.EVENT_ROTATE, null, data);
	};

	Store.prototype._translateEntity = function (data) {
		if (!data.hasOwnProperty('entity')) return;
		if (!data.hasOwnProperty('pos')) return;
		if (!data.hasOwnProperty('prePos')) return;
		this.undoBuffer.push({
			undo : function (prePos) {
				this.entity.setPosition(prePos)
			}.bind(data, data.prePos), 
			redo : function (pos) {
				this.entity.setPosition(pos)
			}.bind(data, data.pos)
		});
		data.entity.setPosition(data.pos);
		this.emit(Store.EVENT_TRANSLATE, null, data);
	};

	Store.prototype._transformIK = function (data) {
		this.undoBuffer.push({
			undo : function (data) {
				let calculatedList = data;
				for (let i = calculatedList.length - 1; i >= 0; --i) {
					let calculated = calculatedList[i];
					calculated.entity.setLocalRotation(calculated.preRot);
				}
			}.bind(this, data), 
			redo : function (data) {
				let calculatedList = data;
				for (let i = calculatedList.length - 1; i >= 0; --i) {
					let calculated = calculatedList[i];
					calculated.entity.setLocalRotation(calculated.rot);
				}
			}.bind(this, data)
		});
		for (let i = data.length - 1; i >= 0; --i) {
			let calculated = data[i];
			calculated.entity.setLocalRotation(calculated.rot);
		}
		this.emit(Store.EVENT_TRANSFORM_IK, null, data);
	};

	Store.prototype._captureImage = function (data) {
		let canvas = pc.app.graphicsDevice.canvas;
		let captureFunc =  function() {
			pc.app.off('frameend', captureFunc);
			let bigData = canvas.toDataURL();
			let bigImage = new Image();
			bigImage.onload = function () {
				if (data.isNoResize) {
					let result = {
						image : bigImage,
						id : data.id
					}
					this.emit(Store.EVENT_IMAGE_CAPTURE, null, result);
				} else {
					let dummyCanvas = document.createElement("canvas");
					dummyCanvas.width = data.width;
					dummyCanvas.height = data.height;
					let ctx = dummyCanvas.getContext('2d');
					ctx.drawImage(bigImage, 0, 0, data.width, data.height);
					let smallData = dummyCanvas.toDataURL();
					let smallImage = new Image();
					smallImage.onload = function () {
						let result = {
							image : smallImage,
							id : data.id
						}
						this.emit(Store.EVENT_IMAGE_CAPTURE, null, result);
					}.bind(this);
					smallImage.src = smallData;
					bigImage = null;
				}
			}.bind(this);
			bigImage.src = bigData;
		}.bind(this);
		pc.app.on('frameend', captureFunc);
	};

	Store.prototype.getContentIndex = function (contentKey) {
		if (this.contentKeyToIndex.hasOwnProperty(contentKey)) {
			return this.contentKeyToIndex[contentKey];
		}
		return -1;
	};

	Store.prototype.getContent = function (contentKey) {
		if (this.contentKeyToIndex.hasOwnProperty(contentKey)) {
			return this.timelineData_.contents[this.contentKeyToIndex[contentKey]];
		}
		return null;
	};

	Store.prototype.getProp = function (contentKey, propKey) {
		let content = this.getContent(contentKey);
		if (content) {
			for (let i = 0; i < content.props.length; ++i) {
				if (content.props[i].propKey === propKey) {
					return content.props[i];
				}
			}
		}
		return null;
	};

	/**
	 * scene
	 */
	Object.defineProperty(Store.prototype, 'scene', {
		get: function () {
			return this.scene_;
		}
	});

	/**
	 * playcanvas application
	 */
	Object.defineProperty(Store.prototype, 'pcapp', {
		get: function () {
			return this.app_;
		}
	});

	/**
	 * current_frame
	 */
	Object.defineProperty(Store.prototype, 'currentFrame', {
		get: function () {
			return this.currentFrame_;
		}
	});

	/**
	 * timeline_data
	 */
	Object.defineProperty(Store.prototype, 'timelineData', {
		get: function () {
			return this.timelineData_;
		}
	});

	Store.EVENT_UNDO = "undo"
	Store.EVENT_REDO = "redo"
	Store.EVENT_RESIZE = "resize"
	Store.EVENT_ORIENTATION_CHANGE = "orientation_change"
	Store.EVENT_KEYFRAME_ADD = "add_keyframe"
	Store.EVENT_MODEL_ADD = "add_model"
	Store.EVENT_IMAGE_CAPTURE = "image_capture"
	Store.EVENT_TRANSLATE = "translate"
	Store.EVENT_TRANSFORM_IK = "transform_ik"
	Store.EVENT_ROTATE = "rotate"
	upaint.Store = Store;

}());
