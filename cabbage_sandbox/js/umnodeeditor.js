/*jslint devel:true*/
/*global Float32Array */
(function () {
    "use strict";

    let UMNodeEditor;

    UMNodeEditor = function () {
        this.graph = new LGraph();

        this.canvas = new LGraphCanvas("#node_editor", this.graph);
        
        let node_const = LiteGraph.createNode("basic/const");
        node_const.pos = [200,200];
        this.graph.add(node_const);
        node_const.setValue(4.5);
        
        let node_watch = LiteGraph.createNode("basic/watch");
        node_watch.pos = [700,200];
        this.graph.add(node_watch);
        
        node_const.connect(0, node_watch, 0 );
        
        this.graph.start();

        this.auto_resize_handle = setInterval(() => {
            let canvas = document.getElementById('node_editor');
            let nodeview = document.getElementById('nodeview');
            if (nodeview.clientWidth !== canvas.clientWidth || nodeview.clientHeight !== canvas.clientHeight) {
                this.resize();
            }
        }, 30);
    };

    UMNodeEditor.prototype.resize = function () {
		let canvas = document.getElementById('node_editor'),
			nodeview = document.getElementById('nodeview');
		canvas.width = nodeview.clientWidth;
        canvas.height = nodeview.clientHeight;
        this.canvas.draw(true, true);
    };
    
    UMNodeEditor.prototype.dispose = function () {
        
    };

    window.UMNodeEditor = UMNodeEditor;

}());
