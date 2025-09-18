
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


/* eslint-disable no-global-assign */

/* global
IETformatWarning
gSearchView
getPredefinedFolder
IETopenFPsync
isMbox
IETtotal
IETexported
IETskipped
exportAsHtml
saveMsgAsEML
IETstoreHeaders
createIndexCSV
*/


// NOTE : for some strange reasons, it seems impossibile to get elements by id

// type 0 = EML
// type 1 = HTML
// type 2 = TEXT
// type 3 = TEXT (one file)
// type 4 = MBOX (new)
// type 5 = MBOX (append)

var messengerWindow = Services.wm.getMostRecentWindow("mail:3pane");

var { ExtensionParent } = ChromeUtils.importESModule(
	"resource://gre/modules/ExtensionParent.sys.mjs"
);

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
	"ImportExportToolsNG@cleidigh.kokkini.net"
);

var { ietngUtils } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/ietngUtils.mjs?"
  + ietngExtension.manifest.version + messengerWindow.ietngAddon.dateForDebugging);

var searchFolder = null;

function SDexportMsg() {
	var view;
	var all;

	let msgFolder = searchFolder;

	if (typeof gSearchView === "undefined")
		view = gDBView;
	else
		view = gSearchView;

	// There is no message, so exit
	// 4294967295 is the unsigned value for -1
	if (view.getKeyAt(0) === 4294967295)
		return;
	var rg = document.getElementsByTagName("radiogroup");
	var ml = document.getElementsByTagName("menulist");
	var type = ml[ml.length - 1].selectedIndex;
	if (type === 1 || type === 2) {
		var question = IETformatWarning(1);
		if (!question)
			return;
	}
	if (document.getElementById("IETall"))
		all = (document.getElementById("IETall").selectedIndex === 0);
	else
		all = (rg[rg.length - 2].selectedIndex === 0);
	let winCtx = window;
	const tbVersion = ietngUtils.getThunderbirdVersion();
	if (tbVersion.major >= 120) {
		winCtx = window.browsingContext;
	}
	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	var res;
	var file;

	if (type === 4 || type === 6)
		file = getPredefinedFolder(0);
	else if (type === 5) {
		fp.init(winCtx, ietngUtils.localizeMsg("filePickerAppend"), nsIFilePicker.modeOpen);
		fp.appendFilters(nsIFilePicker.filterAll);
		if (fp.show)
			res = fp.show();
		else
			res = IETopenFPsync(fp);
		if (res === nsIFilePicker.returnOK) {
			file = fp.file;
			if (isMbox(file) !== 1) {
				var string = ("\"" + file.leafName + "\" " + ietngUtils.localizeMsg("nomboxfile"));
				alert(string);
				return;
			}
		} else
			return;
	} else
		file = getPredefinedFolder(2);


	if (!file) {
		fp.init(winCtx, ietngUtils.localizeMsg("filePickerExport"), nsIFilePicker.modeGetFolder);
		if (fp.show)
			res = fp.show();
		else
			res = IETopenFPsync(fp);
		if (res === nsIFilePicker.returnOK)
			file = fp.file;
		else {
			return;
		}
	}

	let emlsArray = [];
	if (all) {

		var total = gDBView.rowCount;
		for (let i = 0; i < total; i++) {
			// check for  #359
			try {
				emlsArray.push(view.getURIForViewIndex(i));

			} catch (e) {
				continue; // ignore errors for dummy rows
			}
		}
	} else {
		emlsArray = view.getURIsForSelection();
	}

	var msguri = emlsArray[0];
	IETtotal = emlsArray.length;
	IETexported = 0;
	IETskipped = 0;
	if (type === 1)
		exportAsHtml(msguri, emlsArray, file, false, false, false, false, null, null, null, false);
	else if (type === 2)
		exportAsHtml(msguri, emlsArray, file, true, false, false, false, null, null, null, null, false);
	else if (type === 3)
		exportAsHtml(msguri, emlsArray, file, true, false, false, true, null, null, null, null, false);
	else if (type === 4) {
		var now = new Date;
		var filename = now.getFullYear().toString() + (now.getMonth() + 1).toString() + now.getDate().toString() + "_mbox";
		file.append(filename);
		saveMsgAsEML(msguri, file, true, emlsArray, null, null, false, false, null, null);
	} else if (type === 5)
		saveMsgAsEML(msguri, file, true, emlsArray, null, null, false, false, null, null);
	else if (type === 6) {
		var hdrArray = [];
		for (var k = 0; k < emlsArray.length; k++) {
			msguri = emlsArray[k];
			var msserv = MailServices.messageServiceFromURI(msguri);
			var msg = msserv.messageURIToMsgHdr(msguri);
			var hdrStr = IETstoreHeaders(msg, msguri, file, true);
			hdrArray.push(hdrStr);
		}
		createIndexCSV(7, file, hdrArray, null, true);
	} else
		saveMsgAsEML(msguri, file, false, emlsArray, null, null, false, false, null, null);
}


function SDinit() {

		searchFolder = window.arguments[0];
}
