'use strict';

function grid(nodes) {
	return (gl, container, display) => {
		const canvases = nodes.map((row) => row.map((_) => document.createElement('canvas')));
		const contexts = canvases.map((row) => row.map((c) => c.getContext('2d', {alpha: false})));
		for (let y = 0; y < 5; y++) {
			for (let x = 0; x < 5; x++) {
				container.append(canvases[y][x]);
				canvases[y][x].addEventListener('click', (event) => {
					if (settings.operation === 'variations') {
						display.setDisplay(grid(makeGrid(nodes[y][x])));
					} else if (settings.operation === 'save') {
						saveShader(shaders[y][x], gl, 200);
					} else if (settings.operation === 'open') {
						openShader().then((shader) => setShader(y, x, shader));
					} else if (settings.operation === 'inspect') {
						alert(JSON.stringify(nodes[y][x], null, '\t'));
					}
				});
			}
		}
		function setShader(y, x, shader) {
			nodes[y][x] = shader;
			shaders[y][x].dispose();
			shaders[y][x] = gl.compile(shader);
		}
		const shaders = nodes.map((row) => row.map((node) => gl.compile(node)));
		return {
			draw(time) {
				const zoomRadius = Math.exp(-settings.zoom) * 2;
				for (let y = 0; y < 5; y++) {
					for (let x = 0; x < 5; x++) {
						const centerX = settings.center.x + (settings.continuous ? zoomRadius * 2 * (x - 2) : 0);
						const centerY = settings.center.y + (settings.continuous ? zoomRadius * 2 * -(y - 2) : 0);
						const {width: cWidth, height: cHeight} = canvases[y][x].getBoundingClientRect();
						const width = Math.round(cWidth * devicePixelRatio / settings.resolutionReduction);
						const height = Math.round(cHeight * devicePixelRatio / settings.resolutionReduction);
						if (shaders[y][x].isReady()) {
							shaders[y][x].draw(width, height, time, centerX - zoomRadius, centerY - zoomRadius, centerX + zoomRadius, centerY + zoomRadius, (bitmap, px, py) => {
								canvases[y][x].width = width;
								canvases[y][x].height = height;
								contexts[y][x].drawImage(bitmap, px, py, width, height, 0, 0, width, height);
							});
						}
					}
				}
				gl.endFrame();
			},
			dispose() {
				shaders.forEach((row) => row.forEach((shader) => shader.dispose()));
				container.replaceChildren();
			},
		};
	};
}

function makeDisplay(container) {
	container.addEventListener('wheel', (event) => {
		if (event.deltaY > 0) {
			settings.zoom += 0.1;
		} else if (event.deltaY < 0) {
			settings.zoom -= 0.1;
		}
		settings.zoom = clamp(settings.zoom, -2, 2);
	});
	container.addEventListener('mousemove', (event) => {
		if (settings.operation === 'pan' && event.buttons & 1) {
			const zoomScale = 2 * 5 * Math.exp(-settings.zoom) * 2;
			settings.center.x -= event.movementX * zoomScale / container.clientWidth;
			settings.center.y -= -event.movementY * zoomScale / container.clientHeight;
		}
	});
	const gl = initWebGL();
	let display;
	let time = 0;
	let frameNumber = 0;
	const me = {
		setDisplay(displayMaker) {
			if (display) {
				display.dispose();
			}
			display = displayMaker(gl, container, me);
		},
		draw() {
			time += 0.01;
			frameNumber++;
			if (frameNumber % settings.frameRateReduction === 0) {
				display.draw(time);
			}
		},
	};
	return me;
}
