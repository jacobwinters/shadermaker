"use strict";

var fullscreen = [[1, -1, 1, -1], [-1, -1, -1, -1], [1, 1, 1, 1], [-1, 1, -1, 1]];
var arrays = [fullscreen];
for(var i = 1; i <= 5; i++) {
  for(var j = 1; j <= 5; j++) {
    const xpos = (j - 3) / 2.5
    const ypos = (i - 3) / 2.5;
    arrays.push(fullscreen.map(([x, y, x2, y2]) => [(x / 5) + xpos, (y / 5) + ypos, x2 * 2, y2 * 2]));
  }
}

const positions = new Float32Array(flatten(arrays.map(flatten)));

function initWebGL(canvas){
  const gl = canvas.getContext('webgl');
  const vshader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vshader,
    'precision highp float;\
    attribute vec2 aScreenPosition;\
    attribute vec2 aPosition;\
    varying vec2 coord;\
    void main(void){\
      gl_Position = vec4(aScreenPosition, 1., 1.);\
      coord = aPosition;\
    }');
  gl.compileShader(vshader);
  const vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  function compileShader(code) {
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
    return {
      screenPositionAttrib: gl.getAttribLocation(shaderProgram, 'aScreenPosition'),
      positionAttrib: gl.getAttribLocation(shaderProgram, 'aPosition'),
      timeUniform: gl.getUniformLocation(shaderProgram, 'time'),
      program: shaderProgram,
      dispose: () => { gl.deleteProgram(shaderProgram); }
    };
  }
  function draw(program, time, position) {
    gl.useProgram(program.program);
    gl.enableVertexAttribArray(program.screenPositionAttrib);
    gl.enableVertexAttribArray(program.positionAttrib);
    gl.vertexAttribPointer(program.screenPositionAttrib, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(program.positionAttrib, 2, gl.FLOAT, false, 16, 8);
    gl.uniform1f(program.timeUniform, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, position * 4, 4);
  }
  function clear(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
  return {
    compileShader: compileShader,
    draw: draw,
    clear: clear,
    canvas: canvas
  };
}
