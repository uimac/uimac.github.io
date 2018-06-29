(function () {
	"use strict";

	let Model = function () {
		EventEmitter.call(this);
		this.pcentity_ = new pc.Entity("Model");

	};
	Model.prototype = Object.create(EventEmitter.prototype);

	/**
	 * playcanvas entity
	 */
	Object.defineProperty(Model.prototype, 'pcentity', {
		get: function () {
			return this.pcentity_;
		}
	});

	window.upaint.Model = Model;

}());