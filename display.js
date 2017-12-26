"use strict";

function grid(shaders) {
  return (gl, compiler, display) => {
    $(gl.canvas).click((event) => {
      const x = event.offsetX / gl.canvas.clientWidth;
      const y = 1 - (event.offsetY / gl.canvas.clientHeight);
      display.setDisplay(grid(makeGrid(shaders[Math.floor(x * 5) + Math.floor(y * 5) * 5])));
    });
    const shaderResolvers = [];
    const compiledShaderPromises = shaders.map((shader) => new Promise((resolve) => shaderResolvers.push(resolve)));
    var currentShader = 0;
    function compileOneShader() {
      shaderResolvers[currentShader](compiler(compileToShader(shaders[currentShader])));
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
            const posX = ((i % 5) - 2) * 2/5;
            const posY = Math.floor((i / 5) - 2) * 2/5;
            const size = 1 / 5;
            compiledShaders[i].draw(time, posX, posY, size, size, 0, 0, 2, 2);
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
  return (gl, compiler, display) => {
    const compiledShader = compiler(compileToShader(shader));
    return {
      draw(time) {
        compiledShader.draw(time, 0, 0, 1, 1, 0, 0, 2, 2);
      },
      dispose() {
        compiledShader.dispose();
      }
    };
  }
}

function makeDisplay(canvas) {
  const gl = initWebGL(canvas);
  const compiler = shaderCompiler(gl.gl);
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
      display = displayMaker(gl, compiler, me);
    },
    draw() {
      time += .01;
      gl.clear();
      display.draw(time);
    }
  };
  return me;
}
