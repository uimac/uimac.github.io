/*jslint devel:true*/
/*global Float32Array */
(function () {

	function init() {
		// Convert a div to a dock manager.  Panels can then be docked on to it
		var dockDiv = document.getElementById("dock_manager");
		var dockManager = new dockspawn.DockManager(dockDiv);
		dockManager.initialize();

		// Let the dock manager element fill in the entire screen
		var onResized = function(e) {
			dockManager.resize(
				window.innerWidth - (dockDiv.clientLeft + dockDiv.offsetLeft),
				window.innerHeight - (dockDiv.clientTop + dockDiv.offsetTop));
		}
		window.addEventListener('resize', onResized);
		onResized(null);

		// Convert existing elements on the page into "Panels".
		// They can then be docked on to the dock manager
		// Panels get a titlebar and a close button, and can also be
		// converted to a floating dialog box which can be dragged / resized
		var setting_panel = new dockspawn.PanelContainer(document.getElementById("settingview"), dockManager);
		var tool_panel = new dockspawn.PanelContainer(document.getElementById("toolview"), dockManager);
		var timeline_panel = new dockspawn.PanelContainer(document.getElementById("timeline"), dockManager);
		var main_panel = new dockspawn.PanelContainer(document.getElementById("mainview"), dockManager);

		// Dock the panels on the dock manager
		var documentNode = dockManager.context.model.documentManagerNode;
		var timelineNode = dockManager.dockDown(documentNode, timeline_panel, 0.25);
		var toolNode = dockManager.dockLeft(documentNode, tool_panel);
		var toolNode = dockManager.dockRight(documentNode, setting_panel);
		var mainNode = dockManager.dockFill(documentNode, main_panel);
	}

	window.umlayout = {};
	window.umlayout.init = init;

}());
