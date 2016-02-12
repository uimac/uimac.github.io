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
				//console.log(target.id, topSum);
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

	function toNumber(s) {
		return Number(s.split("px").join(""));
	}

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
					if (size.indexOf('px') > 0 && toNumber(size) < 0) {
						size = (window.innerHeight + toNumber(size)) + "px";
					}
					panel.style.height = size;
					setting.currentSize = toNumber(size);
					if (document.getElementById(parent.id).style.width) {
						panel.style.width = document.getElementById(parent.id).style.width;
					} else {
						panel.style.width = "100%";
					}
				} else {
					if (size.indexOf('px') > 0 && toNumber(size) < 0) {
						size = (window.innerWidth + toNumber(size)) + "px";
					}
					panel.style.width = size;
					setting.currentSize = toNumber(size);
					if (document.getElementById(parent.id).style.height) {
						panel.style.height = document.getElementById(parent.id).style.height;
					} else {
						panel.style.height = "100%";
					}
				}
			}
		}
	};

	UMLayout.prototype.setSplitBehavior = function (contents, splitter, i) {
		var prePos = 0,
			isLeftDown = false;

		splitter.addEventListener('mousedown', function (ev) {
			if (ev.button === 0) {
				isLeftDown = true;
			}
		});
		window.addEventListener('mousemove', function (ev) {
			var s,
				ca,
				cb,
				sa = null,
				sb = null,
				rect,
				mv;
			if (isLeftDown) {
				if (splitter.className === "ns_splitter") {
					rect = splitter.getBoundingClientRect();
					mv = ev.clientY - rect.top;
				} else {
					rect = splitter.getBoundingClientRect();
					mv = ev.clientX - rect.left;
				}
				ca = contents[i-1];
				cb = contents[i+1];
				if (ca.hasOwnProperty("size")) {
					s = toNumber(ca.size);
					sa = s + mv;
					if (ca.hasOwnProperty("minSize") && sa <= toNumber(ca.minSize)) {
						return;
					}
				}
				if (cb.hasOwnProperty("size")) {
					s = toNumber(cb.size);
					sb = s - mv;
					if (cb.hasOwnProperty("minSize") && sb <= toNumber(cb.minSize)) {
						return;
					}
				}
				if (sa !== null && sb !== null) {
					contents[i-1].size = String(sa) + "px";
					contents[i-1].currentSize = sa;
					contents[i+1].size = String(sb) + "px";
					contents[i+1].currentSize = sb;
					this.resize();
					this.relocate();
				}
			}
		}.bind(this));
		window.addEventListener('mouseup', function (ev) {
			isLeftDown = false;
		});
	}

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
				this.setSplitBehavior(parent.contents, splitter, i);
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
			color : 'rgb(35, 35, 35)',
			contents : [
				{
					id : 'menuview',
					position : 'top',
					size : "40px",
					minSize : "40px"
				},
				{
					size : "3px",
					splitter : "3px"
				},
				{
					id : 'layout2',
					size : "-246px",
					direction : 'vertical',
					contents : [
						{
							id : 'toolview',
							position : 'left',
							size : "42px",
							minSize : "42px"
						},
						{
							size : "3px",
							splitter : "3px"
						},
						{
							id : 'mainview',
							size : "-90px"
						},
						{
							size : "3px",
							splitter : "3px"
						},
						{
							id : 'settingview',
							position : 'right',
							size : "42px",
							minSize : "42px"
						}
					]
				},
				{
					size : "3px",
					splitter : "3px"
				},
				{
					id : 'timeline',
					size : "200px",
					minSize : "50px"
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
