/*
	ImportExportTools NG is a derivative extension for Thunderbird 60+
	providing import and export tools for messages and folders.
	The derivative extension authors:
		Copyright (C) 2024 : Christopher Leidigh, The Thunderbird Team

	The original extension & derivatives, ImportExportTools, by Paolo "Kaosmos",
	is covered by the GPLv3 open-source license (see LICENSE file).
		Copyright (C) 2007 : Paolo "Kaosmos"

	ImportExportTools NG is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// cleidigh - Update for TB68
// cleidigh - reformat, services, globals, Streamlisteners


/* global
GetFirstSelectedMsgFolder,
FolderPaneSelectionChange,
IETformatWarning,
getPredefinedFolder,
IETopenFPsync,
IETgetSelectedMessages,
isMbox,
IETemlArray2hdrArray,
IETprefs,
msgFolder2LocalFile,
buildContainerDirName,
nametoascii,
IETgetExt,
getSubjectForHdr,
IETstr_converter,
convertPRTimeToString,
IETlogger,
IETcopyStrToClip,
MsgHdrToMimeMessage,
findGoodFolderName,
IETgetComplexPref,
constructAttachmentsFilename,
gTabmail,
*/

/* eslint complexity: [0,30] */
/* eslint-disable no-control-regex */
/* eslint-disable no-useless-concat */


// update to use es6 modules for 128+, 136+ required - thx Axel

var { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");
var Ietng_ESM = parseInt(AppConstants.MOZ_APP_VERSION, 10) >= 128;

var { ietngUtils } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/ietngUtils.mjs?"
	+ ietngExtension.manifest.version + messengerWindow.ietngAddon.dateForDebugging);

var { MailServices } = Ietng_ESM
	? ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs")
	: ChromeUtils.import("resource:///modules/MailServices.jsm");

var { parse5322 } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/email-addresses.mjs");

// console.debug('exportTools start');

var IETexported;
var IETskipped;
var IETtotal;
var IETnosub = ietngUtils.localizeMsg("nosubjectmsg");
var IETmesssubdir = ietngUtils.localizeMsg("messsubdir");
// Values of IETsortType:
// 0 = date+subject+recipients+author
// 1 = subject+recipients+author+date
// 2 = author+subject+recipients+date
// 3 = recipients+subject+author+date
var IETsortType;

// Global variables introduced in 2.3.6 version
var IETglobalMsgFolders;
var IETglobalMsgFoldersExported;
var IETglobalFile;
var IETabort;

var kStatusOK = 1;
var kStatusDone = 2;
var kStatusAbort = 3;

var { strftime } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/strftime.mjs");

var { MsgHdrToMimeMessage } = Ietng_ESM
	? ChromeUtils.importESModule("resource:///modules/gloda/MimeMessage.sys.mjs")
	: ChromeUtils.import("resource:///modules/gloda/MimeMessage.jsm");

//var { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
var { XPCOMUtils } = ChromeUtils.importESModule("resource://gre/modules/XPCOMUtils.sys.mjs");

function searchANDsave(params) {

	try {
		let preselectedFolder = getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path);
		var args = { folder: preselectedFolder, ietngSearch: true };
		window.openDialog("chrome://messenger/content/SearchDialog.xhtml", "", "chrome,resizable,status,centerscreen,dialog=no", args, true);
		return { status: "ok" };
	} catch (ex) {
		console.log(ex)
		return ex;
	}
}

function IETgetSortType() {

	// Get gDBView from 3pane - 115
	var gDBView = gTabmail.currentAbout3Pane.gDBView;

	if (!gDBView) {
		IETsortType = 0;
		return;
	}
	switch (gDBView.sortType) {
		case 19:
			// nsMsgViewSortTypeValue bySubject = 19
			IETsortType = 1;
			break;
		case 20:
			// nsMsgViewSortTypeValue byAuthor = 20
			IETsortType = 2;
			break;
		case 28:
			// nsMsgViewSortTypeValue byRecipient = 28
			IETsortType = 3;
			break;
		default:
			// For any other value of nsMsgViewSortTypeValue the sort index is by date
			IETsortType = 0;
	}
}

function IETabortExport() {
	IETabort = true;
	if (gImporting) {
		gImporting = false;
		document.getElementById("IETabortIcon").collapsed = true;
	} else {
		IETwritestatus(ietngUtils.localizeMsg("exportAborted"));
		document.getElementById("IETabortIcon").collapsed = true;
	}

}

async function exportSelectedMsgs(type, params) {
	/* Export types:
	0 = EML
	1 = HTML
	2 = Plain Text
	3 = MBOX
	4 = MBOX (append mode)
	5 = index (HTML)
	6 = index (CSV)
	7 = CSV (with body)
	8 = HTML with attachments
	9 = Plain Text with attachments
	10 = PDF
	*/

	//console.log("export selected messages ")
	//console.log(params)

	var needIndex = false;
	if (type > 99) {
		type = type - 100;
		needIndex = true;
	}

	var question;
	if (type === 1 || type === 2 || type === 7) {
		question = IETformatWarning(1);
		if (!question)
			return { status: "cancel" };

		question = IETformatWarning(0);
		if (!question)
			return { status: "cancel" };
	}

	if (type === 8 || type === 9) {
		question = IETformatWarning(1);
		if (!question)
			return { status: "cancel" };
	}

	try {

		var file = getPredefinedFolder(2);
		if (!file || type === 3 || type === 4) {
			var nsIFilePicker = Ci.nsIFilePicker;
			let winCtx = window;
			const tbVersion = ietngUtils.getThunderbirdVersion();
			if (tbVersion.major >= 120) {
				winCtx = window.browsingContext;
			}
			var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			if (type === 3) {
				fp.init(winCtx, ietngUtils.localizeMsg("filePickerExport"), nsIFilePicker.modeSave);
				fp.appendFilters(nsIFilePicker.filterAll);
			} else if (type === 4) {
				fp.init(winCtx, ietngUtils.localizeMsg("filePickerAppend"), nsIFilePicker.modeOpen);
				fp.appendFilters(nsIFilePicker.filterAll);
			} else {
				fp.init(winCtx, ietngUtils.localizeMsg("filePickerExport"), nsIFilePicker.modeGetFolder);
			}

			var res;
			if (fp.show)
				res = fp.show();
			else
				res = IETopenFPsync(fp);
			if (res === nsIFilePicker.returnOK)
				file = fp.file;
			else
				return { status: "cancel" };
		}

		try {
			if (file.exists() && !file.isWritable()) {
				alert(ietngUtils.localizeMsg("nowritable"));
				return { status: "error" };
			}
		} catch (ex) {
			return ex;
		}


		var curDBView;
		// Lets see where we are
		if (gTabmail.currentAbout3Pane) {
			// On 3p
			curDBView = gTabmail.currentAbout3Pane.gDBView;
		} else if (gTabmail.currentAboutMessage) {
			curDBView = gTabmail.currentAboutMessage.gDBView;
		}

		var msgUris = [];

		msgUris = await ietngUtils.getNativeSelectedMessages(params?.selectedMessages);

		// Use first message to get current folder
		var mms1 = MailServices.messageServiceFromURI(msgUris[0]).QueryInterface(Ci.nsIMsgMessageService);
		var hdr1 = mms1.messageURIToMsgHdr(msgUris[0]);
		var curMsgFolder = hdr1.folder;

		// support shortcuts (no params)
		try {
			var msgFolder = getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path);
		} catch (ex) {
			msgFolder = GetFirstSelectedMsgFolder();

			if (!msgFolder) {
				msgFolder = curMsgFolder;
			}
		}

		if (!msgFolder) {
			console.log("exp selected msgs - null msgFolder after folder check");
			console.log(params);
			Services.prompt.alert(window, "Error", "msgFolder null after check - exp selected msgs.\nPlease report!")
			return { status: "error" };
		}


		IETskipped = 0;
		IETtotal = msgUris.length;
		IETexported = 0;
		var msguri = msgUris[0];

		var hdrArray;

		switch (type) {
			case 1:
				await exportAsHtml(msguri, msgUris, file, false, false, false, false, null, null, msgFolder);
				break;
			case 2:
				await exportAsHtml(msguri, msgUris, file, true, false, false, false, null, null, msgFolder);
				break;
			case 3:
				await saveMsgAsEML(msguri, file, true, msgUris, null, null, false, false, null, msgFolder);
				break;
			case 4:
				if (isMbox(file) !== 1) {
					var string = ("\"" + file.leafName + "\" " + ietngUtils.localizeMsg("nomboxfile"));
					alert(string);
					return { status: "error" };
				}
				await saveMsgAsEML(msguri, file, true, msgUris, null, null, false, false, null, null);
				break;
			case 5:
				hdrArray = IETemlArray2hdrArray(msgUris, false, file);
				createIndex(type, file, hdrArray, msgFolder, true, true);
				break;
			case 6:
				hdrArray = IETemlArray2hdrArray(msgUris, false, file);
				createIndexCSV(type, file, hdrArray, msgFolder, false);
				break;
			case 7:
				hdrArray = IETemlArray2hdrArray(msgUris, true, file);
				createIndexCSV(type, file, hdrArray, msgFolder, true);
				break;
			case 8:
				await exportAsHtml(msguri, msgUris, file, false, false, false, false, null, null, msgFolder, true);
				break;
			case 9:
				await exportAsHtml(msguri, msgUris, file, true, false, false, false, null, null, msgFolder, true);
				break;
			default:
				await saveMsgAsEML(msguri, file, false, msgUris, null, null, false, false, null, null);
		}

		if (needIndex) {
			hdrArray = IETemlArray2hdrArray(msgUris, false, file);
			createIndex(type, file, hdrArray, msgFolder, false, false);
		}
		if (type !== 5 && type !== 6 && type !== 7 && document.getElementById("IETabortIcon"))
			document.getElementById("IETabortIcon").collapsed = false;
		IETabort = false;

		return { status: "ok" };
	} catch (ex) {
		console.log("ex", ex)

		let errTitle = window.ietngAddon.extension.localeData.localizeMessage("Error.msg");
		let errMsg = ex;
		if (ex.extendedMsg) {
			errMsg += `\n\n${ex.extendedMsg}`;
		}
		errMsg += `\n\n${ex.stack}`;
		Services.prompt.alert(window, errTitle, errMsg);
		if (document.getElementById("IETabortIcon")) {
			document.getElementById("IETabortIcon").collapsed = true;
		}
		return ex;
	}
}

// Export all messages is done through more steps
//
// 1) exportAllMsgs
//
// Sets the destination directory and makes some checks about the types of the selected folders;
// all the selected folders are stored in IETglobalMsgFolders global array

async function exportAllMsgs(type, params) {
	console.log("exportAllMsgs", type, params);

	let st = new Date();

	var exportFolderPath;
	var question;

	// only warn on first folder
	if (params.warnings) {
		if (type === 1 || type === 2 || type === 4) {
			question = IETformatWarning(1);
			if (!question)
				return;
			question = IETformatWarning(0);
			if (!question)
				return;
		}

		if (type === 8 || type === 9 || type === 7) {
			question = IETformatWarning(1);
			if (!question)
				return;
		}
	}

	try {

		var file = getPredefinedFolder(1);
		if (!file && params.fileDialog) {
			let winCtx = window;
			const tbVersion = ietngUtils.getThunderbirdVersion();
			if (tbVersion.major >= 120) {
				winCtx = window.browsingContext;
			}

			var nsIFilePicker = Ci.nsIFilePicker;
			var res;
			var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			fp.init(winCtx, ietngUtils.localizeMsg("filePickerExport"), nsIFilePicker.modeGetFolder);
			if (fp.show)
				res = fp.show();
			else
				res = IETopenFPsync(fp);
			if (res === nsIFilePicker.returnOK) {
				file = fp.file;
			} else {
				return { status: "cancel" };
			}
		} else if (params.exportFolderPath) {
			file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
			file.initWithPath(params.exportFolderPath);
		}

		exportFolderPath = file.path;

		try {
			if (!file.isWritable()) {
				alert(ietngUtils.localizeMsg("nowritable"));
				return { status: "cancel" };
			}
		} catch (e) {
			return { status: "cancel" };
		}

		IETglobalMsgFolders = [getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path)];

		IETglobalMsgFoldersExported = 0;
		for (var i = 0; i < IETglobalMsgFolders.length; i++) {
			// Check if there is a multiple selection and one of the folders is a virtual one.
			// If so, exits, because the export function can't handle this
			if (IETglobalMsgFolders.length > 1 && IETglobalMsgFolders[i].flags & 0x0020) {
				alert(ietngUtils.localizeMsg("virtFolAlert"));
				return { status: "cancel" };
			}

			/*
			if (params.warnings && type !== 3 && type !== 5 && (IETglobalMsgFolders[i].server.type === "imap" || IETglobalMsgFolders[i].server.type === "news") && !IETglobalMsgFolders[i].verifiedAsOnlineFolder) {
				var go = confirm(ietngUtils.localizeMsg("offlineWarning"));
				if (!go) {
					return { status: "cancel" };
				}
			}
				*/
		}
		IETglobalFile = file.clone();
		if (type !== 3 && type !== 5) {
			IETwritestatus(ietngUtils.localizeMsg("exportstart"));
			document.getElementById("IETabortIcon").collapsed = false;
		}

		await exportAllMsgsStart(type, file, IETglobalMsgFolders[0], params);
		if (document.getElementById("IETabortIcon"))
			document.getElementById("IETabortIcon").collapsed = true;

	} catch (ex) {
		if (document.getElementById("IETabortIcon"))
			document.getElementById("IETabortIcon").collapsed = true;
		let errTitle = window.ietngAddon.extension.localeData.localizeMessage("Error.msg");
		let errMsg = ex;
		if (ex.extendedMsg) {
			errMsg += `\n\n${ex.extendedMsg}`;
		}
		errMsg += `\n\n${ex.stack}`;
		Services.prompt.alert(window, errTitle, errMsg);
		return { status: "error", errMsg: ex };
	}

	console.log(new Date() - st);

	return { status: "ok", exportFolderPath: exportFolderPath };
}

