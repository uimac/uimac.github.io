/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
	var UMBvh,
		BvhNode;

	UMBvh = function () {};
	BvhNode = function () {
		this.box = new ummath.UMBox();
		this.box.init();
	};

	function sah(box) {
		var x_size = box.max_.xyz[0] - box.min_.xyz[0],
			y_size = box.max_.xyz[1] - box.min_.xyz[1],
			z_size = box.max_.xyz[2] - box.min_.xyz[2];
		return 2.0 * ((x_size * y_size) + (x_size * z_size) + (y_size * s_size));
	}

	BvhNode.prototype.pickSplitAxis = function () {
		var axis_x = this.box.max_.xyz[0] - this.box.min_.xyz[0],
			axis_y = this.box.max_.xyz[1] - this.box.min_.xyz[1],
			axis_z = this.box.max_.xyz[2] - this.box.min_.xyz[2];

		if (axis_x > axis_y) {
			if (axis_x > axis_z) {
				return 0; // x
			} else {
				return 2; // z
			}
		} else {
			if (axis_y > axis_z) {
				return 1; // y
			} else {
				return 2; // z
			}
		}
	};

	BvhNode.prototype.computeVolume = function (primitive_list) {
		var i;
		this.box.min_ = JSON.parse(JSON.stringify(primitive_list[0].box.min_));
		this.box.max_ = JSON.parse(JSON.stringify(primitive_list[0].box.max_));
		for (i = 1; i < primitive_list.length; i = i + 1) {
			this.box.extend(primitive_list[i].box);
		}
	};

	BvhNode.prototype.splitNode = function (primitive_list) {
		var axis = this.pickSplitAxis(),
			center,
			left_list,
			right_list;
		primitive_list = primitive_list.sort(function (a, b) {
			return (a.box.min_[axis] + a.box.max_[axis]) - (b.box.min_[axis] + b.box.max_[axis]);
		});
		center = primitive_list.length / 2;

		left_list = primitive_list.slice(0, center);
		right_list = primitive_list.slice(center, primitive_list.length - 1);
		if (left_list.length > 0) {
			this.left = new BvhNode();
			this.left.init(left_list);
		}
		if (right_list.length > 0) {
			this.right = new BvhNode();
			this.right.init(right_list);
		}
	};

	BvhNode.prototype.init = function (primitive_list) {
		this.left = null;
		this.right = null;
		if (primitive_list.length <= 1) {
			// leaf node
			this.computeVolume(primitive_list);
		} else {
			this.computeVolume(primitive_list);
			this.splitNode(primitive_list);
		}
	}

	UMBvh.prototype.flatten = function (queue, bvhNodeList) {
		while (queue.length > 0) {
			var bvhNode = queue.shift();
			if (bvhNode.left) {
				bvhNodeList.push(bvhNode.left);
				queue.push(bvhNode.left);
			}
			if (bvhNode.right) {
				bvhNodeList.push(bvhNode.right);
				queue.push(bvhNode.right);
			}
		}
	}

	UMBvh.prototype.build = function (primitive_list) {
		this.root = new BvhNode();
		this.root.init(primitive_list);

		var bvhNodes = [];
		bvhNodes.push(this.root);
		var queue = [];
		queue.push(this.root);
		this.flatten(queue, bvhNodes);
		return bvhNodes;
	};

	UMBvh.prototype.intersects = function () {

	};

	UMBvh.prototype.box = function () {
		return this.root.box;
	};

	window.umbvh = {}
	window.umbvh.UMBvh = UMBvh;

}(window.ummath));
