// As of 2020-01-20, Edge doesn't support canvas.toBlob() yet.

if (!HTMLCanvasElement.prototype.toBlob) {
	HTMLCanvasElement.prototype.toBlob = function(callback) {
		const dataURL = this.toDataURL();
		if (!dataURL.startsWith('data:image/png;base64,')) {
			alert('Error converting canvas to blob');
			return;
		}
		const binaryString = atob(dataURL.substring('data:image/png;base64,'.length));
		const binaryArray = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			binaryArray[i] = binaryString.codePointAt(i);
		}
		callback(new Blob([binaryArray.buffer], {type: 'image/png'}));
	};
}
