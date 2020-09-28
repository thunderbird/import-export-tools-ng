const fs = require('fs-extra');
var parser = require("dtd-file");
const path = require('path');
const prettier = require("prettier");

const localeDir = "../src/chrome/locale";
const referenceLocaleId = "en-US";

const dtdTestFile = "de/settings.dtd";
const propertyTestFile = "en-US/settings.properties";
const propertyTestFile2 = "de/settings.properties";
const jsonTestFileOut = "../src/_locales/de/settings";
const jsonTestFileOut3 = "../src/_locales/de/settings2";
const jsonTestFileOut2 = "../src/_locales/en-US/settings2";

var keyName = "";
var msg = "";

var templates = {
	tbMessageJson: {
		ext: "json",
		tmp: `"${keyName}":\n\t"message": ${msg}`,
	},
}

function loadPropertys(propertyFile, options) {
	let propertiesText = fs.readFileSync(`${options.inputLocaleDir}/${propertyFile}`, 'utf-8');
	console.debug(propertiesText);
	const rg = /^(.+)=(.+)$/gm;
	let properties = Array.from(propertiesText.matchAll(rg));
	// console.debug(properties);
	let propertyStrings = properties.map(p => {
		// return {`"${p[1]}": "${p[2]}"`});
		let key = p[1];
		let str = p[2];
		return { [key]: str };
		// return { `"${p[1]}"`: "a"};
	});
	// console.debug(propertyStrings);
	return propertyStrings;
}

function loadDTD(dtdFile, options) {
	let fileEntitiesKeys = Object.keys(parser.parse(fs.readFileSync(`${options.inputLocaleDir}/${dtdFile}`, 'utf-8')));
	let fileEntities = parser.parse(fs.readFileSync(`${options.inputLocaleDir}/${dtdFile}`, 'utf-8'));
	// console.debug(fileEntities);
	return fileEntities;
}

function srcItemsToMessageJson(fileEntities, iFile, options) {
	// var itemTemplate = options.template.tmp;
	console.debug('OutputMessages - sj');
	console.debug(fileEntities);
	var outputMessages = "{\n";

	if (options.append) {
		outputMessages = ",\n";
	}

	var outputKeys = "";

	let currentFileKey = `\n\n\t"ColumnsWizard-file-src-${iFile}": {\n\t\t"message": "${options.inputLocaleDir}"\n\t},\n`;

	outputMessages += currentFileKey;

	if (options.propertiesType) {
		fileEntities.forEach((p, i) => {
			let keyName = Object.keys(p)[0];
			let msg = p[keyName];
			let tmp = `\t"${keyName}": {\n\t\t"message": "${msg}"\n\t}`;
			outputMessages += tmp;
			if (i < fileEntities.length - 1) {
				outputMessages += ",\n";
			}
		});
		outputKeys += `__MSG_${keyName}__\n`;
	} else {
		let len = Object.keys(fileEntities).length;

		// console.debug(fileEntities);
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
	}

	if (options.append && !options.lastFile) {
		outputMessages += "\n";
	} else {
		outputMessages += "\n}\n";

	}


	console.debug('OutputMessages');
	console.debug(outputMessages);
	// console.debug(outputFile);
	// console.debug(options);
	// console.debug(JSON.stringify(outputMessages));
	let outFile = `${options.outputLocaleDir}/${outputFile}`;
	if (options.append) {
		console.debug('App ' + outFile);
		outFile = `${options.outputLocaleDir}/messages.json`;
		fs.appendFileSync(outFile, outputMessages);
	} else {
		fs.outputFileSync(outFile + ".json", outputMessages);
	fs.outputFileSync(outFile + ".txt", outputKeys);
	}
	
}


function stringsToJson(inputFiles, outputFile, options) {
	var inputLocaleDir = options.inputLocaleDir;
	var outputLocaleDir = options.outputLocaleDir;

	console.debug('Starting');

	if (!fs.existsSync(`${outputLocaleDir}/messages.json`) && options.append) {
		console.debug('create message base');
		fs.copyFileSync(`./src/_locales/en-US/messages-base.json`, `${outputLocaleDir}/messages.json`);
	}

	inputFiles.forEach(iFile => {
		var strings = [];
		options.lastFile = false;
		console.debug('Processing: ' + iFile);
		if (iFile === inputFiles[inputFiles.length-1]) {
			options.lastFile = true;
		}
		switch (path.extname(iFile)) {
			case '.dtd':
				strings = loadDTD(iFile, options);
				options.propertiesType = false;
				srcItemsToMessageJson(strings, iFile, options);
				break;
			case '.properties':
				strings = loadPropertys(iFile, options);
				options.propertiesType = true;
				srcItemsToMessageJson(strings, iFile, options);
				break;

			default:
				break;
		}

	});

}


var options = {
	inputLocaleDir: `./src/chrome/locale/zh-CN`,
	outputLocaleDir: "./src/_locales/zh-CN",
	append: true,
};

// let inputFile = `${localeDir}/en-US/overlay.dtd`;
let inputFiles = ["settings.dtd", "settings.properties", "overlay.dtd", "overlay.properties"];
// let inputFiles = ["overlay.properties"];
let outputFile = "messages-out";

// let inputFile =  `${localeDir}/de/overlay.dtd`;
// let outputFile = "../src/_locales/de/messages-out";

// testPtoJ(inputFile, outputFile);
console.debug('Start');
console.debug(options);
stringsToJson(inputFiles, outputFile, options);
