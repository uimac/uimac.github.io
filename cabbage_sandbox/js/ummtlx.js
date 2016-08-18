/*jslint devel:true nomen:true */
(function () {
	"use strict";
	var UMMtlx;

	function load(dom) {
		var i,
			k,
			n,
			m,
			materials = {},
			material_base = {
				diffuse : [0.7, 0.7, 0.7, 1.0],
				specular : [0.9, 0.9, 0.9, 1.0],
				ambient : [0.3, 0.3, 0.3, 1.0],
				diffuse_texture : ""
			},
			material,
			node,
			cnode,
			onode,
			name,
			cname,
			lname,
			sname,
			oname,
			gname,
			mat,
			look,
			shader,
			opgraph,
			materialassign,
			collection,
			materialx = {
				look : {},
				material : {},
				shader : {},
				opgraph : {},
				collection : {}
			},
			doc = dom.documentElement;

		if (!doc.hasChildNodes()) {
			return null;
		}
		for (i = 0; i < doc.childNodes.length; ++i) {
			node = doc.childNodes[i];
			if (node.nodeType === 1 && node.hasAttribute("name")) {
				name = node.getAttribute("name");
				if (node.nodeName === "look") {
					materialx.look[name] = node;
				} else if (node.nodeName === "material") {
					materialx.material[name] = node;
				} else if (node.nodeName === "shader") {
					materialx.shader[name] = node;
				} else if (node.nodeName === "opgraph") {
					materialx.opgraph[name] = node;
				} else if (node.nodeName === "collection") {
					materialx.collection[name] = node;
				}
			}
		}
		for (i in materialx.look) {
			if (materialx.look.hasOwnProperty(i)) {
				look = materialx.look[i];
				for (k = 0; k < look.childNodes.length; ++k) {
					node = look.childNodes[k];
					if (node.nodeType === 1 && node.nodeName === "materialassign" &&
						node.hasAttribute("name") &&
						node.hasAttribute("collection")) {
						materialassign = node;
						name = sname = lname = cname = oname = gname = "";
						// new material
						material = JSON.parse(JSON.stringify(material_base));

						// collection
						cname = materialassign.getAttribute("collection");
						if (materialx.collection.hasOwnProperty(cname)) {
							collection = materialx.collection[cname];
							for (n = 0; n < collection.childNodes.length; ++n) {
								node = collection.childNodes[n];
								if (node.nodeName === "collectionadd") {
									materials[node.getAttribute("geom")] = material;
								}
							}
						}
						// material -> shaderref -> shader -> input ->
						// -> opgraph ->image
						lname = materialassign.getAttribute("name");
						if (materialx.material.hasOwnProperty(lname)) {
							mat = materialx.material[lname];
							for (n = 0; n < mat.childNodes.length; ++n) {
								node = mat.childNodes[n];
								if (node.nodeType === 1 && node.nodeName === "shaderref") {
									sname = node.getAttribute("name");
								}
							}
						}
						if (materialx.shader.hasOwnProperty(sname)) {
							shader = materialx.shader[sname];
							for (n = 0; n < shader.childNodes.length; ++n) {
								node = shader.childNodes[n];
								if (node.nodeType === 1 && node.nodeName === "input" &&
									node.hasAttribute("opgraph") &&
									node.hasAttribute("graphoutput")) {
										gname = node.getAttribute("graphoutput");
										oname = node.getAttribute("opgraph");
								}
							}
						}
						if (materialx.opgraph.hasOwnProperty(oname)) {
							opgraph = materialx.opgraph[oname];
							for (n = 0; n < opgraph.childNodes.length; ++n) {
								node = opgraph.childNodes[n];
								if (node.nodeType === 1 && node.nodeName === "output" && gname === node.getAttribute("name")) {
									onode = node;
								}
							}
							if (onode) {
								for (n = 0; n < opgraph.childNodes.length; ++n) {
									node = opgraph.childNodes[n];
									if (node.nodeName === "image") {
										for (m = 0; m < node.childNodes.length; ++m) {
											cnode = node.childNodes[m];
											if (cnode.nodeType === 1 && cnode.nodeName === "parameter" &&
												cnode.getAttribute("type") === "filename" &&
												cnode.hasAttribute("value"))
											{
												material.diffuse_texture = cnode.getAttribute("value");
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		console.log("materials", materials);
		return { materials : materials };
	}

	window.ummtlx = {};
	window.ummtlx.load = load;
}());