// 2) exportAllMsgsStart
//
// If we must export a virtual folder is called the function for that,
// otherwise is called the "normal" function of export

async function exportAllMsgsStart(type, file, msgFolder, params) {
	var newTopDir;
	var result;
	IETabort = false;

	// 0x0020 is MSG_FOLDER_FLAG_expVIRTUAL
	var isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
	if (isVirtFol) {
		if (IETglobalMsgFolders.length === 1) {
			await new Promise(resolve => setTimeout(resolve, 50));
			result = await exportAllMsgsDelayedVF(type, file, msgFolder, false, false);
			newTopDir = result.nextfile2;
		} else {
			IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
			await exportAllMsgsStart(type, file, IETglobalMsgFolders[IETglobalMsgFoldersExported]);
		}
	} else {
		await new Promise(resolve => setTimeout(resolve, 50));

		result = await exportAllMsgsDelayed(type, file, msgFolder, false, params);
		newTopDir = result.nextfile2;

		if (result.status == kStatusAbort) {
			return;
		}
		if (params.recursive && msgFolder.hasSubFolders) {
			//console.log("export all sf", msgFolder)

			result = await exportSubFolders(type, file, msgFolder, newTopDir, params);
			if (result.status == kStatusAbort) {
				IETabortExport();
				return;
			}
		}
	}
}

async function exportSubFolders(type, file, msgFolder, newTopDir, params) {
	for (const subFolder of msgFolder.subFolders) {
		await new Promise(resolve => setTimeout(resolve, 200));

		let subFolderName;
		if (!subFolder.localizedName) {
			subFolderName = subFolder.prettyName;
		} else {
			subFolderName = subFolder.localizedName;
		}

		let folderDirName = nametoascii(subFolderName);
		let folderDirNamePath = newTopDir.path;
		let fullFolderPath = PathUtils.join(folderDirNamePath, folderDirName);
		if (await IOUtils.exists(fullFolderPath)) {
			fullFolderPath = await IOUtils.createUniqueDirectory(folderDirNamePath, folderDirName)
		}
		file = await IOUtils.getDirectory(fullFolderPath);

		var newTopDir2;
		var isVirtFol = subFolder ? subFolder.flags & 0x0020 : false;
		if (isVirtFol) {
			result = await exportAllMsgsDelayedVF(type, file, subFolder, true, params);
			newTopDir2 = result.nextfile2;
		} else {
			result = await exportAllMsgsDelayed(type, file, subFolder, true, params);
			newTopDir2 = result.nextfile2;
		}
		if (result.status == kStatusAbort) {
			break;
		}

		if (subFolder.hasSubFolders) {
			result = await exportSubFolders(type, file, subFolder, newTopDir2, params);
		}
	}

	return result;

}

// 3a) exportAllMsgsDelayedVF
//
// The virtual folders are only a collection of messages that are really in other folders.
// So we must select the folder, do some pre-export stuff and call the export routine

