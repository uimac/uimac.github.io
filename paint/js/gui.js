(function () {
	"use strict";
	
	let GUI = function (store, action) {
		EventEmitter.call(this);

		this.onReize = function () {
			action.resize();
		};
		this.onOrientationChange = function () {
			action.orientationchange();
		};

		this.dock_ = new upaint.Dock();
		this.dock_.on("initialize", function (err) {
			let dockView = this.dock_.layout.root.getItemsById('dock_view')[0];
			if (dockView) {
				this.canvas_ = document.createElement('canvas');
				this.canvas_.style.width = "100%";
				this.canvas_.style.height = "100%";
				this.canvas_.style.background = "linear-gradient(white, rgb(100, 110, 140))"
				dockView.element.children().append(this.canvas_);
				dockView.container.on("resize", this.onReize);
			}
			
			let dockTimeline = this.dock_.layout.root.getItemsById('dock_timeline')[0];
			if (dockTimeline && !this.timeline_) {
				this.timeline_ = new upaint.GUITimeline(store, action);
				dockTimeline.element.children().append(this.timeline_.rootElement);
			}

			let dockMenu = this.dock_.layout.root.getItemsById('dock_menu')[0];
			if (dockMenu && !this.menu_) {
				this.menu_ = new upaint.GUIMenu(store, action);
				dockMenu.element.children().append(this.menu_.rootElement);
			}
			
			action.init(this.canvas_);
		}.bind(this));

		this.dock_.on("reset", function (err, id) {
			let item = this.dock_.layout.root.getItemsById(id)[0];
			if (item) {
				if (id === "dock_view") {
					item.element.children().append(this.canvas_);
					item.container.on("resize", this.onReize);
					this.onReize();
				} else if (id === "dock_timeline") {
					item.element.children().append(this.timeline_.rootElement);
				}
			}
		}.bind(this));

		this.onTouchMove = function (e) {
			e.preventDefault();
		};
		document.addEventListener("touchmove", this.onTouchMove, { passive: false });
		window.addEventListener('resize', this.onReize);
		window.addEventListener('orientationchange', this.onOrientationChange);
		
		this.dock_.init();
	};
	GUI.prototype = Object.create(EventEmitter.prototype);

	GUI.prototype.destroy = function () {
		document.removeEventListener("touchmove", this.onTouchMove);
		window.removeEventListener('resize', this.onReize);
		window.removeEventListener('orientationchange', this.onOrientationChange);
	};

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