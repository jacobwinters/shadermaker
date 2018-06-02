'use strict';

const settings = {
	operation: 'variations',
	frameRateReduction: 1,
	resolutionReduction: 1,
	continuous: false,
	zoom: 0,
	center: {x: 0, y: 0},
};
const display = makeDisplay(document.getElementById('canvas'));
const initialShaders = [];
for (let y = 0; y < 5; y++) {
	const row = [];
	for (let x = 0; x < 5; x++) {
		row.push(generateNode(5));
	}
	initialShaders.push(row);
}
display.setDisplay(grid(initialShaders));
function draw() {
	display.draw();
	requestAnimationFrame(draw);
}
new Vue({
	el: '#controls',
	data: settings,
});
draw();