async function exportAllMsgsDelayedVF(type, file, msgFolder, containerOverride, useMsgsDir) {
	//console.log("exportAllMsgsDelayedVF", msgFolder)

	var msgUriArray = [];

	// temporarily select virtual folder so we can expand and iterate
	let curMsgFolder = window.gTabmail.currentTabInfo.folder;
	window.gTabmail.currentTabInfo.folder = msgFolder;
	var gDBView = gTabmail.currentAbout3Pane.gDBView;

	var waitCnt = 100;
	while (waitCnt--) {
		if (gDBView.rowCount == gDBView.numMsgsInView) {
			break;
		}
		await new Promise(r => window.setTimeout(r, 50));
	}

	// Have to expand view to iterate across all threads
	// Should be a better way that does not change UI
	gDBView.doCommand(Ci.nsMsgViewCommandType.expandAll);
	for (let i = 0; i < gDBView.rowCount; i++) {
		// Error handling changed in 102
		// https://searchfox.org/comm-central/source/mailnews/base/content/junkCommands.js#428
		// Resolves #359

		try {
			var uri = gDBView.getURIForViewIndex(i);
			msgUriArray[i] = uri;
		} catch (ex) {

			continue; // Ignore errors for dummy rows
		}
	}
	// Collapse back view
	gDBView.doCommand(Ci.nsMsgViewCommandType.collapseAll);
	// jump back to top folder
	window.gTabmail.currentTabInfo.folder = curMsgFolder;

	var folderType = msgFolder.server.type;
	IETtotal = msgUriArray.length;
	IETexported = 0;
	IETskipped = 0;

	var hdrArray = [];
	var mustcorrectname = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_toascii");
	var filex = msgFolder2LocalFile(msgFolder);
	var datedir = buildContainerDirName();
	var useContainer = IETprefs.getBoolPref("extensions.importexporttoolsng.export.use_container_folder");

	if (useContainer && !containerOverride) {

		// Check if the name is good or exists already another directory with the same name
		var filetemp = file.clone();
		var direname;
		var subfile;

		let folderName;
		if (!msgFolder.localizedName) {
			folderName = msgFolder.prettyName;
		} else {
			folderName = msgFolder.localizedName;
		}

		if (mustcorrectname)
			direname = nametoascii(folderName) + "_" + datedir;
		else {
			direname = folderName + "_" + datedir;
			direname = direname.replace(/[\\:?"\*\/<>|]/g, "_");
		}
		filetemp.append(direname);
		var index1 = 0;
		while (filetemp.exists()) {
			index1++;
			filetemp = file.clone();
			if (mustcorrectname)
				direname = nametoascii(folderName) + "_" + datedir + "-" + index1.toString();
			else
				direname = folderName + "_" + datedir + "-" + index1.toString();
			filetemp.append(direname);
		}
		file = filetemp.clone();
		// Create the container directory
		file.create(1, 0o775);

		subfile = file.clone();

		// no message directory for eml exports
		if ((type < 3 || type > 6) && type != 0) {
			subfile.append(IETmesssubdir);
			subfile.create(1, 0o775);
		}
	} else {
		subfile = file.clone();
		if ((type < 3 || type > 6) && type != 0) {
			subfile.append(IETmesssubdir);
			subfile.create(1, 0o775);
		}
	}

	var file2 = file.clone();

	IETgetSortType();
	// Export the messages one by one
	for (let j = 0; j < msgUriArray.length; j++) {
		var msguri = msgUriArray[j];
		var msserv = MailServices.messageServiceFromURI(msguri);
		var msg = msserv.messageURIToMsgHdr(msguri);

		if (type !== 3 && type !== 5 && (msg.folder.server.type === "imap" || msg.folder.server.type === "news")
			&& !msg.folder.verifiedAsOnlineFolder &&
			!(msg.flags & 0x00000080)) {
			IETskipped = IETskipped + 1;
			IETtotal = IETtotal - 1;

			continue;
		}
		// cleidigh
		// var addBody = (type === 6) ? true : false;
		var addBody = type === 6;
		var hdrStr = IETstoreHeaders(msg, msguri, subfile, addBody);
		hdrArray.push(hdrStr);
	}

	hdrArray.sort();
	if (gDBView && gDBView.sortOrder === 2)
		hdrArray.reverse();
	result = await IETrunExport(type, subfile, hdrArray, file2, msgFolder);

	return { status: result, nextfile2: file2 };
}

// 3b) exportAllMsgsDelayed
//
// The same of 3a for non-virtual folder

async function exportAllMsgsDelayed(type, file, msgFolder, overrideContainer, params) {

	try {
		IETtotal = msgFolder.getTotalMessages(false);

		IETexported = 0;
		IETskipped = 0;
		var msgArray;

		if (msgFolder.getMessages)
			// Gecko 1.8 and earlier
			msgArray = msgFolder.getMessages(null);
		else
			// Gecko 1.9
			msgArray = msgFolder.messages;
	} catch (e) {
		alert(e)
		return;
	}
	var hdrArray = [];

	var mustcorrectname = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_toascii");
	var filex = msgFolder2LocalFile(msgFolder);
	var datedir = buildContainerDirName();
	var useContainer = IETprefs.getBoolPref("extensions.importexporttoolsng.export.use_container_folder");
	var skipExistingMsg = IETprefs.getBoolPref("extensions.importexporttoolsng.export.skip_existing_msg");
	var ext = IETgetExt(type);

	if (useContainer && !overrideContainer) {
		// Check if the name is good or exists already another directory with the same name
		var filetemp = file.clone();
		var direname;
		var subfile;

		let folderName;
		if (!msgFolder.localizedName) {
			folderName = msgFolder.prettyName;
		} else {
			folderName = msgFolder.localizedName;
		}

		if (mustcorrectname)
			direname = nametoascii(folderName) + "_" + datedir;
		else {
			direname = folderName + "_" + datedir;
			direname = direname.replace(/[\\:?"\*\/<>|]/g, "_");
		}
		filetemp.append(direname);
		var index1 = 0;
		while (filetemp.exists()) {
			index1++;
			filetemp = file.clone();
			if (mustcorrectname)
				direname = nametoascii(folderName) + "_" + datedir + "-" + index1.toString();
			else
				direname = folderName.replace(/[\\:?"\*\/<>|]/g, "_") + "_" + datedir + "-" + index1.toString();
			filetemp.append(direname);
		}
		file = filetemp.clone();
		// Create the container directory
		file.create(1, 0o755);

		// deal with top then recursive 

		let folderDirName = nametoascii(folderName);
		let folderDirNamePath = file.path;
		let fullFolderPath = PathUtils.join(folderDirNamePath, folderDirName);
		await IOUtils.makeDirectory(fullFolderPath);
		file = await IOUtils.getDirectory(fullFolderPath);
		subfile = file.clone();

		// no message directory for eml exports
		if ((type < 3 || type > 6) && type != 0) {
			subfile.append(IETmesssubdir);
			subfile.create(1, 0o755);
		}
	} else {
		subfile = file.clone();
		if ((type < 3 || type > 6) && type != 0) {
			subfile.append(IETmesssubdir);
			subfile.create(1, 0o755);
		}
	}

	var file2 = file.clone();
	IETgetSortType();

	var msgList = [...msgFolder.messages];
	if (msgFolder.getTotalMessages(false) != msgList.length) {
		//console.log(`IETNG: Thunderbird Msg count error: ${msgFolder.name}: getTotalMessages: ${IETtotal} Iterator: ${msgList.length}`)

		let curMsgFolder = window.gTabmail.currentTabInfo.folder;
		var gDBView = gTabmail.currentAbout3Pane.gDBView;
		var waitCnt = 100;
		while (waitCnt--) {
			if (IETtotal = [...msgFolder.messages].length) {
				break;
			}
			await new Promise(r => window.setTimeout(r, 50));
		}
		IETtotal = msgList.length;
		// jump back to top folder
		window.gTabmail.currentTabInfo.folder = curMsgFolder;
	}

	var cnt = 0;
	// Export the messages one by one
	while (msgArray.hasMoreElements()) {

		var msg = msgArray.getNext();
		var skip = false;
		msg = msg.QueryInterface(Ci.nsIMsgDBHdr);
		var tempExists = false;
		var tempFile;

		cnt++;
		if (!useContainer && skipExistingMsg) {
			var sog = getSubjectForHdr(msg, subfile.path);
			tempFile = subfile.clone();
			tempFile.append(sog + ext);
			tempExists = tempFile.exists();
		}


		if (!skip) {
			var addBody = type === 6;
			var msguri = msg.folder.getUriForMsg(msg);
			if (addBody && IETabort) {
				IETabort = false;
				break;
			}
			var hdrStr = IETstoreHeaders(msg, msguri, subfile, addBody);
			hdrArray.push(hdrStr);
		}

	}
	if (IETtotal != hdrArray.length) {
		console.log("IETNG: Thunderbird Msg count error, : getTotalMessages:", IETtotal, "Iterator:", hdrArray.length)

	}
	IETtotal = hdrArray.length;
	hdrArray.sort();
	// nsMsgViewSortOrderValue none = 0;
	// nsMsgViewSortOrderValue ascending = 1;
	// nsMsgViewSortOrderValue descending = 2;
	var gDBView = gTabmail.currentAbout3Pane.gDBView;
	if (gDBView && gDBView.sortOrder === 2) {
		hdrArray.reverse();
	}
	if (IETtotal == 0) {
		return { status: kStatusOK, nextfile2: file2 };

	}

	result = await IETrunExport(type, subfile, hdrArray, file2, msgFolder);

	return { status: result.status, nextfile2: file2 };
}

// 4) IETrunExport
//
// According to the type requested, it's called the routine that performs the export

async function IETrunExport(type, subfile, hdrArray, file2, msgFolder) {
	var firstUri = hdrArray[0].split("§][§^^§")[5];

	//console.log("runexport", msgFolder)

	switch (type) {
		case 1: // HTML format, with index
			result = await exportAsHtml(firstUri, null, subfile, false, true, false, false, hdrArray, file2, msgFolder);
			break;
		case 2: // Plain text format, with index
			result = await exportAsHtml(firstUri, null, subfile, true, true, false, false, hdrArray, file2, msgFolder);
			break;
		case 3: // Just HTML index
			result = createIndex(type, file2, hdrArray, msgFolder, true, true);
			break;
		case 4: // Plain text, single file, no index
			result = await exportAsHtml(firstUri, null, subfile, true, true, false, true, hdrArray, null, msgFolder);
			break;
		case 5: // Just CSV index
			result = createIndexCSV(type, file2, hdrArray, msgFolder, false);
			break;
		case 6: // CSV format, with body too
			result = createIndexCSV(type, file2, hdrArray, msgFolder, true);
			break;
		case 7: // Plain text, single file, no index and with attachments
			result = await exportAsHtml(firstUri, null, subfile, true, true, false, true, hdrArray, null, msgFolder, true);
			break;
		case 8: // HTML format, with index and attachments
			result = await exportAsHtml(firstUri, null, subfile, false, true, false, false, hdrArray, file2, msgFolder, true);
			break;
		case 9: // Plain text format, with index and attachments
			result = await exportAsHtml(firstUri, null, subfile, true, true, false, false, hdrArray, file2, msgFolder, true);
			break;
		case 10: // PDF format, with index
			result = await exportAsPDF(firstUri, null, subfile, false, true, false, false, hdrArray, file2, msgFolder, true);
			break;
		default: // EML format, with index
			result = await saveMsgAsEML(firstUri, subfile, false, null, hdrArray, null, false, false, file2, msgFolder);
	}

	if (type !== 3 && type !== 5 && type !== 6) {
		IETabort = false;
		document.getElementById("IETabortIcon").collapsed = false;
	}
	return result;
}

var attIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADFUlEQVR4nO2aTagOURjHH+KGuMXCZ0m3aycLKcqGEsICG2VhYXG7xYIsRSzIRjZ0EYnkY+EjG4qV8rWyQG5ZKPmIheQj3x/Pv5k3c+d9zpw5M2dm3nM9v/p33/vOOU/Pf94z55x5ZogURVEURVEURVEUpZPoYi1irWf1sdax5rNGNplUHcxlnWd9YP0R9JY1wJrZVIJVMYZ1jPWLZONpfWXtZI1oIlnfTGHdo3zG07pM0ckLlsmsh1TMfEuna8/aE/jlH1O2uR+sd6zflnabas69NDbz91krKFoNwHjWBtZTQ/sXrLH1pV8Om/mTrNGGvt2sW4Z+QYwCm/njZF/rMW+8F/peqiZlf/gw3+Kg0P+N53y94tM8WCvEwB7CdOk0im/zYJkhVreflP3hYh67ukOs5TnibhFiffaZuA9czQ/E3z8j+1C+K8R74Df9criaP5I6viQjdp8h5l7fJoqCZaqMeajfEBuT33ehPSbAOf6tuIOd220qZx7aKMQ2mYfOVOKmANLk5Goe+/6eVNws869Y06sy5MojkpM8QfnMQxdSMbPMf2EtrMyNIxNJTvIs5Tf/hDUpEdNmPs+SWSmY7WfEn3tJTnRBfNxmfpA1LRE7CPMY8kvj/00j4CJFw/SU4XiQ5jFMW9f7tsT3pjkgSxj2SfNrqMPNj2LdoH9JXU8cy1oFhoV5sIOGJoZNSG98DPuAOzSMzWPoS8WIq4k22AlmbYYgnKSpiT5BmAdbSU7yHA2t0eNmZjO1V3wxR+Ay6Uq0DcY8uEntSaIgOS6jD1aHnvhvmqDMA2n47y4YKzjzKDtLya4qECs482ACyQm7Jtvxm5wsPlF70tsd+gdtHkgPMTHT5ylqBm8e7CLZwB5LP7zgELx5MIv1jWQjh6l9qcPEiZP209AnKPMtULo27fAwR1xjHWVdoejJrqltkOYBVoMid31J4Q2P1XUn7pPZrNdUzPxHCvSXT4NCJJ7ju5h/zprXRLJVgZsePKh4SfZffT914LM7X6BIspi1j6IaPQomqO4eYK2kgN7eUBRFURRF+S/4CwPqfEibwrHFAAAAAElFTkSuQmCC"

function createIndex(type, file2, hdrArray, msgFolder, justIndex, subdir) {

	if (IETprefs.getBoolPref("extensions.importexporttoolsng.experimental.index_short1")) {
		createIndexShort1(type, file2, hdrArray, msgFolder, justIndex, subdir);
		return { status: kStatusOK };
	}


	if (!IETprefs.getBoolPref("extensions.importexporttoolsng.export.use_container_folder") && !justIndex && subdir)
		return { status: kStatusOK };


	// Custom date format
	// pref("extensions.importexporttoolsng.export.index_date_custom_format", "");
	var customDateFormat = IETgetComplexPref("extensions.importexporttoolsng.export.index_date_custom_format");
	var myDate = new Date();
	var titleDate;

	if (customDateFormat === "") {
		titleDate = myDate.toLocaleString();
	} else {
		titleDate = strftime.strftime(customDateFormat, myDate);
	}

	var clone2 = file2.clone();
	var ext = IETgetExt(type);
	var subdirname;

	if (subdir && type != 0)
		subdirname = encodeURIComponent(nametoascii(IETmesssubdir)) + "/";
	else
		subdirname = "";
	// Build the index html page
	clone2.append("index.html");
	clone2.createUnique(0, 0o644);

	var date_received_hdr = "";
	if (IETprefs.getBoolPref("extensions.importexporttoolsng.experimental.use_delivery_date")) {
		date_received_hdr = " (" + ietngUtils.localizeMsg("Received") + ")";
	}

	let subjectHdr = ietngUtils.localizeMsg("msgHdr.Subject");
	let fromHdr = ietngUtils.localizeMsg("msgHdr.From");
	let toHdr = ietngUtils.localizeMsg("msgHdr.To");
	let dateHdr = ietngUtils.localizeMsg("msgHdr.Date");

	// Improve index table formatting
	let styles = '<style>\r\n';
	styles += 'table { border-collapse: collapse; }\r\n';
	styles += 'th { background-color: #e6ffff; }\r\n';
	styles += 'th, td { padding: 4px; text-align: left; vertical-align: center; }\r\n';
	styles += 'tr:nth-child(even) { background-color: #f0f0f0; }\r\n';
	styles += 'tr:nth-child(odd) { background-color: #fff; }\r\n';
	styles += 'tr>:nth-child(5) { text-align: center; }\r\n';
	styles += 'tr>:nth-child(6) { text-align: right; }\r\n';
	styles += '</style>\r\n';

	var data = '<html>\r\n<head>\r\n';

	data = data + styles;
	data = data + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\r\n<title>' + msgFolder.name + '</title>\r\n</head>\r\n<body>\r\n<h2>' + msgFolder.name + " (" + titleDate + ")</h2>";

	data = data + '<table width="99%" border="1" >';
	data = data + "<tr><th><b>" + subjectHdr + "</b></th>"; // Subject
	data = data + "<th><b>" + fromHdr + "</b></th>"; // From
	data = data + "<th><b>" + toHdr + "</b></th>"; // To
	data = data + "<th><b>" + dateHdr + date_received_hdr + "</b></th>"; // Date

	data = data + "<th><b>" + "<img src='" + attIcon + "' height='20px' width='20px'></b></th>"; // Attachment

	const sizeStr = window.ietng.extension.localeData.localizeMessage("Size");
	data = data + "<th><b>" + sizeStr + "</b></th>"; // Attachment

	data = data + "</tr>";


	// Fill the table with the data of the arrays
	for (let i = 0; i < hdrArray.length; i++) {
		var currentMsgHdr = hdrArray[i];
		// If the last char is "1", so the first letter must be modified in lower case
		if (currentMsgHdr.substring(currentMsgHdr.length - 1) === "1")
			currentMsgHdr = currentMsgHdr.substring(0, 1).toLowerCase() + currentMsgHdr.substring(1, currentMsgHdr.length - 1);
		// Splits the array element to find the needed headers
		var hdrs = currentMsgHdr.split("§][§^^§");
		var time;
		var subj;
		var recc;
		var auth;

		switch (IETsortType) {
			case 1:
				time = hdrs[3];
				subj = hdrs[0];
				recc = hdrs[1];
				auth = hdrs[2];
				break;

			case 2:
				time = hdrs[3];
				subj = hdrs[1];
				recc = hdrs[2];
				auth = hdrs[0];
				break;

			case 3:
				time = hdrs[3];
				subj = hdrs[1];
				recc = hdrs[0];
				auth = hdrs[2];
				break;

			default:
				time = hdrs[0];
				subj = hdrs[1];
				recc = hdrs[2];
				auth = hdrs[3];
		}

		// Attachment flag may have changed from integer to string
		// https://github.com/thundernest/import-export-tools-ng/issues/68

		var hasAtt;
		if (hdrs[6] === 1 || hdrs[6] === '1') {
			hasAtt = "* ";
		} else
			hasAtt = "&nbsp;";

		// Find hour and minutes of the message
		var time2 = time / 1000;
		var obj = new Date(time2);
		var objHour = obj.getHours();
		var objMin = obj.getMinutes();
		if (objMin < 10)
			objMin = "0" + objMin;
		if (!justIndex) {
			var urlname = IETstr_converter(hdrs[4]);
			urlname.replace(/[\/\\:<>*\?\"\|]/g, "_");
			try {
				var url = subdirname + encodeURIComponent(urlname) + ext;
			} catch (ex) {
				console.log("IETNG: Fix Illegal url: ", urlname)

				urlname = filterNonASCIICharacters(urlname);
				url = subdirname + encodeURIComponent(urlname) + ext;
			}
			data = data + '\r\n<tr><td><a href="' + url + '">' + subj + "</a></td>";
		} else {
			data = data + "\r\n<tr><td>" + subj + "</td>";
		}


		// Deal with e-mail without 'To:' headerSwitch to insiders
		if (recc === "" || !recc) {
			recc = "(none)";
		}

		data = data + "\r\n<td>" + auth + "</td>";
		data = data + "\r\n<td>" + recc + "</td>";
		// The nowrap attribute is used not to break the time row

		// Custom date format

		if (customDateFormat === "") {
			data = data + "\r\n<td nowrap>" + strftime.strftime("%n/%d/%Y", new Date(time / 1000)) + " " + objHour + "." + objMin + "</td>";
		} else {
			data = data + "\r\n<td nowrap>" + strftime.strftime(customDateFormat, new Date(time / 1000)) + "</td>";
		}
		data = data + '\r\n<td align="center">' + hasAtt + "</td>";
		data = data + '\r\n<td nowrap align="left">' + ietngUtils.formatBytes(hdrs[7], 2) + "</td></tr>";

	}
	data = data + "</table></body></html>";
	IETwriteDataOnDiskWithCharset(clone2, data, false, null, null, "UTF-8");
	return { status: kStatusOK };
}

function createIndexShort1(type, file2, hdrArray, msgFolder, justIndex, subdir) {
	if (!IETprefs.getBoolPref("extensions.importexporttoolsng.export.use_container_folder") && !justIndex && subdir)
		return;

	// Custom date format
	// pref("extensions.importexporttoolsng.export.index_date_custom_format", "");
	var customDateFormat = IETgetComplexPref("extensions.importexporttoolsng.export.index_date_custom_format");
	var myDate = new Date();
	var titleDate;

	if (customDateFormat === "") {
		titleDate = myDate.toLocaleString();
	} else {
		titleDate = strftime.strftime(customDateFormat, myDate);
	}

	var clone2 = file2.clone();
	var ext = IETgetExt(type);
	var subdirname;

	if (subdir)
		subdirname = encodeURIComponent(nametoascii(IETmesssubdir)) + "/";
	else
		subdirname = "";
	// Build the index html page
	clone2.append("index.html");

	var date_received_hdr = "";
	if (IETprefs.getBoolPref("extensions.importexporttoolsng.experimental.use_delivery_date")) {
		date_received_hdr = " (" + ietngUtils.localizeMsg("Received") + ")";
	}

	// Improve index table formatting
	let styles = '<style>\r\n';
	styles += 'table { border-collapse: collapse; }\r\n';
	styles += 'th { background-color: #e6ffff; }\r\n';
	styles += 'th, td { padding: 2px; text-align: left; vertical-align: center; }\r\n';
	styles += 'tr:nth-child(even) { background-color: #f0f0f0; }\r\n';
	styles += 'tr:nth-child(odd) { background-color: #fff; }\r\n';
	styles += 'tr>:nth-child(3) { text-align: center; }\r\n';
	styles += '</style>\r\n';

	var data = '<html>\r\n<head>\r\n';

	data = data + styles;
	data = data + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\r\n<title>' + msgFolder.name + '</title>\r\n</head>\r\n<body>\r\n<h2>' + msgFolder.name + " (" + titleDate + ")</h2>";

	let subjectHdr = ietngUtils.localizeMsg("msgHdr.Subject");
	let fromHdr = ietngUtils.localizeMsg("msgHdr.From");
	let toHdr = ietngUtils.localizeMsg("msgHdr.To");
	let dateHdr = ietngUtils.localizeMsg("msgHdr.Date");

	data = data + '<table width="99%" border="1" >';
	data = data + "<tr>";
	data = data + "<th><b>" + "&nbsp;&nbsp;" + "</b></th>"; // Check 1
	data = data + "<th><b>" + "&nbsp;&nbsp;" + "</b></th>"; // Check 2
	data = data + "<th><b>" + "Attachment" + "</b></th>"; // Attachment
	data = data + "<th><b>" + ietngUtils.localizeMsg("msgHdr.Subject") + "</b></th>"; // Subject
	data = data + "<th><b>" + ietngUtils.localizeMsg("msgHdr.From") + "</b></th>"; // From
	data = data + "<th><b>" + ietngUtils.localizeMsg("msgHdr.Date") + date_received_hdr + "</b></th>"; // Date
	data = data + "</tr>";


	// Fill the table with the data of the arrays
	for (let i = 0; i < hdrArray.length; i++) {
		var currentMsgHdr = hdrArray[i];
		// If the last char is "1", so the first letter must be modified in lower case
		if (currentMsgHdr.substring(currentMsgHdr.length - 1) === "1")
			currentMsgHdr = currentMsgHdr.substring(0, 1).toLowerCase() + currentMsgHdr.substring(1, currentMsgHdr.length - 1);
		// Splits the array element to find the needed headers
		var hdrs = currentMsgHdr.split("§][§^^§");
		var time;
		var subj;
		var recc;
		var auth;

		switch (IETsortType) {
			case 1:
				time = hdrs[3];
				subj = hdrs[0];
				recc = hdrs[1];
				auth = hdrs[2];
				break;

			case 2:
				time = hdrs[3];
				subj = hdrs[1];
				recc = hdrs[2];
				auth = hdrs[0];
				break;

			case 3:
				time = hdrs[3];
				subj = hdrs[1];
				recc = hdrs[0];
				auth = hdrs[2];
				break;

			default:
				time = hdrs[0];
				subj = hdrs[1];
				recc = hdrs[2];
				auth = hdrs[3];
		}

		// Attachment flag may have changed from integer to string
		// https://github.com/thundernest/import-export-tools-ng/issues/68

		var hasAtt;
		if (hdrs[6] === 1 || hdrs[6] === '1') {
			hasAtt = "* ";
		} else
			hasAtt = "&nbsp;";

		// Find hour and minutes of the message
		var time2 = time / 1000;
		var obj = new Date(time2);
		var objHour = obj.getHours();
		var objMin = obj.getMinutes();
		if (objMin < 10)
			objMin = "0" + objMin;
		if (!justIndex) {
			var urlname = IETstr_converter(hdrs[4]);
			var url = subdirname + encodeURIComponent(urlname) + ext;
			data = data + '\r\n<tr><td><a href="' + url + '">' + subj + "</a></td>";
		} else {
			data = data + "\r\n<tr><td>" + "   " + "</td>";
		}

		data = data + "\r\n<td>" + "   " + "</td>";

		data = data + '\r\n<td align="center">' + hasAtt + "</td>";
		data = data + "\r\n<td>" + subj + "</td>";
		data = data + "\r\n<td>" + auth + "</td>";
		// The nowrap attribute is used not to break the time row

		// Custom date format

		if (customDateFormat === "") {
			data = data + "\r\n<td nowrap>" + strftime.strftime("%n/%d/%Y", new Date(time / 1000)) + " " + objHour + "." + objMin + "</td>";
		} else {
			data = data + "\r\n<td nowrap>" + strftime.strftime(customDateFormat, new Date(time / 1000)) + "</td>";
		}
		data = data + "</tr>";
	}
	data = data + "</table></body></html>";
	IETwriteDataOnDiskWithCharset(clone2, data, false, null, null, "UTF-8");
}



function createIndexCSV(type, file2, hdrArray, msgFolder, addBody) {
	var clone2;
	if (type !== 7 && type !== 6) {
		clone2 = file2.clone();
		clone2.append("index.csv");
	} else {
		clone2 = file2.clone();
		clone2.append("messages.csv");
		clone2.createUnique(0, 0o644);
	}

	var subdirname = nametoascii(IETmesssubdir);
	var sep = IETprefs.getCharPref("extensions.importexporttoolsng.csv_separator");
	var data = "";

	// Build the index CSV page

	var time;
	var subj;
	var recc;
	var auth;

	// Fill the table with the data of the arrays
	for (let i = 0; i < hdrArray.length; i++) {
		var currentMsgHdr = hdrArray[i];
		// If the last char is "1", so the first letter must be modified in lower case
		if (currentMsgHdr.substring(currentMsgHdr.length - 1) === "1")
			currentMsgHdr = currentMsgHdr.substring(0, 1).toLowerCase() + currentMsgHdr.substring(1, currentMsgHdr.length - 1);

		// Splits the array element to find the needed headers
		var hdrs = currentMsgHdr.split("§][§^^§");

		switch (IETsortType) {
			case 1:
				time = hdrs[3];
				subj = hdrs[0];
				recc = hdrs[1];
				auth = hdrs[2];
				break;

			case 2:
				time = hdrs[3];
				subj = hdrs[1];
				recc = hdrs[2];
				auth = hdrs[0];
				break;

			case 3:
				time = hdrs[3];
				subj = hdrs[1];
				recc = hdrs[0];
				auth = hdrs[2];
				break;

			default:
				time = hdrs[0];
				subj = hdrs[1];
				recc = hdrs[2];
				auth = hdrs[3];
		}

		// Find hour and minutes of the message
		var time2 = time / 1000;
		var obj = new Date(time2);
		var objHour = obj.getHours();
		var objMin = obj.getMinutes();
		if (objMin < 10)
			objMin = "0" + objMin;
		auth = auth.replace(/&gt;/g, ">");
		auth = auth.replace(/&lt;/g, "<");
		auth = auth.replace(/\"/g, "");
		recc = recc.replace(/&gt;/g, ">");
		recc = recc.replace(/&lt;/g, "<");
		recc = recc.replace(/\"/g, "");
		subj = subj.replace(/&gt;/g, ">");
		subj = subj.replace(/&lt;/g, "<");
		subj = subj.replace(/\"/g, "\"\"");
		if (subj.indexOf(sep) > -1)
			subj = "\"" + subj + "\"";
		if (auth.indexOf(sep) > -1)
			auth = "\"" + auth + "\"";
		if (recc.indexOf(sep) > -1)
			recc = "\"" + recc + "\"";

		var hasAtt;
		if (hdrs[6] === 1 || hdrs[6] === '1') {
			hasAtt = "*";
		}
		else {
			hasAtt = " ";
		}

		var body = addBody ? hdrs[8] : "";

		// Utilize index format for CSV 
		// https://github.com/thundernest/import-export-tools-ng/issues/161

		var customDateFormat = IETgetComplexPref("extensions.importexporttoolsng.export.index_date_custom_format");
		var msgDate = new Date(time / 1000);
		var csvDate;

		if (customDateFormat === "") {
			csvDate = msgDate.toLocaleDateString() + " " + objHour + ":" + objMin;
			// console.debug('DefaultDate ' + csvDate);
		} else {
			csvDate = strftime.strftime(customDateFormat, msgDate);
			// console.debug(' customDate ' + csvDate);
		}

		let size = hdrs[7];

		// Add experimental account /folder column #349
		let accountFolderCol = "";
		if (IETprefs.getBoolPref("extensions.importexporttoolsng.experimental.csv.account_folder_col")) {
			accountFolderCol = '"' + hdrs[5] + '"' + sep;
		}

		var record = accountFolderCol + '"' + subj.replace(/\"/g, '""') + '"' + sep + '"'
			+ auth.replace(/\"/g, '""') + '"' + sep + '"' + recc.replace(/\"/g, '""') +
			'"' + sep + csvDate + sep + hasAtt + sep + size + sep + body + "\r\n";

		data = data + record;
	}

	if (document.getElementById("IETabortIcon") && addBody)
		document.getElementById("IETabortIcon").collapsed = true;
	IETwriteDataOnDiskWithCharset(clone2, data, false, null, null, null);
	return { status: kStatusOK };
}


async function saveMsgAsEML(msguri, file, append, uriArray, hdrArray, fileArray, imapFolder, clipboard, file2, msgFolder) {

	var saveAsEmlDone = false;
	var nextUri = msguri;
	var nextFile = file;
	var result;

	while (!saveAsEmlDone) {
		result = await new Promise((resolve, reject) => {

			var myEMLlistner = {

				scriptStream: null,
				emailtext: "",

				QueryInterface: function (iid) {
					if (iid.equals(Ci.nsIStreamListener) ||
						iid.equals(Ci.nsISupports))
						return this;
					throw Cr.NS_NOINTERFACE;
				},

				onStartRequest: function (aRequest) { },

				onStopRequest: function (aRequest, aStatusCode) {
					var sub;
					var data;

					this.scriptStream = null;

					try {

						if (clipboard) {
							IETcopyStrToClip(this.emailtext);
							return;
						}
						var tags = hdr.getStringProperty("keywords");
						if (tags && this.emailtext.substring(0, 5000).includes("X-Mozilla-Keys"))
							this.emailtext = "X-Mozilla-Keys: " + tags + "\r\n" + this.emailtext;
						if (append) {

							if (this.emailtext !== "") {
								data = this.emailtext + "\n";

								// Some IMAP servers don't add to the message the "From" prologue
								if (data && !data.match(/^From /)) {
									let fromAddr;
									try {
										fromAddr = parse5322.parseFrom(hdr.author)[0].address;
									} catch (ex) {
										fromAddr = "";
									}

									let msgDate = (new Date(hdr.dateInSeconds * 1000));
									msgDate.setMinutes(msgDate.getMinutes() + msgDate.getTimezoneOffset());
									let msgDateStr = strftime.strftime("%a %b %d %H:%M:%S %Y", msgDate);

									var prologue = "From " + fromAddr + " " + msgDateStr + "\n";
									data = prologue + data;
								}
								data = IETescapeBeginningFrom(data);
							}
							var fileClone = file.clone();
							data = data.replace(/\r\n/g, "\n");

							IETwriteDataOnDisk(fileClone, data, true, null, null);
							sub = true;
						} else {
							if (!hdrArray) {
								sub = getSubjectForHdr(hdr, file.path);
							} else {
								var parts = hdrArray[IETexported].split("§][§^^§");
								sub = parts[4];
								sub = sub.replace(/[\x00-\x1F]/g, "_");
							}

							sub = IETstr_converter(sub);

							if (sub) {
								// Addresses #350
								// This probably is removing an mbox separator, but is
								// not specific enough and originally would replace 
								// a normal From: field. Make better regex...
								// data = this.emailtext.replace(/^From.+\r?\n/, "");

								data = this.emailtext.replace(/^(From (?:.*?)\r?\n)([\x21-\x7E]+: )/, "$2");
								data = IETescapeBeginningFrom(data);

								// Strip CR option - @ashikase
								if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.strip_CR_for_EML_exports")) {
									data = data.replace(/\r\n/g, "\n");
								}

								var clone = file.clone();
								// The name is taken from the subject "corrected"
								clone.append(sub + ".eml");
								clone.createUnique(0, 0o644);
								var time = (hdr.dateInSeconds) * 1000;
								IETwriteDataOnDisk(clone, data, false, null, time);
								// myEMLlistener.file2 exists just if we need the index
								if (myEMLlistner.file2) {
									var nameNoExt = clone.leafName.replace(/\.eml$/, "");
									// If the leafName of the file is not equal to "sub", we must change also
									// the correspondent section of hdrArray[IETexported], otherwise the link
									// in the index will be wrong
									if (sub !== nameNoExt) {
										parts[4] = nameNoExt;
										hdrArray[IETexported] = parts.join("§][§^^§");
									}
								}
							}
						}
						IETexported = IETexported + 1;
						if (sub)
							IETwritestatus(ietngUtils.localizeMsg("exported") + " " + IETexported + " " + ietngUtils.localizeMsg("msgs") + " " + (IETtotal + IETskipped));

						if (IETabort) {
							IETabort = false;
							resolve(kStatusAbort)
							return;
						}

						if (IETexported < IETtotal) {
							if (fileArray) {
								nextUri = uriArray[IETexported];
								nextFile = fileArray[IETexported];
							} else if (!hdrArray) {
								nextUri = uriArray[IETexported];
								nextFile = file;
							} else {
								parts = hdrArray[IETexported].split("§][§^^§");
								nextUri = parts[5];
								nextFile = file;
							}
							resolve(kStatusOK);
							return;
						} else {
							if (myEMLlistner.file2)
								createIndex(0, myEMLlistner.file2, hdrArray, myEMLlistner.msgFolder, false, true);
							IETexported = 0;
							IETtotal = 0;
							IETskipped = 0;
							if (IETglobalMsgFolders) {
								IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
								if (IETglobalMsgFoldersExported && IETglobalMsgFoldersExported < IETglobalMsgFolders.length) {
									if (imapFolder) {
										setTimeout(function () {
											exportIMAPfolder(IETglobalMsgFolders[IETglobalMsgFoldersExported], file.parent);
										}, 1000);
									} else
										exportAllMsgsStart(0, IETglobalFile, IETglobalMsgFolders[IETglobalMsgFoldersExported]);
								} else if (document.getElementById("IETabortIcon"))
									document.getElementById("IETabortIcon").collapsed = true;
							} else if (document.getElementById("IETabortIcon"))
								document.getElementById("IETabortIcon").collapsed = true;
						}
						saveAsEmlDone = true;
						resolve(kStatusDone);
					} catch (ex) {
						let folderName;
						if (!hdr.folder.localizedName) {
							folderName = msgFolder.prettyName;
						} else {
							folderName = hdr.folder.localizedName;
						}

						ex.extendedMsg = `Exporting: Folder: ${folderName}\nMsg: ${hdr.mime2DecodedSubject}`;
						if (document.getElementById("IETabortIcon")) {
							document.getElementById("IETabortIcon").collapsed = true;
						}
						reject(ex)
					}
				},

				onDataAvailable: function (aRequest, aInputStream, aOffset, aCount) {
					var scriptStream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
					scriptStream.init(aInputStream);
					this.emailtext += scriptStream.read(scriptStream.available());
				},
			};

			var mms = MailServices.messageServiceFromURI(nextUri);
			var hdr = mms.messageURIToMsgHdr(nextUri);

			try {
				IETlogger.write("call to saveMsgAsEML - subject = " + hdr.mime2DecodedSubject + " - messageKey = " + hdr.messageKey);
			} catch (e) {
				IETlogger.write("call to saveMsgAsEML - error = " + e);
			}

			file = nextFile;
			myEMLlistner.file2 = file2;
			myEMLlistner.msgFolder = msgFolder;
			mms.streamMessage(nextUri, myEMLlistner, msgWindow, null, false, null);
		});
		if (saveAsEmlDone || result == kStatusAbort) {
			break;
		}
	}
	if (result == kStatusDone) {
		return { status: kStatusOK };
	} else {
		return { status: result };
	}
}

async function exportAsHtml(uri, uriArray, file, convertToText, allMsgs, copyToClip, append, hdrArray, file2, msgFolder, saveAttachments) {

	//console.log("exportashtml", msgFolder)

	if (!msgFolder) {
		var messageService = MailServices.messageServiceFromURI(uri);
		var hdr = messageService.messageURIToMsgHdr(uri);
		msgFolder = hdr.folder;

		if (!msgFolder) {
			console.log("exportashtml null msgFolder on entry", convertToText);
			Services.prompt.alert(window, "Error", "msgFolder null on export ashtml.\nPlease report!")
			return { status: kStatusOK };
		}
	}

	var exportAsHtmlDone = false;
	var nextUri = uri;

	while (!exportAsHtmlDone) {
		var result = await new Promise((resolve, reject) => {

			var myTxtListener = {
				scriptStream: null,
				emailtext: "",

				QueryInterface: function (iid) {
					if (iid.equals(Ci.nsIStreamListener) ||
						iid.equals(Ci.nsISupports))
						return this;

					throw Cr.NS_NOINTERFACE;
				},


				onStartRequest: function (request) { },

				onDataAvailable: function (aRequest, inputStream, aOffset, aCount) {
					var scriptStream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
					scriptStream.init(inputStream);
					this.emailtext += scriptStream.read(scriptStream.available());
				},

				onStopRequest: async function (request, statusCode) {

					try {

						var data = this.emailtext;

						if (copyToClip) {
							data = IEThtmlToText(data, msgFolder);
							IETcopyToClip(data);
							return;
						}

						this.scriptStream = null;
						var clone = file.clone();

						if (String.prototype.trim && saveAttachments && (hdr.flags & 0x10000000)) {
							var aMsgHdr = hdr;
							MsgHdrToMimeMessage(aMsgHdr, null, async function (aMsgHdr, aMsg) {
								var attachments = aMsg.allUserAttachments ? aMsg.allUserAttachments : aMsg.allAttachments;
								// attachments = attachments.filter(function (x) x.isRealAttachment);

								var footer = null;
								var noDir = true;
								var attName;
								var attNameAscii;
								var attDirContainerName;
								var time = (hdr.dateInSeconds) * 1000;

								for (var i = 0; i < attachments.length; i++) {
									var att = attachments[i];
									if (noDir) {
										var attDirContainer = file.clone();
										var attachmentsExtendedFilenameFormat = IETgetComplexPref("extensions.importexporttoolsng.export.attachments.filename_extended_format");

										if (attachmentsExtendedFilenameFormat === "") {
											attDirContainer.append("Attachments");
										} else {
											let afname = constructAttachmentsFilename(1, hdr);
											attDirContainer.append(afname);
										}

										if (navigator.platform.toLowerCase().includes("win") &&
											attDirContainer.path.length > 220) {
											let attName = PathUtils.filename(attDirContainer.path);
											let cutLen = attName.length / 4;
											attName = attName.slice(0, attName.length - cutLen);
											attName = attName.trimEnd();
											attDirContainer.initWithPath(PathUtils.join(PathUtils.parent(attDirContainer.path), attName));
										}
										attDirContainer.createUnique(1, 0o755);
										footer = '<br><hr><br><div style="font-size:16px;color:black;"><img src="data:image/gif;base64,R0lGODdhDwAPAOMAAP///zEwYmJlzQAAAPr6+vv7+/7+/vb29pyZ//39/YOBg////////////////////ywAAAAADwAPAAAESRDISUG4lQYr+s5bIEwDUWictA2GdBjhaAGDrKZzjYq3PgUw2co24+VGLYAAAesRLQklxoeiUDUI0qSj6EoH4Iuoq6B0PQJyJQIAOw==">\r\n<ul>';
										noDir = false;
									}
									var success = true;

									if (att.url.indexOf("file") === 0) { // Detached attachments
										try {
											var localFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
											var attURL = decodeURIComponent(att.url.replace(/\?part.+/, ""));
											attURL = attURL.replace("file://", "");
											localFile.initWithPath(attURL);
											localFile.copyTo(attDirContainer, "");
											attName = localFile.leafName;
											attNameAscii = encodeURIComponent(attName);
										} catch (e) {
											success = false;
										}
									} else {
										try {
											var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
												.createInstance(Ci.nsIScriptableUnicodeConverter);
											converter.charset = "UTF-8";
											attName = converter.ConvertFromUnicode(att.name);
											attDirContainerName = converter.ConvertFromUnicode(attDirContainer.leafName);

											var attDirContainerClone = attDirContainer.clone();
											attNameAscii = encodeURIComponent(att.name);

											let totallen = attDirContainerClone.path.length + attNameAscii.length
											var adjustedAttName = att.name;

											// while NTFS is supposed to support paths
											// up to 255 chars, tests throw exceptions
											// at 249 chars so we truncate there

											if (totallen > 248) {
												let cutLen = totallen - 248;
												// separate name from extension so we can truncate name
												let extension = att.name.split('.').pop();
												let lastDotIndex = att.name.lastIndexOf('.');
												if (lastDotIndex == -1) {
													adjustedAttName = att.name;
												} else {
													adjustedAttName = `${att.name.substring(0, lastDotIndex - cutLen)}.${extension}`;
												}
											}
											attDirContainerClone.append(adjustedAttName);
											attachments[i].file = attDirContainerClone;

											let attPartName = att.url.match(/part=([.0-9]+)&?/)[1];
											let attFile = await getAttachmentFile(aMsgHdr, attPartName)
											let fileData = await fileToUint8Array(attFile);
											await IOUtils.write(attDirContainerClone.path, fileData);
										} catch (e) {
											success = false;
											console.debug('save attachment exception ' + att.name);
											console.debug(e);
										}
									}

									if (success)
										footer = footer + '<li><a href="' +
											encodeURIComponent(attDirContainer.leafName) +
											"/" + encodeURIComponent(adjustedAttName) + '">' +
											attDirContainerName + "/" + attName + '</li></a>';
								}
								if (footer) {
									footer = footer + "</ul></div><div class='' ></div></body>";
									data = data.replace("</body>", footer);
									data = data.replace(/<\/html>(?:.|\r?\n)+/, "</html>");

									// cleidigh - fix up group boxes and images
									let rs;

									// cleidigh - original outline for inline images 
									// regex could somehow go to recursion
									// https://github.com/thundernest/import-export-tools-ng/issues/98

									// Just remove all but top outlines for now

									data = data.replace(/<\/head>/i, "<style>fieldset.moz-mime-attachment-header {border-bottom: none; border-right: none; border-left: none;}</style></head>");

									let regex2 = /<div class="moz-text-plain"([\S|\s]*?)<\/div>/gi;
									rs = null;
									rs = data.match(regex2);

									if (!!rs && rs.length > 0) {
										for (let index = 0; index < rs.length; index++) {
											const element = rs[index];
											data = data.replace(element, element + "\n</fieldset>\n");
										}
									}

								}

								myTxtListener.onAfterStopRequest(clone, data, saveAttachments);
							}, true, { examineEncryptedParts: true });
						} else
							await myTxtListener.onAfterStopRequest(clone, data, saveAttachments);

					} catch (ex) {
						let folderName;
						if (!hdr.folder.localizedName) {
							folderName = msgFolder.prettyName;
						} else {
							folderName = hdr.folder.localizedName;
						}
						ex.extendedMsg = `Exporting: Folder: ${folderName}\nMsg: ${hdr.mime2DecodedSubject}`;
						if (document.getElementById("IETabortIcon")) {
							document.getElementById("IETabortIcon").collapsed = true;
						}
						reject(ex);
					}
				},

				onAfterStopRequest: async function (clone, data, saveAttachments) {
					try {

						let encoder = new TextEncoder();

						let replyToStr = ietngUtils.localizeMsg("msgHdr.ReplyTo");

						let cvtToUTF16 = function (s) {
							s = encoder.encode(s);
							s = ietngUtils.bytesToString(s);
							return s;
						}

						// This is a ridiculous set of transforms we have to do because
						// streammessage with aConvert == true does not translate headers
						// in the ja locale even in v128, just ty a Print!
						if (Services.locale.appLocaleAsBCP47 === "ja") {
							let jaSubject = ietngUtils.localizeMsg("msgHdr.Subject");
							let jaTo = ietngUtils.localizeMsg("msgHdr.To");
							let jaFrom = ietngUtils.localizeMsg("msgHdr.From");
							let jaDate = ietngUtils.localizeMsg("msgHdr.Date");
							jaSubject = cvtToUTF16(jaSubject);
							data = data.replace(">Subject: </", `>${jaSubject}: </`);
							jaTo = cvtToUTF16(jaTo);
							data = data.replace(">To: </", `>${jaTo}: </`);
							jaFrom = cvtToUTF16(jaFrom);
							data = data.replace(">From: </", `>${jaFrom}: </`);
							jaDate = cvtToUTF16(jaDate);
							data = data.replace(">Date: </", `>${jaDate}: </`);
						}

						replyToStr = encoder.encode(replyToStr);
						replyToStr = ietngUtils.bytesToString(replyToStr);

						var replyTo = hdr.getStringProperty("replyTo");
						if (replyTo.length > 1) {
							var replyTo = replyTo.replace("<", "&lt;").replace(">", "&gt;");

							var rt = '<tr><td><div class="moz-header-display-name" style="display:inline;">' + replyToStr + ': </div> ' + replyTo + '</td></tr>';
							data = data.replace("</table><br>", rt + "</table><br>");
						}

						var appendClone;
						if (this.append && convertToText) {
							appendClone = clone.clone();
						}

						var sub;
						if (!hdrArray)
							sub = getSubjectForHdr(hdr, file.path);
						else {
							var parts = hdrArray[IETexported].split("§][§^^§");
							sub = parts[4];
							sub = sub.replace(/[\x00-\x1F]/g, "_");
						}

						sub = IETstr_converter(sub);

						// The name is taken from the subject "corrected"
						if (convertToText)
							clone.append(sub + ".txt");
						else
							clone.append(sub + ".html");
						var num = 0;
						while (clone.exists()) {
							num++;
							clone = file.clone();
							if (convertToText)
								clone.append(sub + "-" + num + ".txt");
							else
								clone.append(sub + "-" + num + ".html");
						}
						if (myTxtListener.file2) {
							if (num > 0) {
								// If "num" is greater than 0, it means that the filename is not equal to subject
								// and so the correspondent section of hdrArray[IETexported] must be modified too,
								// otherwise the link the index will be wrong
								parts[4] = sub + "-" + num;
								hdrArray[IETexported] = parts.join("§][§^^§");
							}
						}
						var time = (hdr.dateInSeconds) * 1000;

						if (saveAttachments) {
							// Save embedded images
							try {
								var embImgContainer = null;
								var isWin = (navigator.platform.toLowerCase().indexOf("win") > -1);

								// Embedded in-line images can be either 'mailbox' for POP accounts
								// or 'imap' for IMAP
								// Fix https://github.com/thundernest/import-export-tools-ng/issues/74

								var imgs;
								imgs = data.match(/<IMG[^>]+SRC=\"mailbox[^>]+>/gi);
								if (imgs === null) {
									imgs = [];
								}

								var imgsImap = data.match(/<IMG[^>]+SRC=\"imap[^>]+>/gi);
								if (imgsImap !== null) {
									imgs = imgs.concat(imgsImap);
								}

								let imgAtts = imgs.map(img => {
									return { imgLink: img }
								});

								// Update for extended naming
								for (var i = 0; i < imgs.length; i++) {
									if (!embImgContainer) {
										embImgContainer = file.clone();
										var attachmentsExtendedFilenameFormat = IETgetComplexPref("extensions.importexporttoolsng.export.embedded_attachments.filename_extended_format");

										if (attachmentsExtendedFilenameFormat === "") {
											embImgContainer.append("EmbeddedImages");
										} else {
											let afname = constructAttachmentsFilename(2, hdr);
											embImgContainer.append(afname);
										}
										embImgContainer.createUnique(1, 0o755);
									}

									var aUrl;

									aUrl = imgs[i].match(/mailbox:\/\/\/[^\"]+/);
									if (aUrl === null) {
										aUrl = imgs[i].match(/imap:\/\/[^\"]+/);
									}

									if (aUrl === null) {
										continue;
									}

									if (ietngUtils.getThunderbirdVersion().major <= 128) {

										// The urlListener.OnStopRunningUrl fires before the 
										// file is truly closed. An attempt to change lastModifiedTime
										// here gets superceded with the current date. This is likely 
										// a file descriptor being closed after the event.
										// A setTimeout delayed action is required. 
										// Setting the attachment date to match the message date #549

										// @implements {nsIUrlListener}
										const embImgsUrlListener = {
											OnStartRunningUrl(url) { },
											OnStopRunningUrl(url, status) {
												if (time && !IETprefs.getBoolPref("extensions.importexporttoolsng.export.set_filetime")) {
													return;
												}
												let curAtt = imgAtts.find((att) => {
													if (att.url == url.spec) {
														return true;
													}
												})
												setTimeout(this.setFileTime, 50, curAtt);
											},
											setFileTime(curAtt) {
												curAtt.file.lastModifiedTime = time;
											}
										}

										var embImg = embImgContainer.clone();

										embImg.append(i + ".jpg");
										imgAtts[i].file = embImg;
										imgAtts[i].url = aUrl;

										messenger.saveAttachmentToFile(embImg, aUrl, uri, "image/jpeg", embImgsUrlListener);
										// Encode for UTF-8 - Fixes #355
										data = data.replace(aUrl, encodeURIComponent(embImgContainer.leafName) + "/" + i + ".jpg");

									} else {

										let inlinePartName = aUrl[0].match(/part=([.0-9]+)&?/)[1];
										let inlineFilename = aUrl[0].match(/\&filename=(.+)&?/)[1];

										var embImg = embImgContainer.clone();
										embImg.append(inlineFilename);
										imgAtts[i].url = aUrl;

										try {
											let inlineFile = await getAttachmentFile(hdr, inlinePartName)
											let fileData = await fileToUint8Array(inlineFile);
											let unqInlineFilepath = await IOUtils.createUniqueFile(embImgContainer.path, inlineFilename)
											await IOUtils.write(unqInlineFilepath, fileData);
											embImg = embImg.initWithPath(unqInlineFilepath)
											imgAtts[i].file = embImg;

											// Encode for UTF-8 - Fixes #355
											data = data.replace(aUrl, encodeURIComponent(embImgContainer.leafName) + "/" + inlineFilename);
										} catch {
											data = data.replace(aUrl, "data:image/gif;base64,R0lGODdhDwAPAOMAAP///zEwYmJlzQAAAPr6+vv7+/7+/vb29pyZ//39/YOBg////////////////////ywAAAAADwAPAAAESRDISUG4lQYr+s5bIEwDUWictA2GdBjhaAGDrKZzjYq3PgUw2co24+VGLYAAAesRLQklxoeiUDUI0qSj6EoH4Iuoq6B0PQJyJQIAOw==")
										}
									}
								}
							} catch (e) {
								console.log(e)
								IETlogger.write("save embedded images - error = " + e);
							}
						}
						/* Clean HTML code generated by streamMessage and "header=filter":
						- Replace author/recipients/subject with mimeDecoded values
						- Strip off the reference to messageBody.css
						- Add a style rule to make headers name in bold
						*/

						let mimePartsArray = data.match(/=\?[\w-]+\?[BQ]\?\S+\?=/g)

						if (mimePartsArray) {
							for (const mimePart of mimePartsArray) {
								let mimePartStr = ietngUtils.bytesToString(encoder.encode(mimePart));
								let decodedMimePartStr = MailServices.mimeConverter.decodeMimeHeader(
									mimePartStr,
									null,
									false /* override_charset */,
									true /* eatContinuations */
								);
								let encodedMimePartArr = encoder.encode(decodedMimePartStr);
								let mimeStr = ietngUtils.bytesToString(encodedMimePartArr);
								data = data.replace(mimePart, mimeStr);
							}
						}

						/* example insertion of mime element
						tempStr = this.hdr.recipients.replace("<", "&lt;").replace(">", "&gt;");
						let decodedRecStr = this.hdr.mime2DecodedAuthor.replace("<", "&lt;").replace(">", "&gt;");
						let encodedRecArr = encoder.encode(decodedRecStr);
						let utf8RecStr = ietngUtils.bytesToString(encodedRecArr);
						data = data.replace(tempStr, utf8RecStr);
						*/

						data = data.replace("chrome:\/\/messagebody\/skin\/messageBody.css", "");

						const r1 = "div.headerdisplayname {font-weight:bold;}\n";
						// const rh = ".tb { display: none;}\n";
						// const r2 = ".moz-text-html .tb { display: block;}\n";
						data = data.replace("<\/head>", `<style>${r1}<\/style><\/head>`);

						if (!HTMLasView && this.chrset)
							data = data.replace("<head>", '<head><meta http-equiv="Content-Type" content="text/html; charset=' + this.chrset + '" />');
						else
							data = data.replace("<head>", '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />');

						if (!msgFolder) {
							console.log("exportashtml Before cvt", msgFolder)
							Services.prompt.alert(window, "Error", "msgFolder null before text converter.\nPlease report!")
							resolve(kStatusOK);
						}

						if (convertToText) {
							data = IEThtmlToText(data, msgFolder);
						}
						if (convertToText && append) {
							data = data + "\r\n\r\n" + IETprefs.getCharPref("extensions.importexporttoolsng.export.mail_separator") + "\r\n\r\n";

							var nfile = appendClone.leafName + ".txt";
							IETwriteDataOnDiskWithCharset(appendClone, data, true, nfile, time, null);
						} else if (convertToText) {
							IETwriteDataOnDiskWithCharset(clone, data, true, nfile, time, null);
						} else {
							data = IETconvertToUTF8(data);
							IETwriteDataOnDiskWithCharset(clone, data, true, nfile, time, "UTF-8");
						}

						IETexported = IETexported + 1;
						IETwritestatus(ietngUtils.localizeMsg("exported") + " " + IETexported + " " + ietngUtils.localizeMsg("msgs") + " " + (IETtotal + IETskipped));

						if (IETabort) {
							IETabort = false;
							console.log("abort", msgFolder.name)
							resolve(kStatusAbort)
							return;
						}

						if (IETexported < IETtotal) {
							if (!hdrArray)
								nextUri = uriArray[IETexported];
							else {
								parts = hdrArray[IETexported].split("§][§^^§");
								nextUri = parts[5];
							}
							resolve(kStatusOK);
							return;

						} else {
							var type = convertToText ? 2 : 1;
							if (myTxtListener.file2) {
								createIndex(type, myTxtListener.file2, hdrArray, myTxtListener.msgFolder, false, true);
							}
							if (saveAttachments)
								type += 7;
							IETexported = 0;
							IETtotal = 0;
							IETskipped = 0;
							IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
							if (IETglobalMsgFoldersExported && IETglobalMsgFoldersExported < IETglobalMsgFolders.length)
								exportAllMsgsStart(type, IETglobalFile, IETglobalMsgFolders[IETglobalMsgFoldersExported]);
							else if (document.getElementById("IETabortIcon"))
								document.getElementById("IETabortIcon").collapsed = true;
							exportAsHtmlDone = true;
							resolve(kStatusDone);
						}

					} catch (ex) {
						let folderName;
						if (!hdr.folder.localizedName) {
							folderName = msgFolder.prettyName;
						} else {
							folderName = hdr.folder.localizedName;
						}
						ex.extendedMsg = `Exporting: Folder: ${folderName}\nMsg: ${hdr.mime2DecodedSubject}`;
						if (document.getElementById("IETabortIcon")) {
							document.getElementById("IETabortIcon").collapsed = true;
						}
						reject(ex)
					}
				},
			};


			// This pref fixes also bug https://bugzilla.mozilla.org/show_bug.cgi?id=384127
			var HTMLasView = IETprefs.getBoolPref("extensions.importexporttoolsng.export.HTML_as_displayed");
			// For additional headers see http://lxr.mozilla.org/mozilla1.8/source/mailnews/mime/src/nsStreamConverter.cpp#452
			if (!HTMLasView && !convertToText && !copyToClip)
				uri = uri + "?header=saveas";
			var messageService = MailServices.messageServiceFromURI(uri);
			var hdr = messageService.messageURIToMsgHdr(uri);

			try {
				IETlogger.write("call to exportAsHtml - subject = " + hdr.mime2DecodedSubject + " - messageKey = " + hdr.messageKey);
			} catch (e) {
				IETlogger.write("call to exportAsHtml - error = " + e);
			}
			myTxtListener.append = append;
			myTxtListener.hdr = hdr;
			myTxtListener.file2 = file2;
			myTxtListener.msgFolder = msgFolder;

			/* With Thunderbird 5 or higher, nschannel+asyncConverter causes randomly a crash.
			This is probably due to some JavaScript engine bug, for technical details see
			https://bugzilla.mozilla.org/show_bug.cgi?id=692735
			To use streamMessage with "header=filter" additional header is a quite good compromise,
			as workaround against this bug. The HTML code generated is less clean than the one generated
			by asyncConverter; it's made cleaner ex-post in OnStopRequest function.
			Notice that streamMessage alone seems not to work with NEWS messages, so for them I'm forced
			to use the asyncConverter.
			I hope that in future the bug of asyncConverter will be fixed (it should be on 10 version) and so I've
			insert a preference to use it anyway.
			*/

			var useConverter = IETprefs.getBoolPref("extensions.importexporttoolsng.export.use_converter");
			if (hdr.folder.server.type === "nntp" || useConverter) {
				var nsURI = Cc["@mozilla.org/network/io-service;1"]
					.getService(Ci.nsIIOService).newURI(uri, null, null);
				var nschannel = Cc["@mozilla.org/network/input-stream-channel;1"]
					.createInstance(Ci.nsIInputStreamChannel);
				nschannel.setURI(nsURI);
				var streamConverterService = Cc["@mozilla.org/streamConverters;1"]
					.getService(Ci.nsIStreamConverterService);
				var streamListner = streamConverterService.asyncConvertData("message/rfc822", "text/html", myTxtListener, nschannel);
				myTxtListener.chrset = hdr.Charset;
				messageService.streamMessage(uri, streamListner, msgWindow, null, false, null);
			} else if (hdr.folder.server.type === "imap") {
				myTxtListener.chrset = "UTF-8";
				messageService.streamMessage(uri, myTxtListener, null, null, true, null);
			} else {
				myTxtListener.chrset = hdr.Charset;
				messageService.streamMessage(uri, myTxtListener, null, null, true, "header=filter");
			}

		});


		uri = nextUri;
		if (result == kStatusAbort) {
			break;
		}
	}

	if (result == kStatusDone) {
		return { status: kStatusOK };
	} else {
		return { status: result };
	}

}

async function fileToUint8Array(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			const arrayBuffer = event.target.result;
			const uint8Array = new Uint8Array(arrayBuffer);
			resolve(uint8Array);
		};

		reader.onerror = (error) => {
			reject(error);
		};

		reader.readAsArrayBuffer(file);
	});
}

async function exportAsPDF(uri, uriArray, file, convertToText, allMsgs, copyToClip, append, hdrArray, file2, msgFolder, saveAttachments) {
	var msgUris = [];

	hdrArray.forEach(hdrItem => {
		var uri = hdrItem.split("§][§^^§")[5];
		msgUris.push(uri)
	});

	await IETprintPDFmain.setupPDF(msgUris, file.path);
	createIndex(10, file2, hdrArray, msgFolder, false, true);
	return { status: kStatusOK }
}


function IETconvertToUTF8(string) {
	try {
		var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";
		var stringUTF8 = converter.ConvertToUnicode(string);
		return stringUTF8;
	} catch (e) {
		return string;
	}
}

function getLoadContext() {
	return window.docShell.QueryInterface(Ci.nsILoadContext);
}


function IETcopyToClip(data) {
	var str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
	var str2 = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
	var justText = IETprefs.getBoolPref("extensions.importexporttoolsng.clipboard.always_just_text");
	str.data = data;
	// Hack to clean the headers layout!!!
	data = data.replace(/<div class=\"headerdisplayname\" style=\"display:inline;\">/g, "<span>");

	this.scriptStream = null;
	var dataUTF8 = IETconvertToUTF8(data);

	str2.data = dataUTF8;
	var trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
	if (!trans)
		return false;
	trans.init(getLoadContext())
	trans.addDataFlavor("text/html");
	trans.addDataFlavor("text/plain");
	if (!justText) {
		trans.setTransferData("text/html", str2, data.length * 2);
	}

	trans.setTransferData("text/plain", str, data.length * 2);

	Services.clipboard.setData(trans, null, Services.clipboard.kGlobalClipboard);
	return true;
}

function exportVirtualFolder(msgFolder, destDir) {
	setTimeout(function () { exportVirtualFolderDelayed(msgFolder, destDir); }, 500);
}

function exportVirtualFolderDelayed(msgFolder, destDir) {

	var file = destDir;
	IETwritestatus(ietngUtils.localizeMsg("exportstart"));
	IETtotal = msgFolder.getTotalMessages(false);
	if (IETtotal === 0)
		return;
	IETexported = 0;
	let folderName;
	if (!msgFolder.localizedName) {
		folderName = msgFolder.prettyName;
	} else {
		folderName = msgFolder.localizedName;
	}

	var clone = file.clone();
	clone.append(folderName);
	clone.createUnique(0, 0o644);
	var uriArray = [];

	var gDBView = gTabmail.currentAbout3Pane.gDBView;
	gDBView.doCommand(Ci.nsMsgViewCommandType.expandAll);

	for (let i = 0; i < IETtotal; i++) {
		// Error handling changed in 102
		// https://searchfox.org/comm-central/source/mailnews/base/content/junkCommands.js#428
		// Resolves #359
		try {
			var msguri = gDBView.getURIForViewIndex(i);
		} catch (ex) {
			continue; // Ignore errors for dummy rows
		}

		uriArray.push(msguri);

	}
	gDBView.doCommand(Ci.nsMsgViewCommandType.collapseAll);

	saveMsgAsEML(uriArray[0], clone, true, uriArray, null, null, false, false, null, null);
}


function exportIMAPfolder(msgFolder, destdirNSIFILE) {
	if (!msgFolder.verifiedAsOnlineFolder) {
		alert(ietngUtils.localizeMsg("noRemoteExport"));
		IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
		if (IETglobalMsgFolders.length === IETglobalMsgFoldersExported)
			return;

		exportIMAPfolder(IETglobalMsgFolders[IETglobalMsgFoldersExported], destdirNSIFILE);
	}
	var uriArray = [];
	var foldername = findGoodFolderName(msgFolder.name, destdirNSIFILE);
	var msgArray;

	if (msgFolder.getMessages)
		// Gecko 1.8 and earlier
		msgArray = msgFolder.getMessages(null);
	else {
		// Gecko 1.9
		msgArray = msgFolder.messages;
	}
	var clone = destdirNSIFILE.clone();
	clone.append(foldername);
	clone.createUnique(0, 0o644);
	IETtotal = msgFolder.getTotalMessages(false);
	IETexported = 0;
	IETskipped = 0;
	while (msgArray.hasMoreElements()) {
		var msg = msgArray.getNext();
		msg = msg.QueryInterface(Ci.nsIMsgDBHdr);
		// cleidigh
		var msguri = msg.folder.getUriForMsg(msg);

		if (!msg.folder.verifiedAsOnlineFolder && !(msg.flags & 0x00000080)) {
			IETskipped = IETskipped + 1;
			IETtotal = IETtotal - 1;
		} else if (msguri)
			uriArray.push(msguri);
	}
	IETwritestatus(ietngUtils.localizeMsg("exportstart"));
	if (IETtotal > 0) {
		saveMsgAsEML(uriArray[0], clone, true, uriArray, null, null, true, false, null, null);
	}
}

function IETwritestatus(text) {
	if (document.getElementById("statusText")) {
		document.getElementById("statusText").setAttribute("label", text);
		document.getElementById("statusText").setAttribute("value", text);
		var delay = IETprefs.getIntPref("extensions.importexporttoolsng.delay.clean_statusbar");
		delay += 3000;
		if (delay > 0)
			window.setTimeout(function () { IETdeletestatus(text); }, delay);
	}
}

function IETdeletestatus(text) {
	if (document.getElementById("statusText").getAttribute("label") === text) {
		document.getElementById("statusText").setAttribute("label", "");
		document.getElementById("statusText").setAttribute("value", "");

		if (text.includes("Err")) {
			delay = 15000;
		}

		if (!gImporting) {
			if (document.getElementById("IETabortIcon")) {
				document.getElementById("IETabortIcon").collapsed = true;
			}
		}
	}
}

function IETwriteDataOnDisk(file, data, append, fname, time) {
	try {
		IETlogger.write("call to IETwriteDataOnDisk - file path = " + file.path);
	} catch (e) {
		IETlogger.write("call to IETwriteDataOnDisk - error = " + e);
	}
	var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Ci.nsIFileOutputStream);
	if (append) {
		if (fname)
			file.append(fname);
		foStream.init(file, 0x02 | 0x08 | 0x10, 0o664, 0); // write, create, append
	} else
		foStream.init(file, 0x02 | 0x08 | 0x20, 0o664, 0); // write, create, truncate
	if (data)
		foStream.write(data, data.length);
	foStream.close();
	if (time && IETprefs.getBoolPref("extensions.importexporttoolsng.export.set_filetime"))
		file.lastModifiedTime = time;
}

function IETwriteDataOnDiskWithCharset(file, data, append, fname, time, charsetOverride) {
	var os;
	var charset = IETprefs.getCharPref("extensions.importexporttoolsng.export.text_plain_charset");
	if (charsetOverride) {
		charset = charsetOverride;
	}

	if (charset.indexOf("(BOM)") > -1) {
		charset = "UTF-8";
		data = "\ufeff" + data;
	}
	try {
		// On Thunderbird 1.0 this will fail
		os = Cc["@mozilla.org/intl/converter-output-stream;1"]
			.createInstance(Ci.nsIConverterOutputStream);
	} catch (e) {
		IETwriteDataOnDisk(file, data, append, fname, time);
		return;
	}
	var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Ci.nsIFileOutputStream);
	if (append) {
		file.append(fname);
		foStream.init(file, 0x02 | 0x08 | 0x10, 0o664, 0); // write, create, append
	} else
		foStream.init(file, 0x02 | 0x08 | 0x20, 0o664, 0); // write, create, truncate

	os = Cc["@mozilla.org/intl/converter-output-stream;1"]
		.createInstance(Ci.nsIConverterOutputStream);
	os.init(foStream, charset, 0, "?".charCodeAt(0));
	if (data)
		os.writeString(data);
	os.close();
	foStream.close();
	if (time && IETprefs.getBoolPref("extensions.importexporttoolsng.export.set_filetime")) {
		file.lastModifiedTime = time;
	}
}

async function copyMSGtoClip(selectedMsgs) {

	var msguri;

	let copyMsgsToClip_promptTitle = ietngUtils.localizeMsg("copyMsgsToClip_promptTitle");
	let copyMsgsToClip_firstOnly = ietngUtils.localizeMsg("copyMsgsToClip_firstOnly");
	if (selectedMsgs.length > 1) {
		let prompt = Services.prompt;
		let buttonFlags = (prompt.BUTTON_POS_0) * (prompt.BUTTON_TITLE_OK);
		let buttonReturn = Services.prompt.confirmEx(window, copyMsgsToClip_promptTitle,
			copyMsgsToClip_firstOnly,
			buttonFlags,
			null,
			null,
			"",
			null, {});
	}

	if (selectedMsgs[0].id) {
		let realMessage = window.ietngAddon.extension
			.messageManager.get(selectedMsgs[0].id);
		msguri = realMessage.folder.getUriForMsg(realMessage);
		if (!msguri)
			return { status: "cancel" };


		exportAsHtml(msguri, null, null, null, null, true, null, null, null, realMessage.folder, null);
		return { status: "ok" };

	}
}


function IEThtmlToText(data, msgFolder) {

	// This is necessary to avoid the subject ending with ":" can cause wrong parsing
	data = data.replace(/\:\s*<\/td>/, "$%$%$");
	var dataUTF8 = IETconvertToUTF8(data);

	// Windows 7 somehow eats CRLFs with convertMsgSnippetToPlainText
	// Not worth figuring out why, we'll use old htmlformatconverter

	const tbVersion = ietngUtils.getThunderbirdVersion();

	if (tbVersion.major >= 128) {
		// These mods are required for the new converter
		// Combining the three header tables removes the line breaks 
		// between tables
		dataUTF8 = dataUTF8.replace(/<title>.*<\/title>\r/, "");
		dataUTF8 = dataUTF8.replace(/<\/table><table.*moz-header-part2 moz-main-header">/, "");
		dataUTF8 = dataUTF8.replace(/<\/table><table.*moz-header-part3 moz-main-header">/, "");

		const ParserUtils = Cc["@mozilla.org/parserutils;1"].getService(
			Ci.nsIParserUtils
		);

		let options = {};
		options.flowed = true;
		let wrapWidth = 0;
		let flags =
			Ci.nsIDocumentEncoder.OutputLFLineBreak |
			Ci.nsIDocumentEncoder.OutputDisallowLineBreaking;

		if (options?.flowed) {
			wrapWidth = 72;
			flags |=
				Ci.nsIDocumentEncoder.OutputFormatted |
				Ci.nsIDocumentEncoder.OutputFormatFlowed;
		}

		let res = ParserUtils.convertToPlainText(dataUTF8, flags, wrapWidth).trim();

		res = fixClipHdrs(res);
		res = res.replace(/^\r\n/, "");

		return res;
	} else if (navigator.userAgent.includes("Windows NT 6.1")) {
		// For Windows 7

		var toStr = {};
		var formatConverter = Cc["@mozilla.org/widget/htmlformatconverter;1"].createInstance(Ci.nsIFormatConverter);
		var fromStr = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
		fromStr.data = dataUTF8;
		try {
			formatConverter.convert("text/html", fromStr, "text/plain", toStr);
		} catch (e) {
			console.log("IETNG: Text converter exception", e)
			dataUTF8 = dataUTF8.replace("$%$%$", ":");
			return dataUTF8;
		}
		if (toStr.value) {
			toStr = toStr.value.QueryInterface(Ci.nsISupportsString);
			var os = navigator.platform.toLowerCase();
			var strValue = toStr.toString();
			// Fix for TB13 empty line at the beginning
			strValue = strValue.replace(/^\r*\n/, "");
			// Correct the headers format in plain text
			var head;
			var text;
			var headcorrect;

			if (os.indexOf("win") > -1) {
				head = strValue.match(/(.+\r\n?)*/)[0];
				text = strValue.replace(/(.+\r\n?)*/, "");
				headcorrect = head.replace(/:\r\n/g, ": ");
			} else {
				head = strValue.match(/(.+\n?)*/)[0];
				text = strValue.replace(/(.+\n?)*/, "");
				headcorrect = head.replace(/:\n/g, ": ");
			}
			var retValue = headcorrect + text;
			retValue = retValue.replace("$%$%$", ":");
			return retValue;
		}
		dataUTF8 = dataUTF8.replace("$%$%$", ":");
		return dataUTF8;
	} else {
		dataUTF8 = msgFolder.convertMsgSnippetToPlainText(dataUTF8);
		dataUTF8 = fixClipHdrs(dataUTF8);
	}
	return dataUTF8;
}

function fixClipHdrs(strValue) {
	var os = navigator.platform.toLowerCase();

	// Fix for TB13 empty line at the beginning
	strValue = strValue.replace(/^\r*\n/, "");
	// Correct the headers format in plain text
	var head;
	var text;
	var headcorrect;

	if (os.indexOf("win") > -1) {
		head = strValue.match(/(.+\r?\n)*/)[0];
		text = strValue.replace(/(.+\r?\n)*/, "");
		headcorrect = head.replaceAll(/:\r?\n/g, ": ");

		text = text.replaceAll(/(?<!\r)\n/g, "\r\n");
		headcorrect = headcorrect.replaceAll(/(?<!\r)\n/g, "\r\n");
	} else {
		head = strValue.match(/(.+\n?)*/)[0];
		text = strValue.replace(/(.+\n?)*/, "");
		headcorrect = head.replace(/:\n/g, ": ");
	}
	var retValue = headcorrect + text;
	retValue = retValue.replace("$%$%$", ":");

	return retValue;
}

var copyHeaders = {
	getListener: function () {
		var myListener = {

			data: "",

			QueryInterface: function (iid) {
				if (iid.equals(Ci.nsIStreamListener) ||
					iid.equals(Ci.nsIMsgHeaderSink) ||
					iid.equals(Ci.nsISupports))
					return this;

				throw Cr.NS_NOINTERFACE;
			},

			onStartRequest: function (request) { },

			onStopRequest: function (aRequest, aStatusCode) {
				if (!this.remote)
					IETcopyStrToClip(this.data);
				else {
					var data = this.data.replace(/\r/g, "");
					var headers = data.substring(0, data.indexOf("\n\n"));
					IETcopyStrToClip(headers);
				}
				return true;
			},

			onDataAvailable: function (aRequest, aInputStream, aOffset, aCount) {
				if (this.remote) {
					var scriptStream = Cc["@mozilla.org/scriptableinputstream;1"].createInstance(Ci.nsIScriptableInputStream);
					scriptStream.init(aInputStream);
					this.data += scriptStream.read(20000);
				} else {
					var channel = aRequest.QueryInterface(Ci.nsIChannel);
					var msgMailUrl = channel.URI.QueryInterface(Ci.nsIMsgMailNewsUrl);
					this.data = msgMailUrl.mimeHeaders.allHeaders;
				}
			},
		};

		return myListener;
	},


	start: async function (selectedMsgs) {
		try {

			var msguri;
			let copyHdrsToClip_promptTitle = ietngUtils.localizeMsg("copyHdrsToClip_promptTitle");
			let copyHdrsToClip_firstOnly = ietngUtils.localizeMsg("copyHdrsToClip_firstOnly");
			if (selectedMsgs.length > 1) {
				let prompt = Services.prompt;
				let buttonFlags = (prompt.BUTTON_POS_0) * (prompt.BUTTON_TITLE_OK);
				let buttonReturn = Services.prompt.confirmEx(window, copyHdrsToClip_promptTitle,
					copyHdrsToClip_firstOnly,
					buttonFlags,
					null,
					null,
					"",
					null, {});
			}

			if (selectedMsgs[0].id) {
				let realMessage = window.ietngAddon.extension
					.messageManager.get(selectedMsgs[0].id);
				msguri = realMessage.folder.getUriForMsg(realMessage);

				var mms = MailServices.messageServiceFromURI(msguri).QueryInterface(Ci.nsIMsgMessageService);
				var streamListner = copyHeaders.getListener();
				if (msguri.indexOf("news") === 0 || msguri.indexOf("imap") === 0)
					streamListner.remote = true;
				mms.streamMessage(msguri, streamListner, msgWindow, null, false, "filter");
				return { status: "ok" };
			}
		} catch (ex) {
			throw (ex);
		}
	},

};

function IETescapeBeginningFrom(data) {
	// Workaround to fix the "From " in beginning line problem in body messages
	// See https://bugzilla.mozilla.org/show_bug.cgi?id=119441 and
	// https://bugzilla.mozilla.org/show_bug.cgi?id=194382
	// TB2 has uncorrect behaviour with html messages
	// This is not very fine, but I didn't find anything better...
	var datacorrected = data.replace(/\nFrom /g, "\n From ");
	return datacorrected;
}

function IETstoreHeaders(msg, msguri, subfile, addBody) {
	var subMaxLen = IETprefs.getIntPref("extensions.importexporttoolsng.subject.max_length");
	var authMaxLen = IETprefs.getIntPref("extensions.importexporttoolsng.author.max_length");
	var recMaxLen = IETprefs.getIntPref("extensions.importexporttoolsng.recipients.max_length");
	var realsubject;
	var author;
	var recipients;
	var body;
	var size;
	var hdrStr;

	size = msg.messageSize;

	try {
		// Cut the subject, the author and the recipients at 50 chars
		if (msg.mime2DecodedSubject)
			realsubject = msg.mime2DecodedSubject.substring(0, subMaxLen);
		else
			realsubject = IETnosub;
	} catch (e) {
		realsubject = IETnosub;
	}
	// Has the message the reply flag?
	if (msg.flags & 0x0010)
		realsubject = "Re: " + realsubject;
	try {
		author = msg.mime2DecodedAuthor.substring(0, authMaxLen);
	} catch (e) {
		author = "***";
	}
	var time = msg.date;
	try {
		recipients = msg.mime2DecodedRecipients ? msg.mime2DecodedRecipients.substring(0, recMaxLen) : "";
	} catch (e) {
		recipients = "***";
	}
	author = author.replace("<", "&lt;");
	author = author.replace(">", "&gt;");
	author = author.replace(/\"/, "");
	author = author.replace(/^ +/, "");
	recipients = recipients.replace("<", "&lt;");
	recipients = recipients.replace(">", "&gt;");
	recipients = recipients.replace(/\"/, "");
	recipients = recipients.replace(/^ +/, "");
	// Correct the name of the subject, because it will be also the name of the file html
	var subject = getSubjectForHdr(msg, subfile.path);
	// Has attachments?
	var hasAtt = (msg.flags & 0x10000000) ? 1 : 0;

	if (IETprefs.getBoolPref("extensions.importexporttoolsng.experimental.use_delivery_date")) {
		var time2 = msg.getUint32Property('dateReceived');
		time = time2 * 1000 * 1000;
	}

	if (addBody)
		body = IETstoreBody(msguri);
	else {
		body = "";
	}

	// Store the data in the arrays
	// The time must have always 17 chars, otherwise the sorting will be wrong
	// so we add zeros at beginning until the length is 17 chars
	while (time.toString().length < 17)
		time = "0" + time;
	// The sequence §][§^^§ is the headers separator in hdrStr variable. I hope that nobody
	// will insert §][§^^§ in subject....but why should (s)he write it???
	switch (IETsortType) {
		case 1:
			hdrStr = realsubject + "§][§^^§" + recipients + "§][§^^§" + author + "§][§^^§" + time + "§][§^^§" + subject + "§][§^^§" + msguri + "§][§^^§" + hasAtt + "§][§^^§" + size + "§][§^^§" + body;
			break;

		case 2:
			hdrStr = author + "§][§^^§" + realsubject + "§][§^^§" + recipients + "§][§^^§" + time + "§][§^^§" + subject + "§][§^^§" + msguri + "§][§^^§" + hasAtt + "§][§^^§" + size + "§][§^^§" + body;
			break;

		case 3:
			hdrStr = recipients + "§][§^^§" + realsubject + "§][§^^§" + author + "§][§^^§" + time + "§][§^^§" + subject + "§][§^^§" + msguri + "§][§^^§" + hasAtt + "§][§^^§" + size + "§][§^^§" + body;
			break;

		default:
			hdrStr = time + "§][§^^§" + realsubject + "§][§^^§" + recipients + "§][§^^§" + author + "§][§^^§" + subject + "§][§^^§" + msguri + "§][§^^§" + hasAtt + "§][§^^§" + size + "§][§^^§" + body;
	}
	// If the subject begins with a lowercase letter, the sorting will be wrong
	// so it is changed in uppercase. To track this and restore the original
	// first letter, we add a flag to the realsubject variable (0 or 1 at the end)
	if (hdrStr.substring(0, 1) === hdrStr.substring(0, 1).toUpperCase())
		hdrStr = hdrStr + "§][§^^§" + "0";
	else {
		hdrStr = hdrStr.substring(0, 1).toUpperCase() + hdrStr.substring(1);
		hdrStr = hdrStr + "§][§^^§" + "1";
	}
	return hdrStr;
}

function IETstoreBody(msguri) {
	var content = "";
	var MsgService = MailServices.messageServiceFromURI(msguri);
	var MsgStream = Cc["@mozilla.org/network/sync-stream-listener;1"].createInstance();
	var consumer = MsgStream.QueryInterface(Ci.nsIInputStream);
	var ScriptInput = Cc["@mozilla.org/scriptableinputstream;1"].createInstance();
	var ScriptInputStream = ScriptInput.QueryInterface(Ci.nsIScriptableInputStream);
	ScriptInputStream.init(consumer);
	try {
		MsgService.streamMessage(msguri, MsgStream, null, null, true, "header=filter");
	} catch (e) {
		return content;
	}
	ScriptInputStream.available();
	while (ScriptInputStream.available()) {
		content = content + ScriptInputStream.read(512);
	}

	var toStr = { value: null };
	var formatConverter = Cc["@mozilla.org/widget/htmlformatconverter;1"].createInstance(Ci.nsIFormatConverter);
	var fromStr = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
	var dataUTF8 = IETconvertToUTF8(content);
	var text;

	fromStr.data = dataUTF8;

	try {
		// Fix #451 use text/plain output
		formatConverter.convert("text/html", fromStr, "text/plain", toStr);
	} catch (e) {
		text = dataUTF8;
	}
	if (toStr.value) {
		toStr = toStr.value.QueryInterface(Ci.nsISupportsString);
		var os = navigator.platform.toLowerCase();
		var strValue = toStr.toString();
		if (os.indexOf("win") > -1)
			text = strValue.replace(/(.+\r\n?)*/, "");
		else
			text = strValue.replace(/(.+\n?)*/, "");
		text = text.replace(/\r?\n+/g, "\r\n");
		text = text.replace(/^(\r\n)/g, "");
		text = text.replace(/(\r\n)$/g, "");
	}
	text = text.replace("$%$%$", ":");
	text = text.replace(/\"/g, '""');
	text = '"' + text + '"';

	IETexported = IETexported + 1;
	IETwritestatus(ietngUtils.localizeMsg("exported") + " " + IETexported + " " + ietngUtils.localizeMsg("msgs") + " " + (IETtotal + IETskipped));
	return text;
}