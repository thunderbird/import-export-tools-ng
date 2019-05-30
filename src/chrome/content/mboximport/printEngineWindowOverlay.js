var IETprintPDFengine = {
	prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
	
	exit : function() {
		if (opener.IETprintPDFmain.total  > 0 && ! IETprintPDFengine.error) 
			opener.IETprintPDFmain.printDelayed();
		else 
			IETprintPDFengine.restore();
	},

	restore : function() {
		IETprintPDFengine.prefs.setBoolPref("extensions.importexporttools.printPDF.start", false);
		if (IETprintPDFengine.prefs.getBoolPref("extensions.importexporttools.printPDF.restore_print_silent"))
				IETprintPDFengine.prefs.setBoolPref("print.always_print_silent", false);	
		opener.document.getElementById("IETabortIcon").collapsed = true;
	},

	onLoad : function() {
		try {
			PrintEngineCreateGlobals();
			InitPrintEngineWindow();
			var PSSVC = Components.classes["@mozilla.org/gfx/printsettings-service;1"]
				.getService(Components.interfaces.nsIPrintSettingsService);
			var myPrintSettings = PSSVC.newPrintSettings;
			myPrintSettings.printSilent = true;
			myPrintSettings.toFileName  = opener.IETprintPDFmain.filePath;
			myPrintSettings.printToFile = true;
			var fileFormat = IETprintPDFengine.prefs.getIntPref("extensions.importexporttools.printPDF.fileFormat");
			if (fileFormat < 3)
				myPrintSettings.outputFormat = fileFormat;
			printEngine.startPrintOperation(myPrintSettings);
		}
		catch(e) {
			IETprintPDFengine.error = true;
			setTimeout(function() {window.close();}, 500);
		}
	}
};


if (IETprintPDFengine.prefs.getBoolPref("extensions.importexporttools.printPDF.start")) {
	OnLoadPrintEngine = IETprintPDFengine.onLoad;
	IETprintPDFengine.prefs.setBoolPref("extensions.importexporttools.printPDF.start", false);
}		

window.addEventListener("unload", IETprintPDFengine.exit, false);

