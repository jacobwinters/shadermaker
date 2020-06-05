'use strict';

function initWebGL(canvas) {
	const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
	let paramsChanged = changeDetector();
	function startFrame() {
		const {width: cWidth, height: cHeight} = canvas.getBoundingClientRect();
		if (paramsChanged(cWidth, cHeight, settings.resolutionReduction, gl.drawingBufferWidth, gl.drawingBufferHeight, devicePixelRatio)) {
			canvas.width = Math.round(cWidth * devicePixelRatio / settings.resolutionReduction);
			canvas.height = Math.round(cHeight * devicePixelRatio / settings.resolutionReduction);
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		}
	}
	return {
		gl: gl,
		startFrame: startFrame,
		canvas: canvas,
	};
}

function shaderCompiler(gl) {
	const vshader = gl.createShader(gl.VERTEX_SHADER);
	const vshaderSource = `precision highp float;
attribute vec2 position;
attribute vec2 innerPosition;
varying vec2 coord;
void main(void){
	gl_Position = vec4(position, 1., 1.);
	coord = innerPosition;
}`;
	gl.shaderSource(vshader, vshaderSource);

	gl.compileShader(vshader);
	const vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

	return function compileShader(code) {
		const shaderProgram = gl.createProgram();
		const fshader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fshader, code);
		gl.compileShader(fshader);
		if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
			alert('Fragment shader error');
			console.log(gl.getShaderInfoLog(fshader), code);
		}
		gl.attachShader(shaderProgram, vshader);
		gl.attachShader(shaderProgram, fshader);
		gl.deleteShader(fshader);
		gl.linkProgram(shaderProgram);
		function draw(time, xmin, ymin, xmax, ymax, innerXmin, innerYmin, innerXmax, innerYmax) {
			gl.useProgram(shaderProgram);
			const positions = new Float32Array([
				(xmin*2)-1, ((1-ymax)*2)-1, innerXmin, -innerYmax,
				(xmin*2)-1, ((1-ymin)*2)-1, innerXmin, -innerYmin,
				(xmax*2)-1, ((1-ymax)*2)-1, innerXmax, -innerYmax,
				(xmax*2)-1, ((1-ymin)*2)-1, innerXmax, -innerYmin,
			]);
			gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
			const positionAttrib = gl.getAttribLocation(shaderProgram, 'position');
			gl.enableVertexAttribArray(positionAttrib);
			gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 16, 0);
			const innerPositionAttrib = gl.getAttribLocation(shaderProgram, 'innerPosition');
			gl.enableVertexAttribArray(innerPositionAttrib);
			gl.vertexAttribPointer(innerPositionAttrib, 2, gl.FLOAT, false, 16, 8);
			gl.uniform1f(gl.getUniformLocation(shaderProgram, 'time'), time);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}
		function drawInBuffer(size, destinationBuffer, time, innerXmin, innerYmin, innerXmax, innerYmax) {
			const fb = gl.createFramebuffer();
			const texture = gl.createTexture();
			gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
			gl.viewport(0, 0, size, size);

			draw(time, 0, 0, 1, 1, innerXmin, innerYmax, innerXmax, innerYmin); // Flip y because readPixels also flips y
			gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, destinationBuffer);

			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.deleteFramebuffer(fb);
			gl.deleteTexture(texture);
		}
		function dispose() {
			gl.deleteProgram(shaderProgram);
		}
		return {
			draw: draw,
			drawInBuffer: drawInBuffer,
			dispose: dispose,
		};
	};
}

function asyncShaderCompiler(compileShader) {
	return function(shader) {
		let disposed = false;
		let compiledShader = null;
		function forceCompileShader() {
			if (compiledShader === null && !disposed) {
				compiledShader = compileShader(shader);
			}
		}
		setTimeout(forceCompileShader);

		return {
			draw(time, xmin, ymin, xmax, ymax, innerXmin, innerYmin, innerXmax, innerYmax) {
				if (compiledShader) {
					compiledShader.draw(time, xmin, ymin, xmax, ymax, innerXmin, innerYmin, innerXmax, innerYmax);
				}
			},
			drawInBuffer(size, destinationBuffer, time, innerXmin, innerYmin, innerXmax, innerYmax) {
				forceCompileShader();
				compiledShader.drawInBuffer(size, destinationBuffer, time, innerXmin, innerYmin, innerXmax, innerYmax);
			},
			dispose() {
				if (compiledShader) {
					compiledShader.dispose();
				}
				disposed = true;
			},
		};
	};
}
