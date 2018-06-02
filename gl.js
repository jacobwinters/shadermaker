"use strict";

function initWebGL(canvas){
	const gl = canvas.getContext('webgl');
	var oldWidth, oldHeight, oldResolutionReduction, oldBufferWidth, oldBufferHeight;
	function startFrame() {
		if (canvas.clientWidth !== oldWidth || canvas.clientHeight !== oldHeight || settings.resolutionReduction !== oldResolutionReduction || gl.drawingBufferWidth !== oldBufferWidth || gl.drawingBufferHeight !== oldBufferHeight) {
			canvas.width = canvas.clientWidth * devicePixelRatio / settings.resolutionReduction;
			canvas.height = canvas.clientHeight * devicePixelRatio / settings.resolutionReduction;
			oldWidth = canvas.clientWidth;
			oldHeight = canvas.clientHeight;
			oldResolutionReduction = settings.resolutionReduction;
			oldBufferWidth = gl.drawingBufferWidth;
			oldBufferHeight = gl.drawingBufferHeight;
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		}
	}
	return {
		gl: gl,
		startFrame: startFrame,
		canvas: canvas
	};
}

function shaderCompiler(gl) {
	const vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vshader,
		'precision highp float;\
		attribute vec2 position;\
		uniform vec2 center;\
		uniform vec2 size;\
		uniform vec2 innerCenter;\
		uniform vec2 innerSize;\
		varying vec2 coord;\
		void main(void){\
			gl_Position = vec4(center + size * position, 1., 1.);\
			coord = innerCenter + innerSize * position;\
		}');
	gl.compileShader(vshader);
	const positions = new Float32Array(flatten([[1, -1], [-1, -1], [1, 1], [-1, 1]]));
	const vertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

	return function compileShader(code) {
		const shaderProgram = gl.createProgram();
		const fshader = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(fshader, code);
		gl.compileShader(fshader);
		if(!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)){
			alert('Fragment shader error');
			console.log(gl.getShaderInfoLog(fshader), code);
		}
		gl.attachShader(shaderProgram, vshader);
		gl.attachShader(shaderProgram, fshader);
		gl.deleteShader(fshader);
		gl.linkProgram(shaderProgram);
		function draw(setUniforms, posX, posY, sizeX, sizeY, posXInner, posYInner, sizeXInner, sizeYInner) {
			gl.useProgram(shaderProgram);
			const positionAttrib = gl.getAttribLocation(shaderProgram, 'position');
			gl.enableVertexAttribArray(positionAttrib);
			gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
			setUniforms(gl, shaderProgram);
			gl.uniform2f(gl.getUniformLocation(shaderProgram, 'position'), posX, posY);
			gl.uniform2f(gl.getUniformLocation(shaderProgram, 'center'), posX, posY);
			gl.uniform2f(gl.getUniformLocation(shaderProgram, 'size'), sizeX, sizeY);
			gl.uniform2f(gl.getUniformLocation(shaderProgram, 'innerCenter'), posXInner, posYInner);
			gl.uniform2f(gl.getUniformLocation(shaderProgram, 'innerSize'), sizeXInner, sizeYInner);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}
		function dispose(){
			gl.deleteProgram(shaderProgram);
		}
		return {
			draw: draw,
			dispose: dispose
		};
	}
}

function nodeShaderCompiler(compileShader) {
	return function compileNodeShader(node) {
		var disposed = false;
		const compiledShaderPromise = new Promise((resolve) => setTimeout(() => { if(!disposed) { resolve(compileShader(compileToShader(node))) } }));
		var compiledShader;
		compiledShaderPromise.then((compiledShader_) => compiledShader = compiledShader_);
		function draw(time, posX, posY, sizeX, sizeY, posXInner, posYInner, sizeXInner, sizeYInner) {
			function setTime(gl, shaderProgram){
				gl.uniform1f(gl.getUniformLocation(shaderProgram, 'time'), time);
			}
			if(compiledShader) {
				compiledShader.draw(setTime, posX, posY, sizeX, sizeY, posXInner, posYInner, sizeXInner, sizeYInner);
			}
		}
		return {
			draw: draw,
			dispose: () => {
				compiledShaderPromise.then((compiledShader) => compiledShader.dispose());
				disposed = true;
			}
		};
	}
}
