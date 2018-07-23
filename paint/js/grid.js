(function () {
	"use strict";

	let Grid = function () {
		this.pcentity_ = new pc.Entity('Grid');

		let mat = new pc.BasicMaterial();
		
		let xmat = mat.clone();
		xmat.color.set(1, 0, 0);
		let xmesh = pc.createMesh(pc.app.graphicsDevice, [0, 0, 0, 100, 0, 0]);
		xmesh.primitive[0].type = pc.PRIMITIVE_LINES;
		let xmodel = upaint.Util.createImeddiateModel(xmesh, xmat);

		let ymat = mat.clone();
		ymat.color.set(0, 1, 0);
		let ymesh = pc.createMesh(pc.app.graphicsDevice, [0, 0, 0, 0, 100, 0]);
		ymesh.primitive[0].type = pc.PRIMITIVE_LINES;
		let ymodel = upaint.Util.createImeddiateModel(ymesh, ymat);

		let zmat = mat.clone();
		zmat.color.set(0, 0, 1);
		let zmesh = pc.createMesh(pc.app.graphicsDevice, [0, 0, 0, 0, 0, 100]);
		zmesh.primitive[0].type = pc.PRIMITIVE_LINES;
		let zmodel = upaint.Util.createImeddiateModel(zmesh, zmat);
	};

	upaint.Grid = Grid;

}());
