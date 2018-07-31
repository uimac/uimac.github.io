(function () {
	"use strict";

	// flux pattern

	let Action = function () {
		EventEmitter.call(this);
	};
	Action.prototype = Object.create(EventEmitter.prototype);

	Action.prototype.init = function (data) {
		this.emit(Action.EVENT_INIT, null, data);
	};

	Action.prototype.resize = function () {
		this.emit(Action.EVENT_RESIZE, null);
	};

	Action.prototype.orientationchange = function () {
		this.emit(Action.EVENT_ORIENTATION_CHANGE, null);
	};

	Action.prototype.addKeyFrame = function (data) {
		this.emit(Action.EVENT_ADD_KEYFRAME, null, data);
	};
	
	Action.prototype.loadModel = function (data) {
		this.emit(Action.EVENT_LOAD_MODEL, null, data);
	};
	
	Action.prototype.changeCurrentFrame = function (data) {
		this.emit(Action.EVENT_CHANGE_CURRENT_FRAME, null, data);
	};

	Action.EVENT_INIT = "init";
	Action.EVENT_RESIZE = "resize";
	Action.EVENT_ORIENTATION_CHANGE = "orientationchange";
	Action.EVENT_ADD_KEYFRAME = "addKeyFrame";
	Action.EVENT_LOAD_MODEL = "loadModel";
	Action.EVENT_CHANGE_CURRENT_FRAME = "changeCurrentFrame";
	upaint.Action = Action;

}());
