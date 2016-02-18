/*jslint devel:true */
/*global ace, brython */

(function (umgl) {
	"use strict";

	window.addEventListener('load', function () {
		umgl.init();
	});

	window.addEventListener('unload', function () {
		umgl.dispose();
	});

}(window.umgl));
