"use strict";

function fiddle(node, type = 'texture') {
	const nodeType = nodeTypes[type][node[0]];
	if(Math.random() < .1) {
		return generateNode(5, type);
	} else {
		if(typeof node === 'number') {
			return node;
		} else {
			return [node[0]].concat(nodeType.params.map((each, index) => fiddle(node[index + 1], each)));
		}
	}
}

function makeGrid(node) {
	const shaders = [];
	for(var y = 0; y < 5; y++) {
		const row = [];
		for(var x = 0; x < 5; x++) {
			row.push((y == 2 && x == 2) ? node : fiddle(node));
		}
		shaders.push(row);
	}
	return shaders;
}
