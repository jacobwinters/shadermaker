"use strict";

// number (usually time) -> point
var points = {};
// number (usually time, but not always) -> number in [0, 1]
var numbers = {};
// number (usually time, but not always) -> radians
var angles = {};
// number (usually time) -> color
var colors = {};
// time and point -> color
var textures = {};
// time and point -> point
var transforms = {};

const nodeTypes = {
  point: points,
  number: numbers,
  angle: angles,
  color: colors,
  texture: textures,
  transform: transforms
};

function buildCode(generator, comment, returnType, params) {
  var code = '';
  function appendToCode(line){
    code += "\t" + line + '\n';
  }
  code += returnType + ' `0(' + params + ') {\n';
  appendToCode(comment);
  generator(appendToCode);
  code += '}';
  return code;
}

function node(map, name, params, code) {
  map[name] = {
    name: name,
    params: params.map((fn) => fn.type),
    code: code
  };
}

function nodeDefiner(type, returnType, parameters){
  const definer = (name, params, code) => {
    node(nodeTypes[type], name, params, buildCode(code, '// ' + type + ' ' + name, returnType, parameters));
  };
  definer.type = type;
  return definer;
}

const point = nodeDefiner('point', 'vec2', 'float position');
const number = nodeDefiner('number', 'float', 'float position');
const angle = nodeDefiner('angle', 'float', 'float position');
const color = nodeDefiner('color', 'vec3', 'float position');
const texture = nodeDefiner('texture', 'vec3', 'vec3 position');
const transform = nodeDefiner('transform', 'vec3', 'vec3 position');

transform('skew', [point], function(c){
  c("mat2 transform = mat2(1., `1(position.z), 1.);");
  c("return vec3(transform * position.xy, position.z);");
});
transform('rotate', [angle], function(c){
  c("float angle = `1(position.z);")
  c("mat2 transform = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));");
  c("return vec3(transform * position.xy, position.z);");
});
transform('scale', [point], function(c){
  c("return vec3(position.xy * `1(position.z), position.z);");
});
transform('invert', [], function(c){
  c("float len = length(position.xy);")
  c("return vec3(position.xy / (len*len), position.z);");
});
transform('translate', [point], function(c){
  c("return vec3(position.xy + `1(position.z), position.z);");
});
texture('solid', [color], function(c){
  c('return `1(position.z);');
});
color('from-components', [angle, number, number], function(c){
  c('return vec3(`1(position), `2(position), `3(position));')
});
point('cartesian', [number, number], function(c){
  c('float x = `1(position);');
  c('float y = `2(position);');
  c('return vec2(x, y);')
});
point('polar', [angle, number], function(c){
  c('float t = `1(position);');
  c('float r = `2(position);');
  c('return r * vec2(cos(t), sin(t));')
});
point('transform', [point, transform], function(c){
  c('return `2(vec3(`1(position), position)).xy;');
});
texture('transform', [texture, transform], function(c){
  c('return `1(`2(position));');
});
texture('checkerboard', [texture, texture, transform], function(c){
  c('vec2 checkerTestPoint = `3(position).xy;');
  c('if(mod(floor(checkerTestPoint.x), 2.) == 0. ^^ mod(floor(checkerTestPoint.y), 2.) == 0.) {');
  c('  return `1(position);');
  c('} else {');
  c('  return `2(position);');
  c('}');
});
// Parameters: texture1, texture2, angle of wave, wave, phase of wave
texture('gradient', [texture, texture, angle, number, angle], function(c){
  c('float angle = `3(position.z);');
  c('vec2 unitVectorInDirection = vec2(cos(angle), sin(angle));');
  c('float waveOffsetFromPosition = dot(unitVectorInDirection, position.xy);');
  c('float waveOffset = waveOffsetFromPosition + `5(position.z);');
  c('float blend = `4(waveOffset);');
  c('return colormix(`1(position), `2(position), blend);');
});
number('sine', [], function(c){
  c('return sin(position) * .5 + .5;')
});
number('triangle', [], function(c){
  c('return abs(mod(position / PI, 2.) - 1.);')
});
number('average', [number, number], function(c){
  c('return (`1(position) + `2(position)) / 2.;');
});
number('change-phase', [number, number /* Constant */], function(c){
  c('return `1(position + `2(0.));');
});
number('change-frequency', [number, number /* Constant */], function(c){
  c('return `1(position * `2(0.) * 2.);'); // Without the * 2 this could only decrease frequency because `2() is in [0, 1]
});
angle('from-number', [number, number /* Constant */], function(c){
  c('return (`1(position) + `2(0.)) * 2. * PI;');
});
angle('constant-forward', [angle, number /* Constant */], function(c){
  c('return `1(position) + position * `2(0.);');
});
texture('hue-substitute', [texture, texture], function(c){
  c('float hue = `1(position).x;');
  c('vec3 rest = `2(position);');
  c('return vec3(hue, rest.yz);');
});
texture('saturation-substitute', [texture, texture], function(c){
  c('float saturation = `1(position).y;');
  c('vec3 rest = `2(position);');
  c('return vec3(rest.x, saturation, rest.z);');
});
texture('lightness-substitute', [texture, texture], function(c){
  c('float lightness = `1(position).z;');
  c('vec3 rest = `2(position);');
  c('return vec3(rest.xy, lightness);');
});
