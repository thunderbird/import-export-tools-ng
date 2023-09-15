const fs = require('fs-extra');
const path = require('path');
const prettier = require("prettier");
var parser = require("dtd-file");

const projectId = 'ThunderbirdTranslations';

const key = fs.readJSONSync("/Dev/SecurityMaterial/gapi-key.json").gapiKey;

// Imports the Google Cloud client library
const { Translate } = require('@google-cloud/translate').v2;

// Instantiates a client
const translate = new Translate({ projectId, key });

// console.debug( translate );
var translationArray3 = [
	// common titles
	{"key":"extensionName", "text":"ImportExportTools NG"},
	{"key":"extensionDescription", "text":"Adds tools to import/export messages and folders (NextGen)"},

	{"key": "ctxMenu_ExtensionName.title", "text": "ImportExportTools NG"},
	{"key": "ctxMenu_Options.title", "text": "Options"},
	{"key": "ctxMenu_Help.title", "text": "Help"},


	
	{"key": "toolsCtxMenu_Exp_Profile_Id.title", "text": "Export Profile"},
	{"key": "toolsCtxMenu_Imp_Profile_Id.title", "text": "Import Profile"},
	{"key": "toolsCtxMenu_Backup_Id.title", "text": "Backup"},
	
	{"key": "toolsCtxMenu_Exp_ProfileFull_Id.title", "text": "Full Profile"},
	{"key": "toolsCtxMenu_Exp_ProfileMailOnly_Id.title", "text": "Mail Only"},

	{"key": "msgCtxMenu_TopId.title", "text": "Export Messages As…"},
{"key": "msgCtxMenu_Exp_EMLFormat_Id.title", "text": "EML Message Format"},
{"key": "msgCtxMenu_Exp_HTMLFormat_Id.title", "text": "HTML Format"},
{"key": "msgCtxMenu_Exp_PDFFormat_Id.title", "text": "PDF Format"},
{"key": "msgCtxMenu_Exp_PlainTextFormat_Id.title", "text": "Plain Text Format"},
{"key": "msgCtxMenu_Exp_CSVFormat_Id.title", "text": "CSV Format (Spreadsheet)"},
{"key": "msgCtxMenu_Exp_MboxFormat_Id.title", "text": "mbox Format"},
{"key": "msgCtxMenu_Exp_Index_Id.title", "text": "Message Index"},
{"key": "msgCtxMenu_CopyToClipboard_Id.title", "text": "Copy To Clipboard"},

{"key": "msgCtxMenu_Exp_EMLFormatMsgsOnly_Id.title", "text": "Messages (Attachments Embedded)"},
{"key": "msgCtxMenu_Exp_EMLFormatCreateIndex_Id.title", "text": "Messages And HTML Index"},
{"key": "msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id.title", "text": "Messages Only"},
{"key": "msgCtxMenu_Exp_HTMLFormatSaveAtts_Id.title", "text": "Messages And Attachments"},
{"key": "msgCtxMenu_Exp_HTMLFormatCreateIndex_Id.title", "text": "Messages And HTML Index"},
{"key": "msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id.title", "text": "Messages With Attachments And Index"},
{"key": "msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id.title", "text": "Messages Only"},
{"key": "msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id.title", "text": "Messages And Attachments"},
{"key": "msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id.title", "text": "Messages And HTML Index"},
{"key": "msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id.title", "text": "Messages With Attachments And Index"},
{"key": "msgCtxMenu_Exp_MboxFormatNewMbox_Id.title", "text": "New mbox File"},
{"key": "msgCtxMenu_Exp_MboxFormatAppendMbox_Id.title", "text": "Append To Existing mbox File"},
{"key": "msgCtxMenu_Exp_IndexHTML_Id.title", "text": "HTML Format"},
{"key": "msgCtxMenu_Exp_IndexCSV_Id.title", "text": "CSV Format"},
{"key": "msgCtxMenu_CopyToClipboardMessage_Id.title", "text": "Message"},
{"key": "msgCtxMenu_CopyToClipboardHeaders_Id.title", "text": "Headers"},


{"key": "folderCtxMenu_Exp_FolderMbox_Id.title", "text": "Folder Export (mbox)"},
{"key": "folderCtxMenu_Exp_FolderMboxOnly_Id.title", "text": "As mbox File"},
{"key": "folderCtxMenu_Exp_FolderMboxZipped_Id.title", "text": "Single Zipped mbox File"},
{"key": "folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id.title", "text": "Structured With Subfolders"},
{"key": "folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id.title", "text": "With Flattened Subfolders"},
{"key": "folderCtxMenu_Exp_RemoteFolderMbox_Id.title", "text": "Export Remote Folder"},
{"key": "folderCtxMenu_Exp_AllMessages_Id.title", "text": "Export All Messages In Folder"},
{"key": "folderCtxMenu_Exp_EMLFormat_Id.title", "text": "EML Message Format"},
{"key": "folderCtxMenu_Exp_HTMLFormat_Id.title", "text": "HTML Format"},
{"key": "folderCtxMenu_Exp_PDFFormat_Id.title", "text": "PDF Format"},
{"key": "folderCtxMenu_Exp_PlainTextFormat_Id.title", "text": "Plain Text Format"},
{"key": "folderCtxMenu_Exp_CSVFormat_Id.title", "text": "CSV Format (Spreadsheet)"},
{"key": "folderCtxMenu_Exp_Index_Id.title", "text": "Message Index"},
{"key": "folderCtxMenu_Exp_SearchExport_Id.title", "text": "Search And Export Messages"},
{"key": "folderCtxMenu_Imp_MboxFiles_Id.title", "text": "Import mbox Files"},
{"key": "folderCtxMenu_Imp_MboxFilesIndv_Id.title", "text": "Individual mbox Files"},
{"key": "folderCtxMenu_Imp_MboxFilesIndvRecursive_Id.title", "text": "Individual mbox Files (with sbd structure)"},
{"key": "folderCtxMenu_Imp_MboxFilesDir_Id.title", "text": "All mbox Files from directory"},
{"key": "folderCtxMenu_Imp_MboxFilesDirRecursive_Id.title", "text": "All mbox Files from directory (with sbd structure)"},
{"key": "folderCtxMenu_Imp_MaildirFiles_Id.title", "text": "Import Maildir Folder"},
{"key": "folderCtxMenu_Imp_EMLFormat_Id.title", "text": "Import EML Messages"},
{"key": "folderCtxMenu_Imp_EMLFormatMsgs_Id.title", "text": "Individual EML Messages"},
{"key": "folderCtxMenu_Imp_EMLFormatDir_Id.title", "text": "All EML Messages From A Directory"},
{"key": "folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id.title", "text": "All EML Messages From A Directory And Subdirectories"},
{"key": "folderCtxMenu_CopyFolderPath_Id.title", "text": "Copy Folder Path"},
{"key": "folderCtxMenu_OpenFolderDir_Id.title", "text": "Open Folder Directory"},

{"key": "folderCtxMenu_Exp_EMLFormatCreateIndex_Id.title", "text": "Messages And HTML Index"},
{"key": "folderCtxMenu_Exp_HTMLFormatCreateIndex_Id.title", "text": "Messages And HTML Index"},
{"key": "folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id.title", "text": "Messages With Attachments And Index"},
{"key": "folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id.title", "text": "Messages And HTML Index"},
{"key": "folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id.title", "text": "Messages With Attachments And Index"},
{"key": "folderCtxMenu_Exp_PlainTextFormatSingleFile_Id.title", "text": "Messages As Single File"},
{"key": "folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id.title", "text": "Messages As Single File With Attachments"},
{"key": "folderCtxMenu_Exp_IndexHTML_Id.title", "text": "HTML Format"},
{"key": "folderCtxMenu_Exp_IndexCSV_Id.title", "text": "CSV Format"}
];

	// { key: "", text: "" },

	var translationArray2 = [

		{"key": "buttonMenu_Exp_Profile_Id.title", "text": "Export Profile"},
	{"key": "buttonMenu_Imp_Profile_Id.title", "text": "Import Profile"},
	{"key": "buttonMenu_Backup_Id.title", "text": "Backup"},
	
	{"key": "buttonMenu_Exp_ProfileFull_Id.title", "text": "Full Profile"},
	{"key": "buttonMenu_Exp_ProfileMailOnly_Id.title", "text": "Mail Only"},
	{"key": "buttonMenu_Options.title", "text": "Options"},
	{"key": "buttonMenu_Help.title", "text": "Help"},
	];

	var translationArray4 = [

  { key: "subjectFmtToken", text: "${subject}"},
  { key: "senderFmtToken", text: "${sender}"},
  { key: "recipientFmtToken", text: "${recipient}"},
  { key: "senderEmailFmtToken", text: "${sender_email}"},
  { key: "recipientEmailFmtToken", text: "${recipient_email}"},
  { key: "smartNameFmtToken", text: "${smart_name}"},
  { key: "indexFmtToken", text: "${index}"},
  { key: "prefixFmtToken", text: "${prefix}"},
  { key: "suffixFmtToken", text: "${suffix}"},
  { key: "dateCustomFmtToken", text: "${date_custom}"},
  { key: "dateFmtToken", text: "${date}"},
];

