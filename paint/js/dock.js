(function () {
	"use strict";

	let config = {}

	function initConfig() {
		config = {
			settings: {
				//reorderEnabled: false,
				showMaximiseIcon : false,
				//hasHeaders : false
			},
			dimensions: {
				minItemHeight: 56 - 20  // for menu
			}, 
			content: [{
				type: 'column',
				content: [{
					header : { show: false, popout : false },
					id: 'dock_menu',
					title: "Menu",
					type: 'component',
					isClosable : false,
					height: 40,
					componentName: 'main'
				}, {
					type: 'row',
					height: document.body.clientHeight - 200,
					content : [/*{
						header : { popout : false },
						id: 'dock_tool',
						title: "Tool",
						type: 'component',
						isClosable : false,
						width: 56,
						componentName: 'main'
					}, */{
						header : { popout : false, maximise : true },
						id: 'dock_view',
						title: "View",
						type: 'component',
						isClosable : false,
						width: document.body.clientWidth - 180,
						componentName: 'main'
					}/*, {
						header : { popout : false },
						id: 'dock_shape',
						title: "Shape",
						type: 'component',
						isClosable : false,
						width: 180,
						componentName: 'main'
					}*/]
				}, {
					header : { popout : false, maximise : true },
					id: 'dock_timeline',
					title: "Timeline",
					type: 'component',
					isClosable : false,
					height: 150,
					componentName: 'main'
				}]
			}]
		};
	}

	let Dock = function () {
		EventEmitter.call(this);

		initConfig();

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