(function () {
	"use strict";

	let Store = function () {
		EventEmitter.call(this);
		this.timelineData_ = {
			contents: []
		};
		this.contentKeyToIndex = {}
		this.currentFrame_ = 0;
		
		this.currentContentKey = "data/AliciaSolid.vrm";
		this.currentPropKey = "all";
		this.addContent("アリシア・ソリッド", this.currentContentKey);
		this.addProp(this.currentContentKey, "全身", this.currentPropKey);
	};
	Store.prototype = Object.create(EventEmitter.prototype);

	Store.prototype.addContent = function (contentName, contentKey) {
		this.timelineData_.contents.push({
			name : contentName,
			contentKey : contentKey,
			closed: true,
			color: "rgb(100, 100, 200)",
			propColor: "rgba(100, 100, 200, 0.7)",
			props : []
		});
		this.contentKeyToIndex[contentKey] = this.timelineData_.contents.length - 1;
	};

	Store.prototype.addProp = function (contentKey, propName, propKey) {
		let content = this.getContent(contentKey);
		if (content) {
			content.props.push({
				name : propName,
				propKey : propKey,
				data : {}
			});
			console.log(content)
		}
	};
	
	Store.prototype.addKeyFrame = function (frameData, contentKey, propKey, frame) {
		if (!contentKey) {
			contentKey = this.currentContentKey;
		}
		if (!propKey) {
			propKey = this.currentPropKey;
		}
		if (!frame) {
			frame = this.currentFrame;
		}
		let prop = this.getProp(contentKey, propKey);
		console.log(contentKey, propKey, frame);
		if (prop) {
			prop.data[frame] = frameData;
			this.emit(Store.EVENT_KEYFRAME_ADD, null, frame, prop);
		}
	}

	Store.prototype.getContentIndex = function (contentKey) {
		if (this.contentKeyToIndex.hasOwnProperty(contentKey)) {
			return this.contentKeyToIndex[contentKey];
		}
		return -1;
	}

	Store.prototype.getContent = function (contentKey) {
		if (this.contentKeyToIndex.hasOwnProperty(contentKey)) {
			return this.timelineData_.contents[this.contentKeyToIndex[contentKey]];
		}
		return null;
	};

	Store.prototype.getProp = function (contentKey, propKey) {
		let content = this.getContent(contentKey);
		if (content) {
			for (let i = 0; i < content.props.length; ++i) {
				if (content.props[i].propKey === propKey) {
					return content.props[i];
				}
			}
		}
		return null;
	};

	/**
	 * current_frame
	 */
	Object.defineProperty(Store.prototype, 'currentFrame', {
		get: function () {
			return this.currentFrame_;
		},
		set: function (frame) {
			this.currentFrame_ = frame;
		}
	});

	/**
	 * timeline_data
	 */
	Object.defineProperty(Store.prototype, 'timelineData', {
		get: function () {
			return this.timelineData_;
		}
	});

	Store.EVENT_KEYFRAME_ADD = "add_keyframe"
	upaint.Store = Store;

}());
