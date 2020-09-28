
/*
	ImportExportTools NG is a derivative extension for Thunderbird 60+
	providing import and export tools for messages and folders.
	The derivative extension authors:
		Copyright (C) 2019 : Christopher Leidigh, The Thunderbird Team

	The original extension & derivatives, ImportExportTools, by Paolo "Kaosmos",
	is covered by the GPLv3 open-source license (see LICENSE file).
		Copyright (C) 2007 : Paolo "Kaosmos"

	ImportExportTools NG is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// cleidigh - reformat, globals, services

/* global
PrintEngineCreateGlobals,
InitPrintEngineWindow,
printEngine,
OnLoadPrintEngine,
*/

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { strftime } = ChromeUtils.import("chrome://mboximport/content/mboximport/modules/strftime.js");

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
			// cleidigh - seems to be necessary under WL API
			opener.content = null;
			PrintEngineCreateGlobals();
			InitPrintEngineWindow();
			var PSSVC = Cc["@mozilla.org/gfx/printsettings-service;1"]
				.getService(Ci.nsIPrintSettingsService);
			
			// Use global printing preferences
			// https://github.com/thundernest/import-export-tools-ng/issues/77

			var myPrintSettings;

			if (IETprintPDFengine.prefs.getBoolPref("extensions.importexporttoolsng.experimental.printPDF.use_global_preferences")) {
				// Use global printing preferences
				// https://github.com/thundernest/import-export-tools-ng/issues/77
				// Services.console.logStringMessage('PDF Output: Use global preferences');
				myPrintSettings = PSSVC.globalPrintSettings;
				myPrintSettings.printerName = PSSVC.defaultPrinterName;

				PSSVC.initPrintSettingsFromPrinter(myPrintSettings.printerName, myPrintSettings);
				PSSVC.initPrintSettingsFromPrefs(myPrintSettings, true, myPrintSettings.kInitSaveAll);
			} else {
				// Services.console.logStringMessage('PDF Output: Use default preferences');
				myPrintSettings = PSSVC.newPrintSettings;
			}
			
			myPrintSettings.printSilent = true;

			var customDateFormat = IETgetComplexPref("extensions.importexporttoolsng.export.filename_date_custom_format");
			
			if (customDateFormat !== "") {
					let customDate = strftime.strftime(customDateFormat, new Date());
					myPrintSettings.headerStrRight = myPrintSettings.headerStrRight.replace("%d", customDate);
					myPrintSettings.headerStrLeft = myPrintSettings.headerStrLeft.replace("%d", customDate);
					myPrintSettings.headerStrCenter = myPrintSettings.headerStrCenter.replace("%d", customDate);
					myPrintSettings.footerStrRight = myPrintSettings.footerStrRight.replace("%d", customDate);
					myPrintSettings.footerStrLeft = myPrintSettings.footerStrLeft.replace("%d", customDate);
					myPrintSettings.footerStrCenter = myPrintSettings.footerStrCenter.replace("%d", customDate);
				}
			
			IETprintPDFengine.prefs.setBoolPref("print.show_print_progress", false);

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

// cleidigh window not available
// window.addEventListener("unload", IETprintPDFengine.exit, false);

