(function () {
	"use strict";

	let CCDIK = function (store, action) {
		this.store = store;
		this.action = action;
	};

	CCDIK.prototype.translate = (function () {
		// マウスダウン時の回転.  Undo用
		let preRotations = [];
		// マウスダウンからアップの間に1度でも回転が適用されたかどうか
		let isApplied = false;
		return function (target, entity, initialVal, isDone, state) {
			// 目標座標
			let targetPos = target.getPosition().clone();
			let iteration = target.iteration;

			let calculatedList = []
			let effector = entity;

			if (state === "down") {
				preRotations = [];
				isApplied = false;
				// undo用バッファに格納
				let targetEntity = effector.parent;
				for (let i = 0; i < iteration && targetEntity; ++i) {
					preRotations.push({
						entity : targetEntity,
						preRot : targetEntity.getLocalRotation().clone()
					});
					targetEntity = targetEntity.parent;
				}
			}

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
				if (Math.abs(rotationAngle) > 1.0e-3)
				{
					// 回転軸
					let rotationAxis = new pc.Vec3().cross(axisLocalPos, axisTarget);
					rotationAxis.normalize();

					// Quat作成
					let quat = new pc.Quat();
					quat.setFromAxisAngle(rotationAxis, pc.math.RAD_TO_DEG * rotationAngle);

					// rotationに反映
					targetEntity.setLocalRotation(targetEntity.getLocalRotation().clone().mul(quat));
					isApplied = true;
				}

				// redo用バッファに格納
				if (isDone && isApplied) {
					calculatedList.push({
						entity : targetEntity,
						rot : targetEntity.getLocalRotation().clone()
					});
				}

				// iteration
				targetEntity = targetEntity.parent;
			}
			if (state === "up") {
				let pos = effector.getPosition();
				target.setPosition(pos.x, pos.y, pos.z);
			}

			if (isDone && calculatedList.length > 0) {
				// 移動の確定
				for (let i = 0; i < calculatedList.length; ++i) {
					let entity = calculatedList[i].entity;
					for (let k = 0; k < preRotations.length; ++k) {
						if (preRotations[k].entity === entity) {
							calculatedList[i].preRot = preRotations[k].preRot;
							break;
						}
					}
				}
				preRotations = [];
				isApplied = false;
				this.action.transformIK(calculatedList);
			}
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
