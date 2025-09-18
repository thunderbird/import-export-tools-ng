/*
	ImportExportTools NG is a derivative extension for Thunderbird 60+
	providing import and export tools for messages and folders.
	The derivative extension authors:
		Copyright (C) 2021 : John Bieling, Christopher Leidigh
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

// cleidigh - reformat, services, globals, Streamlisteners

/* eslint-disable no-control-regex */
/* eslint-disable no-useless-concat */
/* eslint-disable no-lonely-if */
/* eslint-disable consistent-return */

/* global IETformatWarning,
getPredefinedFolder,
IETwritestatus,
IETgetSelectedMessages,
isMbox,
IETprefs,
IETgetComplexPref,
nametoascii,
getSubjectForHdr,
IETcopyStrToClip,
SelectFolder,
IETremoteWarning,
IETgetPickerModeFolder,
exportVirtualFolder,
IETglobalMsgFoldersExported,
exportIMAPfolder,
IETcleanName,
IETemlx2eml,
IETescapeBeginningFrom,
IOUtils,
PathUtils,
PrintUtils,
strftime,
getMsgFolderFromAccountAndPath,
globalThis,
*/

// update to use es6 modules for 128+, 136+ required - thx Axel

var messengerWindow = Services.wm.getMostRecentWindow("mail:3pane");

var { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");
var Ietng_ESM = parseInt(AppConstants.MOZ_APP_VERSION, 10) >= 128;

var { ExtensionParent } = ChromeUtils.importESModule(
	"resource://gre/modules/ExtensionParent.sys.mjs"
);

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
	"ImportExportToolsNG@cleidigh.kokkini.net"
);

var { MailServices } = Ietng_ESM
	? ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs")
	: ChromeUtils.import("resource:///modules/MailServices.jsm");

var { XPCOMUtils } = ChromeUtils.importESModule("resource://gre/modules/XPCOMUtils.sys.mjs");
var FileUtils = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs").FileUtils;
var { ietngUtils } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/ietngUtils.mjs?"
  + ietngExtension.manifest.version + messengerWindow.ietngAddon.dateForDebugging);

var { parse5322 } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/email-addresses.mjs");

var { mboxImportExport } = ChromeUtils.importESModule(
	"resource://mboximport/content/mboximport/modules/mboxImportExport.mjs?"
  + ietngExtension.manifest.version + messengerWindow.ietngAddon.dateForDebugging);

var { Subprocess } = ChromeUtils.importESModule("resource://gre/modules/Subprocess.sys.mjs");

XPCOMUtils.defineLazyGlobalGetters(this, ["IOUtils", "PathUtils"]);

var nosub = ietngUtils.localizeMsg("nosubjectmsg");

var gEMLimported;
var gEMLimportedErrs;
var gEMLtotal;
var gFileEMLarray;
var gFileEMLarrayIndex;
var IETtempfilesize;
var IETcount;
var gNeedCompact;
var gMsgFolderImported;
var IETabort;

// cleidigh where do we get this
var gImporting;
// cleidigh create folder fix
var folderCount;
var warningMsg = ietngExtension.localeData.localizeMessage("Warning.msg");
var errorMsg = ietngExtension.localeData.localizeMessage("Error.msg");


// make sure there is no lingering ietngStatusText
if (window.document.getElementById("ietngStatusText")) {
	window.document.getElementById("ietngStatusText").remove();
}

