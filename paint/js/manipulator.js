(function () {
	"use strict";
	const MANIP_NAME_TRANSX = "mainp_transx";
	const MANIP_NAME_TRANSY = "mainp_transy";
	const MANIP_NAME_TRANSZ = "mainp_transz";
	const MANIP_NAME_ROTX = "mainp_rotx";
	const MANIP_NAME_ROTY = "mainp_roty";
	const MANIP_NAME_ROTZ = "mainp_rotz";
	const MANIP_NAME_ROTW = "mainp_rotw";
	const TRANS_INDEX = {
		"mainp_transx": 0,
		"mainp_transy": 1,
		"mainp_transz": 2
	};
	const ROT_INDEX = {
		"mainp_rotx": 0,
		"mainp_roty": 1,
		"mainp_rotz": 2
	};
	const ROT_VEC = {
		"mainp_rotx": new pc.Vec3(1, 0, 0),
		"mainp_roty": new pc.Vec3(0, 1, 0),
		"mainp_rotz": new pc.Vec3(0, 0, 1)
	};
	let PivotSize = 0.2;

	let Manipulator = function (store, action) {
		this.action = action;
		this.camera = null;
		this.canvasResolution = {};

		// xyz軸ハンドルの親
		this.manipEntity_ = new pc.Entity('Manip');
		this.target_ = null;

		// ハンドル用マテリアル
		this.mat = new pc.BasicMaterial();
		//this.mat.cull = pc.CULLFACE_NONE;
		this.mat.depthTest = false;
		//this.mat.blendType = pc.BLEND_NORMAL;
		this.mat.update();

		// 回転ハンドルMesh
		this.initRotationHandles();

		// 移動ハンドルMesh
		this.initTranslationHandles();
		
		// ハンドルを非表示に
		this.setTranslationVisible(false);
		this.setRotationVisible(false);

		this.bbox_ = new pc.BoundingBox(
			this.manipEntity_.getPosition().clone(), 
			this.manipEntity_.getLocalScale().clone().scale(0.5));
			
		store.on(upaint.Store.EVENT_RESIZE, function (err) {
			this.resize();
		}.bind(this));
		
		store.on(upaint.Store.EVENT_ORIENTATION_CHANGE, function (err) {
			this.resize();
		}.bind(this));

		store.on(upaint.Store.EVENT_UNDO, function (err, data) {
			this.ccdik.update();
		}.bind(this));
		store.on(upaint.Store.EVENT_REDO, function (err, data) {
			this.ccdik.update();
		}.bind(this));

		this.ccdik = new upaint.CCDIK(store, action);
	};

	/// カメラにより初期化する
	Manipulator.prototype.init = function (camera) {
		this.camera = camera;
		this.resize();
	};

	/**
	 * 終了処理
	 */
	Manipulator.prototype.destroy = function () {
		this.pcentity.destroy();
	};

	/**
	 * キャンバスのサイズが変わった場合など 
	 */
	Manipulator.prototype.resize = function () {
		let canvas = pc.app.graphicsDevice.canvas;
		this.canvasResolution = {
			width : canvas.width,
			height : canvas.height
		};
	};

	Manipulator.prototype.initRotationHandles = function () {
		let createHandle = function (mat, name, radius, trans = false, hasDragModel = true) {
			let mesh = upaint.Util.createTorus(pc.app.graphicsDevice, {
				tubeRadius : 0.04, 
				ringRadius : 0.8,
				radius : radius
			});
			let dragMesh = upaint.Util.createTorus(pc.app.graphicsDevice, {
				tubeRadius : 0.15, 
				ringRadius : 0.8,
				radius : radius
			});
			let mat2 = mat.clone();
			mesh.name = name + "_";
			dragMesh.name = name;
			let model = upaint.Util.createImeddiateModel(mesh, mat, trans);
			model.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
			if (hasDragModel) {
				mat2.color.set(0, 0, 0, 0);
				mat2.blendType = pc.BLEND_NORMAL;
				let dragModel = upaint.Util.createImeddiateModel(dragMesh, mat2, trans);
				dragModel.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
				dragMesh.entity = this.manipEntity_;
				return [model, dragModel];
			} else {
				return [model];
			}
		}.bind(this);

		let xmat = this.mat.clone();
		xmat.color.set(1, 0, 0, 1);
		this.rot_x_ = createHandle(xmat, MANIP_NAME_ROTX, Math.PI);
		for (let i = 0; i < this.rot_x_.length; ++i) {
			this.rot_x_[i].pcentity.setLocalEulerAngles(0, 0, 90);
		}

		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.rot_y_ = createHandle(ymat, MANIP_NAME_ROTY, Math.PI);

		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.rot_z_ = createHandle(zmat, MANIP_NAME_ROTZ, Math.PI);
		let a = new pc.Quat();
		let b = new pc.Quat();
		a.setFromAxisAngle(upaint.Constants.AxisZ, 90);
		b.setFromAxisAngle(upaint.Constants.AxisX, 90);
		let zrot = a.mul(b);
		for (let i = 0; i < this.rot_z_.length; ++i) {
			this.rot_z_[i].pcentity.setLocalRotation(zrot);
		}

		let wmat = this.mat.clone();
		wmat.color.set(0.6, 0.6, 0.6, 0.2);
		wmat.blendType = pc.BLEND_NORMAL;
		this.rot_w_ = createHandle(wmat, MANIP_NAME_ROTW, Math.PI * 2, true, false);

		this.manipEntity_.addChild(this.rot_w_[0].pcentity);

		for (let i = 0; i < 2; ++i) {
			this.manipEntity_.addChild(this.rot_x_[i].pcentity);
			this.manipEntity_.addChild(this.rot_y_[i].pcentity);
			this.manipEntity_.addChild(this.rot_z_[i].pcentity);
		}
	};

	Manipulator.prototype.initTranslationHandles = function () {
		let createHandle = function (mat, name) {
			let mesh = pc.createCylinder(pc.app.graphicsDevice, {
				height  : 1.2, 
				radius  : 0.04
			});
			mesh.name = name;
			let model = upaint.Util.createImeddiateModel(mesh, mat);
			model.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
			mesh.entity = this.manipEntity_;
			
			let cone = pc.createCone(pc.app.graphicsDevice, {
				height  : 0.3, 
				baseRadius  : 0.1
			});
			cone.name = name;
			let coneModel = upaint.Util.createImeddiateModel(cone, mat);
			coneModel.pcentity.setLocalScale(PivotSize, PivotSize, PivotSize);
			cone.entity = this.manipEntity_;

			return [model, coneModel];
		}.bind(this);

		let xmat = this.mat.clone();
		xmat.color.set(1, 0, 0, 1);
		this.trans_x_ = createHandle(xmat, MANIP_NAME_TRANSX);
		for (let i = 0; i < this.trans_x_.length; ++i) {
			this.trans_x_[i].pcentity.setLocalEulerAngles(0, 0, 90);
		}
		this.trans_x_[0].pcentity.setLocalPosition(-0.6 * PivotSize, 0, 0);
		this.trans_x_[1].pcentity.setLocalPosition(-1.2 * PivotSize, 0, 0); // cone


		let ymat = this.mat.clone();
		ymat.color.set(0, 1, 0, 1);
		this.trans_y_ = createHandle(ymat, MANIP_NAME_TRANSY);
		this.trans_y_[0].pcentity.setLocalPosition(0, 0.6 * PivotSize, 0);
		this.trans_y_[1].pcentity.setLocalPosition(0, 1.2 * PivotSize, 0); // cone
		let zmat = this.mat.clone();
		zmat.color.set(0, 0, 1, 1);
		this.trans_z_ = createHandle(zmat, MANIP_NAME_TRANSZ);
		let a = new pc.Quat();
		let b = new pc.Quat();
		a.setFromAxisAngle(upaint.Constants.AxisZ, 90);
		b.setFromAxisAngle(upaint.Constants.AxisX, 90);
		let c = a.mul(b);
		for (let i = 0; i < this.trans_z_.length; ++i) {
			this.trans_z_[i].pcentity.setLocalRotation(c);
		}
		this.trans_z_[0].pcentity.setLocalPosition(0, 0, 0.6 * PivotSize);
		this.trans_z_[1].pcentity.setLocalPosition(0, 0, 1.2 * PivotSize); // cone

		for (let i = 0; i < this.trans_x_.length; ++i) {
			this.manipEntity_.addChild(this.trans_x_[i].pcentity);
			this.manipEntity_.addChild(this.trans_y_[i].pcentity);
			this.manipEntity_.addChild(this.trans_z_[i].pcentity);
		}
	};

	/**
	 * 更新
	 */
	Manipulator.prototype.update = (function () {
		let qa = new pc.Quat();
		let qb = new pc.Quat();
		return function (camera) {
			if (!this.target) return;
			let entity = this.target;
			if (this.target.ikeffector) {
				entity = this.target.ikeffector;
			}
			this.camera = camera;
			let rotInv = entity.getRotation().clone().invert();
			let cameraPos = camera.pcentity.getPosition();
			let targetPos = entity.getPosition().clone();
			let eyeVec = targetPos.sub(cameraPos);
			let distanceScale = Math.max(PivotSize * eyeVec.length() / 2, PivotSize * (2 / 3));
			let scale = [distanceScale, distanceScale, distanceScale];
			eyeVec.normalize();
			eyeVec = rotInv.transformVector(eyeVec);

			qa.x = eyeVec.z;
			qa.y = 0.0;
			qa.z = -eyeVec.x;
			qa.w = 1.0 + eyeVec.y;
			qa.normalize();
			this.rot_w_[0].pcentity.setLocalRotation(qa);
			this.rot_w_[0].pcentity.setLocalScale(scale[0], scale[1], scale[2]);

			// rot_x
			qa.setFromAxisAngle(upaint.Constants.AxisZ, 
				pc.math.RAD_TO_DEG * Math.PI * 0.5);
			qb.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.y, -eyeVec.z));
			let rotx = qa.mul(qb);
			for (let i = 0; i < this.rot_x_.length; ++i) {
				this.rot_x_[i].pcentity.setLocalRotation(rotx);
				this.rot_x_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
			}

			// rot_y
			qa.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.x, -eyeVec.z));
			for (let i = 0; i < this.rot_y_.length; ++i) {
				this.rot_y_[i].pcentity.setLocalRotation(qa);
				this.rot_y_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
			}

			// rot_z
			qa.setFromAxisAngle(upaint.Constants.AxisX, 
				pc.math.RAD_TO_DEG * Math.PI * 0.5);
			qb.setFromAxisAngle(upaint.Constants.AxisY, 
				pc.math.RAD_TO_DEG * Math.atan2(-eyeVec.x, eyeVec.y));
			let rotz = qa.mul(qb);
			for (let i = 0; i < this.rot_z_.length; ++i) {
				this.rot_z_[i].pcentity.setLocalRotation(rotz);
				this.rot_z_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
			}

			// trans
			for (let i = 0; i < this.trans_x_.length; ++i) {
				this.trans_x_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
				this.trans_x_[i].pcentity.setLocalPosition(-0.6 * (i+1) * scale[0], 0, 0);
				this.trans_y_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
				this.trans_y_[i].pcentity.setLocalPosition(0, 0.6 * (i+1) * scale[1], 0);
				this.trans_z_[i].pcentity.setLocalScale(scale[0], scale[1], scale[2]);
				this.trans_z_[i].pcentity.setLocalPosition(0, 0, 0.6 * (i+1) * scale[2]);
			}
		}
	}());

	/**
	 * 回転マニピュレーターの表示非表示を設定
	 */
	Manipulator.prototype.setRotationVisible = function (visible) {
		for (let i = 0; i < this.rot_x_.length; ++i) {
			this.rot_x_[i].setVisible(visible);
			this.rot_y_[i].setVisible(visible);
			this.rot_z_[i].setVisible(visible);
		}
		this.rot_w_[0].setVisible(visible);
	};
	
	/**
	 * 移動マニピュレーターの表示非表示を設定
	 */
	Manipulator.prototype.setTranslationVisible = function (visible) {
		for (let i = 0; i < this.trans_x_.length; ++i) {
			this.trans_x_[i].setVisible(visible);
			this.trans_y_[i].setVisible(visible);
			this.trans_z_[i].setVisible(visible);
		}
	};

	/**
	 * マニピュレータのターゲット
	 */
	Object.defineProperty(Manipulator.prototype, 'target', {
		get: function () {
			return this.target_;
		},
		set: function (entity) {
			if (this.manipEntity_.parent) {
				this.manipEntity_.parent.removeChild(this.manipEntity_);
			}
			this.target_ = entity;
			if (this.target_) {
				// 移動できるやつだけ移動マニピュレーターを出す
				let canTrans = entity.name === "Model";
				this.setTranslationVisible(canTrans);
				this.setRotationVisible(true);
				
				let s = entity.getLocalScale();

				// IKの場合は全部非表示
				if (entity.ikeffector) {
					this.setTranslationVisible(false);
					this.setRotationVisible(true);
					entity.ikeffector.addChild(this.manipEntity_);
					s = entity.ikeffector.getLocalScale();
				} else {
					this.target_.addChild(this.manipEntity_);
				}
				this.manipEntity_.setLocalScale(new pc.Vec3(1.0/s.x, 1.0 / s.y, 1.0/s.z));
			} else {
				// nullがセットされたら非表示にする
				this.setTranslationVisible(false);
				this.setRotationVisible(false);
			}
		}
	});
	
	// 移動
	Manipulator.prototype.translate = (function () {
		let tempVec = new pc.Vec3();
		return function (name, entity, initialpos, prepos, curpos, initialVal, isDone) {
			let normals = [entity.right, entity.up, entity.forward];
			let sign = (TRANS_INDEX[name] === 2) ? -1 : 1;

			let rot = entity.getRotation();
			let diff = curpos.sub(prepos);
			diff = rot.invert().transformVector(diff);

			let newpos = entity.getPosition().clone();
			tempVec = normals[TRANS_INDEX[name]].clone();
			tempVec.scale(sign * Math.sign(diff.data[TRANS_INDEX[name]]) * diff.length())
			newpos.add(tempVec);
			if (isDone) {
				// 移動の確定
				this.action.translateEntity({
					entity : entity,
					prePos : initialVal.pos,
					pos : newpos
				});
			} else {
				// 移動中
				entity.setPosition(newpos);
			}
		}
	}());

	// 自由移動
	Manipulator.prototype.freeTranslate = (function () {
		let tempVec = new pc.Vec3();
		return function (entity, initialpos, prepos, curpos) {
			let rot = entity.getRotation();
			let diff = curpos.sub(prepos);
			diff = rot.invert().transformVector(diff);
			let newpos = entity.getPosition().clone();
			newpos.add(diff);
			entity.setPosition(newpos);
		}
	}());

	// ローカル回転
	Manipulator.prototype.rotate = function (name, entity, initialpos, prepos, curpos, initialVal, isDone) 
	{
		let cameraPos = this.camera.pcentity.getPosition();
		let initialRay = new pc.Ray(cameraPos, initialpos.clone().sub(cameraPos).normalize());
		let startRay = new pc.Ray(cameraPos, prepos.clone().sub(cameraPos).normalize());
		let endRay = new pc.Ray(cameraPos, curpos.clone().sub(cameraPos).normalize());

		let entityPos = entity.getPosition().clone();
		let normals = [entity.right, entity.up, entity.forward];
		let sign = (ROT_INDEX[name] === 2) ? -1 : 1;
		let isVertical = Math.abs(initialRay.direction.dot(normals[ROT_INDEX[name]])) < 0.25;

		let startEndRot = 0.0;
		if (isVertical) {
			let diffStart = prepos.sub(entityPos);
			diffStart.normalize();
			let diffEnd = curpos.sub(entityPos);
			diffEnd.normalize();
			let side = new pc.Vec3().cross(normals[ROT_INDEX[name]], diffStart);

			let y = upaint.Util.clamp(diffEnd.dot(diffStart), -1.0, 1.0);
			let x = upaint.Util.clamp(diffEnd.dot(side), -1.0, 1.0);
			startEndRot = Math.atan2(x, y);
		} else {
			let plane = new pc.Plane(entityPos, normals[ROT_INDEX[name]]);
			let startPos = new pc.Vec3();
			let endPos = new pc.Vec3();
			let isHitStart = plane.intersectsRay(startRay, startPos);
			let isHitEnd = plane.intersectsRay(endRay, endPos);
			if (isHitStart && isHitEnd) {
				let diffStart = startPos.sub(entityPos);
				diffStart.normalize();
				let diffEnd = endPos.sub(entityPos);
				diffEnd.normalize();
				let side = new pc.Vec3().cross(normals[ROT_INDEX[name]], diffStart);

				let y = upaint.Util.clamp(diffEnd.dot(diffStart), -1.0, 1.0);
				let x = upaint.Util.clamp(diffEnd.dot(side), -1.0, 1.0);
				startEndRot = Math.atan2(x, y);
			}
		}
		let quat = new pc.Quat();
		quat.setFromAxisAngle(ROT_VEC[name], sign * startEndRot * pc.math.RAD_TO_DEG);

		let newrot = entity.getLocalRotation().clone().mul(quat).normalize();
		if (isDone) {
			// 回転の確定
			this.action.rotateEntity({
				entity : entity,
				preRot : initialVal.rot,
				rot : newrot
			});
		} else {
			// 回転中
			entity.setLocalRotation(newrot);
		}
	};

	Manipulator.prototype.manipulate = function (meshInstance, initial, start, end, initialVal, isDone, state) {
		let name = meshInstance.mesh.name;
		let entity = Manipulator.GetEntity(meshInstance);
		let dist = entity.getPosition().sub(this.camera.pcentity.getPosition()).length();

		if (!meshInstance.mesh.entity) { return; }
		let targetEntity = meshInstance.mesh.entity.parent;
		if (this.target_.ikeffector) {
			targetEntity = this.target_.ikeffector;
		}
		if (!targetEntity) { return; }

		let initialpos = this.camera.pccamera.screenToWorld(
			initial.x, initial.y, dist- this.bbox_.halfExtents.z / 2.0, 
			this.canvasResolution.width, this.canvasResolution.height);

		let prepos = this.camera.pccamera.screenToWorld(
			start.x, start.y, dist- this.bbox_.halfExtents.z / 2.0, 
			this.canvasResolution.width, this.canvasResolution.height);

		let curpos = this.camera.pccamera.screenToWorld(
			end.x, end.y, dist - this.bbox_.halfExtents.z / 2.0, 
			this.canvasResolution.width, this.canvasResolution.height);

		if (ROT_INDEX.hasOwnProperty(name)) {
			this.rotate(name, targetEntity, initialpos, prepos, curpos, initialVal, isDone);
		} else if (TRANS_INDEX.hasOwnProperty(name)) {
			if (!this.target_.ikeffector) {
				this.translate(name, targetEntity, initialpos, prepos, curpos, initialVal, isDone);
			}
		} else {
			let canTrans = entity.name === "Model";
			if (canTrans || this.target_.ikeffector) {
				this.freeTranslate(this.target_, initialpos, prepos, curpos);
				if (this.target_.ikeffector) {
					if (state === "down") {
						this.setRotationVisible(true);
					} else if (state === "move") {
						this.setRotationVisible(false);
					}
					this.ccdik.translate(this.target_, this.target_.ikeffector, initialVal, isDone, state);
				}
			}
		}
		this.ccdik.update(this.target_);
	};

	Manipulator.IsManipulator = function (meshInstance) {
		let name = meshInstance.mesh.name;
		return TRANS_INDEX.hasOwnProperty(name) 
			|| ROT_INDEX.hasOwnProperty(name);
	};
	
	Manipulator.GetEntity = function (meshInstance) {
		return meshInstance.mesh.entity;
	};

	upaint.Manipulator = Manipulator;

}());