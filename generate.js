"use strict";

function generateNode(maxDepth, type='texture') {
  if(Math.random() * (maxDepth + 1) < 1) {
    return generateLeaf(type);
  } else {
    return generateNodeOfType(maxDepth, randomFromObject(nodeTypes[type]));
  }
}

var depthPenalty = {
  number: .125,
  angle: .125,
  point: .125,
  color: .125,
  transform: .25,
  texture: 2
};

function generateNodeOfType(maxDepth, nodeType) {
  const params = nodeType.params.map(each => generateNode(maxDepth - depthPenalty[each], each));
  return [nodeType.name].concat(params);
}

function generateLeaf(type) {
  switch(type){
    case 'number':
      return Math.random();
    case 'angle':
      return Math.random() * 2 * Math.PI;
    case 'point':
      return generateNodeOfType(0, randomFromArray([points.cartesian, points.polar]));
    case 'color':
      return generateNodeOfType(0, colors['from-components']);
    case 'transform':
      return generateNodeOfType(0, randomFromArray([transforms.skew, transforms.rotate, transforms.scale, transforms.translate]));
    case 'texture':
      return generateNodeOfType(0, textures.solid);
  }
}
