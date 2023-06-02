
//window.addEventListener("load", function (event) {
	console.debug('Load Help');
	//console.debug(WL);
	//console.debug(window.WL);
	
	document.getElementById("extVersion").innerText = "v" + browser.runtime.getManifest().version;
	
	//fixIDReferenceLabels();
	//fixPropertyReferenceLabels();
	var tb_locale = null;

	try {
		tb_locale = Services.locale.appLocaleAsBCP47;
	} catch (e) {
		tb_locale = 'en-US';
	}

	document.getElementById("locale1").textContent = tb_locale;
	if (tb_locale === 'en-US' || tb_locale.split('-')[0] === 'en') {
		document.getElementById("localized-token-table").classList.add('hide-ltoken-table');
	}

	//await new Promise(r => mainWindow.setTimeout(r, 150));
/*
	var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
let extension = ExtensionParent.GlobalManager.getExtension("ImportExportToolsNG@cleidigh.kokkini.net");
console.log(extension)
// Provide a relative path to i18.js from the root of your extension.
let i18nScriptPath = extension.rootURI.resolve("chrome/content/mboximport/modules/i18n.js");
Services.scriptloader.loadSubScript(i18nScriptPath, this, "UTF-8");
*/
document.addEventListener('DOMContentLoaded', () => {
  i18n.updateDocument();
}, { once: true });


function fixIDReferenceLabels() {
	var ids = document.querySelectorAll("[dtd-text-id-ref]");
	console.log(ids)
	var w = getMail3Pane();
	var sourceDocument = w.document;

	for (let element of ids) {
		let sourceElement = sourceDocument.getElementById(element.getAttribute("dtd-text-id-ref"));
		let label = sourceElement.getAttribute("label");
		element.textContent = label;
	}
}

function fixPropertyReferenceLabels() {
	var MBstrBundleService = Services.strings;
	var mboximportbundle = MBstrBundleService.createBundle("chrome://mboximport/locale/mboximport.properties");
	var ids = document.querySelectorAll("[property-text-ref]");

	for (let element of ids) {
		let sourceProperty = element.getAttribute("property-text-ref");
		let text = mboximportbundle.GetStringFromName(sourceProperty);
		element.textContent = text;
	}
}
function getMail3Pane() {
	var w = Cc["@mozilla.org/appshell/window-mediator;1"]
		.getService(Ci.nsIWindowMediator)
		.getMostRecentWindow("mail:3pane");
	return w;
}
