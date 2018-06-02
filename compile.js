"use strict";

function compile(node, type='texture', counter = makeCounter()){
	if(typeof node === 'number') {
		const ourId = counter();
		return ['float node' + ourId + '(float position){ return ' + numberToGlslString(node) + '; }', ourId];
	} else {
		const nodeType = nodeTypes[type][node[0]];
		const children = nodeType.params.map((childType, index) => compile(node[index + 1], childType, counter));
		const ourId = counter();
		const ourName = 'node' + ourId;
		const names = [ourName].concat(children.map(x => 'node' + x[1]));
		var code = nodeKinds[type].returnType + " " + ourName + "(" + nodeKinds[type].parameters + ") {\n" +
			"\t// " + type + " " + node[0] + "\n\t" +
			nodeType.code.join("\n\t") +
			"\n}";
		names.map((x, index) => [x, index]).reverse().forEach(([name, index]) => { // If not reversed `1 would be replaced before `11, and `11 matches `1
			code = code.replace(RegExp('`' + index, 'g'), name);
		});
		const codeWithChildren = children.map(x => x[0]).concat([code]).join('\n');
		return [codeWithChildren, ourId];
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
	var code = '';
	function c(line) {
		code += line + '\n';
	}
	c('precision mediump float;');
	c('varying vec2 coord;');
	c('uniform float time;');
	c('#define PI 3.1415926535897932384626433832795');
	c('vec3 colormix(vec3 c1,vec3 c2,float factor) {');
	c('	float h1 = max(c1.x, c2.x);');
	c('	float h2 = min(c1.x, c2.x);');
	c('	float d = h1 - h2;');
	c('	if(d > PI){');
	c('		h1 += 2. * PI;');
	c('	}');
	c('	return vec3(mix(h1, h2, factor), mix(c1.yz, c2.yz, factor));');
	c('}');
	c('float sinh(float x) {');
	c('	return (exp(x) - exp(-x)) / 2.;');
	c('}');
	c('float cosh(float x) {');
	c('	return (exp(x) + exp(-x)) / 2.;');
	c('}');
	c('float voronoiDistance(vec2 x) {');
	c('	return min(min(length(x), distance(x, vec2(2., 2.))), min(distance(x, vec2(2., 0.)), distance(x, vec2(0., 2.))));');
	c('}');

	const [body, id] = compile(node);
	c(body);

	c('void main(void) {');
	c('	vec3 hslcolor = node' + id + '(vec3(coord, time));');
	c('	float c = (1. - abs(2. * hslcolor.z)) * hslcolor.y;');
	c('	float h = hslcolor.x / (PI / 3.);');
	c('	float x = c * (1. - abs(mod(h, 2.) - 1.));');
	c('	vec3 color;');
	c('	if(5. <= h){');
	c('		color.r=c;');
	c('		color.b=x;');
	c('	} else if(4. <= h){');
	c('		color.r=x;');
	c('		color.b=c;');
	c('	} else if(3. <= h){');
	c('		color.g=x;');
	c('		color.b=c;');
	c('	} else if(2. <= h){');
	c('		color.g=c;');
	c('		color.b=x;');
	c('	} else if(1. <= h){');
	c('		color.r=x;');
	c('		color.g=c;');
	c('	} else {');
	c('		color.r=c;');
	c('		color.g=x;');
	c('	}');
	c('	color += hslcolor.z - c / 2.;');
	c('	gl_FragColor = vec4(color, 1.);');
	c('}');

	return code;
}
