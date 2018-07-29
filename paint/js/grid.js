(function () {
	"use strict";

	let Grid = function () {
		this.pcentity_ = new pc.Entity('Grid');

		let gridSize = upaint.Constants.GridSize;
		let halfSize = gridSize / 2;
		let span = upaint.Constants.GridSpan;
		
		let mat = new pc.BasicMaterial();
		
		// 軸の線
		let xmat = mat.clone();
		xmat.color.set(1, 0, 0);
		let xmesh = pc.createMesh(pc.app.graphicsDevice, [0, 0, 0, halfSize, 0, 0]);
		xmesh.primitive[0].type = pc.PRIMITIVE_LINES;
		let xmodel = upaint.Util.createImeddiateModel(xmesh, xmat);

		let ymat = mat.clone();
		ymat.color.set(0, 1, 0);
		let ymesh = pc.createMesh(pc.app.graphicsDevice, [0, 0, 0, 0, halfSize, 0]);
		ymesh.primitive[0].type = pc.PRIMITIVE_LINES;
		let ymodel = upaint.Util.createImeddiateModel(ymesh, ymat);

		let zmat = mat.clone();
		zmat.color.set(0, 0, 1);
		let zmesh = pc.createMesh(pc.app.graphicsDevice, [0, 0, 0, 0, 0, halfSize]);
		zmesh.primitive[0].type = pc.PRIMITIVE_LINES;
		let zmodel = upaint.Util.createImeddiateModel(zmesh, zmat);

		// グリッド
		let gridMat = mat.clone();
		gridMat.color.set(0.5, 0.5, 0.5);
		// z
		for (let i = 0, count = gridSize/span; i <= count; ++i) {
			let posX = -halfSize + i * span;
			let gridMesh;
			if (posX === 0) {
				gridMesh = pc.createMesh(pc.app.graphicsDevice, [posX, 0, -halfSize, posX, 0, 0]);
			} else {
				gridMesh = pc.createMesh(pc.app.graphicsDevice, [posX, 0, -halfSize, posX, 0, halfSize]);
			}
			gridMesh.primitive[0].type = pc.PRIMITIVE_LINES;
			upaint.Util.createImeddiateModel(gridMesh, gridMat);
		}
		// x
		for (let i = 0, count = gridSize/span; i <= count; ++i) {
			let posZ = -halfSize + i * span;
			let gridMesh;
			if (posZ === 0) {
				gridMesh = pc.createMesh(pc.app.graphicsDevice, [-halfSize, 0, posZ, 0, 0, posZ]);
			} else {
				gridMesh = pc.createMesh(pc.app.graphicsDevice, [-halfSize, 0, posZ, halfSize, 0, posZ]);
			}
			gridMesh.primitive[0].type = pc.PRIMITIVE_LINES;
			upaint.Util.createImeddiateModel(gridMesh, gridMat);
		}
	};

	upaint.Grid = Grid;

}());
