/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
	"use strict";

	function load(mtl) {
		var i,
			k,
			n,
			spec,
			materials = {},
			material_base = {
				diffuse : [0.7, 0.7, 0.7, 1.0],
				specular : [0.9, 0.9, 0.9, 1.0],
				ambient : [0.3, 0.3, 0.3, 1.0],
				diffuse_texture : ""
			},
			material,
			line,
			lines,
			vals;

		lines = mtl.split("\n");
		for (i = 0; i < lines.length; i = i + 1) {
			line = lines[i];
			vals = line.split(/\s+/).filter(Boolean);
			if (vals[0] === "newmtl") {
				material = JSON.parse(JSON.stringify(material_base));
				materials[vals[1]] = material;
			} else if (vals[0] === "Kd") {
				material.diffuse[0] = Number(vals[1]);
				material.diffuse[1] = Number(vals[2]);
				material.diffuse[2] = Number(vals[3]);
			} else if (vals[0] === "Ka") {
				material.ambient[0] = Number(vals[1]);
				material.ambient[1] = Number(vals[2]);
				material.ambient[2] = Number(vals[3]);
			} else if (vals[0] === "Ks") {
				material.specular[0] = Number(vals[1]);
				material.specular[1] = Number(vals[2]);
				material.specular[2] = Number(vals[3]);
			} else if (vals[0] === "Ns") {
				material.specular[3] = Number(vals[1]);
			} else if (vals[0] === "map_Kd") {
				material.diffuse_texture = vals[1];
			}
		}
		return { materials : materials };
	}

	window.ummtl = {};
	window.ummtl.load = load;
}(window.ummath));
