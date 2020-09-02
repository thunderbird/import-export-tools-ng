var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

window.addEventListener("load", function (event) {
	console.debug('LoadsHelp');
	// console.debug(WL);
	// console.debug(window.WL);
	

	fixIDReferenceLabels();
	fixPropertyReferenceLabels();
	var tb_locale = null;

	try {
		const versionChecker = Services.vc;
		const currentVersion = Services.appinfo.platformVersion;

		// cleidigh - TB68 groupbox needs hbox/label
		if (versionChecker.compare(currentVersion, "61") >= 0) {
			tb_locale = Services.locale.appLocaleAsBCP47;
		} else {
			tb_locale = Cc["@mozilla.org/intl/localeservice;1"]
				.getService(Ci.mozILocaleService)
				.getAppLocaleAsBCP47();
		}
	} catch (e) {
		tb_locale = 'en-US';
	}

	document.getElementById("locale1").textContent = tb_locale;
	if (tb_locale === 'en-US' || tb_locale.split('-')[0] === 'en') {
		document.getElementById("localized-token-table").classList.add('hide-ltoken-table');
	}
});

function fixIDReferenceLabels() {
	var ids = document.querySelectorAll("[dtd-text-id-ref]");

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
