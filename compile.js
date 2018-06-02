"use strict";

function compile(node, type='texture', counter = makeCounter()){
	const ourId = counter();
	if(typeof node === 'number') {
		return {code: `float node${ourId}(float position){ return ${numberToGlslString(node)}; }`, id: ourId};
	} else {
		const nodeType = nodeTypes[type][node[0]];
		const children = nodeType.params.map((childType, index) => compile(node[index + 1], childType, counter));

		const code = `${nodeKinds[type].returnType} node${ourId}(${nodeKinds[type].parameters}) {
	// ${type} ${node[0]}
	${nodeType.code.join("\n\t")}
}`;

		const codeWithChildrenCalls = code.replace(/`([0-9]+)/g, (_, number) => `node${children[Number(number) - 1].id}`)
		const codeWithChildren = children.map(child => child.code).concat([codeWithChildrenCalls]).join('\n');
		return {code: codeWithChildren, id: ourId};
	}
}

function numberToGlslString(x) {
	const str = x.toString();
	return str + (str.includes('.') ? '' : '.');
}

function makeCounter() {
	var i = 1;
	return function() {
		return i++;
	}
}

function compileToShader(node) {
	const {code: body, id} = compile(node);
  return `precision mediump float;
varying vec2 coord;
uniform float time;
#define PI 3.1415926535897932384626433832795
vec3 colormix(vec3 c1,vec3 c2,float factor) {
	float h1 = max(c1.x, c2.x);
	float h2 = min(c1.x, c2.x);
	float d = h1 - h2;
	if(d > PI){
		h1 += 2. * PI;
	}
	return vec3(mix(h1, h2, factor), mix(c1.yz, c2.yz, factor));
}
float sinh(float x) {
	return (exp(x) - exp(-x)) / 2.;
}
float cosh(float x) {
	return (exp(x) + exp(-x)) / 2.;
}
float voronoiDistance(vec2 x) {
	return min(min(length(x), distance(x, vec2(2., 2.))), min(distance(x, vec2(2., 0.)), distance(x, vec2(0., 2.))));
}
${body}
void main(void) {
	vec3 hslcolor = node${id}(vec3(coord, time));
	float c = (1. - abs(2. * hslcolor.z)) * hslcolor.y;
	float h = hslcolor.x / (PI / 3.);
	float x = c * (1. - abs(mod(h, 2.) - 1.));
	vec3 color;
	if(5. <= h){
		color.r=c;
		color.b=x;
	} else if(4. <= h){
		color.r=x;
		color.b=c;
	} else if(3. <= h){
		color.g=x;
		color.b=c;
	} else if(2. <= h){
		color.g=c;
		color.b=x;
	} else if(1. <= h){
		color.r=x;
		color.g=c;
	} else {
		color.r=c;
		color.g=x;
	}
	color += hslcolor.z - c / 2.;
	gl_FragColor = vec4(color, 1.);
}`;
}