var IETprintPDFmain = {

	print: async function (allMessages, params) {
		// New built in Mozilla PDF driver finally works on OSX - enable for Mac
		// Addresses #353

		try {
			let printSvc = Cc["@mozilla.org/gfx/printsettings-service;1"].getService(Ci.nsIPrintSettingsService);
			if (printSvc.defaultPrinterName === "") {
				alert(ietngUtils.localizeMsg("noPDFnoPrinter"));
				return { status: "error" };
			}
		} catch (e) {
			return e;
		}

		try {

			var msgFolders;
			try {
				msgFolders = [getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path)];
			} catch (e) {
				msgFolders = [GetFirstSelectedMsgFolder()];
			}

			if (msgFolders.length > 1) {
				alert(ietngUtils.localizeMsg("noPDFmultipleFolders"));
				return { status: "error" };
			}
			let question = IETformatWarning(1);
			if (!question)
				return { status: "cancel" };

			question = IETformatWarning(0);
			if (!question)
				return { status: "cancel" };


			if (!allMessages) {

				IETprintPDFmain.uris = await ietngUtils.getNativeSelectedMessages(params?.selectedMessages);

			} else {
				IETprintPDFmain.uris = [];
				let msgFolder = msgFolders[0];
				let isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
				if (isVirtFol) {
					var gDBView = gTabmail.currentAbout3Pane.gDBView;
					var total = msgFolder.getTotalMessages(false);
					// We need to expand all-iterate-collapse all to get all msgs
					gDBView.doCommand(Ci.nsMsgViewCommandType.expandAll);
					for (let i = 0; i < total; i++)
						// error handling changed in 102
						// https://searchfox.org/comm-central/source/mailnews/base/content/junkCommands.js#428
						// Resolves #359
						try {
							IETprintPDFmain.uris.push(gDBView.getURIForViewIndex(i));
						} catch (ex) {
							continue; // ignore errors for dummy rows
						}
					// collapse back view
					gDBView.doCommand(Ci.nsMsgViewCommandType.collapseAll);

				} else {
					let msgs = msgFolder.messages;
					while (msgs.hasMoreElements()) {
						let msg = msgs.getNext();
						msg = msg.QueryInterface(Ci.nsIMsgDBHdr);
						let uri = msgFolder.getUriForMsg(msg);
						IETprintPDFmain.uris.push(uri);
					}
				}
			}
			if (!IETprintPDFmain.uris)
				return { status: "cancel" };


			IETprintPDFmain.total = IETprintPDFmain.uris.length;
			let dir = getPredefinedFolder(2);
			if (!dir) {
				let winCtx = window;
				const tbVersion = ietngUtils.getThunderbirdVersion();
				if (tbVersion.major >= 120) {
					winCtx = window.browsingContext;
				}
				let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
				fp.init(winCtx, ietngUtils.localizeMsg("filePickerExport"), Ci.nsIFilePicker.modeGetFolder);
				let res = await new Promise(resolve => {
					fp.open(resolve);
				});
				if (res !== Ci.nsIFilePicker.returnOK) {
					return { status: "cancel" };
				}
				dir = fp.file;
			}
			IETprintPDFmain.file = dir;
			await IETprintPDFmain.saveAsPDF();
			return { status: "ok" };
		} catch (ex) {
			return ex;
		}
	},

	/**
	 * Runs through IETprintPDFmain.uris and prints all to PDF
	 */
	saveAsPDF: async function (pageSettings = {}) {
		let fileFormat = IETprefs.getIntPref("extensions.importexporttoolsng.printPDF.fileFormat");
		let filePath = IETprintPDFmain.file.path;

		let psService = Cc[
			"@mozilla.org/gfx/printsettings-service;1"
		].getService(Ci.nsIPrintSettingsService);

		// pdf changes for 102
		// newPrintSettings => createNewPrintSettings()
		// printSetting.printToFile deprecated in 102, not needed in 91
		let printSettings;
		if (psService.newPrintSettings) {
			printSettings = psService.newPrintSettings;
		} else {
			printSettings = psService.createNewPrintSettings();
		}

		printSettings.printerName = "Mozilla_Save_to_PDF";
		psService.initPrintSettingsFromPrefs(printSettings, true, printSettings.kInitSaveAll);


		printSettings.isInitializedFromPrinter = true;
		printSettings.isInitializedFromPrefs = true;

		printSettings.printSilent = true;
		printSettings.outputFormat = Ci.nsIPrintSettings.kOutputFormatPDF;

		// print setup for PDF printing changed somewhere around 102.3
		// also on 91.x The change first appeared in Linux
		// the printToFile gets deprecated and replaced by
		// outputDestination
		// As an XPCOM object you must check property existence
		// Addresses #351

		if (printSettings.outputDestination !== undefined) {
			printSettings.outputDestination = Ci.nsIPrintSettings.kOutputDestinationFile;
		}

		if (printSettings.printToFile !== undefined) {
			printSettings.printToFile = true;
		}

		if (pageSettings.paperSizeUnit)
			printSettings.paperSizeUnit = pageSettings.paperSizeUnit;

		if (pageSettings.paperWidth)
			printSettings.paperWidth = pageSettings.paperWidth;

		if (pageSettings.paperHeight)
			printSettings.paperHeight = pageSettings.paperHeight;

		if (pageSettings.orientation)
			printSettings.orientation = pageSettings.orientation;
		if (pageSettings.scaling)
			printSettings.scaling = pageSettings.scaling;
		if (pageSettings.shrinkToFit)
			printSettings.shrinkToFit = pageSettings.shrinkToFit;
		if (pageSettings.showBackgroundColors)
			printSettings.printBGColors = pageSettings.showBackgroundColors;
		if (pageSettings.showBackgroundImages)
			printSettings.printBGImages = pageSettings.showBackgroundImages;
		if (pageSettings.edgeLeft)
			printSettings.edgeLeft = pageSettings.edgeLeft;
		if (pageSettings.edgeRight)
			printSettings.edgeRight = pageSettings.edgeRight;
		if (pageSettings.edgeTop)
			printSettings.edgeTop = pageSettings.edgeTop;
		if (pageSettings.edgeBottom)
			printSettings.edgeBottom = pageSettings.edgeBottom;
		if (pageSettings.marginLeft)
			printSettings.marginLeft = pageSettings.marginLeft;
		if (pageSettings.marginRight)
			printSettings.marginRight = pageSettings.marginRight;
		if (pageSettings.marginTop)
			printSettings.marginTop = pageSettings.marginTop;
		if (pageSettings.marginBottom)
			printSettings.marginBottom = pageSettings.marginBottom;
		if (pageSettings.headerLeft)
			printSettings.headerStrLeft = pageSettings.headerLeft;
		if (pageSettings.headerCenter)
			printSettings.headerStrCenter = pageSettings.headerCenter;
		if (pageSettings.headerRight)
			printSettings.headerStrRight = pageSettings.headerRight;
		if (pageSettings.footerLeft)
			printSettings.footerStrLeft = pageSettings.footerLeft;
		if (pageSettings.footerCenter)
			printSettings.footerStrCenter = pageSettings.footerCenter;
		if (pageSettings.footerRight)
			printSettings.footerStrRight = pageSettings.footerRight;

		let customDateFormat = IETgetComplexPref("extensions.importexporttoolsng.export.filename_date_custom_format");
		if (customDateFormat !== "") {
			let customDate = strftime.strftime(customDateFormat, new Date());
			printSettings.headerStrRight = printSettings.headerStrRight.replace("%d", customDate);
			printSettings.headerStrLeft = printSettings.headerStrLeft.replace("%d", customDate);
			printSettings.headerStrCenter = printSettings.headerStrCenter.replace("%d", customDate);
			printSettings.footerStrRight = printSettings.footerStrRight.replace("%d", customDate);
			printSettings.footerStrLeft = printSettings.footerStrLeft.replace("%d", customDate);
			printSettings.footerStrCenter = printSettings.footerStrCenter.replace("%d", customDate);
		}

		// console.log("IETNG: Save as PDF: ", new Date());
		// console.log("IETNG: message count: ", IETprintPDFmain.uris.length);
		// We can simply by using PrintUtils.loadPrintBrowser eliminating
		// the fakeBrowser NB: if the printBrowser does not exist we
		// can create with PrintUtils as well


		var errCounter = 0;
		let mainWindow = Services.wm.getMostRecentWindow("mail:3pane");

		for (var msgIdx = 0; msgIdx < IETprintPDFmain.uris.length; msgIdx++) {
			let uri = IETprintPDFmain.uris[msgIdx];

			try {
				var messageService = MailServices.messageServiceFromURI(uri);
				let aMsgHdr = messageService.messageURIToMsgHdr(uri);

				let fileName = fileFormat === 2
					? getSubjectForHdr(aMsgHdr, filePath) + ".pdf"
					: getSubjectForHdr(aMsgHdr, filePath) + ".ps";
				uniqueFileName = await IOUtils.createUniqueFile(filePath, fileName);
				printSettings.toFileName = uniqueFileName;

				await PrintUtils.loadPrintBrowser(messageService.getUrlForUri(uri).spec);
				await PrintUtils.printBrowser.browsingContext.print(printSettings);
				var time = (aMsgHdr.dateInSeconds) * 1000;
				if (time && IETprefs.getBoolPref("extensions.importexporttoolsng.export.set_filetime")) {
					await IOUtils.setModificationTime(uniqueFileName, time);
				}
				IETwritestatus(ietngUtils.localizeMsg("exported") + ": " + fileName);
				// When we got here, everything worked, and reset error counter.
				errCounter = 0;
			} catch (ex) {
				// Something went wrong, wait a bit and try again.
				// We did not inc i, so we will retry the same file.
				//
				errCounter++;
				console.log(`Re-trying to print message ${msgIdx + 1} (${uri}).`, ex);
				if (errCounter > 3) {
					console.log(`We retried ${errCounter} times to print message ${msgIdx + 1} and abort.`);
				} else {
					// dec idx so next loop repeats msg that erred
					msgIdx--;
				}
				await new Promise(r => mainWindow.setTimeout(r, 150));
			}
		}
	},

	async setupPDF(msgUris, outputPath) {
		IETprintPDFmain.file = {};
		IETprintPDFmain.file.path = outputPath;
		IETprintPDFmain.uris = msgUris;
		await IETprintPDFmain.saveAsPDF();
	},
};

function openProfileImportWizard() {
	var quit = {};
	window.openDialog("chrome://mboximport/content/mboximport/profileImportWizard.xhtml", "", "dialog,chrome,modal,centerscreen", quit);

	var appStartup = Cc["@mozilla.org/toolkit/app-startup;1"]
		.getService(Ci.nsIAppStartup);
	if (quit.value)
		setTimeout(function () {
			appStartup.quit(Ci.nsIAppStartup.eAttemptQuit);
		}, 1000);
	return { status: "ok" };
}

function msgFolder2LocalFile(msgFolder) {
	if (msgFolder.filePath)
		var LocalFile = msgFolder.filePath;
	return LocalFile;
}

