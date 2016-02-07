/*jslint devel:true */
/*global ace, brython */

(function (umgl, umeditor, umtimeline, umlayout) {
	"use strict";

	window.onload = function () {
		umgl.init();
		umeditor.init();
		umtimeline.init();
		umlayout.init();
	};

	window.onunload = function () {
		umgl.dispose();
		umeditor.dispose();
		umtimeline.dispose();
		umlayout.dispose();
	};

}(window.umgl, window.umeditor, window.umtimeline, window.umlayout));
