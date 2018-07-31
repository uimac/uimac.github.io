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
		this.scene = null;

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
		this.scene = this.sceneManager.newScene();
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
		let command = this.undoBuffer.pop();
		if (command) {
			command.undo();
			this.redoBuffer.push(command);
		}
	};

	Store.prototype._redo = function () {
		console.log("_redo")
		let command = this.redoBuffer.pop();
		if (command) {
			command.redo();
			this.undoBuffer.push(command);
		}
	};

	Store.prototype._loadModel = function (url) {
		let io = new upaint.ModelIO.VRM();
		io.on('loaded', function (err, data, json) {
			this.scene.addModel(data.model);
			this.scene.addAnimation(data.animation);

			let meta = json.extensions.VRM.meta;
			this.currentContentKey = url;
			this.currentPropKey = "all";
			this._addTimelineContent({
				contentName : meta.title,
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
		this.sceneManager.pick.update();
	};

	Store.prototype._resize = function () {
		this.app_.resizeCanvas();
		this.sceneManager.pick.update();
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
			console.log(content)
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
				this.entity.setRotation(rot)
			}.bind(data, data.preRot), 
			redo : function (rot) {
				this.entity.setRotation(rot)
			}.bind(data, data.rot)
		});
		data.entity.setRotation(data.rot);
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

	Store.EVENT_KEYFRAME_ADD = "add_keyframe"
	upaint.Store = Store;

}());
