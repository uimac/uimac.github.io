(function () {
	"use strict";

	let config = {
		settings: {
			showMaximiseIcon : false
		},
		content: [{
			type: 'row',
			content: [{
				type: 'column',
				content: [{
					header : { popout : false },
					id: 'dock_view',
					title: "View",
					type: 'component',
					isClosable : false,
					height: 900,
					componentName: 'main'
				}, {
					header : { popout : false },
					id: 'dock_timeline',
					title: "Timeline",
					type: 'component',
					isClosable : false,
					height: 150,
					componentName: 'main'
				}]
			}]
		}]
	};

	let Dock = function () {
		EventEmitter.call(this);

		this.layout_ = new GoldenLayout(config);
		// let savedState = localStorage.getItem('upaint.layout');
		// if (savedState !== null) {
		// 	layout = new GoldenLayout(JSON.parse(savedState));
		// }
		this.layout_.registerComponent('main', function (container, componentState) {
			//container.getElement().html('<h2>' + componentState.label + '</h2>');
		});
		this.layout_.on("initialised", function (err) {
			this.emit("initialize", null);
			console.log(this.layout.toConfig());
		}.bind(this));

		this.layout_.on('windowOpened', function (win) {
			let config = win.toConfig();
			console.log(this.layout.toConfig());
		}.bind(this));

		this.layout_.on('windowClosed', function (win) {
			//console.log(this.layout.toConfig());
			//let state = JSON.stringify(this.layout.toConfig());
			let config = win.toConfig();
			if (config.content[0]) {
				this.emit("reset", null, config.content[0].id);
			}
			//localStorage.setItem('upaint.layout', state);
		}.bind(this));
	};
	Dock.prototype = Object.create(EventEmitter.prototype);

	Dock.prototype.init = function () {
		this.layout_.init();
	};
	
	Object.defineProperty(Dock.prototype, 'layout', {
		get: function () {
			return this.layout_;
		}
	});

	Dock.EVENT_INITIALIZE = "initialize";
	window.upaint.Dock = Dock;
}());