/*jslint devel:true */
/*global ace */

(function (umgl, umeditor, umtimeline, umlist, umlayout, UMNodeEditor) {
	"use strict";

	window.start_time = new Date();
	window.is_auto_mode = false;

	let node_editor = null;

	window.addEventListener('load', function () {
		umgl.init();
		umeditor.init();
		node_editor = new UMNodeEditor();
		umlist.init();
		umlayout.init();
	});

	window.addEventListener('unload', function () {
		umgl.dispose();
		umeditor.dispose();
		node_editor.dispose();
		umlist.dispose();
		umlayout.dispose();
	});

}(window.umgl, window.umeditor, window.umtimeline, window.umlist, window.umlayout, window.UMNodeEditor));