function IETupdateFolder(folder) {
	var msgDB = folder.msgDatabase;
	msgDB.summaryValid = false;
	folder.ForceDBClosed();
	folder.updateFolder(msgWindow);
}

async function trytocopyMAILDIR(params) {
	let storeType = getMailStoreFromFolderPath(params.selectedFolder.accountId, params.selectedFolder.path);

	if (storeType !== 1) {
		alert(ietngUtils.localizeMsg("noMaildirStorage"));
		return;
	}

	// initialize variables
	let msgFolder = getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path);

	// we don't import the file in imap or nntp accounts
	if ((msgFolder.server.type === "imap") || (msgFolder.server.type === "nntp")) {
		alert(ietngUtils.localizeMsg("badfolder"));
		return;
	}

	let winCtx = window;
	const tbVersion = ietngUtils.getThunderbirdVersion();
	if (tbVersion.major >= 120) {
		winCtx = window.browsingContext;
	}
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
	fp.init(winCtx, ietngUtils.localizeMsg("filePickerImport"), Ci.nsIFilePicker.modeGetFolder);
	fp.appendFilters(Ci.nsIFilePicker.filterAll);
	let res = await new Promise(resolve => {
		fp.open(resolve);
	});
	if (res !== Ci.nsIFilePicker.returnOK) {
		return { status: "cancel" };
	}

	var destFile = fp.file;
	var filename = destFile.leafName;
	var newfilename = filename;


	var folderFile = msgFolder2LocalFile(msgFolder);
	var clonex = folderFile.clone();
	var restoreChar = false;
	if (newfilename.match(/#/)) {
		var safeChar = Math.floor(Math.random() * 99999).toString();
		newfilename = newfilename.replace(/#/g, safeChar);
		restoreChar = true;
	}
	clonex.append(newfilename);
	// add to the original filename a random number in range 0-999
	if (IETprefs.getBoolPref("extensions.importexporttoolsng.import.name_add_number"))
		newfilename = newfilename + Math.floor(Math.random() * 999);
	var k = 0;
	// if exists a subfolder with this name, we change the random number, with max. 500 tests
	// while (msgFolder.containsChildNamed(newfilename)) {
	while (msgFolder.containsChildNamed(newfilename) || clonex.exists()) {
		newfilename = filename + Math.floor(Math.random() * 999);
		k++;
		if (k > 500) {
			alert("Can't find a good name");
			return false;
		}
		clonex = clonex.parent;
		clonex.append(newfilename);
	}

	// 1. add a subfolder with the name of the folder to import
	// cdl - convert addSubfolder => createSubfolder


	try {
		let res = await ietngUtils.createSubfolder(msgFolder, newfilename);
	} catch (ex) {
		// Throw error to allow termination
		throw (ex);
	}

	var newFolder = msgFolder.getChildNamed(newfilename);
	if (restoreChar) {
		var reg = new RegExp(safeChar, "g");
		newFolder.name = newfilename.replace(reg, "#");
	}

	// 2. find the MAILDIR directory created above
	var filex = msgFolder2LocalFile(newFolder);
	try {
		var destFileClone = destFile.clone();
		destFileClone.append("cur");
		if (!destFileClone.exists() || !destFileClone.isDirectory()) {
			alert(ietngUtils.localizeMsg("isNotMaildir"));
			return;
		}
		destFileClone = destFileClone.parent;
		destFileClone.append("tmp");
		if (!destFileClone.exists() || !destFileClone.isDirectory()) {
			alert(ietngUtils.localizeMsg("isNotMaildir"));
			return;
		}
		var allfiles = destFile.directoryEntries;
		// copy all the files inside the MAILDIR directory to import in MAILDIR directory created above
		while (allfiles.hasMoreElements()) {
			var singlefile = allfiles.getNext();
			singlefile = singlefile.QueryInterface(Ci.nsIFile);
			singlefile.copyTo(filex, null);
		}
	} catch (e) {
		return false;
	}

	// 3. update the database by using our fancy new reindexDBandRebuildSummary
	try {
		mboxImportExport.reindexDBandRebuildSummary(newFolder);
		return { status: "ok" };
	} catch (e) {
		console.log(e);
		return { status: "error", ex };
	}
}

function storeImportedSubFolders(msgFolder) {
	if (msgFolder.subFolders) {
		for (let subfolder of msgFolder.subFolders) {
			let obj = {};
			obj.msgFolder = subfolder;
			obj.forceCompact = false;
			gMsgFolderImported.push(obj);
			// If the subfolder has subfolders, the function calls itself.
			if (subfolder.hasSubFolders)
				storeImportedSubFolders(subfolder);
		}
	}
}

function addEmptyMessageToForceCompact(msgFolder) {
	var file = msgFolder2LocalFile(msgFolder);

	var istream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);

	istream.init(file, 0x01, 0o444, 0);
	istream.QueryInterface(Ci.nsILineInputStream);
	var line = {};
	var first3lines = "";
	for (var i = 0; i < 4; i++) {
		istream.readLine(line);
		first3lines = first3lines + line.value + "\n";
	}
	istream.close();
	if (first3lines.indexOf("X-Mozilla-Status") > -1) {
		return false;
	}

	// Probably this is not a Thunderbird/Mozilla mbox file, because is missing of X-Mozilla-Status fields
	// The only way to write  X-Mozilla-Status  in all messages is to force compacting after import
	// Thunderbird will compact just there are bites to expunge, so we add at the end of the mbox file
	// a fake deleted message

	var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
		createInstance(Ci.nsIFileOutputStream);
	var data = "\n\nFrom Moon\nX-Mozilla-Status: 0009\nX-Mozilla-Status2: 00800000\nDate: Fri, 08 Feb 2008 10:30:48 +0100\nFrom: nomail@nomail.no\nMIME-Version: 1.0\nTo: nomail@nomail.no\nSubject: empty\nContent-Type: text/plain\n\n\n\n";
	foStream.init(file, 0x02 | 0x08 | 0x10, 0o666, 0);
	foStream.write(data, data.length);
	foStream.close();
	return true;
}

// these lines *should* create the msf file
async function buildMSGfile(scan) {
	for (var i = 0; i < gMsgFolderImported.length; i++) {
		try {
			var folder = gMsgFolderImported[i].msgFolder;
			IETupdateFolder(folder);
		} catch (e) { }
		// I have no idea why so many setTimeout are in here, but each spins out
		// of the main thread and it is hard to keep track of the actual execution
		// flow. Let us return to sequential coding.
		await new Promise(resolve => setTimeout(resolve, 2000));
		await updateImportedFolder(folder, gMsgFolderImported[i].forceCompact);
	}
	gMsgFolderImported = [];
	if (scan)
		IETwritestatus(ietngUtils.localizeMsg("endscan"));
}

async function updateImportedFolder(msgFolder, forceCompact) {
	try {
		msgFolder.updateSummaryTotals(true);
	} catch (e) { }
	try {
		msgFolder.summaryChanged();
	} catch (e) { }
	if (forceCompact)
		msgFolder.compact(null, msgWindow);
}




