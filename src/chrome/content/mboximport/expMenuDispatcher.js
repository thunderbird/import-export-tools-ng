// expMenuDispatcher

/* global
exportSelectedMsgs,

*/

console.log("load");

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

var { mboxImportExport, setGlobals } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/mboxImportExport.js");
var gVars = {
	window: window,
};
setGlobals(gVars);


async function expMenuDispatcher(data) {
	console.log("expMenuDispacher: ", data);
	switch (data.command) {
		case "WXMCMD_EML_Format":
			console.log("mdis: ", data);
			if (data.params.msgsOnly) {
				await exportSelectedMsgs(0, data.params);
			} else if (data.params.createIndex) {
				await exportSelectedMsgs(100, data.params);
			}
			break;
		case "WXMCMD_HTML_Format":
			console.log("mdis: ", data.params);
			if (data.params.msgsOnly) {
				await exportSelectedMsgs(1, data.params);
			} else if (data.params.saveAtts && !data.params.createIndex) {
				await exportSelectedMsgs(8, data.params);
			} else if (data.params.createIndex && !data.params.saveAtts) {
				await exportSelectedMsgs(101, data.params);
			} else if (data.params.saveAtts && data.params.createIndex) {
				await exportSelectedMsgs(108, data.params);
			}

			break;
		case "WXMCMD_PDF_Format":
			await IETprintPDFmain.print(false, data.params);
			break;
		case "WXMCMD_PlainText_Format":
			if (data.params.msgsOnly) {
				await exportSelectedMsgs(2, data.params);
			} else if (data.params.saveAtts && !data.params.createIndex) {
				await exportSelectedMsgs(9, data.params);
			} else if (data.params.createIndex && !data.params.saveAtts) {
				await exportSelectedMsgs(102, data.params);
			} else if (data.params.saveAtts && data.params.createIndex) {
				await exportSelectedMsgs(109, data.params);
			}
			break;
		case "WXMCMD_CSV_Format":
			await exportSelectedMsgs(7, data.params);
			break;
		case "WXMCMD_Mbox_Format":
			if (data.params.mboxExpType == "newMbox") {
				await exportSelectedMsgs(3, data.params);
			} else if (data.params.mboxExpType == "appendMbox") {
				await exportSelectedMsgs(4, data.params);
			}
			break;
		case "WXMCMD_CopyToClipboard":
			if (data.params.clipboardType == "Message") {
				await copyMSGtoClip();
			} else {
				copyHeaders.start();
			}
			break;
		case "WXMCMD_Index":
			if (data.params.indexType == "indexHTML") {
				await exportSelectedMsgs(5, data.params);
			} else if (data.params.indexType == "indexCSV") {
				await exportSelectedMsgs(6, data.params);
			}
			break;
				
		case "WXMCMD_ExpFolderMboxFormat":
			exportfolder(data.params);
			break;
		case "WXMCMD_ExpFolderRemote":
			exportfolder(data.params);
			break;
		case "WXMCMD_ExpSearch":
			searchANDsave(data.params);
			break;
		case "WXMCMD_FolderExp_EML_Format":
			await exportAllMsgs(0, data.params);
			break;
		case "WXMCMD_FolderExp_HTML_Format":
			if (data.params.createIndex && !data.params.saveAtts) {
			await exportAllMsgs(1, data.params);
			} else if (data.params.saveAtts) {
				await exportAllMsgs(8, data.params);
			}
			break;
		case "WXMCMD_FolderExp_PDF_Format":
			IETprintPDFmain.print(true, data.params);
			break;
		case "WXMCMD_FolderExp_PlainText_Format":
			if (data.params.createIndex && !data.params.saveAtts) {
				await exportAllMsgs(2, data.params);
			} else if (data.params.saveAtts && !data.params.singleFile) {
				await exportAllMsgs(9, data.params);
			} else if (!data.params.saveAtts && data.params.singleFile) {
				await exportAllMsgs(4, data.params);
			} else if (data.params.saveAtts && data.params.singleFile) {
				await exportAllMsgs(7, data.params);
			}
			break;
		case "WXMCMD_FolderExp_Index":
			if (data.params.indexType == "indexHTML") {
				await exportAllMsgs(3, data.params);
			} else if (data.params.indexType == "indexCSV") {
				await exportAllMsgs(5, data.params);
			}
			break;
		case "WXMCMD_Exp_Profile":
			IETexport_all(data.params);
			break;
		case "WXMCMD_Imp_Profile":
			openProfileImportWizard();
			break;
		case "WXMCMD_Backup":
			window.ietng.OpenBackupDialog('manual');
			break;
		case "WXMCMD_ImpMbox":

			console.log(data.params);
			mboxImportExport.importMboxSetup(data.params);
			break;
		case "WXMCMD_ImpMaildirFiles":
			trytocopyMAILDIR(data.params);
			break;
		case "WXMCMD_ImpEML":
			importEMLs(data.params);
			break;
			case "WXMCMD_ImpEMLAll":
				importALLasEML(data.params);
				break;
		case "WXMCMD_CopyFolderPath":
			IETcopyFolderPath(data.params);
		break;
		case "WXMCMD_OpenFolderDir":
			IETopenFolderPath(data.params);
		break;
		case "WXMCMD_OpenOptions":
			openIEToptions();
			break;
		case "WXMCMD_OpenHelp":
			openIEThelp();
			break;
		case "WXMCMD_SaveJSON":
			IOUtils.writeJSON(data.params.path, data.params.obj);
			break;
		case "WXMCMD_getMailStoreFromFolderPath":
			let storeType = getMailStoreFromFolderPath(data.params.accountId, data.params.folderPath);
			return storeType;
		
		default:
			break;
	}

	return true;
}

function onUnload() {
}
// exp listener
var listener_id = window.ietngAddon.notifyTools.addListener(expMenuDispatcher);
