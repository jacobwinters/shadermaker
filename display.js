"use strict";

function grid(shaders) {
  return (gl, display) => {
    $(gl.canvas).click((event) => {
      const x = event.offsetX / gl.canvas.clientWidth;
      const y = 1 - (event.offsetY / gl.canvas.clientHeight);
      display.setDisplay(grid(makeGrid(shaders[Math.floor(x * 5) + Math.floor(y * 5) * 5])));
    });
    const shaderResolvers = [];
    const compiledShaderPromises = shaders.map((shader) => new Promise((resolve) => shaderResolvers.push(resolve)));
    var currentShader = 0;
    function compileOneShader() {
      shaderResolvers[currentShader](gl.compileShader(compileToShader(shaders[currentShader])));
      currentShader++;
      if(currentShader < 25) {
        setTimeout(compileOneShader);
      }
    }
    setTimeout(compileOneShader);
    const compiledShaders = [];
    compiledShaderPromises.forEach((compiledShaderPromise, i) => compiledShaderPromise.then((compiledShader) => compiledShaders[i] = compiledShader));
    return {
      draw(time) {
        for(var i = 0; i < 25; i++) {
          if(compiledShaders[i]) {
            gl.draw(compiledShaders[i], time, i + 1);
          }
        }
      },
      dispose() {
        compiledShaderPromises.forEach((compiledShaderPromise) => compiledShaderPromise.then((compiledShader) => compiledShader.dispose()));
      }
    }
  }
}

function justOne(shader){
  return (gl, display) => {
    const compiledShader = gl.compileShader(compileToShader(shader));
    return {
      draw(time) {
        gl.draw(compiledShader, time, 0);
      },
      dispose() {
        compiledShader.dispose();
      }
    };
  }
}

function makeDisplay(canvas) {
  const gl = initWebGL(canvas);
  var displayMaker;
  var display;
  var time = 0;
  var me = {
    setDisplay(newDisplayMaker) {
      if(display) {
        display.dispose();
      }
      displayMaker = newDisplayMaker;
      $(canvas).off();
      display = displayMaker(gl, me);
    },
    draw() {
      time += .01;
      gl.clear();
      display.draw(time);
    }
  };
  return me;
}