async function exportfolder(params) {

	var exportFolderPath;
	var localfolder = params.localFolder;
	var zip = params.zipped;
	var subfolders = params.includeSubfolders;
	var keepstructure = !params.flattenSubfolders;

	//console.log("Start: ExportFolders (mbox)", params);

	var folders = [];
	var account;

	if (params.selectedFolder == "//currentFolder") {
		folders[0] = GetFirstSelectedMsgFolder();
	} else {
		if (params.selectedAccount && !params.selectedFolder) {
			var accountManager = Cc["@mozilla.org/messenger/account-manager;1"]
				.getService(Components.interfaces.nsIMsgAccountManager);
			account = accountManager.accounts.find(account => {
				if (account.key == params.selectedAccount.id) {
					return true;
				}
			});
			folders[0] = account.incomingServer.rootMsgFolder;
		} else {
			folders = [getMsgFolderFromAccountAndPath(params.selectedAccount.id, params.selectedFolder.path)];
		}
	}

	/*
	console.log("   Subfolders:", subfolders);
	console.log("   Structured: ", keepstructure);
	console.log("   Local: ", localfolder);
	console.log("   Zipper: ", zip);
*/

	var isVirtualFolder = false;
	for (var i = 0; i < folders.length; i++) {
		isVirtualFolder = folders[i] ? folders[i].flags & Ci.nsMsgFolderFlags.Virtual : false;
		if ((i > 0 && folders[i].server.type !== lastType) || (folders.length > 1 && isVirtualFolder)) {
			alert(ietngUtils.localizeMsg("noFolderExport"));
			return;
		}
		var lastType = folders[i].server.type;
	}

	if (params.warnings) {
		if (localfolder && (lastType === "imap" || lastType === "nntp")) {
			var go = IETremoteWarning();
			if (!go)
				return { status: "cancel" };
		}
	}

	var destdirNSIFILE = getPredefinedFolder(0);

	if (!destdirNSIFILE && params.fileDialog) {
		destdirNSIFILE = IETgetPickerModeFolder();
		if (!destdirNSIFILE) {
			return { status: "cancel" };
		}
	} else if (params.exportFolderPath) {
		destdirNSIFILE = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
		destdirNSIFILE.initWithPath(params.exportFolderPath);
	} else if (!destdirNSIFILE) {
		console.log("no dest cancel")

		return { status: "error" };
	}

	exportFolderPath = destdirNSIFILE.path;

	if (zip) {
		try {
			await IETexportZip(destdirNSIFILE, folders);
			return { status: "ok", exportFolderPath: exportFolderPath };
		} catch (ex) {
			return { status: "error", errMsg: ex };
		}
	}

	if (folders[0].isServer && keepstructure) {

		let destPath = destdirNSIFILE.path;
		let msgFolder = folders[0];
		try {
			await exportAccount(msgFolder, msgFolder.filePath.path, destPath);
			IETwritestatus(ietngUtils.localizeMsg("exportOK"));
			return { status: "ok", exportFolderPath: exportFolderPath };
		} catch (ex) {
			console.log(ex)
			return { status: "error", errMsg: ex };
		}

	}

	if (localfolder && !subfolders && isVirtualFolder) {
		try {
			exportVirtualFolder(folders[0], destdirNSIFILE);
			IETwritestatus(ietngUtils.localizeMsg("exportOK"));
			return { status: "ok", exportFolderPath: exportFolderPath };
		} catch (ex) {
			return { status: "error", errMsg: ex };
		}
	}

	if (!localfolder && !subfolders) {
		try {
			exportRemoteFolders(destdirNSIFILE, folders);
			return { status: "ok", exportFolderPath: exportFolderPath };
		} catch (ex) {
			return { status: "error", errMsg: ex };
		}
	}

	// new export
	let rootFolder = folders[0];
	rootFolder = rootFolder.QueryInterface(Ci.nsIMsgFolder);

	let flatten = !keepstructure;
	let destPath = destdirNSIFILE.path;

	let rootFolderName;
		if (!rootFolder.localizedName) {
			rootFolderName = rootFolder.prettyName;
		} else {
			rootFolderName = rootFolder.localizedName;
		}
	try {
		await mboxImportExport.exportFoldersToMbox(rootFolder, destPath, subfolders, flatten);

		if (folders[0].isServer) {
			let accountName = rootFolderName;
			if (this.IETprefs.getBoolPref("extensions.importexporttoolsng.export.mbox.use_mboxext")) {
				accountName += ".mbox";
			}
			await IOUtils.remove(PathUtils.join(destPath, accountName));
		} return { status: "ok", exportFolderPath: exportFolderPath };
	} catch (ex) {
		return { status: "error", errMsg: ex };
	}
}

async function IETexportZip(destdirNSIFILE, folders) {
	for (var i = 0; i < folders.length; i++) {
		var zipFile = destdirNSIFILE.clone();
		// export folder before zip

		var file = msgFolder2LocalFile(folders[i]);
		if (file.exists()) {

			var path = folders[i].name;
			var zipDestPath = destdirNSIFILE.path;
			var destPath = destdirNSIFILE.path + "\\ztmp";

			let useMboxExt = false;
			if (this.IETprefs.getBoolPref("extensions.importexporttoolsng.export.mbox.use_mboxext")) {
				useMboxExt = true;
			}
			
			let folderName;
		if (!folders[i].localizedName) {
			folderName = folders[i].prettyName;
		} else {
			folderName = folders[i].localizedName;
		}
			let newname = ietngUtils.createUniqueFolderName(folderName, destPath, false, useMboxExt);

			path = newname;

			await mboxImportExport.exportFoldersToMbox(folders[i], destPath, false, false);
			let newDestPath = PathUtils.join(destPath, newname);

			file.initWithPath(newDestPath);

			var zipName = path + ".zip";
			zipName = ietngUtils.createUniqueFolderName(zipName, zipDestPath, false, false);
			zipFile.append(zipName);
			var zipWriter = Components.Constructor("@mozilla.org/zipwriter;1", "nsIZipWriter");
			var zipW = new zipWriter();
			IETwritestatus(ietngUtils.localizeMsg("exportstart"));
			await new Promise(resolve => window.setTimeout(resolve, 100));

			zipW.open(zipFile, 0x04 | 0x08 | 0x20);
			if (file.isDirectory())
				IETaddFolderContentsToZip(zipW, file, "");
			else
				zipW.addEntryFile(path, Ci.nsIZipWriter.COMPRESSION_DEFAULT, file, false);
			zipW.close();
			await new Promise(resolve => window.setTimeout(resolve, 500));
			IOUtils.remove(newDestPath);
			IOUtils.remove(destPath);

			IETwritestatus(ietngUtils.localizeMsg("exportOK"));

		}
	}
}

function IETaddFolderContentsToZip(zipW, folder, root) {
	var entries = folder.directoryEntries;
	while (entries.hasMoreElements()) {
		var entry = entries.getNext();
		entry.QueryInterface(Ci.nsIFile);
		zipW.addEntryFile(root + entry.leafName, Ci.nsIZipWriter.COMPRESSION_DEFAULT, entry, false);
		if (entry.isDirectory())
			IETaddFolderContentsToZip(zipW, entry, root + entry.leafName + "/");
	}
}

// To be deprecated
function exportRemoteFolders(destdirNSIFILE, folders) {
	let IETglobalMsgFolders = folders;
	if (IETglobalMsgFolders[0].isServer)
		return;
	// cleidigh ?
	IETglobalMsgFoldersExported = 0;
	exportIMAPfolder(IETglobalMsgFolders[0], destdirNSIFILE);
}

