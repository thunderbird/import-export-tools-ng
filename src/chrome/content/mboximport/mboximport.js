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
IETstoreFormat,
GetSelectedMsgFolders,
IETgetSelectedMessages,
isMbox,
IETprefs,
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
*/

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");
var FileUtils = ChromeUtils.import("resource://gre/modules/FileUtils.jsm").FileUtils


XPCOMUtils.defineLazyGlobalGetters(this, ["IOUtils", "PathUtils"]);

var MBstrBundleService = Services.strings;
var mboximportbundle = MBstrBundleService.createBundle("chrome://mboximport/locale/mboximport.properties");
var nosub = mboximportbundle.GetStringFromName("nosubjectmsg");
var mboximportbundle2 = MBstrBundleService.createBundle("chrome://messenger/locale/mime.properties");

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

var IETprintPDFmain = {

	print: async function (allMessages) {
		if (navigator.platform.toLowerCase().indexOf("mac") > -1 || navigator.userAgent.indexOf("Postbox") > -1) {
			alert(mboximportbundle.GetStringFromName("noPDFmac"));
			return;
		}
		try {
			let printSvc = Cc["@mozilla.org/gfx/printsettings-service;1"].getService(Ci.nsIPrintSettingsService);
			if (printSvc.defaultPrinterName === "") {
				alert(mboximportbundle.GetStringFromName("noPDFnoPrinter"));
				return;
			}
		} catch (e) { }

		let msgFolders = GetSelectedMsgFolders();
		if (msgFolders.length > 1) {
			alert(mboximportbundle.GetStringFromName("noPDFmultipleFolders"));
			return;
		}
		let question = IETformatWarning(1);
		if (!question)
			return;
		question = IETformatWarning(0);
		if (!question)
			return;

		if (!allMessages) {
			IETprintPDFmain.uris = IETgetSelectedMessages();
		} else {
			IETprintPDFmain.uris = [];
			let msgFolder = msgFolders[0];
			let isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
			if (isVirtFol) {
				var total = msgFolder.getTotalMessages(false);
				for (let i = 0; i < total; i++)
					IETprintPDFmain.uris.push(gDBView.getURIForViewIndex(i));
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
			return;

		IETprintPDFmain.total = IETprintPDFmain.uris.length;
		let dir = getPredefinedFolder(2);
		if (!dir) {
			let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
			fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), Ci.nsIFilePicker.modeGetFolder);
			let res = await new Promise(resolve => {
				fp.open(resolve);
			});
			if (res !== Ci.nsIFilePicker.returnOK) {
				return;
			}
			dir = fp.file;
		}
		IETprintPDFmain.file = dir;
		await IETprintPDFmain.saveAsPDF();
	},

	/**
	 * Runs through IETprintPDFmain.uris and prints all to PDF
	 * Based on https://searchfox.org/mozilla-central/rev/9bc5dcea99c59dc18eae0de7064131aa20cfbb66/browser/components/extensions/parent/ext-tabs.js#1296
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

		//console.log(printSettings)
		printSettings.isInitializedFromPrinter = true;
		printSettings.isInitializedFromPrefs = true;
		if(printSettings.printToFile !== undefined) {
			printSettings.printToFile = true;
		}
		
		printSettings.printSilent = true;
		printSettings.outputFormat = fileFormat;

		// Allow to override settings, todo
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

		// Create a fake message browser so we do not need to load them into the display area.
		// If we want to print the currently viewed message, we could just use the messagepane
		// browser, but we always use our fake browser.
		let fakeMsgPane = document.createXULElement("browser");
		fakeMsgPane.setAttribute("context", "mailContext");
		fakeMsgPane.setAttribute("type", "content");
		fakeMsgPane.setAttribute("disablesecurity", "true");
		fakeMsgPane.setAttribute("messagemanagergroup", "single-page");
		fakeMsgPane.setAttribute("remote", "false");
		fakeMsgPane.setAttribute("primary", "true");
		fakeMsgPane.hidden = true;
		fakeMsgPane = window.document.getElementById("messagesBox").parentNode.appendChild(fakeMsgPane);

		let docShell = fakeMsgPane.docShell;
		docShell.appType = Ci.nsIDocShell.APP_TYPE_MAIL;

		for (let uri of IETprintPDFmain.uris) {
			let messageService = messenger.messageServiceFromURI(uri);
			let aMsgHdr = messageService.messageURIToMsgHdr(uri);

			let fileName = fileFormat === 2
				? getSubjectForHdr(aMsgHdr, filePath) + ".pdf"
				: getSubjectForHdr(aMsgHdr, filePath) + ".ps"
			printSettings.toFileName = PathUtils.join(filePath, fileName);

			messageService.DisplayMessage(
				uri + "&markRead=false",
				docShell,
				undefined, //win.msgWindow,
				undefined,
				undefined,
				{}
			)

			// Mh, bäh.
			for (let i = 1; i < 100; i++) {
				await new Promise(resolve => window.setTimeout(resolve, 20));
				if (fakeMsgPane.contentDocument.readyState == "complete")
					break;
			}
			await fakeMsgPane.browsingContext.print(printSettings);
		}

		fakeMsgPane.remove();
	},
};

function bytesToString2(bytes) {
    return bytes.reduce(function(str, b) {
      return str + String.fromCharCode(b);
    }, "");
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


}

async function openMboxDialog() {
	if (IETstoreFormat() !== 0) {
		alert(mboximportbundle.GetStringFromName("noMboxStorage"));
		return;
	}
	let msgFolder = GetSelectedMsgFolders()[0];
	// we don't import the file in imap or nntp accounts
	if ((msgFolder.server.type === "imap") || (msgFolder.server.type === "nntp")) {
		alert(mboximportbundle.GetStringFromName("badfolder"));
		return;
	}
	var params = { scandir: false, keepstructure: false, openProfDir: false, recursiveMode: false };
	window.openDialog("chrome://mboximport/content/mboximport/mboxdialog.xhtml", "", "chrome,modal,centerscreen", params);
	if (params.cancel) {
		return;
	}
	// I have no idea why so many setTimeout are in here, but each spins out of the main thread and
	// it is hard to keep track of the actual execution flow. Let us return to sequential coding
	// using async/await.
	await new Promise(resolve => setTimeout(resolve, 800));
	await importmbox(params.scandir, params.keepstructure, params.openProfDir, params.recursiveMode, msgFolder);
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

async function trytocopyMAILDIR() {
	if (IETstoreFormat() !== 1) {
		alert(mboximportbundle.GetStringFromName("noMaildirStorage"));
		return;
	}

	// initialize variables
	let msgFolder = GetSelectedMsgFolders()[0];

	// we don't import the file in imap or nntp accounts
	if ((msgFolder.server.type === "imap") || (msgFolder.server.type === "nntp")) {
		alert(mboximportbundle.GetStringFromName("badfolder"));
		return;
	}

	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("filePickerImport"), Ci.nsIFilePicker.modeGetFolder);
	fp.appendFilters(Ci.nsIFilePicker.filterAll);
	let res = await new Promise(resolve => {
		fp.open(resolve);
	});
	if (res !== Ci.nsIFilePicker.returnOK) {
		return;
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
	var newFolder = msgFolder.addSubfolder(newfilename);
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
			alert(mboximportbundle.GetStringFromName("isNotMaildir"));
			return;
		}
		destFileClone = destFileClone.parent;
		destFileClone.append("tmp");
		if (!destFileClone.exists() || !destFileClone.isDirectory()) {
			alert(mboximportbundle.GetStringFromName("isNotMaildir"));
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

	// 3. update the database by selecting the folder and rebuilding the index
	try {
		msgFolder.NotifyItemAdded(newFolder);
		SelectFolder(newFolder.URI);
		IETupdateFolder(newFolder);
	} catch (e) { }
}

// The arguments of trytocopy are
// file = the file to import as nsIFile
// filename = the name of the file to import
// msgFolder = the folder as nsImsgFolder

async function trytocopy(file, filename, msgFolder, keepstructure) {
	// If the file isn't mbox format, alert, but doesn't exit (it did in pre 0.5.8 version and lower)
	// In fact sometimes TB can import also corrupted mbox files
	var isMbx = isMbox(file);
	if (isMbx !== 1) {
		if (isMbx === 0) {
			var continuebundle = MBstrBundleService.createBundle("chrome://messenger/locale/filter.properties");
			// We take the "Continue" label from another file...
			var continuelabel = continuebundle.GetStringFromName("continueButtonLabel");
			var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService);
			var flags = prompts.BUTTON_TITLE_CANCEL * prompts.BUTTON_POS_0 +
				prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1 + prompts.BUTTON_POS_0_DEFAULT;
			var string = ("\"" + filename + "\" " + mboximportbundle.GetStringFromName("nomboxfile"));
			var button = prompts.confirmEx(window, "ImportExportTools NG", string, flags, "Button 0", continuelabel, "", null, {});
			if (button === 0)
				return false;
		} else {
			if (!confirm(mboximportbundle.GetStringFromName("isNotStandard")))
				return false;
		}
	}

	var filex = msgFolder2LocalFile(msgFolder);
	var clonex = filex.clone();
	var newfilename = filename;
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
	// This is a little strange code, but it can find the destintation folder as nsIFile
	// without calling nsIFile.initwithPath. This is done creating a new subfolder,
	// finding the parent of this temp new subfolder and deleting the subfolder itself.
	// The 0.5.3 version did this scanning all the files into the directory, to find the directory
	// called "msgfoldername.sbd". But this doesn't work, because there is a case when
	// this directory can miss: when you've deleted before all the subfolders from the GUI,
	// without restarting.
	// This is a dirty hack, I hope to find in the future something better...
	//
	// 1. add a subfolder with the name of the folder to import

	// let msgWindow = Cc["@mozilla.org/messenger/msgwindow;1"].createInstance(Ci.nsIMsgWindow);

	var tempfolder = msgFolder.addSubfolder(newfilename);
	// console.debug(tempfolder);
	// tempfolder = tempfolder.QueryInterface(Ci.nsIMsgLocalMailFolder);

	if (restoreChar) {
		var reg = new RegExp(safeChar, "g");
		tempfolder.name = newfilename.replace(reg, "#");
	}
	// 2. find the nsIFile of the directory where the file will be copied
	if (!msgFolder.isServer) {
		var tempfolderNS = msgFolder2LocalFile(tempfolder);
		filex = tempfolderNS.parent;
	}
	// 3. delete the new subfolder, to delete all the files inside "msgfoldername.sbd" directory
	// tempfolder.Delete();
	tempfolder.msgStore.deleteFolder(tempfolder);

	if (!filex) {
		alert(mboximportbundle.GetStringFromName("internalerror"));
		return false;
	}
	console.log("src mbox", tempfolder.filePath.leafName)
	try {
		// Finally copy the mbox file in the "msgfoldername.sbd" directory
		// file.copyTo(filex, newfilename);
		// cleidigh - have to use leafname for truncated internal names
		//let buffer = Uint8Array[10000*1024];
		await ioTest1();
		let destPath = PathUtils.join(filex.path, tempfolder.filePath.leafName);
		console.log("destPath : ", destPath)
		let d = await getData(file.path, destPath);
		console.log(d)
		IETwritestatus("Importing " + tempfolder.filePath.leafName + " Completed...")
		await new Promise(resolve => setTimeout(resolve, 2000));
		//file.copyTo(filex, tempfolder.filePath.leafName);
		
		

		// If this is an export with structure, we try also to export the directory mbox-filename.sbd
		if (keepstructure) {
			var sbd = file.parent;
			sbd.append(file.leafName + ".sbd");
			if (sbd.exists())
				sbd.copyTo(filex, newfilename + ".sbd");
		}
	} catch (e) {
		console.log(e)
		return false;
	}
	
	console.log("check rw")
	// inizialize as nsIFile the folder imported in TB and check if it's writable and readable.
	// if not (for ex. a file imported from a cdrom), change the permissions
	// filex.append(newfilename);
	filex.append(tempfolder.filePath.leafName);

	if (!filex.isReadable() || !filex.isWritable())
		filex.permissions = 420;
	// the following code of this subfunction has been written with the help of Frank Ausdilecce
	// really thanks for his help
	var newFolder = tempfolder;

	// At this location was a call to msgFolder.NotifyItemAdded inside a try catch wich was not doing
	// anything for ages. The correct call would be msgFolder.notifyFolderAdded(newFolder);
	// BUT I think this is too early as the folder is not actually created
	//msgFolder.notifyFolderAdded(newFolder);

	console.log("add empty ")
	var forceCompact = addEmptyMessageToForceCompact(newFolder);
	if (forceCompact && !gNeedCompact)
		gNeedCompact = true;

	var obj = {};
	obj.msgFolder = newFolder;
	obj.forceCompact = forceCompact;

	if (keepstructure) {
		gMsgFolderImported.push(obj);
		if (newFolder.hasSubFolders) {
			// I have no idea why so many setTimeout are in here, but each spins
			// out of the main thread and it is hard to keep track of the actual
			// execution flow. Let us return to sequential coding.
			await new Promise(resolve => setTimeout(resolve, 1000));
			storeImportedSubFolders(newFolder);
		}
	} else {
		gMsgFolderImported.push(obj);
	}

	console.log("frebuild")
	gFolderTreeView._rebuild();
	console.log("tc done")
	return newfilename;
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

	istream.init(file, 0x01, 0444, 0);
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
	foStream.init(file, 0x02 | 0x08 | 0x10, 0666, 0);
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
		IETwritestatus(mboximportbundle.GetStringFromName("endscan"));
}

async function updateImportedFolder(msgFolder, forceCompact) {
	try {
		msgFolder.updateSummaryTotals(true);
	} catch (e) {
		console.log(e)
	 }
	try {
		msgFolder.summaryChanged();
	} catch (e) {
		console.log(e)
	 }
	if (forceCompact)
		msgFolder.compact(null, msgWindow);
}

// scandir flag is to know if the function must scan a directory or just import mbox file(s)
async function importmbox(scandir, keepstructure, openProfDir, recursiveMode, msgFolder) {
	// initialize variables
	gMsgFolderImported = [];
	gNeedCompact = false;
	var buildMSF = IETprefs.getBoolPref("extensions.importexporttoolsng.import.build_mbox_index");
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
	var profDir;
	var filesArray;
	var mboxname;

	if (!scandir) {
		// open the filepicker
		fp.init(window, mboximportbundle.GetStringFromName("filePickerImport"), Ci.nsIFilePicker.modeOpenMultiple);
		fp.appendFilters(Ci.nsIFilePicker.filterAll);

		if (openProfDir) {
			profDir = Cc["@mozilla.org/file/directory_service;1"]
				.getService(Ci.nsIProperties)
				.get("ProfD", Ci.nsIFile);
			fp.displayDirectory = profDir.parent;
		}
		let res = await new Promise(resolve => {
			fp.open(resolve);
		});
		if (res !== Ci.nsIFilePicker.returnOK) {
			return;
		}

		// thefiles is the nsiSimpleEnumerator with the files selected from the filepicker
		var thefiles = fp.files;
		while (thefiles.hasMoreElements()) {
			var onefile = thefiles.getNext();
			onefile = onefile.QueryInterface(Ci.nsIFile);
			mboxname = onefile.leafName;
			IETwritestatus("Importing " + onefile.leafName)
			await trytocopy(onefile, mboxname, msgFolder, keepstructure);
			
			console.log("tcopy done ", new Date())
		}
	} else {
		// Open the filepicker to choose the directory
		fp.init(window, mboximportbundle.GetStringFromName("searchdir"), Ci.nsIFilePicker.modeGetFolder);

		if (openProfDir) {
			profDir = Cc["@mozilla.org/file/directory_service;1"]
				.getService(Ci.nsIProperties)
				.get("ProfD", Ci.nsIFile);
			fp.displayDirectory = profDir.parent;
		}
		let res = await new Promise(resolve => {
			fp.open(resolve);
		});
		if (res !== Ci.nsIFilePicker.returnOK) {
			return;
		}

		if (!recursiveMode) {
			// allfiles is the nsiSimpleEnumerator with the files in the directory selected from the filepicker
			var allfiles = fp.file.directoryEntries;
			filesArray = [];
			while (allfiles.hasMoreElements()) {
				var singlefile = allfiles.getNext();
				singlefile = singlefile.QueryInterface(Ci.nsIFile);
				filesArray.push(singlefile);
			}
		} else {
			filesArray = MBOXIMPORTscandir.find(fp.file);
		}

		var importThis;
		// scanning the directory to search files that could be mbox files
		for (var i = 0; i < filesArray.length; i++) {
			var afile = filesArray[i];
			mboxname = afile.leafName;
			var mboxpath = afile.path;
			if (isMbox(afile) === 1) {
				var ask = IETprefs.getBoolPref("extensions.importexporttoolsng.confirm.before_mbox_import");
				if (ask) {
					var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
						.getService(Ci.nsIPromptService);
					var checkObj = {};
					checkObj.value = false;
					var flags = prompts.BUTTON_TITLE_YES * prompts.BUTTON_POS_0 +
						prompts.BUTTON_TITLE_NO * prompts.BUTTON_POS_2 +
						prompts.BUTTON_TITLE_CANCEL * prompts.BUTTON_POS_1 +
						prompts.BUTTON_POS_0_DEFAULT;
					var string = mboximportbundle.GetStringFromName("confirmimport") + ' "' + mboxpath + '" ?';
					var button = prompts.confirmEx(window, "ImportExportTools NG", string, flags, "", "", "", mboximportbundle.GetStringFromName("noWaring"), checkObj);
					IETprefs.setBoolPref("extensions.importexporttoolsng.confirm.before_mbox_import", !checkObj.value);

					if (button === 0)
						importThis = true;
					else if (button === 2)
						importThis = false;
					else
						break;
				} else {
					importThis = true;
				}
				if (importThis && afile.isFile()) {
					IETwritestatus("Importing " + afile.leafName)
					await trytocopy(afile, mboxname, msgFolder);
					
					console.log("tcopy done ", new Date())
				}
			}
		}
		console.log("end else")
	}
	console.log("before buildmsf")
	if (buildMSF || gNeedCompact) {
		console.log("buildmsf")
		// I have no idea why so many setTimeout are in here, but each spins out
		// of the main thread and it is hard to keep track of the actual execution
		// flow. Let us return to sequential coding.
		let timeout = keepstructure ? 2000 : 1000;
		await new Promise(resolve => setTimeout(resolve, timeout));
		await buildMSGfile();
	}
}

function exportfolder(subfolder, keepstructure, locale, zip) {

	var folders = GetSelectedMsgFolders();
	for (var i = 0; i < folders.length; i++) {
		var isVirtualFolder = folders[i] ? folders[i].flags & 0x0020 : false;
		if ((i > 0 && folders[i].server.type !== lastType) || (folders.length > 1 && isVirtualFolder)) {
			alert(mboximportbundle.GetStringFromName("noFolderExport"));
			return;
		}
		var lastType = folders[i].server.type;
	}
	if (locale && (lastType === "imap" || lastType === "nntp")) {
		var go = IETremoteWarning();
		if (!go)
			return;
	}
	var destdirNSIFILE = getPredefinedFolder(0);
	if (!destdirNSIFILE) {
		destdirNSIFILE = IETgetPickerModeFolder();
		if (!destdirNSIFILE)
			return;
	}

	if (zip) {
		if (!String.prototype.trim)
			alert(mboximportbundle.GetStringFromName("needTB3"));
		else
			IETexportZip(destdirNSIFILE, folders);
		return;
	}

	if (locale) {
		for (let i = 0; i < folders.length; i++)
			exportSingleLocaleFolder(folders[i], subfolder, keepstructure, destdirNSIFILE);
	} else if (folders.length === 1 && isVirtualFolder) {
		exportVirtualFolder(msgFolder); //msgFolder?
	} else {
		exportRemoteFolders(destdirNSIFILE);
	}
}

function IETexportZip(destdirNSIFILE, folders) {
	for (var i = 0; i < folders.length; i++) {
		var zipFile = destdirNSIFILE.clone();
		var file = msgFolder2LocalFile(folders[i]);
		if (file.exists()) {
			var path = file.leafName;
			// see https://bugzilla.mozilla.org/show_bug.cgi?id=445065
			// and http://ant.apache.org/manual/Tasks/zip.html#encoding
			path = path.replace(/[^a-zA-Z0-9\-]/g, "_");
			var zipName = folders[i].name;
			zipFile.append(zipName + ".zip");
			var zipWriter = Components.Constructor("@mozilla.org/zipwriter;1", "nsIZipWriter");
			var zipW = new zipWriter();
			zipW.open(zipFile, 0x04 | 0x08 | 0x20);
			if (file.isDirectory())
				IETaddFolderContentsToZip(zipW, file, "");
			else
				zipW.addEntryFile(path, Ci.nsIZipWriter.COMPRESSION_DEFAULT, file, false);
			zipW.close();
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

function exportRemoteFolders(destdirNSIFILE) {
	let IETglobalMsgFolders = GetSelectedMsgFolders();
	if (IETglobalMsgFolders[0].isServer)
		return;
	// cleidigh ?
	IETglobalMsgFoldersExported = 0;
	exportIMAPfolder(IETglobalMsgFolders[0], destdirNSIFILE);
}

// The subfolder argument is true if we have to export also the subfolders
function exportSingleLocaleFolder(msgFolder, subfolder, keepstructure, destdirNSIFILE) {
	var filex = msgFolder2LocalFile(msgFolder);
	// thefoldername=the folder name displayed in TB (for ex. "Modelli")
	var thefoldername = IETcleanName(msgFolder.name);
	var newname;

	// Check if we're exporting a simple mail folder, a folder with its subfolders or all the folders of the account
	if (msgFolder.isServer) {
		exportSubFolders(msgFolder, destdirNSIFILE, keepstructure);
		IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	} else if (subfolder && !keepstructure) {
		// export the folder with the subfolders
		// first we copy the folder, finding a good name from its displayed name
		newname = findGoodFolderName(thefoldername, destdirNSIFILE, false);
		if (filex.exists())
			filex.copyTo(destdirNSIFILE, newname);
		// then we export the subfolders
		exportSubFolders(msgFolder, destdirNSIFILE, keepstructure);
		IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	} else if (subfolder && msgFolder.hasSubFolders && keepstructure) {
		newname = findGoodFolderName(thefoldername, destdirNSIFILE, true);
		console.log(newname)
		if (filex.exists()) {
			filex.copyTo(destdirNSIFILE, newname);
		} else {
			// This fixes #320 
			// imap profile folders do not have empty 
			// mbox files. We create one if we encounter
			// an msf file, but no mbox file.
			// This must have changed...
			var topdestdirNSI = destdirNSIFILE.clone();
			topdestdirNSI.append(newname);
			topdestdirNSI.create(0, 0644);
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
							nsifile.create(0, 0644);
						}
					} catch (e) { }
				}
			}
		}
		IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	} else {
		// export just the folder
		newname = findGoodFolderName(thefoldername, destdirNSIFILE, false);
		if (filex.exists())
			filex.copyTo(destdirNSIFILE, newname);
		IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	}
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
		for (let subfolder of msgFolder.subFolders) {
			// Search for a good name
			let newname = findGoodFolderName(subfolder.name, destdirNSIFILE, false);
			let subfolderNS = msgFolder2LocalFile(subfolder);
			if (subfolderNS.exists())
				subfolderNS.copyTo(destdirNSIFILE, newname);
			else {
				newname = IETcleanName(newname);
				let destdirNSIFILEclone = destdirNSIFILE.clone();
				destdirNSIFILEclone.append(newname);
				destdirNSIFILEclone.create(0, 0644);
			}
			if (keepstructure) {
				let sbd = subfolderNS.parent;
				sbd.append(subfolderNS.leafName + ".sbd");
				if (sbd.exists() && sbd.directoryEntries.length > 0) {
					sbd.copyTo(destdirNSIFILE, newname + ".sbd");
					let destdirNsFile = destdirNSIFILE.clone();
					destdirNsFile.append(newname + ".sbd");
					let listMSF = MBOXIMPORTscandir.find(destdirNsFile);
					for (i = 0; i < listMSF.length; ++i) {
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

async function importALLasEML(recursive) {
	console.debug('Start eml import');

	let msgFolder = GetSelectedMsgFolders()[0];
	if (!msgFolder || !msgFolder.parent) {
		alert(mboximportbundle.GetStringFromName("noFolderSelected"));
		return;
	}

	// Open the filepicker to choose the directory
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("searchdir"), Ci.nsIFilePicker.modeGetFolder);
	let res = await new Promise(resolve => {
		fp.open(resolve);
	});
	if (res !== Ci.nsIFilePicker.returnOK) {
		return;
	}

	gEMLimported = 0;
	gEMLimportedErrs = 0;
	gImporting = true;
	IETwritestatus(mboximportbundle.GetStringFromName("importEMLstart"));
	if (document.getElementById("IETabortIcon")) {
		document.getElementById("IETabortIcon").collapsed = false;
	}

	// I have no idea why so many setTimeout are in here, but each spins out of the main thread and
	// it is hard to keep track of the actual execution flow. Let us return to sequential coding
	// using async/await.
	await new Promise(resolve => window.setTimeout(resolve, 1000));
	await RUNimportALLasEML(msgFolder, fp.file, recursive);
}

async function RUNimportALLasEML(msgFolder, file, recursive) {
	gFileEMLarray = [];
	gFileEMLarrayIndex = 0;
	folderCount = 1;

	if (!msgFolder) {
		alert(mboximportbundle.GetStringFromName("noFolderSelected"));
		return;
	}

	let rootFolder = msgFolder;

	await buildEMLarray(file, msgFolder, recursive, rootFolder);
	gEMLtotal = gFileEMLarray.length;
	if (gEMLtotal < 1) {
		IETwritestatus(mboximportbundle.GetStringFromName("numEML") + " 0" + "/" + gEMLtotal);
		document.getElementById("IETabortIcon").collapsed = true;
		return;
	}

	// cleidigh - start by closing all files
	rootFolder.ForceDBClosed();
	trytoimportEML(gFileEMLarray[0].file, gFileEMLarray[0].msgFolder, false, null, true);
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
			let newFolder = await new Promise(resolve => {
				let folderListener = {
					folderAdded: function (aFolder) {
						if (aFolder.name == folderName && aFolder.parent == msgFolder) {
							MailServices.mfn.removeListener(folderListener);
							resolve(aFolder);
						}
					}
				};
				MailServices.mfn.addListener(folderListener, MailServices.mfn.folderAdded);
				msgFolder.createSubfolder(folderName, msgWindow);
				// open files bug
				// https://github.com/thundernest/import-export-tools-ng/issues/57
				if (folderCount++ % 400 === 0) {
					rootFolder.ForceDBClosed();
					console.debug('ForceDBClosed');
				}
			})
			await buildEMLarray(afile, newFolder, true, rootFolder);
		} else {
			var emlObj = {};
			var afilename = afile.leafName;
			afilename = afilename.toLowerCase();
			var afilenameext = afilename.substring(afilename.lastIndexOf("."), afilename.length);
			// fix #241 - also import .emlx
			if (!afile.isFile() || (afilenameext !== ".eml" && afilenameext !== ".emlx" && afilenameext !== ".nws"))
				continue;
			emlObj.file = afile;
			emlObj.msgFolder = msgFolder;
			gFileEMLarray[gFileEMLarrayIndex] = emlObj;
			gFileEMLarrayIndex++;
			// console.debug('message ' + gFileEMLarrayIndex);
		}
	}

	return true;
}

async function importEMLs() {
	let msgFolder = GetSelectedMsgFolders()[0];
	// No import for imap and news account, sorry...
	if ((!String.prototype.trim && msgFolder.server.type === "imap") || msgFolder.server.type === "nntp") {
		alert(mboximportbundle.GetStringFromName("badfolder"));
		return;
	}

	// Set the filepicker to open the last opened directory
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("filePickerImportMSG"), Ci.nsIFilePicker.modeOpenMultiple);
	fp.appendFilter(mboximportbundle.GetStringFromName("emailFiles"), "*.eml; *.emlx; *.nws");
	fp.appendFilter("All files", "*.*");
	let res = await new Promise(resolve => {
		fp.open(resolve);
	});
	if (res !== Ci.nsIFilePicker.returnOK) {
		return;
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
	IETwritestatus(mboximportbundle.GetStringFromName("importEMLstart"));
	trytoimportEML(fileArray[0], msgFolder, false, fileArray, false);
}

var importEMLlistener = {

	OnStartCopy: function () { },

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

	next: function () {
		var nextFile;

		if (this.allEML && gEMLimported < gFileEMLarray.length) {
			nextFile = gFileEMLarray[gEMLimported].file;
			trytoimportEML(nextFile, gFileEMLarray[gEMLimported].msgFolder, this.removeFile, this.fileArray, this.allEML);
		} else if (this.fileArray && gEMLimported < this.fileArray.length) {
			nextFile = this.fileArray[gEMLimported];
			trytoimportEML(nextFile, this.msgFolder, this.removeFile, this.fileArray, false);
		} else {
			// At the end we update the fodler view and summary
			this.msgFolder.updateFolder(msgWindow);
			this.msgFolder.updateSummaryTotals(true);
			document.getElementById("IETabortIcon").collapsed = true;
			gImporting = false;
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
		MailServices.copy.copyFileMessage(file, msgFolder, null, false, 1, "", importEMLlistener, msgWindow);
		if (!removeFile) {
			gEMLimported = gEMLimported + 1;
			let errs = "";
			if (gEMLimportedErrs) {
				errs = `(Errs: ${gEMLimportedErrs})`;
			}
			IETwritestatus(mboximportbundle.GetStringFromName("numEML") + gEMLimported + errs + "/" + gEMLtotal);
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
		console.debug(`Msg #: ${++gEMLimported} Err #: ${++gEMLimportedErrs}\n Folder: ${msgFolder.name}\n Filename: ${file.path}\n FirstLine ${lines[0]}\n`);
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

	// Prologue needed to add the message to the folder
	var prologue = "From - " + nowString + "\n"; // The first line must begin with "From -", the following is not important
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
		var myAccount = myAccountManager.FindAccountForServer(msgFolder.server);
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
	IETwritestatus(mboximportbundle.GetStringFromName("numEML") + gEMLimported + errs + "/" + gEMLtotal);

	if (removeFile)
		file.remove(false);
	return 0;
}

function importEmlToFolder() {
	// To import an eml attachment in folder, as a real message, it's necessary to save it
	// in a temporary file in temp directory
	var restoreDownloadWindowPref = false;
	let msgFolder = GetSelectedMsgFolders()[0];
	// 0x0020 is MSG_FOLDER_FLAG_VIRTUAL
	var isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
	if (!String.prototype.trim && ((msgFolder.server.type !== "pop3" && msgFolder.server.type !== "none") || isVirtFol)) {
		alert(mboximportbundle.GetStringFromName("badfolder2"));
		return;
	}
	var item = document.getElementById("attachmentList").selectedItem;
	var attachment = item.attachment;
	var tempdir = Cc["@mozilla.org/file/directory_service;1"]
		.getService(Ci.nsIProperties)
		.get("TmpD", Ci.nsIFile);

	// Hide download window, if necessary (TB2 only)
	try {
		var downloadWindowPref = IETprefs.getBoolPref("browser.download.manager.useWindow");
		if (downloadWindowPref) {
			IETprefs.setBoolPref("browser.download.manager.useWindow", false);
			restoreDownloadWindowPref = true;
		}
	} catch (e) { }

	IETtempfilesize = -1;
	IETcount = 0;
	try {
		var uri = attachment.uri ? attachment.uri : attachment.messageUri;
		var tempfile = messenger.saveAttachmentToFolder(attachment.contentType, attachment.url, encodeURIComponent(attachment.displayName), uri, tempdir);
		window.setTimeout(checkToImportEMLattach, 1000, tempfile, msgFolder);
	} catch (e) {
		alert(mboximportbundle.GetStringFromName("temp_error"));
	}
	if (restoreDownloadWindowPref)
		window.setTimeout(function () { IETprefs.setBoolPref("browser.download.manager.useWindow", true); }, 500);
}

function checkToImportEMLattach(file, msgFolder) {
	// To see if the download is finished, the extension checks the filesize
	// every second, for 20 times (20 sec. are enough for every attachment)
	if (!file.exists())
		return;
	if (file.fileSize !== IETtempfilesize) {
		IETtempfilesize = file.fileSize;
		if (IETcount < 20) {
			IETcount++;
			window.setTimeout(checkToImportEMLattach, 1000, file, msgFolder);
		} else {
			file.remove(false);
		}
		return;
	}
	// The download is finished, call the eml import function, with the "delete-file" option
	trytoimportEML(file, msgFolder, true, null, false);
}

function openIEToptions() {
	window.openDialog("chrome://mboximport/content/mboximport/mboximportOptions.xhtml", "", "chrome,modal,centerscreen");
}

function IETcopyFolderPath() {
	let msgFolder = GetSelectedMsgFolders()[0];
	var file = msgFolder2LocalFile(msgFolder);
	IETcopyStrToClip(file.path);
}

function IETopenFolderPath() {
	let msgFolder = GetSelectedMsgFolders()[0];
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
}


function openIEThelp(localize) {
	// loadTabPage('chrome://mboximport/content/importexport-help.html#main_help', true);
	loadTabPage('importexport-help.html#main_help', true);
}

// window.addEventListener("load", this.init, false);
// window.addEventListener("unload", this.shutdown, false);
