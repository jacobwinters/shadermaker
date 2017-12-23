"use strict";

function flatten(arrayOfArrays) {
  return [].concat.apply([], arrayOfArrays);
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomKeyFromObject(obj) {
  return randomFromArray(Object.keys(obj));
}
