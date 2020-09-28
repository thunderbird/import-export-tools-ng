const fs = require('fs-extra');
var parser = require("dtd-file");

const localeDir = "../src/chrome/locale";
const referenceLocaleId = "en-US";

const dtdTestFile = "de/settings.dtd";
const jsonTestFileOut = "../src/_locales/de/settings";

var keyName = "";
var msg = "";

var templates = {
	tbMessageJson: {
		ext: "json",
		tmp: `"${keyName}":\n\t"message": ${msg}`,
	},
}

function loadDTD(dtdFile) {
	let fileEntitiesKeys = Object.keys(parser.parse(fs.readFileSync(dtdFile, 'utf-8')));
	let fileEntities = parser.parse(fs.readFileSync(dtdFile, 'utf-8'));
	// console.debug(fileEntities);

	return fileEntities;

}

function srcItemsToMessageJson(fileEntities, outputFile, options) {
	// var itemTemplate = options.template.tmp;

	var outputMessages = "{\n";
	var outputKeys = "";

	let len = Object.keys(fileEntities).length;
	for (const entityKey in fileEntities) {
		
			keyName = entityKey;
			msg = fileEntities[entityKey];
			// console.debug(msg);
			let tmp = `\t"${keyName}": {\n\t\t"message": "${msg}"\n\t}`;
			outputMessages += tmp;
			if (Object.keys(fileEntities).indexOf(entityKey) !== len - 1) {
				outputMessages += ",\n";
			}
			// console.debug(tmp);
			outputKeys += `__MSG_${entityKey}__\n`;
			
		}

		outputMessages += "\n}\n";
	
		console.debug(outputMessages);
		console.debug(outputFile);
		// console.debug(JSON.stringify(outputMessages));
		fs.writeFileSync(outputFile + ".json", outputMessages);
		fs.writeFileSync(outputFile + ".txt", outputKeys);
}
const test1FilePath = `${localeDir}/${dtdTestFile}`;
function testDtoJ() {
	let entities = loadDTD(test1FilePath);
	srcItemsToMessageJson(entities, jsonTestFileOut);
}

testDtoJ();