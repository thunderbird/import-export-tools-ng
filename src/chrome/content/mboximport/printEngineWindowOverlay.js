
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

