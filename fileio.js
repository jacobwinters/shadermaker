'use strict';

function saveShader(node, shader, size) {
	const string = JSON.stringify(node);
	const dataHeight = Math.max(Math.ceil(string.length / (3 * size)), watermark.length);
	const data = new Uint8Array(size * (size + dataHeight) * 4);

	shader.renderImageData(size, data);

	store7BitASCIIZInImage(string, size, new Uint8Array(data.buffer, size * size * 4));

	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size + dataHeight;
	canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.buffer), size, size + dataHeight), 0, 0);

	canvas.toBlob((blob) => saveFile(blob, 'shader.png'));
}

function openShader(callback) {
	openFile('.shader,.png', (file) => {
		if (file.name.toLowerCase().endsWith('.shader')) {
			// Legacy json text format
			const reader = new FileReader();
			reader.onload = (_) => callback(JSON.parse(reader.result))
			reader.readAsText(file);
		} else {
			const img = new Image();
			const url = URL.createObjectURL(file);
			img.onload = () => {
				URL.revokeObjectURL(url);

				const dataHeight = img.height - img.width;
				const canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = dataHeight;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, -img.width);
				const data = ctx.getImageData(0, 0, img.width, dataHeight).data;

				callback(JSON.parse(extract7BitASCIIZFromImage(data)));
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
			}
			img.src = url;
		}
	});
}

function saveFile(blob, name) {
	const url = URL.createObjectURL(blob);
	const element = document.createElement('a');
	element.href = url;
	element.download = name;
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openFile(type, callback) {
	const element = document.createElement('input');
	element.type = 'file';
	element.accept = type;
	element.addEventListener('change', (event) => {
		if (element.files.length === 1) {
			callback(element.files[0]);
		}
	});
	element.click();
	openFile.referenceToElementThatWeKeepAroundBecauseIfWeDontThisFunctionDoesntWorkInSafari = element;
}

const watermark = [
	' @            @         @     @   @      @                 @  @ @         @  @                  @    @    ',
	'    @@ @@ @@@ @@@ @   @   @@  @@ @@@ @@ @    @@ @@@ @@@@   @ @  @@   @@ @@@ @@@ @@    @@@@   @@ @ @ @@@ @@',
	' @ @ @ @  @ @ @ @ @ @ @ @ @ @ @  @   @   @   @  @ @ @ @ @ @   @ @ @ @ @ @ @ @   @  @@ @ @ @ @ @ @@  @   @ ',
	'@@  @@ @@ @@@ @@@  @ @  @ @ @  @  @@ @  @  @ @@ @@@ @ @ @ @  @  @ @  @@ @@@  @@ @     @ @ @  @@ @ @  @@ @ ',
];

function store7BitASCIIZInImage(string, width, imgBuffer) {
	const height = imgBuffer.length / width;
	for (let si = 0, ibi = 0; true; ) {
		/* R */ if (si === string.length) { break; }  imgBuffer[ibi++] = string.charCodeAt(si++);
		/* G */ if (si === string.length) { break; }  imgBuffer[ibi++] = string.charCodeAt(si++);
		/* B */ if (si === string.length) { break; }  imgBuffer[ibi++] = string.charCodeAt(si++);
		/* A */ ibi++;
	}
	for (let i = 0; i < imgBuffer.length; i += 4) {
		/* R */ imgBuffer[i + 0] |= 0b10000000;
		/* G */ imgBuffer[i + 1] |= 0b10000000;
		/* B */ imgBuffer[i + 2] |= 0b10000000;
		/* A */ imgBuffer[i + 3] = 0b11111111;
	}
	for (let row = 0; row < watermark.length; row++) {
		for (let col = 0; col < Math.min(width, watermark[row].length); col++) {
			if (watermark[row][col] === '@') {
				/* R */ imgBuffer[(row * width + col) * 4 + 0] &= 0b01111111;
				/* G */ imgBuffer[(row * width + col) * 4 + 1] &= 0b01111111;
				/* B */ imgBuffer[(row * width + col) * 4 + 2] &= 0b01111111;
			}
		}
	}
}

function extract7BitASCIIZFromImage(imgBuffer) {
	for (let i = 0; i < imgBuffer.length; i++) {
		imgBuffer[i] &= 0b01111111;
	}
	let lastIndex = imgBuffer.indexOf(0);
	if (lastIndex === -1) {
		lastIndex = imgBuffer.length;
	}
	const textSize = ~~(lastIndex / 4) * 3 + lastIndex % 4;
	const stringData = new Uint8Array(textSize);
	for (let ibi = 0, sdi = 0; true; ) {
		/* R */ if (ibi === lastIndex) { break; }  stringData[sdi++] = imgBuffer[ibi++];
		/* G */ if (ibi === lastIndex) { break; }  stringData[sdi++] = imgBuffer[ibi++];
		/* B */ if (ibi === lastIndex) { break; }  stringData[sdi++] = imgBuffer[ibi++];
		/* A */ ibi++;
	}
	return String.fromCodePoint(...stringData);
}

function test7BitASCIIZEncoding() {
	const testCases = [
		// Simple strings with a variety of lengths
		'',
		'1',
		'12',
		'123',
		'1234',
		'12345',
		'123456',
		'1234567',

		// Fill the array exactly
		'~'.repeat(256 / 4 * 3),

		// Every valid character
		String.fromCodePoint(...[...Array(127).keys()].map((i) => i + 1)),
	];

	for (const testCase of testCases) {
		const data = new Uint8Array(256);
		store7BitASCIIZInImage(testCase, 1, data);
		if (extract7BitASCIIZFromImage(data) !== testCase) throw testCase;
	}
}