// To be deprecated
// The subfolder argument is true if we have to export also the subfolders
async function exportSingleLocaleFolder(msgFolder, subfolder, keepstructure, destdirNSIFILE) {

	var filex = msgFolder2LocalFile(msgFolder);
	// thefoldername=the folder name displayed in TB (for ex. "Modelli")
	var thefoldername = IETcleanName(msgFolder.name);
	var newname;

	//console.log("Start: exportSingleLocaleFolder");
	// console.log("   SrcPath: ", filex.path);
	// console.log("   Folder: ", thefoldername);

	// Check if we're exporting a simple mail folder, a folder with its subfolders or all the folders of the account
	if (msgFolder.isServer) {
		// console.log("Exporting server");
		// console.log(msgFolder.filePath.path);
		// console.log(msgFolder.prettyName);
		let destPath = destdirNSIFILE.path;
		let folderName;
		if (!msgFolder.localizedName) {
			folderName = msgFolder.prettyName;
		} else {
			folderName = msgFolder.localizedName;
		}
		await exportAccount(folderName, msgFolder.filePath.path, destPath);
		IETwritestatus(ietngUtils.localizeMsg("exportOK"));
	} else if (subfolder && !keepstructure) {
		// export the folder with the subfolders
		// first we copy the folder, finding a good name from its displayed name
		console.log("flat");

		newname = findGoodFolderName(thefoldername, destdirNSIFILE, false);
		if (filex.exists()) {
			console.log("copy ", newname);

			// filex.copyTo(destdirNSIFILE, newname);
			let dest = PathUtils.join(destdirNSIFILE.path, newname);
			console.log("copyfix");
			// mboxImportExport.copyAndFixMboxFile(filex.path, dest);
			await buildAndExportMbox(msgFolder, dest);
		}
		// then we export the subfolders
		exportSubFolders(msgFolder, destdirNSIFILE, keepstructure);
		// IETwritestatus(ietngUtils.localizeMsg("exportOK"));
	} else if (subfolder && msgFolder.hasSubFolders && keepstructure) {
		console.log("Exporting with subfolders");
		newname = findGoodFolderName(thefoldername, destdirNSIFILE, true);
		if (filex.exists()) {
			// filex.copyTo(destdirNSIFILE, newname);
			let dest = PathUtils.join(destdirNSIFILE.path, newname);
			console.log("copyfix");
			mboxImportExport.copyAndFixMboxFile(filex.path, dest);
		} else {
			console.log("create ", newname);
			// This fixes #320
			// imap profile folders do not have empty
			// mbox files. We create one if we encounter
			// an msf file, but no mbox file.
			// This must have changed...
			var topdestdirNSI = destdirNSIFILE.clone();
			topdestdirNSI.append(newname);
			topdestdirNSI.create(0, 0o644);
		}
		var sbd = filex.parent;
		sbd.append(filex.leafName + ".sbd");
		if (sbd) {
			sbd.copyTo(destdirNSIFILE, newname + ".sbd");
			var destdirNsFile = destdirNSIFILE.clone();
			destdirNsFile.append(newname + ".sbd");
			var listMSF = MBOXIMPORTscandir.find(destdirNsFile);
			for (let i = 0; i < listMSF.length; ++i) {
				if (listMSF[i].leafName.substring(listMSF[i].leafName.lastIndexOf(".")) === ".msf") {
					try {
						listMSF[i].remove(false);
						let fname = listMSF[i].path.split(".msf")[0];
						var nsifile = new FileUtils.File(fname);
						if (!nsifile.exists()) {
							nsifile.create(0, 0o644);
						}
					} catch (e) {
						console.log(e);
					}
				}
			}
		}
		IETwritestatus(ietngUtils.localizeMsg("exportOK"));
	} else {
		// export just the folder
		newname = findGoodFolderName(thefoldername, destdirNSIFILE, false);
		if (filex.exists()) {
			let dest = PathUtils.join(destdirNSIFILE.path, newname);
			console.log("copyfix");
			// mboxImportExport.copyAndFixMboxFile(filex.path, dest);
			await buildAndExportMbox(msgFolder, dest);

			// await IOUtils.copy(filex.path, dest);
		}
		// IETwritestatus(ietngUtils.localizeMsg("exportOK"));
	}
}

// Rewrite / fix account level export - use IOUtils #296
async function exportAccount(rootFolder, accountFolderPath, destPath) {

	//console.log("Start: exportAccount");
	// console.log("   SrcPath: ", accountFolderPath);
	// console.log("   srcFolder: ", accountName);
	// console.log("   destPath: ", destPath);

	let rootFolderName;
		if (!rootFolder.localizedName) {
			rootFolderName = rootFolder.prettyName;
		} else {
			rootFolderName = rootFolder.localizedName;
		}
	let accountName = rootFolderName;
	let tmpAccountFolderName = nametoascii(accountName);
	let finalExportFolderPath;
	if (IOUtils.createUniqueDirectory) {
		finalExportFolderPath = await IOUtils.createUniqueDirectory(destPath, tmpAccountFolderName);
	} else {
		finalExportFolderPath = await createUniqueDirectory(destPath, tmpAccountFolderName);
	}

	await mboxImportExport.exportFoldersToMbox(rootFolder, finalExportFolderPath, true, false);


}

async function createUniqueDirectory(parent, prefix) {

	let ext = prefix.split('.').pop();
	let name = prefix.substring(0, prefix.lastIndexOf('.'));

	var tmpUniqueName = await PathUtils.join(parent, prefix);

	for (let i = 0; i < 100; i++) {
		if (i === 0 && !(await IOUtils.exists(tmpUniqueName))) {
			await IOUtils.makeDirectory(tmpUniqueName);
			return tmpUniqueName;
		} else if (i === 0) {
			continue;
		}

		tmpUniqueName = await PathUtils.join(parent, `${name}-${i}.${ext}`);

		if (!await IOUtils.exists(tmpUniqueName)) {
			await IOUtils.makeDirectory(tmpUniqueName);
			return tmpUniqueName;
		}
	}
	return null;
}


async function getDirectoryChildren(rootPath, options) {
	let list = [];
	let items = await IOUtils.getChildren(rootPath);

	list = items;
	if (options && options.fileFilter) {
		list = list.filter(li => li.endsWith(options.fileFilter));
	}

	if (options && options.recursive) {
		for (item of items) {
			let stat = await IOUtils.stat(item);
			// console.log(stat)
			if (stat.type == "directory") {
				// console.log(item)
				list = list.concat(await getDirectoryChildren(item, options));
			}
		}
	}
	return list;
}


var MBOXIMPORTscandir = {
	list2: [],

	find: function (dir) {
		var list = [];
		if (dir.isDirectory()) {
			var files = dir.directoryEntries;
			list = this.scanRecursive(files);
		}
		return list;
	},

	scanRecursive: function (dirEntry) {
		var list = [];
		var files = [];

		while (dirEntry.hasMoreElements()) {
			list.push(dirEntry.getNext().QueryInterface(Ci.nsIFile));
		}
		for (var i = 0; i < list.length; ++i) {
			if (list[i].isDirectory()) {
				files = list[i].directoryEntries;
				this.list2 = this.scanRecursive(files);
			}
		}
		for (i = 0; i < this.list2.length; ++i) {
			list.push(this.list2[i]);
		}
		this.list2 = [];
		return list;
	},
};



