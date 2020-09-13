
var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/printEngineWindowOverlay.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/utils.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://global/content/printUtils.js", window, "UTF-8");

function onLoad() {
	// console.debug('printEngineOverlay OL');
}

function onUnload() {
	// console.debug('printEngineOverlay OL Unload');
	window.IETprintPDFengine.exit();
}
