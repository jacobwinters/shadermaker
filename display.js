'use strict';

function grid(nodes) {
	return (gl, compiler, display) => {
		function eventCoordsToGrid(event) {
			const x = event.offsetX / gl.canvas.clientWidth;
			const y = 1 - event.offsetY / gl.canvas.clientHeight;
			return [Math.floor(y * 5), Math.floor(x * 5)];
		}
		function clickListener(event) {
			const [y, x] = eventCoordsToGrid(event);
			if (settings.operation === 'variations') {
				display.setDisplay(grid(makeGrid(nodes[y][x])));
			} else if (settings.operation === 'save') {
				saveFile(nodes[y][x], 'shader', 'shader');
			} else if (settings.operation === 'open') {
				openFile('shader', (shader) => setShader(y, x, shader));
			}
		}
		function setShader(y, x, shader) {
			nodes[y][x] = shader;
			shaders[y][x].dispose();
			shaders[y][x] = compiler(shader);
		}
		gl.canvas.addEventListener('click', clickListener);
		const shaders = nodes.map((row) => row.map(compiler));
		return {
			draw(time) {
				const zoomRadius = Math.exp(-settings.zoom) * 2;
				for (let y = 0; y < 5; y++) {
					const posY = (y - 2) * 2 / 5;
					for (let x = 0; x < 5; x++) {
						const posX = (x - 2) * 2 / 5;
						const size = 1 / 5;
						const continuousOffsetX = settings.continuous ? zoomRadius * 2 * (x - 2) : 0;
						const continuousOffsetY = settings.continuous ? zoomRadius * 2 * (y - 2) : 0;
						shaders[y][x].draw(time, posX, posY, size, size, settings.center.x + continuousOffsetX, settings.center.y + continuousOffsetY, zoomRadius, zoomRadius);
					}
				}
			},
			dispose() {
				shaders.forEach((row) => row.forEach((shader) => shader.dispose()));
				gl.canvas.removeEventListener('click', clickListener);
			},
		};
	};
}

function justOne(node) {
	return (gl, compiler, display) => {
		const compiledShader = compiler(node);
		return {
			draw(time) {
				compiledShader.draw(time, 0, 0, 1, 1, 0, 0, 2, 2);
			},
			dispose() {
				compiledShader.dispose();
			},
		};
	};
}

function makeDisplay(canvas) {
	canvas.addEventListener('wheel', (event) => {
		if (event.deltaY > 0) {
			settings.zoom += 0.1;
		} else if (event.deltaY < 0) {
			settings.zoom -= 0.1;
		}
		settings.zoom = clamp(settings.zoom, -2, 2);
	});
	canvas.addEventListener('mousemove', (event) => {
		if (settings.operation === 'pan' && event.buttons & 1) {
			const zoomScale = 2 * 5 * Math.exp(-settings.zoom) * 2;
			settings.center.x -= event.movementX * zoomScale / gl.canvas.clientWidth;
			settings.center.y += event.movementY * zoomScale / gl.canvas.clientHeight;
		}
	});
	const gl = initWebGL(canvas);
	const compiler = nodeShaderCompiler(shaderCompiler(gl.gl));
	let display;
	let time = 0;
	let frameNumber = 0;
	const me = {
		setDisplay(displayMaker) {
			if (display) {
				display.dispose();
			}
			display = displayMaker(gl, compiler, me);
		},
		draw() {
			time += 0.01;
			frameNumber++;
			if (frameNumber % settings.frameRateReduction === 0) {
				gl.startFrame();
				display.draw(time);
			}
		},
	};
	return me;
}
