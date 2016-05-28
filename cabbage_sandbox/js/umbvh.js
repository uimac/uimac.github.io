/*jslint devel:true*/
/*global Float32Array */
(function (ummath) {
	"use strict";
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
		var axis_x = this.box.max_[0] + this.box.min_[0],
			axis_y = this.box.max_[1] + this.box.min_[1],
			axis_z = this.box.max_[2] + this.box.min_[2];

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

	function partition(items, left, right, axis, pivot) {
		var i	   = left,
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
			index = partition(items, left, right, axis, items[Math.floor((right + left) / 2)]);
			if (left < index - 1) {
				quickSort(items, left, index - 1, axis, items[Math.floor((right + left) / 2)]);
			}
			if (index < right) {
				quickSort(items, index, right, axis, items[Math.floor((right + left) / 2)]);
			}
		}
		return items;
	}

	function qsplit(items, left, right, axis, pivot) {
		var i = left,
			j = right,
			retval = left;

		while (i <= j) {
			if (sortFunc(items[i], pivot, axis) < 0) {
				swap(items, i, retval);
				retval = retval + 1;
			}
			i = i + 1;
		}
		if (retval === left || retval === right)  {
			//quickSort(items, left, right, axis);
			retval = Math.floor((left + right) / 2);
		}
		return retval;
	}

	BvhNode.prototype.computeVolume = function (primitive_list, lindex, rindex) {
		var i,
			size = rindex - lindex;
		this.box.init();
		for (i = lindex; i <= rindex; i = i + 1) {
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

		this.axis = axis;
		middle = qsplit(primitive_list, lindex, rindex, axis, this);
		/*
		if (size == 2) {
			var sliced = primitive_list.slice(lindex, rindex);
			console.log(lindex, rindex, middle, axis, this.box.center()[axis]);
			for (var i = 0; i < size; ++i) {
				console.log("a:", sliced[i].box.center()[axis]);
			}
		}
		*/
		/*
		middle = Math.floor((lindex + rindex) / 2);

		if (middle === lindex || middle === rindex) {
			quickSort(primitive_list, lindex, rindex, axis);
		}
	*/
		center = middle;

		if ( (center - lindex) > 0) {
			this.left = new BvhNode();
			this.left.init(primitive_list, lindex, center);
		}
		if ( (rindex - center) > 0) {
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
		if (size <= 0) {
			console.error("hoge")
		}
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

	UMBvh.prototype.intersects = function (bvhnode, info, origin, dir, isright) {
		var i,
			result = false,
			param = {},
			a, b,
			invdir = [1.0 / dir.xyz[0], 1.0 / dir.xyz[1], 1.0 / dir.xyz[2]],
			negdir = [invdir[0] < 0, invdir[1] < 0, invdir[2] < 0];

		if (!bvhnode) { return false; }
		if (bvhnode.box.intersects(origin, dir, invdir, negdir, 0.00001, info.closest_distance)) {
			if (!bvhnode.left && !bvhnode.right) {
				//console.log(bvhnode.from, bvhnode.to)
				for (i = bvhnode.from; i <= bvhnode.to; i = i + 1) {
					if (this.primitive_list[i].intersects(origin, dir, param)) {
						//console.log(isright, param.distance)
						if (param.distance < info.closest_distance) {
							info.result = i;
							info.closest_distance = param.distance;
							info.intersect_point = param.intersect_point;
							result = true;
							console.log("primitive number", i)
						}
					}
				}
				if (result) { return result; }
			} else {
				if (bvhnode.right) {
					a = this.intersects(bvhnode.right, info, origin, dir, true);
					result = a;
				}
				if (bvhnode.left) {
					b = this.intersects(bvhnode.left, info, origin, dir, false);
					result = result || b;
				}
			}
		}
		return result;
	};

	UMBvh.prototype.box = function () {
		return this.root.box;
	};

	UMBvh.prototype.getboxlist_ = function (node, box_list, depth) {
		//if (!node.right && !node.left && node.box) {
		if (depth < 10 && node.box) {
			box_list.add(node.box);
		}
		if (node.right) { this.getboxlist_(node.right, box_list, depth + 1); }
		if (node.left) { this.getboxlist_(node.left, box_list, depth + 1); }
	};

	UMBvh.prototype.boxlist = function (box_list) {
		this.getboxlist_(this.root, box_list, 0);
	};

	window.umbvh = {}
	window.umbvh.UMBvh = UMBvh;

}(window.ummath));
