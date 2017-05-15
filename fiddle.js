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
  var shaders = [];
  for(var i = 0; i < 12; i++) {
    shaders.push(fiddle(node));
  }
  shaders.push(node);
  for(var i = 0; i < 12; i++) {
    shaders.push(fiddle(node));
  }
  return shaders;
}
