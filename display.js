"use strict";

function grid(nodes) {
  return (gl, compiler, display) => {
    $(gl.canvas).click((event) => {
      const x = event.offsetX / gl.canvas.clientWidth;
      const y = 1 - (event.offsetY / gl.canvas.clientHeight);
      display.setDisplay(grid(makeGrid(nodes[Math.floor(x * 5) + Math.floor(y * 5) * 5])));
    });
    const shaders = nodes.map(compiler);
    return {
      draw(time) {
        for(var i = 0; i < 25; i++) {
          const posX = ((i % 5) - 2) * 2/5;
          const posY = Math.floor((i / 5) - 2) * 2/5;
          const size = 1 / 5;
          shaders[i].draw(time, posX, posY, size, size, 0, 0, 2, 2);
        }
      },
      dispose() {
        shaders.forEach((shader) => shader.dispose());
      }
    }
  }
}

function justOne(node){
  return (gl, compiler, display) => {
    const compiledShader = compiler(node);
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
  const compiler = nodeShaderCompiler(shaderCompiler(gl.gl));
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
