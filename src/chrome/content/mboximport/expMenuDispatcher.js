/*
	ImportExportTools NG is a extension for Thunderbird mail client
	providing import and export tools for messages and folders.
	The extension authors:
		Copyright (C) 2025 : Christopher Leidigh, The Thunderbird Team

	ImportExportTools NG is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// expMenuDispatcher

/* global
exportSelectedMsgs,

*/

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
	*/

// add date to query for debugging
// won't run without it???
var { mboxImportExport } = ChromeUtils.importESModule(
	"resource://mboximport/content/mboximport/modules/mboxImportExport.mjs?" + ietngExtension.manifest.version + new Date()
);

var gVars = {
	window: window,
};
mboxImportExport.setGlobals(gVars);


async function expMenuDispatcher(data) {
	let dispatcherWinId = window.ietngAddon.extension.windowManager.getWrapper(window).id;

	// console.log("expMenuDispacher: winId", dispatcherWinId, data);
	// console.log("expMenuDispacher focused: ", window.document.hasFocus());
	// console.log(window)
	if (data.params.tabType != "messageDisplay" && data.params.targetWinId != dispatcherWinId) {
		console.log("Not for us: ", data.params.targetWinId);
		return;
	}

	var rv;

	try {

		switch (data.command) {
			case "WXMCMD_EML_Format":
				if (data.params.msgsOnly) {
					rv = await exportSelectedMsgs(0, data.params);
				} else if (data.params.createIndex) {
					rv = await exportSelectedMsgs(100, data.params);
				}
				break;
			case "WXMCMD_HTML_Format":
				if (data.params.msgsOnly) {
					rv = await exportSelectedMsgs(1, data.params);
				} else if (data.params.saveAtts && !data.params.createIndex) {
					rv = await exportSelectedMsgs(8, data.params);
				} else if (data.params.createIndex && !data.params.saveAtts) {
					rv = await exportSelectedMsgs(101, data.params);
				} else if (data.params.saveAtts && data.params.createIndex) {
					rv = await exportSelectedMsgs(108, data.params);
				}
				break;
			case "WXMCMD_PDF_Format":
				rv = await IETprintPDFmain.print(false, data.params);
				break;
			case "WXMCMD_PlainText_Format":
				if (data.params.msgsOnly) {
					rv = await exportSelectedMsgs(2, data.params);
				} else if (data.params.saveAtts && !data.params.createIndex) {
					rv = await exportSelectedMsgs(9, data.params);
				} else if (data.params.createIndex && !data.params.saveAtts) {
					rv = await exportSelectedMsgs(102, data.params);
				} else if (data.params.saveAtts && data.params.createIndex) {
					rv = await exportSelectedMsgs(109, data.params);
				}
				break;
			case "WXMCMD_CSV_Format":
				rv = await exportSelectedMsgs(7, data.params);
				break;
			case "WXMCMD_Mbox_Format":
				if (data.params.mboxExpType == "newMbox") {
					rv = await exportSelectedMsgs(3, data.params);
				} else if (data.params.mboxExpType == "appendMbox") {
					rv = await exportSelectedMsgs(4, data.params);
				}
				break;
			case "WXMCMD_CopyToClipboard":
				if (data.params.clipboardType == "Message") {
					rv = await copyMSGtoClip(data.params.selectedMsgs);
				} else {
					rv = copyHeaders.start(data.params.selectedMsgs);
				}
				break;
			case "WXMCMD_Index":
				if (data.params.indexType == "indexHTML") {
					rv = await exportSelectedMsgs(5, data.params);
				} else if (data.params.indexType == "indexCSV") {
					rv = await exportSelectedMsgs(6, data.params);
				}
				break;

			case "WXMCMD_ExpFolderMboxFormat":
				rv = await exportfolder(data.params);
				break;
			case "WXMCMD_ExpFolderRemote":
				rv = await exportfolder(data.params);
				break;
			case "WXMCMD_ExpSearch":
				rv = searchANDsave(data.params);
				break;
			case "WXMCMD_FolderExp_EML_Format":
				rv = await exportAllMsgs(0, data.params);
				break;
			case "WXMCMD_FolderExp_HTML_Format":
				if (data.params.createIndex && !data.params.saveAtts) {
					rv = await exportAllMsgs(1, data.params);
				} else if (data.params.saveAtts) {
					rv = await exportAllMsgs(8, data.params);
				}
				break;
			case "WXMCMD_FolderExp_PDF_Format":
				rv = await exportAllMsgs(10, data.params);
				break;
			case "WXMCMD_FolderExp_PlainText_Format":
				if (data.params.createIndex && !data.params.saveAtts) {
					rv = await exportAllMsgs(2, data.params);
				} else if (data.params.saveAtts && !data.params.singleFile) {
					rv = await exportAllMsgs(9, data.params);
				} else if (!data.params.saveAtts && data.params.singleFile) {
					rv = await exportAllMsgs(4, data.params);
				} else if (data.params.saveAtts && data.params.singleFile) {
					rv = await exportAllMsgs(7, data.params);
				}
				break;
			case "WXMCMD_FolderExp_CSV_Format":
				rv = await exportAllMsgs(6, data.params);
				break;
			case "WXMCMD_FolderExp_Index":
				if (data.params.indexType == "indexHTML") {
					rv = await exportAllMsgs(3, data.params);
				} else if (data.params.indexType == "indexCSV") {
					rv = await exportAllMsgs(5, data.params);
				}
				break;
			case "WXMCMD_Exp_Profile":
				rv = IETexport_all(data.params);
				break;
			case "WXMCMD_Imp_Profile":
				rv = openProfileImportWizard();
				break;
			case "WXMCMD_Backup":
				rv = window.ietng.OpenBackupDialog('manual');
				break;
			case "WXMCMD_ImpMbox":
				rv = await mboxImportExport.importMboxSetup(data.params);
				break;
			case "WXMCMD_ImpMaildirFiles":
				rv = await trytocopyMAILDIR(data.params);
				break;
			case "WXMCMD_ImpEML":
				rv = await importEMLs(data.params);
				break;
			case "WXMCMD_ImpEMLAll":
				rv = await importALLasEML(data.params);
				break;
			case "WXMCMD_CopyFolderPath":
				rv = IETcopyFolderPath(data.params);
				break;
			case "WXMCMD_OpenFolderDir":
				rv = IETopenFolderPath(data.params);
				break;
			case "WXMCMD_OpenOptions":
				rv = openIEToptions();
				break;
			//case "WXMCMD_OpenHelp":
			//	openIEThelp();
			//	break;
			case "WXMCMD_SaveJSON":
				IOUtils.writeJSON(data.params.path, data.params.obj);
				rv = { status: "ok" };
				break;
			case "WXMCMD_getMailStoreFromFolderPath":
				let storeType = getMailStoreFromFolderPath(data.params.accountId, data.params.folderPath);
				return storeType;
			case "WXMCMD_getBoolPref":
				let bp = IETprefs.getBoolPref(data.params.boolPref);
				return bp;
			default:
				break;
		}

		if (rv == typeof Error) {
			throw (rv);
		}
		return rv;
	} catch (ex) {
		Services.prompt.alert(window, "Exception", `${ex}\n\n${ex.stack}`);
		return {status: "error"};
	}
}

function onUnload() {
}
// exp listener
var listener_id = window.ietngAddon.notifyTools.addListener(expMenuDispatcher);
