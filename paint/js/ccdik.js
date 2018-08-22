(function () {
	"use strict";

	let CCDIK = function (store, action) {
		this.store = store;
	};

	CCDIK.prototype.translate = (function () {
		return function (target, entity, initialVal, isDone, state) {
			// 目標座標
			let targetPos = target.getPosition().clone();
			let iteration = target.iteration;

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
			if (state === "up") {
				let pos = effector.getPosition();
				target.setPosition(pos.x, pos.y, pos.z);
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

	CCDIK.prototype.update = function (entity) {
		let root = this.store.scene.pcentity;
		let targets = root.find("name", "IKTarget");
		for (let i = 0; i < targets.length; ++i) {
			let effector = targets[i].ikeffector;
			let pos = effector.getPosition();
			if (targets[i] !== entity) {
				targets[i].setPosition(pos.x, pos.y, pos.z);
			}
		}
	}

	upaint.CCDIK = CCDIK;

}());
