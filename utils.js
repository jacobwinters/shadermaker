'use strict';

function randomFromArray(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomKeyFromObject(obj) {
	return randomFromArray(Object.keys(obj));
}

function clamp(x, min, max) {
	return Math.min(Math.max(x, min), max);
}

function changeDetector() {
	let oldArgs = null;
	return function(...args) {
		if (oldArgs == null) {
			oldArgs = args;
			return true;
		}
		if (args.length != oldArgs.length) {
			oldArgs = args;
			return true;
		}
		for (let i = 0; i < oldArgs.length; i++) {
			if (args[i] !== oldArgs[i]) {
				oldArgs = args;
				return true;
			}
		}
		return false;
	}
}