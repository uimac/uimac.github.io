/*jslint devel:true*/
(function () {
	"use strict";
	var UMList;

	UMList = function (div) {
		this.setting = { contents : [] };
		this.div = div;
		this.update();
	};

	UMList.prototype.update = function () {
		var content,
			container,
			name,
			type,
			i;

		this.div.innerHTML = "";
		if (!this.setting.contents) {
			return;
		}
		for (i = 0; i < this.setting.contents.length; i = i + 1) {
			content = this.setting.contents[i];
			container = document.createElement('div');
			name = document.createElement('div');
			type = document.createElement('div');
			container.style.width = "100%";
			container.style.minWidth = "80px;"
			container.style.height = "25px"
			container.style.padding = "2px";
			container.style.fontSize = "11px";
			container.style.color = "rgb(220, 220, 220)";
			container.style.overflow = "hidden";
			if (i % 2 == 0) {
				container.style.backgroundColor = "rgb(50, 50, 50)";
			} else {
				container.style.backgroundColor = "rgb(65, 65, 65)";
			}

			name.innerHTML = content.name;
			type.innerHTML = content.type;

			name.style.float = "left";
			name.style.minWidth = "50px"
			type.style.color = "rgba(220, 220, 220, 0.2)"
			type.style.float = "right";
			type.style.minWidth = "10px";
			type.style.position = "absolute";
			type.style.right = "0px"

			container.appendChild(name);
			container.appendChild(type);
			this.div.appendChild(container);
		}
	}

	UMList.prototype.add = function (name, type) {
		this.setting.contents.push({
			name : name,
			type : type
		});
	}

	function init() {
		var div = document.getElementById('listview');
		window.umlist.UMList = new UMList(div);
	}

	window.umlist = {};
	window.umlist.init = init;
}());
