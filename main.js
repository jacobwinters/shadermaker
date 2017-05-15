"use strict";

const display = makeDisplay(document.getElementById('canvas'));
const initialShaders = [];
for(var i = 0; i < 25; i++) {
  initialShaders.push(generateNode(5));
}
display.setDisplay(grid(initialShaders));
function draw() {
  display.draw();
  requestAnimationFrame(draw);
}
draw();
