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

	Action.prototype.undo = function () {
		this.emit(Action.EVENT_UNDO, null);
	};

	Action.prototype.redo = function () {
		this.emit(Action.EVENT_REDO, null);
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
	
	Action.prototype.rotateEntity = function (data) {
		this.emit(Action.EVENT_ROTATE_ENTITY, null, data);
	};
	
	Action.prototype.translateEntity = function (data) {
		this.emit(Action.EVENT_TRANSLATE_ENTITY, null, data);
	};

	Action.prototype.captureImage = function (data) {
		this.emit(Action.EVENT_CAPTURE_IMAGE, null, data);
	};

	// Action.prototype.addBlendShape = function (data) {
	// 	this.emit(Action.EVENT_ADD_BLENDSHAPE, null, data);
	// }

	Action.EVENT_INIT = "init";
	Action.EVENT_RESIZE = "resize";
	Action.EVENT_UNDO = "undo";
	Action.EVENT_REDO = "redo";
	Action.EVENT_ORIENTATION_CHANGE = "orientationchange";
	Action.EVENT_ADD_KEYFRAME = "addKeyFrame";
	Action.EVENT_LOAD_MODEL = "loadModel";
	Action.EVENT_CHANGE_CURRENT_FRAME = "changeCurrentFrame";
	Action.EVENT_ROTATE_ENTITY = "rotateEntity";
	Action.EVENT_TRANSLATE_ENTITY = "translateEntity";
	Action.EVENT_CAPTURE_IMAGE = "captureImage";
	//Action.EVENT_ADD_BLENDSHAPE = "addBlendShape";
	upaint.Action = Action;

}());
