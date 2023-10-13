'use strict';

const vshaderSource = `
precision highp float;
attribute vec2 position;
attribute vec2 innerPosition;
varying vec2 coord;
void main(void){
	gl_Position = vec4(position, 1., 1.);
	coord = innerPosition;
}
`.trim();

function initWebGL() {
	let canvas = new OffscreenCanvas(0, 0);
	let gl = canvas.getContext('webgl', {depth: false});
	if (!gl) {
		// At time of writing Safari doesn't support WebGL on OffscreenCanvas
		canvas = document.createElement('canvas');
		gl = canvas.getContext('webgl', {depth: false});
	}
	const maxSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

	const vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vshader, vshaderSource);
	gl.compileShader(vshader);

	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());

	let posx = 0, posy = 0, maxw = 0, maxh = 0;
	let draws = [];
	let bitmapCallbacks = [];

	let me;

	return me = {
		compile(node) {
			let disposed = false;
			let shaderProgram = null;
			function ensureShaderCompiled() {
				if (shaderProgram !== null || disposed) return;
				shaderProgram = gl.createProgram();
				const fshader = gl.createShader(gl.FRAGMENT_SHADER);
				gl.shaderSource(fshader, compileToShader(node));
				gl.compileShader(fshader);
				if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
					alert('Fragment shader error');
					console.log(gl.getShaderInfoLog(fshader), code);
				}
				gl.attachShader(shaderProgram, vshader);
				gl.attachShader(shaderProgram, fshader);
				gl.deleteShader(fshader);
				gl.linkProgram(shaderProgram);
			}
			setTimeout(ensureShaderCompiled);

			return {
				node,
				draw(width, height, time, xmin, ymin, xmax, ymax, callback) {
					ensureShaderCompiled();
					if (posx + width > maxSize) {
						posx = 0;
						posy += maxh;
					}
					if (posy + height > maxSize) {
						me.endFrame();
					}
					const leftpx = posx;
					const toppx = posy;
					maxw = Math.max(maxw, posx + width);
					maxh = Math.max(maxh, posy + height);
					posx += width;

					draws.push(() => {
						const rescaleX = (x) => x / (maxw / 2) - 1;
						const rescaleY = (y) => y / (maxh / 2) - 1;
						const top = rescaleY(toppx);
						const bottom = rescaleY(toppx + height);
						const left = rescaleX(leftpx);
						const right = rescaleX(leftpx + width);
						const positions = new Float32Array([
							left, -top, xmin, ymax,
							left, -bottom, xmin, ymin,
							right, -top, xmax, ymax,
							right, -bottom, xmax, ymin,
						]);
						gl.useProgram(shaderProgram);
						gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
						const positionAttrib = gl.getAttribLocation(shaderProgram, 'position');
						gl.enableVertexAttribArray(positionAttrib);
						gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 16, 0);
						const innerPositionAttrib = gl.getAttribLocation(shaderProgram, 'innerPosition');
						gl.enableVertexAttribArray(innerPositionAttrib);
						gl.vertexAttribPointer(innerPositionAttrib, 2, gl.FLOAT, false, 16, 8);
						gl.uniform1f(gl.getUniformLocation(shaderProgram, 'time'), time);
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
						bitmapCallbacks.push((b) => callback(b, leftpx, toppx));
					});
				},
				isReady() {
					return shaderProgram !== null;
				},
				dispose() {
					if (shaderProgram) {
						gl.deleteProgram(shaderProgram);
					}
					disposed = true;
				},
			};
		},

		endFrame() {
			if (!draws.length) return;

			canvas.width = maxw;
			canvas.height = maxh;
			gl.viewport(0, 0, maxw, maxh);

			for (const draw of draws) draw();
			draws = [];

			const bitmap = canvas instanceof OffscreenCanvas ? canvas.transferToImageBitmap() : canvas;
			for (const callback of bitmapCallbacks) callback(bitmap);
			bitmapCallbacks = [];
			if (bitmap instanceof ImageBitmap) bitmap.close();

			posx = posy = maxw = maxh = 0;
		},
	};
}
