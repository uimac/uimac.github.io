(function () {
	"use strict";

	const MANIP_NAME_TRANSX = "mainp_transx";
	const MANIP_NAME_TRANSY = "mainp_transy";
	const MANIP_NAME_TRANSZ = "mainp_transz";
	const TRANS_INDEX = {
		"mainp_transx": 0,
		"mainp_transy": 1,
		"mainp_transz": 2
	};
	

	let CCDIK = function (store, action) {

	};

	CCDIK.prototype.translate = (function () {
		let tempVec = new pc.Vec3();
		let targetPos = new pc.Vec3();
		let iteration = 2;
		return function (target, entity, initialVal, isDone, state) {
			// 目標座標
			targetPos = target.getPosition().clone();
			let effector = entity;
			for (let k = 0; k < 4; ++k) {
				let targetEntity = effector.parent;
				for (let i = 0; i < iteration && targetEntity; ++i) {
					let invMat = targetEntity.getWorldTransform().clone().invert();
					let jointPos = targetEntity.getPosition();
	
					// ローカル座標系のposによる軸
					let axisLocalPos = invMat.transformVector(effector.getPosition().clone().sub(jointPos)).normalize();
					// ローカル座標系のtargetPosによる軸
					let axisTarget = invMat.transformVector(targetPos.clone().sub(jointPos)).normalize();
	
					// axisLocalPosからaxisTargetへの角度
					let rotationAngle = Math.acos(axisTarget.dot(axisLocalPos));
					if (Math.abs(rotationAngle) > 1.0e-5)
					{
						// 回転軸
						let rotationAxis = new pc.Vec3().cross(axisLocalPos, axisTarget);
						rotationAxis.normalize();
	
						// Quat作成
						let quat = new pc.Quat();
						quat.setFromAxisAngle(rotationAxis, pc.math.RAD_TO_DEG * rotationAngle);
	
						// rotationに反映
						targetEntity.setLocalRotation(targetEntity.getLocalRotation().mul(quat));
					}
	
					// iteration
					targetEntity = targetEntity.parent;
				}
			}

			// if (isDone) {
			// 	// 移動の確定
			// 	this.action.translateEntity({
			// 		entity : entity,
			// 		prePos : initialVal.pos,
			// 		pos : newpos
			// 	});
			// } else {
			// 	// 移動中
			// 	entity.setPosition(newpos);
			// }
		}
	}());

	upaint.CCDIK = CCDIK;

}());
