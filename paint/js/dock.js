(function () {
	"use strict";

	let config = {
		settings: {
			showMaximiseIcon : false
		},
		content: [{
			type: 'column',
			content: [{
				id: 'dock_view',
				title: "View",
				type: 'component',
				isClosable : false,
				height: 800,
				componentName: 'main',
				showPopoutIcon: false,
				componentState: {  }
			}, {
				id: 'dock_timeline',
				title: "Timeline",
				type: 'component',
				height: 300,
				componentName: 'main',
				componentState: { label: 'C' }
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
		this.layout_.init();

		// this.layout_.on('stateChanged', function () {
		// 	let state = JSON.stringify(this.layout.toConfig());
		// 	localStorage.setItem('upaint.layout', state);
		// }.bind(this));
	};
	Dock.prototype = Object.create(EventEmitter.prototype);

	Object.defineProperty(Dock.prototype, 'layout', {
		get: function () {
			return this.layout_;
		}
	});

	window.upaint.Dock = Dock;
}());