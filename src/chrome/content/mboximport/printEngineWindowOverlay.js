// cleidigh - reformat, globals, services

/* global
PrintEngineCreateGlobals,
InitPrintEngineWindow,
printEngine,
OnLoadPrintEngine,
*/

var IETprintPDFengine = {
	prefs: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),

	exit: function () {
		if (opener.IETprintPDFmain.total > 0 && !IETprintPDFengine.error)
			opener.IETprintPDFmain.printDelayed();
		else
			IETprintPDFengine.restore();
	},

	restore: function () {
		IETprintPDFengine.prefs.setBoolPref("extensions.importexporttoolsng.printPDF.start", false);
		if (IETprintPDFengine.prefs.getBoolPref("extensions.importexporttoolsng.printPDF.restore_print_silent"))
			IETprintPDFengine.prefs.setBoolPref("print.always_print_silent", false);
		opener.document.getElementById("IETabortIcon").collapsed = true;
	},

	onLoad: function () {
		try {
			PrintEngineCreateGlobals();
			InitPrintEngineWindow();
			var PSSVC = Cc["@mozilla.org/gfx/printsettings-service;1"]
				.getService(Ci.nsIPrintSettingsService);
			var myPrintSettings = PSSVC.newPrintSettings;
			myPrintSettings.printSilent = true;
			myPrintSettings.toFileName = opener.IETprintPDFmain.filePath;
			myPrintSettings.printToFile = true;
			var fileFormat = IETprintPDFengine.prefs.getIntPref("extensions.importexporttoolsng.printPDF.fileFormat");
			if (fileFormat < 3)
				myPrintSettings.outputFormat = fileFormat;
			printEngine.startPrintOperation(myPrintSettings);
		} catch (e) {
			IETprintPDFengine.error = true;
			setTimeout(function () { window.close(); }, 500);
		}
	},
};


if (IETprintPDFengine.prefs.getBoolPref("extensions.importexporttoolsng.printPDF.start")) {
	// eslint-disable-next-line no-global-assign
	OnLoadPrintEngine = IETprintPDFengine.onLoad;
	IETprintPDFengine.prefs.setBoolPref("extensions.importexporttoolsng.printPDF.start", false);
}

window.addEventListener("unload", IETprintPDFengine.exit, false);