var translationArray5 = [
  { key: "attachmentFolderNames", text: "Attachment Folder Names"},
  { key: "attachmentFolders", text: "Attachment Folders"},
  { key: "inlineAttachmentsFolders", text: "Inline Attachments Folders"},
  { key: "cutPathLen", text: "Cut file path length to 256 characters"},
];

var translationArray = [
  { key: "useMboxExt.label", text: "Use .mbox extension for mbox files (non-structured)"},

	
];
// const localeDir = "../src/chrome/locale";
const localeDir = "./src/chrome/locale";
// const outputLocaleDir = "./src/_locales";
// const localeDir = "./locale";
// const localeFile = "mboximport/mboximport.dtd";
// const localeFile = "mboximport/mboximport.properties";
var localeFile = "messages-out.json";
const referenceLocaleId = "en";


var _getAllFilesOrFolders = function (dir, foldersOnly) {

	var filesystem = require("fs");
	var files = [];
	var folders = [];

	filesystem.readdirSync(dir).forEach(function (fileObj) {

		file = dir + '/' + fileObj;
		var stat = filesystem.statSync(file);

		if (stat && stat.isDirectory()) {
			// results = results.concat(_getAllFilesFromFolder(file));
			folders.push(fileObj);
		} else files.push(fileObj);
	});

	if (foldersOnly) {
		return folders;
	} else {
		return files;
	}
	return results;

};


