"use strict";

const nodeKinds = {
	// number (usually time) -> point
	point: {
		returnType: "vec2",
		parameters: "float position"
	},
	// number (usually time, but not always) -> number in [0, 1]
	number: {
		returnType: "float",
		parameters: "float position"
	},
	// number (usually time, but not always) -> radians
	angle: {
		returnType: "float",
		parameters: "float position"
	},
	// number (usually time) -> color
	color: {
		returnType: "vec3",
		parameters: "float position"
	},
	// time and point -> color
	texture: {
		returnType: "vec3",
		parameters: "vec3 position"
	},
	// time and point -> point
	transform: {
		returnType: "vec3",
		parameters: "vec3 position"
	}
}

const nodeTypes = {
	transform: {
		"skew": {
			params: ["point"],
			code: ["mat2 transform = mat2(1., `1(position.z), 1.);",
				"return vec3(transform * position.xy, position.z);"
			]
		},
		"rotate": {
			params: ["angle"],
			code: ["float angle = `1(position.z);",
				"mat2 transform = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));",
				"return vec3(transform * position.xy, position.z);"
			]
		},
		"scale": {
			params: ["point"],
			code: ["return vec3(position.xy * `1(position.z), position.z);"]
		},
		"invert": {
			params: [],
			code: ["float len = length(position.xy);",
				"return vec3(position.xy / (len*len), position.z);"
			]
		},
		"translate": {
			params: ["point"],
			code: ["return vec3(position.xy + `1(position.z), position.z);"]
		},
		"swirl": {
			params: ["angle"],
			code: ["float angle = `1(length(position.xy));",
				"mat2 transform = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));",
				"return vec3(transform * position.xy, position.z);"
			]
		},
		// Math taken from http://flam3.com/flame_draves.pdf (a good source of interesting transforms)
		"sphere": {
			params: [],
			code: ["return vec3(position.xy * (length(position.xy) + 1.) / 2., position.z);"]
		},
		// This function's output is as far from the center, by Euclidean distance, as the input was from the center in Manhattan distance
		// This sympy code verifies that it is correct:
		// from sympy.geometry import *
		//
		// def manhattanDistance(p1, p2):
		//     return abs(p1."x-p"2.x) + abs(p1."y-p"2.y)
		//
		// p = Point(x, y)
		// p2 = p * (abs(x) + abs(y)) / sqrt(x**2 + y**2)
		// simplify(Eq(p2.distance(Point(0, 0)), manhattanDistance(p, Point(0, 0))))
		"manhattan": {
			params: [],
			code: ["return vec3(normalize(position.xy) * (abs(position.x) + abs(position.y)), position.z);"]
		},
		// Parameters: angle of wave, wave, phase of wave
		"waves": {
			params: ["angle", "number", "angle"],
			code: ["float angle = `1(position.z);",
				"vec2 unitVectorInDirection = vec2(cos(angle), sin(angle));",
				"float waveOffsetFromPosition = dot(unitVectorInDirection, position.xy);",
				"float waveOffset = waveOffsetFromPosition + `3(position.z);",
				"float offset = `2(waveOffset);",
				"vec2 orthogonalUnitVector = vec2(-sin(angle), cos(angle));",
				"return vec3(position.xy + orthogonalUnitVector * offset, position.z);"
			]
		},
		"compose": {
			params: ["transform", "transform"],
			code: ["return `2(`1(position));"]
		},
		"elliptic": {
			params: [],
			code: ["float x = cosh(position.x) * cos(position.y);",
				"float y = sinh(position.x) * sin(position.y);",
				"return vec3(x, y, position.z);"
			]
		},
		"bipolar": {
			params: [],
			code: ["float denominator = cosh(position.x) - cos(position.y);",
				"float x = sinh(position.x) / denominator;",
				"float y = sin(position.y) / denominator;",
				"return vec3(x, y, position.z);"
			]
		},
		// Math taken from http://flam3.com/flame_draves.pdf (a good source of interesting transforms)
		"sphere-inverse": {
			params: [],
			code: ["return vec3(position.xy * 2. / (length(position.xy) + 1.), position.z);"]
		}
	},
	texture: {
		"solid": {
			params: ["color"],
			code: ["return `1(position.z);"]
		},
		"transform": {
			params: ["texture", "transform"],
			code: ["return `1(`2(position));"]
		},
		"checkerboard": {
			params: ["texture", "texture", "transform"],
			code: ["vec2 checkerTestPoint = `3(position).xy;",
				"if(mod(floor(checkerTestPoint.x), 2.) == 0. ^^ mod(floor(checkerTestPoint.y), 2.) == 0.) {",
				"  return `1(position);",
				"} else {",
				"  return `2(position);",
				"}"
			]
		},
		// Parameters: texture1, texture2, angle of wave, wave, phase of wave
		"gradient": {
			params: ["texture", "texture", "angle", "number", "angle"],
			code: ["float angle = `3(position.z);",
				"vec2 unitVectorInDirection = vec2(cos(angle), sin(angle));",
				"float waveOffsetFromPosition = dot(unitVectorInDirection, position.xy);",
				"float waveOffset = waveOffsetFromPosition + `5(position.z);",
				"float blend = `4(waveOffset);",
				"return colormix(`1(position), `2(position), blend);"
			]
		},
		"hue-substitute": {
			params: ["texture", "texture"],
			code: ["float hue = `1(position).x;",
				"vec3 rest = `2(position);",
				"return vec3(hue, rest.yz);"
			]
		},
		"saturation-substitute": {
			params: ["texture", "texture"],
			code: ["float saturation = `1(position).y;",
				"vec3 rest = `2(position);",
				"return vec3(rest.x, saturation, rest.z);"
			]
		},
		"lightness-substitute": {
			params: ["texture", "texture"],
			code: ["float lightness = `1(position).z;",
				"vec3 rest = `2(position);",
				"return vec3(rest.xy, lightness);"
			]
		}
	},
	color: {
		"from-components": {
			params: ["angle", "number", "number"],
			code: ["return vec3(`1(position), `2(position), `3(position));"]
		}
	},
	point: {
		"cartesian": {
			params: ["number", "number"],
			code: ["float x = `1(position);",
				"float y = `2(position);",
				"return vec2(x, y);"
			]
		},
		"polar": {
			params: ["angle", "number"],
			code: ["float t = `1(position);",
				"float r = `2(position);",
				"return r * vec2(cos(t), sin(t));"
			]
		},
		"transform": {
			params: ["point", "transform"],
			code: ["return `2(vec3(`1(position), position)).xy;"]
		}
	},
	number: {
		"sine": {
			params: [],
			code: ["return sin(position) * .5 + .5;"]
		},
		"triangle": {
			params: [],
			code: ["return abs(mod(position / PI, 2.) - 1.);"]
		},
		"average": {
			params: ["number", "number"],
			code: ["return (`1(position) + `2(position)) / 2.;"]
		},
		"change-phase": {
			params: ["number", "number" /* Constant */ ],
			code: ["return `1(position + `2(0.));"]
		},
		"change-frequency": {
			params: ["number", "number" /* Constant */ ],
			code: ["return `1(position * `2(0.) * 2.); // Without the * 2 this could only decrease frequency because `2() is in [0, 1]"]
		}
	},
	angle: {
		"from-number": {
			params: ["number", "number" /* Constant */ ],
			code: ["return (`1(position) + `2(0.)) * 2. * PI;"]
		},
		"constant-forward": {
			params: ["angle", "number" /* Constant */ ],
			code: ["return `1(position) + position * `2(0.);"]
		}
	}
}
