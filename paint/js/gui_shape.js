(function () {
	"use strict";
	let GUIShape;

	GUIShape = function (store, action) {
		this.store = store;
		this.action = action;

		this.root_ = document.createElement('div');
		this.root_.className = "gui_shape"
		this.store.on(upaint.Store.EVENT_MODEL_ADD, function (err, model) {
			if (!model.shapegroups) return;
			
			let morphInstances = [];
			for (let n = 0; n < model.pcmodels.length; ++n) {
				let instances = model.pcmodels[n].morphInstances;
				if (instances.length > 0) {
					Array.prototype.push.apply(morphInstances, instances);
				}
			}

			for (let i = 0; i < model.shapegroups.length; ++i) {
				let group = model.shapegroups[i];
				let groupMourphInstances = []
				Array.prototype.push.apply(groupMourphInstances, morphInstances);
				for (let k = 0; k < group.binds.length; ++k) {
					let refs = group.binds[k].reference;
					for (let n = 0; n < refs.length; ++n) {
						if (refs[n] && n > 0) {
							refs[n].morph = refs[0].morph;
							let mi = new pc.MorphInstance(refs[n].morph)
							mi._setBaseMesh(refs[n]);
							groupMourphInstances.push(mi);
						}
					}
				}
				this.addShape(groupMourphInstances, group)
			}
		}.bind(this));
	};

	GUIShape.prototype.addShape = function (morphInstances, group) {
		// 名前
		let nameElem = document.createElement('div');
		nameElem.className = "gui_shape_name";
		nameElem.textContent = group.name;
		this.rootElement.appendChild(nameElem);

		// スライダー
		let slider = document.createElement('input');
		slider.setAttribute('type', 'range');
		slider.className = "gui_shape_slider";
		slider.value = 0;
		slider.min = 0;
		slider.max = 100;
		slider.step = 1;
		slider.oninput = function (evt) {
			for (let i = 0; i < group.binds.length; ++i) {
				let refs = group.binds[i].reference;
				let index = group.binds[i].index;
				console.log(index, refs.length, morphInstances.length)
				for (let k = 0; k < refs.length; ++k) {
					if (refs[k]) {
						morphInstances[k].setWeight(index, Number(evt.target.value) / 100.0 );
						console.log(refs[k].vertexBuffer.numVertices)
						morphInstances[k].update(refs[k]);
					}
				}

				// }
				// 	let morph = refs[k].morph;
				// 	for (let n = 0; n < morph._targets.length; ++n) {
				// 		morphInstances[0].setWeight(n, evt.target.value);
				// 	}
				// }
			}
			//console.log(evt.target.value, group);
		};
		this.rootElement.appendChild(slider);
	};

	/**
	 * root element
	 */
	Object.defineProperty(GUIShape.prototype, 'rootElement', {
		get: function () {
			return this.root_;
		}
	});

	upaint.GUIShape = GUIShape;
}());
