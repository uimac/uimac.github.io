(function () {
	"use strict";

	let ModelIO = upaint.ModelIO;

	/**
	 * usage:
	 * let io = new upaint.ModelIO.VRM();
	 * io.on('loaded', function (err, model) {} );
	 * io.load(url);
	 */
	ModelIO.VRM = function () {
		EventEmitter.call(this);
		pc.app.loader.load('js/model_io_vrm_spring.js', "script", function (err, script) {});
	};
	ModelIO.VRM.prototype = Object.create(EventEmitter.prototype);

	ModelIO.VRM.prototype.loadSecondary = function (data, resources, secondary) {
		for (let i = 0; i < secondary.boneGroups.length; ++i) {
			let boneGroup = secondary.boneGroups[i];
			let entity = new pc.Entity("SpringBone");
			entity.addComponent("script", { enabled: true });
			data.model.pcentity.addChild(entity);

			let bones = [];
			for (let k = 0; k < boneGroup.bones.length; ++k) {
				let boneIndex = boneGroup.bones[k];
				let entity = resources.nodes[boneIndex];
				bones.push(entity);
			}
			let colliderGroups = [];
			for (let k = 0; k < boneGroup.colliderGroups.length; ++k) {
				colliderGroups[k] = secondary.colliderGroups[boneGroup.colliderGroups[k]];
			}

			let gravityDir = new pc.Vec3(
				boneGroup.gravityDir.x,
				boneGroup.gravityDir.y,
				boneGroup.gravityDir.z
			);
			let attributes = {
				bones : bones,
				colliderGroups : colliderGroups,
				stiffnessForce : boneGroup.stiffiness,
				gravityPower : boneGroup.gravityPower,
				gravityDir : gravityDir,
				dragForce : boneGroup.dragForce,
				hitRadius : boneGroup.hitRadius
			};
			if (boneGroup.center !== -1) {
				attributes.center = boneGroup.center;
			}
			entity.script.create('VRMSpringBone', { 
				attributes : attributes
			});
		}
	};

	ModelIO.VRM.prototype.loadBlendShape = function (data, resources, shapeMaster) {
		for (let i = 0; i < shapeMaster.blendShapeGroups.length; ++i) {
			let group = shapeMaster.blendShapeGroups[i];
			console.error(resources.meshes, group.binds.length)
			for (let k = 0; k < group.binds.length; ++k) {
				let mesh = group.binds[k].mesh;
				group.binds[k].reference = resources.meshes[mesh];
			}
		}
		data.model.shapegroups = shapeMaster.blendShapeGroups;
	}

	ModelIO.VRM.prototype.load = function (url) {
		let gltfIO = new upaint.ModelIO.GLTF();
		gltfIO.on('loaded', function (err, data, json, resources) {
			if (json.hasOwnProperty('extensions')) {
				let VRM = json.extensions.VRM;

				console.log(resources)
				// humanoidボーンのみ可視とする
				if (VRM.hasOwnProperty('humanoid')) {
					let humanoid = VRM.humanoid;
					if (humanoid.hasOwnProperty('humanBones')) {
						for (let i = 0; i < resources.nodes.length; ++i) {
							let entity = resources.nodes[i];
							data.model.skeleton.setVisible(entity, false);
						}
						for (let i = 0; i < humanoid.humanBones.length; ++i) {
							let humanEntity = resources.nodes[humanoid.humanBones[i].node];
							data.model.skeleton.setVisible(humanEntity, true);
						}
					}
				}
				// 揺れるボーン
				if (VRM.hasOwnProperty('secondaryAnimation')) {
					this.loadSecondary(data, resources, VRM.secondaryAnimation)
				}

				// モーフ設定
				if (VRM.hasOwnProperty('blendShapeMaster')) {
					this.loadBlendShape(data, resources, VRM.blendShapeMaster)
				}

				this.emit(ModelIO.EVENT_LOADED, null, data, json);
			}
		}.bind(this));
		gltfIO.load(url);
	};

}());