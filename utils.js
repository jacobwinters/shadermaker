'use strict';

function flatten(arrayOfArrays) {
	return [].concat.apply([], arrayOfArrays);
}

function randomFromArray(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomKeyFromObject(obj) {
	return randomFromArray(Object.keys(obj));
}

function clamp(x, min, max) {
	return Math.min(Math.max(x, min), max);
}
