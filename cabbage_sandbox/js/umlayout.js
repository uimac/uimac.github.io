/*jslint devel:true*/
/*global Float32Array */
(function () {
	var UMLayout,
		panels = {};

	UMLayout = function (setting) {
		this.setting = setting;
		this.splitterSize = 2;
		this.layout(null, setting);
		this.resize();
		this.relocate();
	};

	function fitPosition(parent, setting, target) {
		var i,
			leftSum = 0,
			topSum = 0;
		if (setting.hasOwnProperty('position')) {
			target.style[setting.position] = "0px";
		} else {
			if (parent.direction === 'vertical') {
				for (i = 0; i < parent.contents.length; i = i + 1) {
					if (parent.contents[i].id === setting.id) {
						break;
					}
					leftSum = leftSum + parent.contents[i].currentSize;
				}
				target.style.left = leftSum + "px";
			} else {
				for (i = 0; i < parent.contents.length; i = i + 1) {
					if (parent.contents[i].id === setting.id) {
						break;
					}
					topSum = topSum + parent.contents[i].currentSize;
				}
				console.log(target.id, topSum);
				target.style.top = topSum + "px";
			}
		}
	};

	UMLayout.prototype.relocate = function () {
		var panel,
			id,
			setting,
			parent,
			direction,
			size;

		for (id in panels) {
			panel = document.getElementById(id);
			setting = panels[id].setting;
			direction = panels[id].direction;
			parent = panels[id].parent;

			fitPosition(parent, setting, panel);
		}
	};

	UMLayout.prototype.resize = function () {
		var panel,
			id,
			setting,
			parent,
			direction,
			size;

		for (id in panels) {
			panel = document.getElementById(id);
			setting = panels[id].setting;
			direction = panels[id].direction;
			parent = panels[id].parent;
			if (setting.hasOwnProperty('size')) {
				size = setting.size;
				if (direction === 'horizontal') {
					if (size.indexOf('px') > 0 && Number(size.split('px').join('')) < 0) {
						size = (window.innerHeight + Number(size.split('px').join(''))) + "px";
					}
					panel.style.height = size;
					setting.currentSize = Number(size.split('px').join(''));
					if (document.getElementById(parent.id).style.width) {
						panel.style.width = document.getElementById(parent.id).style.width;
					} else {
						panel.style.width = "100%";
					}
				} else {
					if (size.indexOf('px') > 0 && Number(size.split('px').join('')) < 0) {
						size = (window.innerWidth + Number(size.split('px').join(''))) + "px";
					}
					panel.style.width = size;
					setting.currentSize = Number(size.split('px').join(''));
					if (document.getElementById(parent.id).style.height) {
						panel.style.height = document.getElementById(parent.id).style.height;
					} else {
						panel.style.height = "100%";
					}
				}
			}
		}
	};

	UMLayout.prototype.layout = function (parent, setting, i) {
		var i,
			k,
			contentElem,
			container,
			panel,
			splitter,
			size;

		if (parent) {
			container = document.getElementById(parent.id);
			if (setting.hasOwnProperty('id')) {
				panel = document.createElement('div');
				panel.id = setting.id + "_panel__";
				panel.style.position = "absolute";
				panels[setting.id + "_panel__"] = {
					direction : parent.direction,
					parent : parent,
					setting : setting
				};

				contentElem = document.getElementById(setting.id);
				contentElem.parentNode.removeChild(contentElem);
				panel.appendChild(contentElem);
				container.appendChild(panel);
			}
			if (setting.hasOwnProperty('splitter')) {
				splitter = document.createElement('div');
				splitter.id = parent.id + "_splitter__" + i;
				splitter.style.position = "absolute";
				splitter.style.backgroundColor = this.setting.color;
				if (parent.direction === 'horizontal') {
					splitter.style.width = "100%";
					splitter.style.height = setting.splitter;
					splitter.className = "ns_splitter";
				} else {
					splitter.style.width = setting.splitter;
					splitter.style.height = "100%";
					splitter.className = "ew_splitter";
				}
				setting.id = splitter.id;
				panels[splitter.id] = {
					direction : parent.direction,
					parent : parent,
					setting : setting
				};
				container.appendChild(splitter);
			}
		}

		if (setting.hasOwnProperty('contents')) {
			for (i = 0; i < setting.contents.length; i = i + 1) {
				this.layout(setting, setting.contents[i], i);
			}
		}
	};

	function init() {
		var setting = {
			id : 'layout',
			direction : 'horizontal',
			color : 'black',
			contents : [
				{
					id : 'menuview',
					position : 'top',
					size : "40px"
				},
				{
					size : "2px",
					splitter : "2px"
				},
				{
					id : 'layout2',
					size : "-244px",
					direction : 'vertical',
					contents : [
						{
							id : 'toolview',
							position : 'left',
							size : "45px"
						},
						{
							size : "2px",
							splitter : "2px"
						},
						{
							id : 'mainview',
							size : "-94px"
						},
						{
							size : "2px",
							splitter : "2px"
						},
						{
							id : 'settingview',
							position : 'right',
							size : "45px"
						}
					]
				},
				{
					size : "2px",
					splitter : "2px"
				},
				{
					id : 'timeline',
					size : "200px"
				}]
			},
			layout = new UMLayout(setting);

		window.addEventListener('resize', function () {
			layout.resize();
			layout.relocate();
		});
	}

	window.umlayout = {};
	window.umlayout.init = init;
	window.umlayout.UMLayout = UMLayout;

}());
