/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
    var json = "";

    function hasprop (json, str) {
        return json.hasOwnProperty(str);
    };
            
    function load_mesh(json, node) {
        var i,
            k,
            mesh,
            prim,
            attrs,
            attr,
            accessor_name,
            material_name,
            mode,
            mesh_name;

        if (hasprop(json, 'meshes') && hasprop(node, 'meshes')) {
            for (i = 0; i < node.meshes.length; i = i + 1) {
                mesh_name = node.meshes[i];
                if (hasprop(json.meshes, mesh_name)) {
                    mesh = json.meshes[mesh_name];
                    if (hasprop(mesh, 'primitives')) {
                        for (k = 0; k < mesh.primitives.length; k = k + 1) {
                            prim = mesh.primitives[k];
                            if (hasprop(prim, 'attributes')) {
                                attrs = prim.attributes;
                                for (attr in attrs) {
                                    if (hasprop(attrs, attr)) {
                                        accessor_name = attrs[attr];
                                    }
                                }
                            }
                            if (hasprop(prim, 'indices')) {
                                accessor_name = prim.indices;
                            }
                            if (hasprop(prim, 'material')) {
                                material_name = prim.material;
                            }
                            if (hasprop(prim, 'mode')) {
                                mode = prim.mode;
                            }
                        }
                    }
                }
            }
        }
    }

	function load(text) {
        var i,
            k,
            scene,
            node,
            node_name,
            mesh,   
            json = JSON.parse(text);

        if (hasprop(json, 'scene') && hasprop(json, 'scenes') && hasprop(json, 'nodes') && hasprop(json, 'accessors')) {
            if (hasprop(json.scenes, json.scene)) {
                scene = json.scenes[json.scene];
                if (hasprop(scene, 'nodes')) {
                    for (i = 0; i < scene.nodes.length; i = i + 1) {
                        node_name = scene.nodes[i];
                        if (hasprop(scene.nodes, node_name)) {
                            node = scene.nodes[node_name];
                            load_mesh(json, node);
                        }
                    }
                }
            }
        }
    }

	window.umgltf = {};
	window.umgltf.load = load;

}(window.ummath));
