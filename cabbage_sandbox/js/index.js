/*jslint devel:true */
/*global ace */

(function (umgl, umeditor, umtimeline, umlist, umlayout) {
	"use strict";

	window.start_time = new Date();
	window.is_auto_mode = false;

	window.addEventListener('load', function () {
		umgl.init();
		umeditor.init();
		umtimeline.init();
		umlist.init();
		umlayout.init();
	});

	window.addEventListener('unload', function () {
		umgl.dispose();
		umeditor.dispose();
		umtimeline.dispose();
		umlist.dispose();
		umlayout.dispose();
	});

}(window.umgl, window.umeditor, window.umtimeline, window.umlist, window.umlayout));
