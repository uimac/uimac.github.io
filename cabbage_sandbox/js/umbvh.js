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
		var x_size = box.max_[0] - box.min_[0],
			y_size = box.max_[1] - box.min_[1],
			z_size = box.max_[2] - box.min_[2];
		return 2.0 * ((x_size * y_size) + (x_size * z_size) + (y_size * s_size));
	}

	BvhNode.prototype.pickSplitAxis = function () {
		var axis_x = this.box.max_[0] - this.box.min_[0],
			axis_y = this.box.max_[1] - this.box.min_[1],
			axis_z = this.box.max_[2] - this.box.min_[2];

		if (axis_x > axis_y && axis_x > axis_z) {
			return 0; // x
		} else if (axis_y > axis_z) {
			return 1; // y
		} else {
			return 2; // z
		}
	};

	function sortFunc(a, b, axis) {
		return (a.box.min_[axis] + a.box.max_[axis]) - (b.box.min_[axis] + b.box.max_[axis]);
	}

	function swap(items, firstIndex, secondIndex){
		var temp = items[firstIndex];
		items[firstIndex] = items[secondIndex];
		items[secondIndex] = temp;
	}

	function partition(items, left, right, axis) {
		var pivot   = items[Math.floor((right + left) / 2)],
			i	   = left,
			j	   = right;

		while (i <= j) {
			while (sortFunc(items[i], pivot, axis) < 0) {
				i++;
			}
			while (sortFunc(items[j], pivot, axis) > 0) {
				j--;
			}
			if (i <= j) {
				swap(items, i, j);
				i++;
				j--;
			}
		}
		return i;
	}

	function quickSort(items, left, right, axis) {
		var index;
		if (items.length > 1) {
			index = partition(items, left, right, axis);
			if (left < index - 1) {
				quickSort(items, left, index - 1, axis);
			}
			if (index < right) {
				quickSort(items, index, right, axis);
			}
		}
		return items;
	}

	BvhNode.prototype.computeVolume = function (primitive_list, lindex, rindex) {
		var i,
			size = rindex - lindex;
		this.box.min_ = [].concat(primitive_list[lindex].box.min_);
		this.box.max_ = [].concat(primitive_list[lindex].box.max_);
		for (i = lindex + 1; i < size; i = i + 1) {
			this.box.extendByBox(primitive_list[i].box);
		}
	};

	BvhNode.prototype.splitNode = function (primitive_list, lindex, rindex) {
		var axis = this.pickSplitAxis(),
			size = rindex - lindex,
			center,
			middle,
			mindex,
			left_list,
			right_list;

		middle = partition(primitive_list, lindex, rindex, axis);
		if (middle === lindex || middle === rindex) {
			middle = Math.floor((lindex + rindex) / 2);
			quickSort(primitive_list, lindex, rindex, axis);
		}
		center = middle;

		if ( (center - lindex) > 1) {
			this.left = new BvhNode();
			this.left.init(primitive_list, lindex, center);
		}
		if ( (rindex - center) > 1) {
			this.right = new BvhNode();
			this.right.init(primitive_list, center, rindex);
		}
	};

	BvhNode.prototype.init = function (primitive_list, lindex, rindex) {
		var size = rindex - lindex;
		this.left = null;
		this.right = null;
		this.from = lindex;
		this.to = rindex;
		if (size <= 1) {
			// leaf node
			this.computeVolume(primitive_list, lindex, rindex);
		} else {
			this.computeVolume(primitive_list, lindex, rindex);
			this.splitNode(primitive_list, lindex, rindex);
		}
	};

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
	};

	UMBvh.prototype.build = function (primitive_list) {
		this.root = new BvhNode();
		this.primitive_list = primitive_list;
		this.root.init(primitive_list, 0, primitive_list.length - 1);
	};

	UMBvh.prototype.intersects = function (bvhnode, info, origin, dir) {
		var i,
			result = false,
			param = {};

		if (!bvhnode) { return false; }
		if (bvhnode.box.intersects(origin, dir)) {
			if (!bvhnode.left || !bvhnode.right) {
				for (i = bvhnode.from; i < bvhnode.to; i = i + 1) {
					if (this.primitive_list[i].intersects(origin, dir, param)) {
						if (param.distance < info.max_distance) {
							info.result = i;
							info.max_distance = param.distance;
							info.intersect_point = param.intersect_point;
							result = true;
							return result;
						}
					}
				}
			} else {
				if (bvhnode.left) {
					result = this.intersects(bvhnode.left, info, origin, dir);
				}
				if (bvhnode.right) {
					result = result || this.intersects(bvhnode.right, info, origin, dir);
				}
				if (result) {
					return result;
				}
			}
		}
		return result;
	};

	UMBvh.prototype.box = function () {
		return this.root.box;
	};

	UMBvh.prototype.getboxlist_ = function (node, box_list) {
		if (!node.right && !node.left && node.box) {
			box_list.add(node.box);
		}
		if (node.right) { this.getboxlist_(node.right, box_list); }
		if (node.left) { this.getboxlist_(node.left, box_list); }
	};

	UMBvh.prototype.boxlist = function (box_list) {
		this.getboxlist_(this.root, box_list);
	};

	window.umbvh = {}
	window.umbvh.UMBvh = UMBvh;

}(window.ummath));
