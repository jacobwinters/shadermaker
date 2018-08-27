'use strict';

function compile(node, type = 'texture', counter = makeCounter()) {
	const ourId = counter();
	if (typeof node === 'number') {
		return {code: `float node${ourId}(float position){ return ${numberToGlslString(node)}; }`, id: ourId};
	} else {
		const nodeType = nodeTypes[type][node[0]];
		const children = nodeType.params.map((childType, index) => compile(node[index + 1], childType, counter));

		const code = `${nodeKinds[type].returnType} node${ourId}(${nodeKinds[type].parameters}) {
	// ${type} ${node[0]}
	${nodeType.code.join('\n\t')}
}`;

		const codeWithChildrenCalls = code.replace(/`([0-9]+)/g, (_, number) => `node${children[Number(number) - 1].id}`);
		const codeWithChildren = children
			.map((child) => child.code)
			.concat([codeWithChildrenCalls])
			.join('\n');
		return {code: codeWithChildren, id: ourId};
	}
}

function numberToGlslString(x) {
	const str = x.toString();
	return str + (str.includes('.') ? '' : '.');
}

function makeCounter() {
	let i = 1;
	return function() {
		return i++;
	};
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
	float hue = hslcolor.x;
	float saturation = hslcolor.y;
	float lightness = hslcolor.z;
	float chroma = (1. - abs(2. * lightness - 1.)) * saturation;
	float hPrime = hue / (PI / 3.);
	float x = chroma * (1. - abs(mod(hPrime, 2.) - 1.));
	vec3 color;
	if(hPrime <= 1.){
		color = vec3(chroma, x, 0.);
	} else if(hPrime <= 2.){
		color = vec3(x, chroma, 0.);
	} else if(hPrime <= 3.){
		color = vec3(0., chroma, x);
	} else if(hPrime <= 4.){
		color = vec3(0., x, chroma);
	} else if(hPrime <= 5.){
		color = vec3(x, 0., chroma);
	} else {
		color = vec3(chroma, 0., x);
	}
	color += lightness - chroma / 2.;
	gl_FragColor = vec4(color, 1.);
}`;
}
