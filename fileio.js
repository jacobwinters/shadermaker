'use strict';

function saveFile(object, name, type) {
	const blob = new Blob([JSON.stringify(object)]);
	const url = URL.createObjectURL(blob);
	const element = document.createElement('a');
	element.href = url;
	element.download = `${name}.${type}`;
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
	URL.revokeObjectURL(url);
}

function openFile(type, callback) {
	const element = document.createElement('input');
	element.type = 'file';
	element.accept = `.${type}`;
	element.addEventListener('change', (event) => {
		if (element.files.length === 1) {
			const reader = new FileReader();
			reader.onload = (_) => callback(JSON.parse(reader.result));
			reader.readAsText(element.files[0]);
		}
	});
	element.click();
	openFile.referenceToElementThatWeKeepAroundBecauseIfWeDontThisFunctionDoesntWorkInSafari = element;
}
