/*jslint devel:true */
/*global ace, brython */

(function (umgl, umeditor, umtimeline) {
	"use strict";

	window.onload = function () {
		umgl.init();
		umeditor.init();
		umtimeline.init();
	};

	window.onunload = function () {
		umgl.dispose();
		umeditor.dispose();
		umtimeline.dispose();
	};

}(window.umgl, window.umeditor, window.umtimeline));
