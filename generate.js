'use strict';

function generateNode(maxDepth, type = 'texture') {
	if (Math.random() * (maxDepth + 1) < 1) {
		return generateLeaf(type);
	} else {
		return generateNodeOfType(maxDepth, type, randomKeyFromObject(nodeTypes[type]));
	}
}

const depthPenalty = {
	number: 1 / 8,
	angle: 1 / 8,
	point: 1 / 8,
	color: 1 / 8,
	transform: 1 / 4,
	texture: 2,
};

function generateNodeOfType(maxDepth, nodeKind, nodeType) {
	const params = nodeTypes[nodeKind][nodeType].params.map((each) => generateNode(maxDepth - depthPenalty[each], each));
	return [nodeType].concat(params);
}

function generateLeaf(type) {
	switch (type) {
		case 'number':
			return Math.random();
		case 'angle':
			return Math.random() * 2 * Math.PI;
		case 'point':
			return generateNodeOfType(0, 'point', randomFromArray(['cartesian', 'polar']));
		case 'color':
			return generateNodeOfType(0, 'color', 'from-components');
		case 'transform':
			return generateNodeOfType(0, 'transform', 'identity');
		case 'texture':
			return generateNodeOfType(0, 'texture', 'solid');
	}
}