function exportSubFolders(msgFolder, destdirNSIFILE, keepstructure) {
	if (msgFolder.subFolders) {
		console.log("copy Subfolders ");

		for (let subfolder of msgFolder.subFolders) {
			// Search for a good name
			console.log(subfolder);
			console.log(subfolder.filePath);
			console.log(subfolder.name);


			let newname = findGoodFolderName(subfolder.name, destdirNSIFILE, false);
			let subfolderNS = msgFolder2LocalFile(subfolder);
			console.log(subfolderNS);

			console.log(subfolderNS.exists());
			console.log(subfolderNS.path);

			if (subfolderNS.exists()) {
				// subfolderNS.copyTo(destdirNSIFILE, newname);
				let dest = PathUtils.join(destdirNSIFILE.path, newname);
				console.log("copyfix");
				mboxImportExport.copyAndFixMboxFile(subfolderNS.path, dest);
			} else {
				newname = IETcleanName(newname);
				let destdirNSIFILEclone = destdirNSIFILE.clone();
				destdirNSIFILEclone.append(newname);
				destdirNSIFILEclone.create(0, 0o644);
			}
			if (keepstructure) {
				let sbd = subfolderNS.parent;
				sbd.append(subfolderNS.leafName + ".sbd");
				if (sbd.exists() && sbd.directoryEntries.length > 0) {
					sbd.copyTo(destdirNSIFILE, newname + ".sbd");
					let destdirNsFile = destdirNSIFILE.clone();
					destdirNsFile.append(newname + ".sbd");
					let listMSF = MBOXIMPORTscandir.find(destdirNsFile);
					for (let i = 0; i < listMSF.length; ++i) {
						if (listMSF[i].leafName.substring(listMSF[i].leafName.lastIndexOf(".")) === ".msf") {
							try {
								listMSF[i].remove(false);
							} catch (e) { }
						}
					}
				}
			}

			// If the subfolder has subfolders, the function calls itself
			if (subfolder.hasSubFolders && !keepstructure)
				exportSubFolders(subfolder, destdirNSIFILE, keepstructure);
		}
	}
}


function findGoodFolderName(foldername, destdirNSIFILE, structure) {
	var overwrite = IETprefs.getBoolPref("extensions.importexporttoolsng.export.overwrite");
	var index = 0;
	var nameIndex = "";
	var NSclone = destdirNSIFILE.clone();

	// Change unsafe chars for filenames with underscore
	foldername = IETcleanName(foldername);
	NSclone.append(foldername);
	foldername = nametoascii(foldername);
	// if the user wants to overwrite the files with the same name in the folder destination
	// the function must delete the existing files and then return the original filename.
	// If it's a structured export, it's deleted also the filename.sbd subdirectory
	if (overwrite) {
		if (NSclone.exists()) {
			NSclone.remove(false);
			if (structure) {
				var NSclone2 = destdirNSIFILE.clone();
				NSclone2.append(foldername + ".sbd");
				NSclone2.remove(true);
			}
		}
		return foldername;
	}
	NSclone = destdirNSIFILE.clone();
	NSclone.append(foldername);
	while (NSclone.exists()) {
		index++;
		nameIndex = foldername + "-" + index.toString();
		NSclone = destdirNSIFILE.clone();
		NSclone.append(nameIndex);
	}
	if (nameIndex !== "")
		return nameIndex;

	return foldername;
}

async function importALLasEML(params) {
	//console.debug('Start eml import', params);

	var recursive = params.emlImpRecursive;
	var msgFolder;
	if (params.selectedFolder.path == "/") {
		var accountManager = Cc["@mozilla.org/messenger/account-manager;1"]
			.getService(Components.interfaces.nsIMsgAccountManager);
		account = accountManager.accounts.find(account => {
			if (account.key == params.selectedAccount.id) {
				return true;
			}
		});
		msgFolder = account.incomingServer.rootMsgFolder;
	} else {
		msgFolder = getMsgFolderFromAccountAndPath(params.selectedAccount.id, params.selectedFolder.path);
	}


	if (!msgFolder) {
		alert(ietngUtils.localizeMsg("noFolderSelected"));
		return;
	}

	let winCtx = window;
	const tbVersion = ietngUtils.getThunderbirdVersion();
	if (tbVersion.major >= 120) {
		winCtx = window.browsingContext;
	}

	// Open the filepicker to choose the directory
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
	fp.init(winCtx, ietngUtils.localizeMsg("searchdir"), Ci.nsIFilePicker.modeGetFolder);
	let res = await new Promise(resolve => {
		fp.open(resolve);
	});
	if (res !== Ci.nsIFilePicker.returnOK) {
		return { status: "cancel" };
	}

	gEMLimported = 0;
	gEMLimportedErrs = 0;
	gImporting = true;
	IETwritestatus(ietngUtils.localizeMsg("importEMLstart"));
	if (document.getElementById("IETabortIcon")) {
		document.getElementById("IETabortIcon").collapsed = false;
	}

	await RUNimportALLasEML(msgFolder, fp.file, recursive);

	if (document.getElementById("IETabortIcon")) {
		document.getElementById("IETabortIcon").collapsed = true;
	}
	if (gEMLimportedErrs) {
	}
	return { status: "ok" };
}

async function RUNimportALLasEML(msgFolder, file, recursive) {
	gFileEMLarray = [];
	gFileEMLarrayIndex = 0;
	folderCount = 1;

	if (!msgFolder) {
		alert(ietngUtils.localizeMsg("noFolderSelected"));
		return;
	}

	let rootFolder = msgFolder;

	let res = await buildEMLarray(file, msgFolder, recursive, rootFolder);
	if (res != true) {
		alert(res);
		return;
	}

	gEMLtotal = gFileEMLarray.length;
	if (gEMLtotal < 1) {
		IETwritestatus(ietngUtils.localizeMsg("numEML") + " 0" + "/" + gEMLtotal);
		document.getElementById("IETabortIcon").collapsed = true;
		return;
	}

	// cleidigh - start by closing all files
	rootFolder.ForceDBClosed();
	trytoimportEML(gFileEMLarray[0].file, gFileEMLarray[0].msgFolder, false, null, true);
	return;
}

async function buildEMLarray(file, msgFolder, recursive, rootFolder) {
	// allfiles is the nsiSimpleEnumerator with the files in the directory selected from the filepicker
	var allfiles = file.directoryEntries;

	// console.debug('Build EML array');
	// console.debug(' folder ' + msgFolder.name);

	while (allfiles.hasMoreElements()) {
		document.getElementById("IETabortIcon").collapsed = false;
		var afile = allfiles.getNext();
		afile = afile.QueryInterface(Ci.nsIFile);
		try {
			// https://bugzilla.mozilla.org/show_bug.cgi?id=701721 ?
			var is_Dir = afile.isDirectory();
		} catch (e) {
			continue;
		}

		if (recursive && is_Dir) {
			let folderName = afile.leafName;

			// Wait for the folder being added.

			var newFolder;
			try {
				newFolder = await ietngUtils.createSubfolder(msgFolder, folderName);
			} catch (ex) {
				return ex;
			}
			await buildEMLarray(afile, newFolder, true, rootFolder);
		} else {
			var emlObj = {};
			var afilename = afile.leafName;
			afilename = afilename.toLowerCase();
			var afilenameext = afilename.substring(afilename.lastIndexOf("."), afilename.length);
			// fix #241 - also import .emlx
			if (!afile.isFile() || (afilenameext !== ".eml" && afilenameext !== ".emlx" && afilenameext !== "._eml" && afilenameext !== ".nws"))
				continue;
			emlObj.file = afile;
			emlObj.msgFolder = msgFolder;
			gFileEMLarray[gFileEMLarrayIndex] = emlObj;
			gFileEMLarrayIndex++;
		}
	}
	return true;
}

