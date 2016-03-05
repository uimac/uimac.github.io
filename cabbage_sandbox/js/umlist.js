/*jslint devel:true*/
(function () {
	var UMTimeline;

	UMList = function (div, setting) {
		var content,
			container,
			name,
			type,
			i;

		for (i = 0; i < setting.contents.length; i = i + 1) {
			content = setting.contents[i];
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
			div.appendChild(container);
		}
	}

	function init() {
		var setting = {
			contents : [
					{
						name : "test",
						type : "mesh"
					},
					{
						type : "mesh",
						name : "point"
					},
					{
						name : "test3",
						type : "curve"
					},
					{
						name : "hogehoge",
						type : "stroke"
					}
				]
			},
			div = document.getElementById('listview');

		new UMList(div, setting);
	}

	window.umlist = {};
	window.umlist.UMList = UMList;
	window.umlist.init = init;
}());