async function translateAllLocales(iFile, sourceArray, locales, format, options) {
	var sourceLocale = referenceLocaleId;

	var promises = [];
	var ts = "\n";
	var tarray = [];

	for (let i = 0; i < locales.length; i++) {
		var locale = locales[i].toLowerCase();
		var shortLocale = locale.split('-')[0];

		if (shortLocale === referenceLocaleId && options.skipEN) {
			continue;
		}

		console.debug('Locale ' + locale + ' ' + locales);

		// set up source identifier for locale 
		// var sourceIdentifier = `<label class="notranslate" locale="${locale}">test</label>`;
		var sourceIdentifier = `<data-translation class="notranslate" locale="${locales[i]}">`;

		var sourceStrings = sourceArray.map(s => s.text);
		sourceStrings.unshift(sourceIdentifier);

		promises.push(translate.translate(sourceStrings, shortLocale)
			.then(([translations]) => {
				tarray.push(translations);
				console.debug('translations return');
				console.debug(translations);
			}));
	}

	await Promise.all(promises);

	// console.debug(tarray);

	for (let i = 0; i < tarray.length; i++) {

		let targetLocale = tarray[i][0].match(/locale="(.*)"/)[1];
		let stringArray = tarray[i].slice(1);

		console.debug(targetLocale);
		console.debug(stringArray);
		// continue;

		console.debug('TranslationArray');
		console.debug(translationArray);
		console.debug('GenerateMessages');
		let lt = stringArray.map((s, i) => {
			let entry;

			switch (options.outputFormat) {
				// messages.json
				case 0:
					switch (path.extname(iFile)) {
						case '.dtd':
							console.debug('DTD 0  ' + iFile);
							entry = `<!ENTITY ${sourceArray[i].key} "${s}">`;
							break;
		
						case '.properties':
							console.debug('Properties 0  ' + iFile);
							entry = `${sourceArray[i].key}=${s}`;
							break;
						default:
							break;
					}
					break;
				case 1:
					entry = `${sourceArray[i].key}=${s}`;
					break;
				case 2:
					entry = `<!ENTITY ${sourceArray[i].key} "${s}">`;
					break;
				case 3:
					entry = `\t"${sourceArray[i].key}": {\n\t\t"message": "${s}"\n\t}`;
					if (i < sourceArray.length - 1) {
						entry += ",\n";
					}
					break;
				default:
					break;
			}
			// console.debug(i);
			// console.debug(translationArray[i]);

			// let entry = `\t"${translationArray[i].key}": {\n\t\t"message": "${s}"\n\t},\n`;
			// let entry = `\t"${sourceArray[i].key}": {\n\t\t"message": "${s}"\n\t},\n`;
			// console.debug(entry);
			return entry;

		});

		lt = lt.join('\n');

		if (options.outputFormat === 3 && !options.append) {
			lt = `{\n${lt}\n}`;
		}

		lt = lt.replace(/<nl>/g, "\\n");
		console.debug('TranslationMessages ' + lt.length);
		console.debug(lt);
		// let outputFileName = iFile.replace('.', '-') + ".json";
		let outputFileName = iFile;

		
		if (options.append && options.outputFormat === 3) {
			var source = fs.readFileSync(`${options.outputLocaleDir}/${targetLocale}/${options.outputLocaleDirSuffix}${outputFileName}`, { encoding: 'utf8' });
			source = source.substr(0, source.lastIndexOf('}') - 1) + ",\n\n" + lt + "\n}";
			console.debug(source);
			fs.outputFileSync(`${options.outputLocaleDir}/${targetLocale}/${outputFileName}`, source);
		}
		else if (options.append) {
			console.debug('AppendingMessages');
			lt = "\n" + lt;
			fs.appendFileSync(`${options.outputLocaleDir}/${targetLocale}/${options.outputLocaleDirSuffix}${outputFileName}`, lt);
			
		} else {
			fs.outputFileSync(`${options.outputLocaleDir}/${targetLocale}/${options.outputLocaleDirSuffix}${outputFileName}`, lt);
			
		}
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


// console.debug(translate);

async function translateHelpPage() {
	//var localeFolders = _getAllFilesOrFolders(localeDir, true);
	
	//var supportedLocales = ['ca', 'da', 'de', 'en-US', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hy-AM'];

	//var supportedLocales = ['it', 'ja', 'ko-KR', 'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN', 'el'];

	//  const supportedLocales2 = ['pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE' ];
	// supportedLocales = ['es-ES'];
	// supportedLocales = ['el', 'gl-ES', 'hu-HU', 'hy-AM',
	// 'sk-SK', 'sl-SI', 'sv-SE', 'el'];


	//localeFolders = supportedLocales;
	// console.debug(localeFolders);
	var helpLocaleDir = "./src/chrome/content/mboximport/help/locale";
	var helpPage = "./src/chrome/content/mboximport/help/locale/en-US/importexport-help.html";
	var helpBase = "importexport-help";
	var source = fs.readFileSync(helpPage, { encoding: 'utf8' });

	for (let i = 0; i < localeFolders.length; i++) {
		if (localeFolders[i] === 'en-US') {
			continue;
		}
		await sleep(100);
		// var locale = locales[i].toLowerCase();
		var shortLocale = localeFolders[i].split('-')[0];
		if (shortLocale === 'zh') {
			shortLocale = 'zh-CN';
		}
		var outputFileName = `${helpLocaleDir}/${localeFolders[i]}/${helpBase}.html`;

		// if (fs.existsSync(outputFileName)) {
		// 	console.debug('Exists: ' + outputFileName);
		// 	continue;
		// }

		console.debug('Translate ' + shortLocale);

		try {
			translatePage([`<data class="notranslate">${outputFileName}`, source], 'en', shortLocale, translation => {
				console.debug('call back ' + translation[0].split('>')[1]);
				let outputFileName = translation[0].split('>')[1];
				console.debug(outputFileName);
				fs.outputFileSync(outputFileName, translation[1]);
				console.debug('Translated ' + shortLocale);
			});
		} catch (e) {
			console.debug(e);
		}
		// break;
		sleep(2);
	}
}


function translatePage(pageSource, sourceLocale, targetLocale, saveOutputCB) {
	// promises.push(translate.translate(sourceStrings, shortLocale)
	// var helpPage = "./src/chrome/content/mboximport/importexport-help-en-US.html";
	// var helpBase = "./src/chrome/content/mboximport/importexport-help";
	// var helpPage = "./src/chrome/content/mboximport/test1.html";
	// var source = fs.readFileSync(helpPage, {encoding: 'utf8'});
	// console.debug(source);
	// var sourceLocale = "en";
	// var shortLocale = "pt-PT";
	var translatedString = translate.translate(pageSource, { prettyPrint: true, from: sourceLocale, to: targetLocale, format: 'html' })
		.then(([translations]) => {
			try {
				console.debug('T0 ' + translations[0]);
				translations[1] = prettier.format(translations[1], { parser: 'html', printWidth: 110 });
			} catch (error) {
				console.debug(error);
			}
			// fs.outputFileSync(helpBase+"-"+shortLocale+".html",translations);
			// console.debug(translations);
			// tarray.push(translations);
			saveOutputCB(translations);
		});
	// console.debug(translatedString);
}

async function translateAll(iFile, strings, options) {
	let s = new Date();
	console.debug('Start ' + s);

	await translateAllLocales(iFile, strings, localeFolders, 1, options);

	let st = new Date();
	console.debug('Stop ' + st);
	console.debug('Stop ' + (st - s) / 1000);
}

var localeFolders = _getAllFilesOrFolders(localeDir, true);
console.debug(localeFolders);

function t() {
	let tb_locale = 'hu';
	var supportedLocales = ['ca', 'da', 'de', 'en-US', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hu-HG', 'hy-AM',
		'it', 'ja', 'ko-KR', 'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];

	var supportedLocaleRegions = supportedLocales.filter(l => {
		if (l === tb_locale || l.split('-')[0] === tb_locale.split('-')[0]) {
			return true;
		}
		return false;
	});

	console.debug(supportedLocaleRegions);
	if (!tb_locale || supportedLocaleRegions.length === 0) {
		tb_locale = "en-US";
	} else if (!supportedLocaleRegions.includes(tb_locale)) {
		tb_locale = supportedLocaleRegions[0];
	}

	console.debug(' locale subset');
	console.debug(supportedLocaleRegions);
	console.debug(tb_locale);

}

function loadMessageStrings(msgFile, options) {
	console.debug(`Loading MessageFile: ${options.inputLocaleDir}/${msgFile}`);
	let srcMessages = fs.readJSONSync(`${options.inputLocaleDir}/${msgFile}`);
	var messageStrings = [];

	for (const key in srcMessages) {
		if (srcMessages.hasOwnProperty(key)) {
			let str = srcMessages[key].message;
			messageStrings.push({ key: key, text: str });
		}
	}
	// console.debug('MessageStrings');
	// console.debug(messageStrings);
	return messageStrings;
}

function loadDTD(dtdFile, options) {
	console.debug(`Loading DTD: ${options.inputLocaleDir}/${dtdFile}`);
	let fileEntitiesKeys = Object.keys(parser.parse(fs.readFileSync(`${options.inputLocaleDir}/${dtdFile}`, 'utf-8')));
	let fileEntities = parser.parse(fs.readFileSync(`${options.inputLocaleDir}/${dtdFile}`, 'utf-8'));
	// console.debug(fileEntities);
	translationArray = [];

	for (const key in fileEntities) {
		if (fileEntities.hasOwnProperty(key)) {
			const message = fileEntities[key];
			translationArray.push({ key: key, text: message });
		}
	}
	// console.debug(translationArray);
	// return fileEntities;
	return translationArray;
}

function loadPropertys(propertyFile, options) {
	console.debug(`Loading propertyFile: ${options.inputLocaleDir}/${propertyFile}`);
	let propertiesText = fs.readFileSync(`${options.inputLocaleDir}/${propertyFile}`, 'utf-8');
	// console.debug(propertiesText);
	const rg = /^(.+)=(.+)$/gm;
	let properties = Array.from(propertiesText.matchAll(rg));
	let propertyStrings = properties.map(p => {
		// return {`"${p[1]}": "${p[2]}"`});
		let key = p[1];
		let str = p[2];
		return { key: key, text: str };
		// return { `"${p[1]}"`: "a"};
	});

	translationArray = propertyStrings;

	// for (const key in propertyStrings) {
	// 	if (propertyStrings.hasOwnProperty(key)) {
	// 		const message = propertyStrings[key];
	// 		translationArray.push({ key: key, text: message });
	// 	}
	// }
	// console.debug(translationArray);
	
	// console.debug(propertyStrings);
	return propertyStrings;
}


function loadTranslationArray(inputFiles, options) {

	inputFiles.forEach(iFile => {
		var strings = [];
		options.lastFile = false;
		console.debug('Processing: ' + iFile);
		if (iFile === inputFiles[inputFiles.length - 1]) {
			options.lastFile = true;
		}
		switch (path.extname(iFile)) {
			case '.dtd':
				strings = loadDTD(iFile, options);
				options.propertiesType = false;
				translateAll(iFile, strings, options);
				break;
			case '.properties':
				strings = loadPropertys(iFile, options);
				options.propertiesType = true;
				translateAll(iFile, strings, options);
				break;
			case '.json':
				strings = loadMessageStrings(iFile, options);
				options.propertiesType = false;
				translateAll(iFile, strings, options);
				break;
	
			default:
				break;
		}

	});
}

function convert(iFile, options) {
	localeFolders.forEach(locale => {
		let input = `./src/chrome/locale/${locale}/mboximport/${iFile}`;
		console.log(input)
		let output = `./src/_locale/${locale}/tokens.json`;
		console.log(output)
		options.inputLocaleDir = `./src/chrome/locale/${locale}/mboximport`
		var strings = loadPropertys(iFile, options);
		console.log(strings)

		let outputJson = "";
		strings.forEach((keyText, index) => {
			let key = keyText.key;
			let text = keyText.text;
			//let entry = eval(`{"${key}": {message: "${text}" }`)
			var entry = `\t"${key}": {\n\t\t"message": "${text}"\n\t}`;
			if (index < strings.length - 1) {
				entry+= ",\n\n"
			}
			console.log(entry)
			outputJson += entry;
			
		})
		//outputJson += "\n};";
 	//	outputJson = prettier.format(outputJson	, { parser: 'json', printWidth: 110 });
		let targetLocale = locale;
		let outputFileName = "messages.json";
		console.log(outputJson)
		var source = fs.readFileSync(`${options.outputLocaleDir}/${targetLocale}/${options.outputLocaleDirSuffix}${outputFileName}`, { encoding: 'utf8' });
			source = source.substr(0, source.lastIndexOf('}') - 1) + ",\n\n" + outputJson + "\n}";
			console.debug(source);
			fs.outputFileSync(`${options.outputLocaleDir}/${targetLocale}/${outputFileName}`, source);
		
		//fs.outputFileSync(output, outputJson);

	});
}


var options1 = {
	inputLocaleDir: `./src/_locales/en-US`,
	outputLocaleDir: "./src/_locales",
	outputLocaleDirSuffix: "",
	append: true,
	outputFormat: 3,
	skipEN: true
};

// dtd=2
var options = {
	inputLocaleDir: `./src/chrome/locale/en-US/mboximport`,
	outputLocaleDir: "./src/chrome/locale",
	outputLocaleDirSuffix: "mboximport/",
	append: true,
	skipEN: true,
	outputFormat: 2,
};

var options4 = {
	inputLocaleDir: `./src/chrome/locale/en-US/mboximport`,
	outputLocaleDir: "./src/_locales",
	outputLocaleDirSuffix: "",
	append: false,
	outputFormat: 3,
};

// let inputFiles = ["settings.dtd", "settings.properties", "overlay.dtd", "overlay.properties"];
// let inputFiles = ["settings.dtd", "settings.properties"];
// let inputFiles = ["settings.dtd"];
// let inputFiles = ["overlay.properties"];
// let inputFiles = ["settings.dtd", "overlay.dtd", "overlay.properties"];


let inputFiles = ["messages.json"];
inputFiles = ["mboximport.dtd"];
// let inputFiles = ["autobackup.dtd", "autobackup.properties", "mboximport.dtd", "mboximport.properties", "profilewizard.dtd", "profilewizard.properties"];
//inputFiles = ["mboximport.properties"];
// var supportedLocales = ['de', 'en-US', 'nl', 'fr', 'it', 'zh-CN', 'ja', 'es-ES', 'ru', 'hu-HU', 'hy-AM', 'ko-KR',
// 						'el', 'pl', 'da', 'pt-PT'];

localeFolders = ['de', 'en-US', 'nl', 'fr', 'it', 'zh-CN', 'ja', 'es-ES', 'ru', 'hu-HU', 'hy-AM', 'ko-KR',
'el', 'pl', 'da', 'pt-PT', 'ca', 'gl-ES', 'sk-SK', 'sl-SI', 'sv-SE'];

// var localeFolders = ['ca', 'gl-ES', 'hu-HU', 'hy-AM',
// 	'sk-SK', 'sl-SI', 'sv-SE'];

localeFolders = ['en-US', 'de', 'ca', 'da', 'el', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hy-AM', 'it', 'ja', 'ko-KR',
	'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];

//localeFolders = ['en-US', 'de'];

// localeFolders = ['ru', 'hu-HU', 'hy-AM', 'ko-KR', 'pl', 'da', 'pt-PT'];
//localeFile = "settings.json";
// t();
//translateHelpPage();
//translatePage();
// translateAll("mboximport.properties", translationArray, options);
translateAll(inputFiles, translationArray, options);
 //loadTranslationArray(inputFiles, options);
 //convert(inputFiles, options);

// let inputFiles = ["settings.dtd"];
/*
node .\scripts\translate-gc.js
*/