async function importEMLs(params) {

	let msgFolder = getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path);
	// No import for imap and news account, sorry...
	if ((!String.prototype.trim && msgFolder.server.type === "imap") || msgFolder.server.type === "nntp") {
		alert(ietngUtils.localizeMsg("badfolder"));
		return;
	}

	let winCtx = window;
	const tbVersion = ietngUtils.getThunderbirdVersion();
	if (tbVersion.major >= 120) {
		winCtx = window.browsingContext;
	}
	// Set the filepicker to open the last opened directory
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
	fp.init(winCtx, ietngUtils.localizeMsg("filePickerImportMSG"), Ci.nsIFilePicker.modeOpenMultiple);
	fp.appendFilter(ietngUtils.localizeMsg("emailFiles"), "*.eml; *.emlx; *.nws; *._eml");
	fp.appendFilter("All files", "*.*");
	let res = await new Promise(resolve => {
		fp.open(resolve);
	});
	if (res !== Ci.nsIFilePicker.returnOK) {
		return { status: "cancel" };
	}

	var thefiles = fp.files;
	var fileArray = [];
	// Files are stored in an array, so that they can be imported one by one
	while (thefiles.hasMoreElements()) {
		var onefile = thefiles.getNext();
		onefile = onefile.QueryInterface(Ci.nsIFile);
		fileArray.push(onefile);
	}
	gEMLimported = 0;
	gEMLimportedErrs = 0;
	gImporting = true;
	gEMLtotal = fileArray.length;
	IETwritestatus(ietngUtils.localizeMsg("importEMLstart"));
	trytoimportEML(fileArray[0], msgFolder, false, fileArray, false);
	return { status: "ok" };
}

var importEMLlistener = {

	onStartCopy: function () {
	},

	OnStartCopy: function () {
	},

	onStopCopy: function () {
		importEMLlistener.next();
	},

	OnStopCopy: function () {
		if (this.removeFile)
			this.file.remove(false);
		importEMLlistener.next();
	},

	SetMessageKey: function (aKey) { },

	onStartRequest: function (aRequest) {
		this.mData = "";
	},

	onDataAvailable: function (aRequest, aStream, aSourceOffset, aLength) {
		// Here it's used the nsIBinaryInputStream, because it can read also null bytes
		var bis = Cc['@mozilla.org/binaryinputstream;1']
			.createInstance(Ci.nsIBinaryInputStream);
		bis.setInputStream(aStream);
		this.mData += bis.readBytes(aLength);
	},

	onStopRequest: function (aRequest, aStatus) {
		var text = this.mData;
		try {
			var index = text.search(/\r\n\r\n/);
			var header = text.substring(0, index);
			if (header.indexOf("Date: =?") > -1) {
				var mime2DecodedService = Cc["@mozilla.org/network/mime-hdrparam;1"]
					.getService(Ci.nsIMIMEHeaderParam);
				var dateOrig = header.match(/Date: \=\?.+\?\=\r\n/).toString();
				var dateDecoded = "Date: " + mime2DecodedService.getParameter(dateOrig.substring(6), null, "", false, { value: null }) + "\r\n";
				header = header.replace(dateOrig, dateDecoded);
			}
			// cleidigh - TODO - what is this ?
			var data = header + text.substring(index);
			var data = text;
		} catch (e) {
			var data = text;
		}

		if (!this.imap) {
			if (writeDataToFolder(data, this.msgFolder, this.file, this.removeFile) === -1)
				return;
		}
		importEMLlistener.next();
	},

	next: async function () {
		var nextFile;
		//console.log("next")

		if (this.allEML && gEMLimported < gFileEMLarray.length) {
			nextFile = gFileEMLarray[gEMLimported].file;
			trytoimportEML(nextFile, gFileEMLarray[gEMLimported].msgFolder, this.removeFile, this.fileArray, this.allEML);
		} else if (this.fileArray && gEMLimported < this.fileArray.length) {
			nextFile = this.fileArray[gEMLimported];
			trytoimportEML(nextFile, this.msgFolder, this.removeFile, this.fileArray, false);
		} else {
			// At the end we update the fodler view and summary
			await ietngUtils.rebuildSummary(this.msgFolder);
			document.getElementById("IETabortIcon").collapsed = true;
			gImporting = false;
			let msgImportErrMsg = ietngExtension.localeData.localizeMessage("messageImportProblems.msg");
			let viewDbgConsoleMsg = ietngExtension.localeData.localizeMessage("viewDbgConsole.msg");

			if (gEMLimportedErrs) {
				// give the ui some time
				await new Promise(r => window.setTimeout(r, 400));
				Services.prompt.alert(window, warningMsg, `${msgImportErrMsg}\n\n${gEMLimportedErrs}${viewDbgConsoleMsg}`);
			}
		}
	},

	QueryInterface: function (aIID) {
		if (aIID.equals(Ci.nsISupports) ||
			aIID.equals(Ci.nsIInterfaceRequestor) ||
			aIID.equals(Ci.nsIChannelEventSink) ||
			aIID.equals(Ci.nsIProgressEventSink) ||
			aIID.equals(Ci.nsIHttpEventSink) ||
			aIID.equals(Ci.nsIStreamListener))
			return this;

		throw Cr.NS_NOINTERFACE;
	},
};

function trytoimportEML(file, msgFolder, removeFile, fileArray, allEML) {
	if (file.path.indexOf(".emlx") > -1) {
		file = IETemlx2eml(file);
	}

	importEMLlistener.msgFolder = msgFolder;
	importEMLlistener.removeFile = removeFile;
	importEMLlistener.file = file;
	importEMLlistener.fileArray = fileArray;
	importEMLlistener.allEML = allEML;
	if (String.prototype.trim && msgFolder.server.type === "imap") {

		importEMLlistener.imap = true;
		let rv = MailServices.copy.copyFileMessage(file, msgFolder, null, false, 1, "", importEMLlistener, msgWindow);

		if (!removeFile) {
			gEMLimported = gEMLimported + 1;
			let errs = "";
			if (gEMLimportedErrs) {
				errs = `(Errs: ${gEMLimportedErrs})`;
			}
			IETwritestatus(ietngUtils.localizeMsg("numEML") + gEMLimported + errs + "/" + gEMLtotal);
		}
	} else {
		importEMLlistener.imap = false;
		var ios = Cc["@mozilla.org/network/io-service;1"]
			.getService(Ci.nsIIOService);
		var fileURI = ios.newFileURI(file);
		var channel;

		if (Services.io.newChannelFromURI2) {
			channel = Services.io.newChannelFromURI2(
				fileURI,
				null,
				Services.scriptSecurityManager.getSystemPrincipal(),
				null,
				Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
				Ci.nsIContentPolicy.TYPE_OTHER
			);
		} else {
			channel = Services.io.newChannelFromURI(
				fileURI,
				null,
				Services.scriptSecurityManager.getSystemPrincipal(),
				null,
				Ci.nsILoadInfo.SEC_ALLOW_CROSS_ORIGIN_SEC_CONTEXT_IS_NULL,
				Ci.nsIContentPolicy.TYPE_OTHER
			);
		}

		channel.asyncOpen(importEMLlistener, null);
	}

	return { status: "ok" };
}

