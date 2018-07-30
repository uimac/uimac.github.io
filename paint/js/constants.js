(function () {
	"use strict";

	upaint.Constants = {
		ClearColor : new pc.Color(0, 0, 0, 0),
		HandleColor : new pc.Color(0.8, 0.5, 0.4, 0.4).toString(true),
		InitialGravity : [0, -9.8, 0],
		GridSize : 20,
		GridSpan : 1,
		GridColor : new pc.Color(0.3, 0.3, 0.3, 1),
		AxisX : new pc.Vec3(1, 0, 0),
		AxisY : new pc.Vec3(0, 1, 0),
		AxisZ : new pc.Vec3(0, 0, 1)
	};
	
}());