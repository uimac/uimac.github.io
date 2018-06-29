(function () {
	"use strict";
	
	let GUI = function () {
		EventEmitter.call(this);

		this.dock_ = new upaint.Dock();
		let dockView = this.dock_.layout.root.getItemsById('dock_view')[0];
		let dockTimeline = this.dock_.layout.root.getItemsById('dock_timeline')[0];
		
		this.canvas_ = document.createElement('canvas');
		this.canvas_.style.width = "100%";
		this.canvas_.style.height = "100%";
		dockView.element.children().append(this.canvas_);
		this.timeline_ = document.createElement('div');
		this.timeline_.innerText = "timeline"
		dockTimeline.element.children().append(this.timeline_);
	};
	GUI.prototype = Object.create(EventEmitter.prototype);


	GUI.prototype.destroy = function () {};

	Object.defineProperty(GUI.prototype, 'dock', {
		get: function () {
			return this.dock_;
		}
	});

	Object.defineProperty(GUI.prototype, 'canvas', {
		get: function () {
			return this.canvas_;
		}
	});

	Object.defineProperty(GUI.prototype, 'timeline', {
		get: function () {
			return this.timeline_;
		}
	});
	window.upaint.GUI = GUI;

}());