function writeDataToFolder(data, msgFolder, file, removeFile) {
	// console.debug('Start write data');

	if (!gImporting) {
		msgFolder.ForceDBClosed();
		console.debug('Abort importing message # ' + gEMLimported + '\r\n\n');
		return -1;
	}
	var msgLocalFolder = msgFolder.QueryInterface(Ci.nsIMsgLocalMailFolder);
	// strip off the null characters, that break totally import and display
	data = data.replace(/\x00/g, "");
	var now = new Date;
	var nowString;

	try {
		nowString = now.toString().match(/.+:\d\d/);
		nowString = nowString.toString().replace(/\d{4} /, "");
		nowString = nowString + " " + now.getFullYear();
	} catch (e) {
		nowString = now.toString().replace(/GMT.+/, "");
	}

	var top = data.substring(0, 2000);

	let lines = top.split('\n');
	// Fix #214 - check for ':' does not require trailing space
	if (!lines[0].includes(":") && !lines[0].includes("From: ") && !lines[0].includes("From ")) {
		console.debug(`Msg #: ${++gEMLimported} Err #: ${++gEMLimportedErrs}\n Folder: ${msgFolder.name}\n Filename: ${file.path}\n FirstLine: ${lines[0]}\n`);
		return 0;
	}

	// Fix for crazy format returned by Hotmail view-source
	if (top.match(/X-Message-Delivery:.+\r?\n\r?\n/) || top.match(/X-Message-Info:.+\r?\n\r?\n/))
		data = data.replace(/(\r?\n\r?\n)/g, "\n");

	// Fix for some not-compliant date headers
	if (top.match(/Posted-Date\:/))
		data = data.replace("Posted-Date:", "Date:");
	if (top.match(/X-OriginalArrivalTime:.+\r?\n\r?\n/))
		data = data.replace("X-OriginalArrivalTime:", "Date:");

	// Some eml files begin with "From <something>"
	// This causes that Thunderbird will not handle properly the message
	// so in this case the first line is deleted
	data = data.replace(/^From\s+.+\r?\n/, "");

	var prologue = "From - " + nowString + "\n"; // The first line must begin with "From -", the following is not important

	// Prologue needed to add the message to the folder
	const tbVersion = ietngUtils.getThunderbirdVersion();
	if (tbVersion.major > 115) {
		prologue = "";
	}

	// If the message has no X-Mozilla-Status, we add them to it
	if (!data.includes("X-Mozilla-Status"))
		prologue = prologue + "X-Mozilla-Status: 0000\nX-Mozilla-Status2: 00000000\n";
	else if (IETprefs.getBoolPref("extensions.importexporttoolsng.reset_mozilla_status")) {
		// Reset the X-Mozilla status
		data = data.replace(/X-Mozilla-Status: \d{4}/, "X-Mozilla-Status: 0000");
		data = data.replace(/X-Mozilla-Status2: \d{8}/, "X-Mozilla-Status2: 00000000");
	}
	// If the message has no X-Account-Key, we add it to it, taking it from the account selected
	if (data.includes("X-Account-Key")) {
		var myAccountManager = Cc["@mozilla.org/messenger/account-manager;1"]
			.getService(Ci.nsIMsgAccountManager);
		var myAccount;
		try {
			myAccount = myAccountManager.FindAccountForServer(msgFolder.server);
		} catch (ex) {
			myAccount = myAccountManager.findAccountForServer(msgFolder.server);
		}
		prologue = prologue + "X-Account-Key: " + myAccount.key + "\n";
	}
	data = IETescapeBeginningFrom(data);
	// Add the prologue to the EML text
	data = prologue + data + "\n";
	// Add the email to the folder
	// console.debug('Before addMessage');
	try {
		var res = msgLocalFolder.addMessage(data);
		// console.debug('# ' + gEMLimported + ' ' + res);
		gEMLimported = gEMLimported + 1;

	} catch (e) {
		gImporting = false;
		console.debug('Exception # ' + e + ' ' + gEMLimported);
		console.debug(msgLocalFolder.filePath.path);
		msgFolder.ForceDBClosed();
		alert('Exception importing message # ' + gEMLimported + '\r\n\n' + e);
		return -1;
	}

	// cleidigh force files closed
	if (gEMLimported % 450 === 0) {
		msgFolder.ForceDBClosed();
		// console.debug('message DB ' + gEMLimported);
	}

	let errs = "";
	if (gEMLimportedErrs) {
		errs = ` (Errs: ${gEMLimportedErrs})`;
	}
	IETwritestatus(ietngUtils.localizeMsg("numEML") + gEMLimported + errs + "/" + gEMLtotal);

	if (removeFile)
		file.remove(false);
	return 0;
}


function openIEToptions() {
	let optionsWin = Cc["@mozilla.org/appshell/window-mediator;1"]
		.getService(Ci.nsIWindowMediator)
		.getMostRecentWindow("ietng:options");
	if (!optionsWin) {
		window.openDialog("chrome://mboximport/content/mboximport/mboximportOptions.xhtml", "", "chrome,centerscreen");
	} else {
		optionsWin.focus();
	}
	return { status: "ok" };
}

function IETcopyFolderPath(params) {
	if (!params.selectedFolder) {
		params.selectedFolder = {};
		params.selectedFolder.path = "/";
	}
	let msgFolder = getMsgFolderFromAccountAndPath(params.selectedAccount.id, params.selectedFolder.path);

	var file = msgFolder2LocalFile(msgFolder);
	IETcopyStrToClip(file.path);
	return { status: "ok" };
}

function IETopenFolderPath(params) {
	if (!params.selectedFolder) {
		params.selectedFolder = {};
		params.selectedFolder.path = "/";

	}
	let msgFolder = getMsgFolderFromAccountAndPath(params.selectedAccount.id, params.selectedFolder.path);

	var file = msgFolder2LocalFile(msgFolder);
	var parent;

	try {
		// Show the directory containing the file and select the file
		file.reveal();
	} catch (e) {
		// If reveal fails for some reason (e.g., it's not implemented on unix or
		// the file doesn't exist), try using the parent if we have it.
		if (msgFolder.isServer)
			parent = file;
		else
			parent = file.parent.QueryInterface(Ci.nsIFile);
		if (!parent)
			return;
		try {
			// "Double click" the parent directory to show where the file should be
			parent.launch();
		} catch (e) {
			// If launch also fails (probably because it's not implemented), let the
			// OS handler try to open the parent
			var uri = Cc["@mozilla.org/network/io-service;1"].
				getService(Ci.nsIIOService).newFileURI(file);
			var protocolSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
				getService(Ci.nsIExternalProtocolService);
			protocolSvc.loadUrl(uri);
		}
	}
	return { status: "ok" };
}
