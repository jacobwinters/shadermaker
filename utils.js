"use strict";

function flatten(arrayOfArrays) {
  return [].concat.apply([], arrayOfArrays);
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomFromObject(obj) {
  return obj[randomFromArray(Object.keys(obj))];
}
