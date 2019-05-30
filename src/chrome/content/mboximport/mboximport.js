//  Code rewritten from 0.5.3 version, to avoid the call to initwithpath (TB 1.5 only)
var MBstrBundleService = Components.classes["@mozilla.org/intl/stringbundle;1"]
	.getService(Components.interfaces.nsIStringBundleService);
var mboximportbundle = MBstrBundleService.createBundle("chrome://mboximport/locale/mboximport.properties"); 
var mboximportbundle2 = MBstrBundleService.createBundle("chrome://messenger/locale/mime.properties"); 
var gEMLimported;
var gEMLtotal;
var gFileEMLarray;
var gFileEMLarrayIndex;
var IETtempfilesize;
var IETcount;
var gNeedCompact;
var gMsgFolderImported;

var IETprintPDFmain = {

	print : function(allMessages) {
		if (navigator.platform.toLowerCase().indexOf("mac") > -1 || navigator.userAgent.indexOf("Postbox") > -1 ) {
			alert(mboximportbundle.GetStringFromName("noPDFmac"));
			return;
		}
		 try {
			var printSvc = Components.classes["@mozilla.org/gfx/printsettings-service;1"].getService(Components.interfaces.nsIPrintSettingsService);
			if (printSvc.defaultPrinterName == "") {
				alert(mboximportbundle.GetStringFromName("noPDFnoPrinter"));
				return;
			}
		} 
		catch(e) {}

		var msgFolders = GetSelectedMsgFolders();
		if (msgFolders.length > 1) {
			alert(mboximportbundle.GetStringFromName("noPDFmultipleFolders"));
			return;
		}		
		var question = IETformatWarning(1);
		if (! question) 
			return;
		question = IETformatWarning(0);
		if (! question) 
			return;
		if (! allMessages)
			IETprintPDFmain.uris =  IETgetSelectedMessages();
		else {
			IETprintPDFmain.uris = [];
			msgFolder = msgFolders[0];
			var isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
			if (isVirtFol) {
				var total = msgFolder.getTotalMessages(false);
				for (var i=0;i<total;i++) 
					IETprintPDFmain.uris.push(gDBView.getURIForViewIndex(i))
			}
			else {
				if (msgFolder.getMessages)
					// Gecko 1.8 and earlier
					var msgs = msgFolder.getMessages(null);
				else
					// Gecko 1.9
					var msgs = msgFolder.messages;
				while(msgs.hasMoreElements()) {
					var msg = msgs.getNext();
					msg = msg.QueryInterface(Components.interfaces.nsIMsgDBHdr);
					var uri = msgFolder.getUriForMsg(msg);
					IETprintPDFmain.uris.push(uri);
				}
			}
		}
		if (! IETprintPDFmain.uris)
			return;
		IETprintPDFmain.paramObj = {};
		IETprintPDFmain.total = IETprintPDFmain.uris.length;
		IETprintPDFmain.totalReal = IETprintPDFmain.total;
		var dir = getPredefinedFolder(2);
		if (! dir) {
			var nsIFilePicker = Components.interfaces.nsIFilePicker;
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);
			if (fp.show) 
				var res = fp.show();	
			else
				var res = IETopenFPsync(fp);
			if (res==nsIFilePicker.returnOK) 
				dir = fp.file;
			else
				return;
		}
		IETprintPDFmain.file = dir;
		try {
			if (IETprefs.getPrefType("print.always_print_silent") == 0 || ! IETprefs.getBoolPref("print.always_print_silent")) {
				IETprefs.setBoolPref("print.always_print_silent", true);
				IETprefs.setBoolPref("extensions.importexporttools.printPDF.restore_print_silent", true);
			}
		}
		catch(e) {}
		IETabort = false;
		IETprintPDFmain.print2();
	},

	print2 : function() {
		var uri = IETprintPDFmain.uris.pop();
		IETprintPDFmain.total  = IETprintPDFmain.total  - 1;
		var messageService = messenger.messageServiceFromURI(uri);
		var aMsgHdr = messageService.messageURIToMsgHdr(uri);
		var pdfName = getSubjectForHdr(aMsgHdr, IETprintPDFmain.file.path);
		var fileClone = IETprintPDFmain.file.clone();
		if (IETprefs.getIntPref("extensions.importexporttools.printPDF.fileFormat") == 2)
			fileClone.append(pdfName+".pdf");
		else
			fileClone.append(pdfName+".ps");
		fileClone.createUnique(0,0644);
		IETprintPDFmain.filePath = fileClone.path;
		IETprefs.setBoolPref("extensions.importexporttools.printPDF.start", true);
		var messageList = [uri];
		IETwritestatus(mboximportbundle.GetStringFromName("exported")+": "+(IETprintPDFmain.totalReal-IETprintPDFmain.total)+"/"+IETprintPDFmain.totalReal); 
		document.getElementById("IETabortIcon").collapsed = false;
		if (! IETabort)
			window.openDialog("chrome://messenger/content/msgPrintEngine.xul", "",
        	        "chrome,dialog=no,all,centerscreen",
        	         messageList.length, messageList, null,
        	         false);
		else 
			document.getElementById("IETabortIcon").collapsed = true;
	},

	printDelayed : function() {
		IETprefs.setBoolPref("print.always_print_silent", true);
		setTimeout(function() {IETprintPDFmain.print2();}, 1000)
	}
};

function openProfileImportWizard() {
	var quit = {};
	window.openDialog("chrome://mboximport/content/profileImportWizard.xul","", "chrome,modal,centerscreen", quit);
	var appStartup = Components.classes["@mozilla.org/toolkit/app-startup;1"]
	                .getService(Components.interfaces.nsIAppStartup);
	if (quit.value) 
		setTimeout(function() {
			appStartup.quit(Components.interfaces.nsIAppStartup.eAttemptQuit);	
		}, 1000);
}

function openMboxDialog() {
	if (IETstoreFormat() != 0) {
		alert(mboximportbundle.GetStringFromName("noMboxStorage"));
		return;
	}
	var msgFolder = GetSelectedMsgFolders()[0];
	// we don't import the file in imap or nntp accounts
	if ( (msgFolder.server.type == "imap" ) || (msgFolder.server.type == "nntp" ) ) {
		alert(mboximportbundle.GetStringFromName("badfolder"));
		return;
	}
	var params = {scandir:false, keepstructure:false, openProfDir:false, recursiveMode:false};
	window.openDialog("chrome://mboximport/content/mboxdialog.xul","", "chrome,modal,centerscreen",params);
	setTimeout(importmbox, 800, params.scandir, params.keepstructure, params.openProfDir, params.recursiveMode, msgFolder);
}


function msgFolder2LocalFile(msgFolder) {
	if (msgFolder.filePath) 
		 var LocalFile= msgFolder.filePath;
	return LocalFile;
}

function IETupdateFolder(folder) {
	var msgDB = folder.msgDatabase;
	msgDB.summaryValid = false;
	folder.ForceDBClosed();
	folder.updateFolder(msgWindow);
}

function trytocopyMAILDIR() {
	if (IETstoreFormat() != 1) {
		alert(mboximportbundle.GetStringFromName("noMaildirStorage"));
		return;
	}

	// initialize variables
	var msgFolder = GetSelectedMsgFolders()[0];
	var buildMSF = IETprefs.getBoolPref("extensions.importexporttools.import.build_mbox_index");
	// var openProfDir = XXXX

	// we don't import the file in imap or nntp accounts
	if ( (msgFolder.server.type == "imap" ) || (msgFolder.server.type == "nntp" ) ) {
		alert(mboximportbundle.GetStringFromName("badfolder"));
		return;
	}

	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("filePickerImport"), nsIFilePicker.modeGetFolder);
	fp.appendFilters(nsIFilePicker.filterAll);
	if (fp.show) 
		var res = fp.show();	
	else
		var res = IETopenFPsync(fp);
	var destFile = fp.file;
	var filename=destFile.leafName;
	var newfilename = filename;

	var folderFile = msgFolder2LocalFile(msgFolder);
	var clonex = folderFile.clone();
	var restoreChar = false;
	if (newfilename.match(/#/)) {
		var safeChar = Math.floor(Math.random()*99999).toString();
		newfilename = newfilename.replace(/#/g, safeChar);
		restoreChar = true;
	}
	clonex.append(newfilename);
	// add to the original filename a random number in range 0-999
	if (IETprefs.getBoolPref("extensions.importexporttools.import.name_add_number"))
		newfilename = newfilename+Math.floor(Math.random()*999); 
	var k = 0;
	// if exists a subfolder with this name, we change the random number, with max. 500 tests
	// while (msgFolder.containsChildNamed(newfilename)) {
	while (msgFolder.containsChildNamed(newfilename) || clonex.exists()) {
		newfilename = filename+Math.floor(Math.random()*999);
		k++;
		if (k >500) {
			alert("Can't find a good name");
			return false;
		}
		clonex = clonex.parent;
		clonex.append(newfilename);
	}

	// 1. add a subfolder with the name of the folder to import 
	var newFolder = msgFolder.addSubfolder(newfilename);
	if (restoreChar) {
		var reg = new RegExp(safeChar,"g");
		newFolder.name = newfilename.replace(reg, "#");
	}

	// 2. find the MAILDIR directory created above
	var filex = msgFolder2LocalFile(newFolder);
	try {
		var destFileClone = destFile.clone();
		destFileClone.append("cur");
		if (! destFileClone.exists() || ! destFileClone.isDirectory()) {
			alert(mboximportbundle.GetStringFromName("isNotMaildir"));
			return;
		}
		destFileClone = destFileClone.parent;
		destFileClone.append("tmp");
		if (! destFileClone.exists() || ! destFileClone.isDirectory()) {
			alert(mboximportbundle.GetStringFromName("isNotMaildir"));
			return;
		}
		var allfiles = destFile.directoryEntries;
		// copy all the files inside the MAILDIR directory to import in MAILDIR directory created above
		while(allfiles.hasMoreElements()) {
			var singlefile= allfiles.getNext();
			singlefile = singlefile.QueryInterface(Components.interfaces.nsIFile);
			singlefile.copyTo(filex,null);
		}
	}
	catch(e) {
		return false;
	} 

	// 3. update the database by selecting the folder and rebuilding the index
	try {
		msgFolder.NotifyItemAdded(newFolder); 
		SelectFolder(newFolder.URI);
		IETupdateFolder(newFolder);
	}
	catch(e) {}	
}

// The arguments of trytocopy are
// file = the file to import as nsIFile
// filename = the name of the file to import
// msgFolder = the folder as nsImsgFolder

function trytocopy(file,filename,msgFolder,keepstructure) {
	// If the file isn't mbox format, alert, but doesn't exit (it did in pre 0.5.8 version and lower)
	// In fact sometimes TB can import also corrupted mbox files
	var isMbx = isMbox(file);
	if (isMbx != 1) {
		if (isMbx == 0) {	
			var continuebundle = MBstrBundleService.createBundle("chrome://messenger/locale/filter.properties");
			// We take the "Continue" label from another file...
			var continuelabel = continuebundle.GetStringFromName("continueButtonLabel");
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
			var flags = prompts. BUTTON_TITLE_CANCEL     * prompts.BUTTON_POS_0 +
		            prompts.BUTTON_TITLE_IS_STRING   *prompts.BUTTON_POS_1   + prompts.BUTTON_POS_0_DEFAULT;
			var string = ("\"" + filename + "\" " + mboximportbundle.GetStringFromName("nomboxfile"));
 			var button = prompts.confirmEx(window, "ImportExportTools", string , flags,  "Button 0", continuelabel, "", null, {});
			if (button==0)
				return false;
		}
		else {
			if (! confirm(mboximportbundle.GetStringFromName("isNotStandard")))
				return false;
		}
	}

	var filex = msgFolder2LocalFile(msgFolder);
	var clonex = filex.clone();
	var newfilename = filename;
	var restoreChar = false;
	if (newfilename.match(/#/)) {
		var safeChar = Math.floor(Math.random()*99999).toString();
		newfilename = newfilename.replace(/#/g, safeChar);
		restoreChar = true;
	}
	clonex.append(newfilename);

	// add to the original filename a random number in range 0-999
	if (IETprefs.getBoolPref("extensions.importexporttools.import.name_add_number"))
		newfilename = newfilename+Math.floor(Math.random()*999); 
	var k = 0;
	// if exists a subfolder with this name, we change the random number, with max. 500 tests
	// while (msgFolder.containsChildNamed(newfilename)) {
	while (msgFolder.containsChildNamed(newfilename) || clonex.exists()) {
		newfilename = filename+Math.floor(Math.random()*999);
		k++;
		if (k >500) {
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
	var tempfolder = msgFolder.addSubfolder(newfilename);
	if (restoreChar) {
		var reg = new RegExp(safeChar,"g");
		tempfolder.name = newfilename.replace(reg, "#");
	}
	// 2. find the nsIFile of the directory where the file will be copied
	if (! msgFolder.isServer) {
		var tempfolderNS = msgFolder2LocalFile(tempfolder);
		filex = tempfolderNS.parent;
	}
	// 3. delete the new subfolder, to delete all the files inside "msgfoldername.sbd" directory
	tempfolder.Delete();
	if (! filex) {
		alert(mboximportbundle.GetStringFromName("internalerror"));
		return false;
	}
	try {
		// Finally copy the mbox file in the "msgfoldername.sbd" directory
		file.copyTo(filex,newfilename);
		// If this is an export with structure, we try also to export the directory mbox-filename.sbd
		if (keepstructure) {
			var sbd = file.parent;
			sbd.append(file.leafName+".sbd");
			if (sbd.exists()) 
				sbd.copyTo(filex,newfilename+".sbd");
		}
	}
	catch(e) {
		return false;
	} 
	// inizialize as nsIFile the folder imported in TB and check if it's writable and readable.
	// if not (for ex. a file imported from a cdrom), change the permissions
	filex.append(newfilename)
	if (! filex.isReadable() || ! filex.isWritable() )
		filex.permissions = 420;
	// the following code of this subfunction has been written with the help of Frank Ausdilecce
	// really thanks for his help
	var newFolder = tempfolder;
	// this notifies listeners that a folder has been added;
	// the code is different for TB-1.0 and TB > 1.0 because the syntax of 
	// NotifyItemAdded seems to have been modified
	try {
	 	msgFolder.NotifyItemAdded(msgFolder,newFolder,"Folder Added"); // This is for TB1.0
	}
	catch(e) {}
	try {
		msgFolder.NotifyItemAdded(newFolder); // This is for TB > 1.0
	}
	catch(e) {}

	var forceCompact = addEmptyMessageToForceCompact(newFolder);
	if (forceCompact && ! gNeedCompact)
		gNeedCompact = true;
	var obj = new Object;
	obj.msgFolder = newFolder;
	obj.forceCompact = forceCompact;
	
	if (keepstructure) {
		gMsgFolderImported.push(obj);
		if (newFolder.hasSubFolders)
			setTimeout(storeImportedSubFolders,1000,newFolder);
	}		
	else
		gMsgFolderImported.push(obj);

	return newfilename;
}

function storeImportedSubFolders(msgFolder) {
	if (msgFolder.GetSubFolders) {
		var subfolders = msgFolder.GetSubFolders();
		while(true) {
			var next = subfolders.currentItem();
			var subfolder = next.QueryInterface(Components.interfaces.nsIMsgFolder);
			var obj = new Object;
			obj.msgFolder = subfolder;
			obj.forceCompact = false;
			gMsgFolderImported.push(obj);
			// If the subfolder has subfodlers, the function calls itself
			if (subfolder.hasSubFolders)
				 storeImportedSubFolders(subfolder);
			try { subfolders.next(); } 
			catch(ex) { break; }
		}
	}
	// Gecko 1.9
	else {
		var subfolders = msgFolder.subFolders;
		while(subfolders.hasMoreElements()) {
			var next = subfolders.getNext();
			var subfolder = next.QueryInterface(Components.interfaces.nsIMsgFolder);
			var obj = new Object;
			obj.msgFolder = subfolder;
			obj.forceCompact = false;
			gMsgFolderImported.push(obj);
			// If the subfolder has subfodlers, the function calls itself
			if (subfolder.hasSubFolders)
				 storeImportedSubFolders(subfolder);	
		}
	}
}

function addEmptyMessageToForceCompact(msgFolder) {
	var file = msgFolder2LocalFile(msgFolder);
	var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
	                .createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);
	var line = {};
	var first3lines = "";
	for (var i=0;i<4;i++) {
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

	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].  
                          createInstance(Components.interfaces.nsIFileOutputStream);  
   	var data = "\n\nFrom Moon\nX-Mozilla-Status: 0009\nX-Mozilla-Status2: 00800000\nDate: Fri, 08 Feb 2008 10:30:48 +0100\nFrom: nomail@nomail.no\nMIME-Version: 1.0\nTo: nomail@nomail.no\nSubject: empty\nContent-Type: text/plain\n\n\n\n";
	foStream.init(file, 0x02 | 0x08 | 0x10, 0666, 0);   
	foStream.write(data,data.length);
	foStream.close();
	return true;
}

// these lines *should* create the msf file
function buildMSGfile(scan) {
	for (var i=0;i< gMsgFolderImported.length;i++) {
		try {
			var folder = gMsgFolderImported[i].msgFolder;
			IETupdateFolder(folder);
		}
		catch(e) {}
		setTimeout(updateImportedFolder, 2000, folder, gMsgFolderImported[i].forceCompact);
	}
	gMsgFolderImported = [];
	if (scan)
		IETwritestatus(mboximportbundle.GetStringFromName("endscan"));
}

function updateImportedFolder(msgFolder,forceCompact) {
	try {
		msgFolder.updateSummaryTotals(true);
	}
	catch(e) {}
	try {
		msgFolder.summaryChanged();
	}
	catch(e) {}
	if (forceCompact)
		msgFolder.compact(null,msgWindow);
}

// scandir flag is to know if the function must scan a directory or just import mbox file(s)
function importmbox(scandir,keepstructure,openProfDir, recursiveMode,msgFolder) {
	// initialize variables
	gMsgFolderImported = [];
	gNeedCompact = false;
	var buildMSF = IETprefs.getBoolPref("extensions.importexporttools.import.build_mbox_index");
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	if (! scandir) {
		// open the filepicker	
		fp.init(window, mboximportbundle.GetStringFromName("filePickerImport"), nsIFilePicker.modeOpenMultiple);
		fp.appendFilters(nsIFilePicker.filterAll);
	
		if (openProfDir) {
			var profDir = Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties)
				.get("ProfD", Components.interfaces.nsIFile);
			fp.displayDirectory = profDir.parent;
		}

		if (fp.show) 
			var res = fp.show();	
		else
			var res = IETopenFPsync(fp);
		if (res==nsIFilePicker.returnOK){
			// thefiles is the nsiSimpleEnumerator with the files selected from the filepicker
			var thefiles=fp.files;
			while(thefiles.hasMoreElements()) {
				var onefile= thefiles.getNext();
				onefile = onefile.QueryInterface(Components.interfaces.nsIFile);
				var mboxname=onefile.leafName;
				trytocopy(onefile,mboxname,msgFolder,keepstructure);
			}
			if (buildMSF || gNeedCompact) {
			 	var timout = keepstructure ? 2000 : 1000;
			 	setTimeout(buildMSGfile, timout, false);
			}
		}
		else 
			return;
	}
	else {
		// Open the filepicker to choose the directory
		fp.init(window, mboximportbundle.GetStringFromName("searchdir"), nsIFilePicker.modeGetFolder);

		if (openProfDir) {
			var profDir = Components.classes["@mozilla.org/file/directory_service;1"]
				.getService(Components.interfaces.nsIProperties)
				.get("ProfD", Components.interfaces.nsIFile);
			fp.displayDirectory = profDir.parent;
		}

		if (fp.show) 
			var res = fp.show();	
		else
			var res = IETopenFPsync(fp);
		if (res==nsIFilePicker.returnOK){
			if (! recursiveMode) {
				// allfiles is the nsiSimpleEnumerator with the files in the directory selected from the filepicker
				var allfiles = fp.file.directoryEntries;
				var filesArray = new Array;
				while(allfiles.hasMoreElements()) {
					var singlefile= allfiles.getNext();
					singlefile = singlefile.QueryInterface(Components.interfaces.nsIFile);
					filesArray.push(singlefile);
				}
			}
			else 
				var filesArray = MBOXIMPORTscandir.find(fp.file);

			// scanning the directory to search files that could be mbox files
			for (i=0; i<filesArray.length;i++) {
				var afile = filesArray[i];
				var mboxname=afile.leafName;
				var mboxpath = afile.path;
				if ( isMbox(afile) == 1) {
					var ask = IETprefs.getBoolPref("extensions.importexporttools.confirm.before_mbox_import");
					if (ask) {
						var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
							.getService(Components.interfaces.nsIPromptService);
						var checkObj = new Object;
						checkObj.value = false;
						var flags = prompts.BUTTON_TITLE_YES * prompts.BUTTON_POS_0 +
						prompts.BUTTON_TITLE_NO*prompts.BUTTON_POS_2 + 
						prompts.BUTTON_TITLE_CANCEL*prompts.BUTTON_POS_1 + 
						prompts.BUTTON_POS_0_DEFAULT;
						var string = mboximportbundle.GetStringFromName("confirmimport")+ ' "'+  mboxpath + '" ?';
						var button = prompts.confirmEx(window, "ImportExportTools", string , flags,  "","","", mboximportbundle.GetStringFromName("noWaring"), checkObj);
						IETprefs.setBoolPref("extensions.importexporttools.confirm.before_mbox_import", ! checkObj.value);
						if (button == 0)
							var importThis = true;
						else if (button == 2)
							var importThis = false;
						else
							break;
					}
					else
						var importThis = true;
					if (importThis && afile.isFile())
						trytocopy(afile,mboxname,msgFolder);
				}
			}
			if (buildMSF || gNeedCompact) 
				setTimeout(buildMSGfile, 1000, true);
			else
				IETwritestatus(mboximportbundle.GetStringFromName("endscan"));
		}
	}		
}

function exportfolder(subfolder, keepstructure, locale,zip) {
	var folders = GetSelectedMsgFolders();
	for (var i=0;i<folders.length;i++) {
		var isVirtualFolder = folders[i] ? folders[i].flags &0x0020 : false;
		if ( (i > 0 && folders[i].server.type != lastType) || (folders.length > 1 && isVirtualFolder) ) {
			alert(mboximportbundle.GetStringFromName("noFolderExport"));
			return;			
		}
		var lastType = folders[i].server.type;
	}
	if (locale && (lastType == "imap" || lastType == "nntp")) {
		var go = IETremoteWarning();
		if (! go) 
			return;
	}
	var destdirNSIFILE = getPredefinedFolder(0);
	if (! destdirNSIFILE) {
		destdirNSIFILE = IETgetPickerModeFolder(); 
		if (! destdirNSIFILE)
			return;
	}

	if (zip) {
		if (! String.trim)
			alert(mboximportbundle.GetStringFromName("needTB3"));
		else
			 IETexportZip(destdirNSIFILE, folders);
		return;
	}	

	if (locale) {
		for (var i=0;i<folders.length;i++)
			exportSingleLocaleFolder(folders[i],subfolder, keepstructure,destdirNSIFILE);
	}	
	else if (folders.length == 1 && isVirtualFolder)
		exportVirtualFolder(msgFolder);
	else
		exportRemoteFolders(destdirNSIFILE);
}

function IETexportZip(destdirNSIFILE, folders) {
	for (var i=0;i<folders.length;i++) {
		var zipFile = destdirNSIFILE.clone();
		var file = msgFolder2LocalFile(folders[i]);
		if (file.exists()) {
			var path = file.leafName;
			// see https://bugzilla.mozilla.org/show_bug.cgi?id=445065 
			// and http://ant.apache.org/manual/Tasks/zip.html#encoding
			path = path.replace(/[^a-zA-Z0-9\-]/g,"_");
			var zipName = folders[i].name;
			zipFile.append(zipName+".zip");
			var zipWriter = Components.Constructor("@mozilla.org/zipwriter;1", "nsIZipWriter");  
			var zipW = new zipWriter();  
			zipW.open(zipFile, 0x04 | 0x08 | 0x20);
			if (file.isDirectory()) 
 				IETaddFolderContentsToZip(zipW, file, "");
			else
				zipW.addEntryFile(path, Components.interfaces.nsIZipWriter.COMPRESSION_DEFAULT, file, false);	
			zipW.close();
		}
	}
}

function IETaddFolderContentsToZip(zipW, folder, root) {
	var entries = folder.directoryEntries; 
	while(entries.hasMoreElements()) { 
		var entry = entries.getNext(); 
		entry.QueryInterface(Components.interfaces.nsIFile); 
		zipW.addEntryFile(root + entry.leafName, Components.interfaces.nsIZipWriter.COMPRESSION_DEFAULT, entry, false);
		if (entry.isDirectory())
			 IETaddFolderContentsToZip(zipW, entry, root + entry.leafName + "/");
	}
}

function exportRemoteFolders(destdirNSIFILE) {
	IETglobalMsgFolders = GetSelectedMsgFolders(); 
	if (IETglobalMsgFolders[0].isServer)
		return;
	IETglobalMsgFoldersExported = 0;
	exportIMAPfolder(IETglobalMsgFolders[0],destdirNSIFILE);
}

// The subfolder argument is true if we have to export also the subfolders
function exportSingleLocaleFolder(msgFolder,subfolder, keepstructure,destdirNSIFILE) {
	var filex = msgFolder2LocalFile(msgFolder);
	// thefoldername=the folder name displayed in TB (for ex. "Modelli")
	var thefoldername = IETcleanName(msgFolder.name);
		
	// Check if we're exporting a simple mail folder, a folder with its subfolders or all the folders of the account
	if (msgFolder.isServer) {
		exportSubFolders(msgFolder, destdirNSIFILE, keepstructure);
		IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	}
	else if (subfolder && ! keepstructure) {
		// export the folder with the subfolders
		// first we copy the folder, finding a good name from its displayed name
		var newname =  findGoodFolderName(thefoldername,destdirNSIFILE,false);
		if(filex.exists())
			filex.copyTo(destdirNSIFILE,newname);
		// then we export the subfolders
		exportSubFolders(msgFolder,destdirNSIFILE, keepstructure);
		IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	}
	else if (subfolder && msgFolder.hasSubFolders && keepstructure) {
		var newname =  findGoodFolderName(thefoldername,destdirNSIFILE,true);
		if(filex.exists())
			filex.copyTo(destdirNSIFILE,newname);
		var sbd = filex.parent;
		sbd.append(filex.leafName+".sbd");
		if (sbd) {
			sbd.copyTo(destdirNSIFILE,newname+".sbd");
			var destdirNsFile = destdirNSIFILE.clone();
			destdirNsFile.append(newname+".sbd");
			var listMSF = MBOXIMPORTscandir.find(destdirNsFile);
			for (i = 0; i < listMSF.length; ++i) {
				if (listMSF[i].leafName.substring(listMSF[i].leafName.lastIndexOf(".")) == ".msf") {
					try {	listMSF[i].remove(false); }
					catch(e) {}
				}
			}
		}
		IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	}
	else {
		//export just the folder
		var newname =  findGoodFolderName(thefoldername,destdirNSIFILE,false);
		if(filex.exists())
			filex.copyTo(destdirNSIFILE,newname);
		IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	}
}

var MBOXIMPORTscandir = {
	list2 : [],

	find : function(dir) {
		var list = new Array();
		if (dir.isDirectory()) {
			var files = dir.directoryEntries;
			list = this.scanRecursive(files);
		}
	return list;
	},

	scanRecursive : function(dirEntry) {
		var list = new Array();
		while (dirEntry.hasMoreElements()) {
			list.push(dirEntry.getNext().QueryInterface(Components.interfaces.nsIFile));
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
	}
};



function exportSubFolders(msgFolder, destdirNSIFILE, keepstructure) {
	// Gecko 1.8 and earlier
	if (msgFolder.GetSubFolders) {
		var subfolders = msgFolder.GetSubFolders();
		while(true) {
			var next = subfolders.currentItem();
			var subfolder = next.QueryInterface(Components.interfaces.nsIMsgFolder);
			// Search for a good name
			var newname = findGoodFolderName(subfolder.name,destdirNSIFILE, false);
			var subfolderNS = msgFolder2LocalFile(subfolder);
			if (subfolderNS.exists())
				subfolderNS.copyTo(destdirNSIFILE,newname);
			else {
				newname =  IETcleanName(newname);
				var destdirNSIFILEclone = destdirNSIFILE.clone();
				destdirNSIFILEclone.append(newname);
				destdirNSIFILEclone.create(0,0644);
			}
		 	if (keepstructure) {
				var sbd = subfolderNS.parent;
				sbd.append(subfolderNS.leafName+".sbd");
				if (sbd.exists() && sbd.directoryEntries.hasMoreElements()) {
					sbd.copyTo(destdirNSIFILE,newname+".sbd");
					var destdirNsFile = destdirNSIFILE.clone();
					destdirNsFile.append(newname+".sbd");
					var listMSF = MBOXIMPORTscandir.find(destdirNsFile);
					for (i = 0; i < listMSF.length; ++i) {
						if (listMSF[i].leafName.substring(listMSF[i].leafName.lastIndexOf(".")) == ".msf") {
							try {	listMSF[i].remove(false); }
							catch(e) {}
						}
					}
				}
			}
			// If the subfolder has subfodlers, the function calls itself
			if (subfolder.hasSubFolders && ! keepstructure)
				 exportSubFolders(subfolder, destdirNSIFILE, keepstructure);
			try { 
				subfolders.next(); 
			} 
			catch(ex) { 
				break; 
			}
		}
	}
	// Gecko 1.9
	else {
		var subfolders = msgFolder.subFolders;
		while(subfolders.hasMoreElements()) {
			var next = subfolders.getNext();
			var subfolder = next.QueryInterface(Components.interfaces.nsIMsgFolder);
			// Search for a good name
			var newname = findGoodFolderName(subfolder.name,destdirNSIFILE, false);
			var subfolderNS = msgFolder2LocalFile(subfolder);
			if (subfolderNS.exists()) 
				subfolderNS.copyTo(destdirNSIFILE,newname);
			else {
				newname =  IETcleanName(newname);
				var destdirNSIFILEclone = destdirNSIFILE.clone();
				destdirNSIFILEclone.append(newname);
				destdirNSIFILEclone.create(0,0644);
			}
			if (keepstructure) {
				var sbd = subfolderNS.parent;
				sbd.append(subfolderNS.leafName+".sbd");
				if (sbd.exists() && sbd.directoryEntries.hasMoreElements()) {
					sbd.copyTo(destdirNSIFILE,newname+".sbd");
					var destdirNsFile = destdirNSIFILE.clone();
					destdirNsFile.append(newname+".sbd");
					var listMSF = MBOXIMPORTscandir.find(destdirNsFile);
					for (i = 0; i < listMSF.length; ++i) {
						if (listMSF[i].leafName.substring(listMSF[i].leafName.lastIndexOf(".")) == ".msf") {
							try {	listMSF[i].remove(false); }
							catch(e) {}
						}
					}
				}
			}
			
			// If the subfolder has subfodlers, the function calls itself
			if (subfolder.hasSubFolders && ! keepstructure)
				 exportSubFolders(subfolder, destdirNSIFILE, keepstructure);
		}
	}
}
	

function findGoodFolderName(foldername,destdirNSIFILE,structure) {
	var overwrite = IETprefs.getBoolPref("extensions.importexporttools.export.overwrite");
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
				NSclone2.append(foldername+".sbd");
				NSclone2.remove(true);
			}
		}				 
		return foldername;
	}
	var NSclone = destdirNSIFILE.clone();
	NSclone.append(foldername);
	while (NSclone.exists()) {
		index++;
		nameIndex = foldername + "-"+index.toString();
		NSclone = destdirNSIFILE.clone();
		NSclone.append(nameIndex);
	}
	if (nameIndex != "")
		return nameIndex;
	else
		return foldername;
}

function importALLasEML(recursive) {
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	// Open the filepicker to choose the directory
	fp.init(window, mboximportbundle.GetStringFromName("searchdir"), nsIFilePicker.modeGetFolder);
	// Set the filepicker to open the last opened directory
	if (fp.show) 
		var res = fp.show();	
	else
		var res = IETopenFPsync(fp);
	gEMLimported = 0;
	IETwritestatus(mboximportbundle.GetStringFromName("importEMLstart")); 
	if (res==nsIFilePicker.returnOK) {
		setTimeout(function(){RUNimportALLasEML(fp.file,recursive);}, 1000);
	}
}

function RUNimportALLasEML(file,recursive) {
	gFileEMLarray = [];
	gFileEMLarrayIndex = 0;
	var buildEMLarrayRet = buildEMLarray(file,null,recursive);
	gEMLtotal = gFileEMLarray.length;
	if (gEMLtotal < 1) {
		IETwritestatus(mboximportbundle.GetStringFromName("numEML")+" 0"+"/"+gEMLtotal); 
		return;
	}
	trytoimportEML(gFileEMLarray[0].file, gFileEMLarray[0].msgFolder,false, null, true);
}

function buildEMLarray(file,fol,recursive) {
	// allfiles is the nsiSimpleEnumerator with the files in the directory selected from the filepicker
	var allfiles = file.directoryEntries;
	if (! fol) 
		var msgFolder = GetSelectedMsgFolders()[0];
	else
		var msgFolder = fol;

	while(allfiles.hasMoreElements()) {
		var afile= allfiles.getNext();
		afile = afile.QueryInterface(Components.interfaces.nsIFile);
		try {
			// https://bugzilla.mozilla.org/show_bug.cgi?id=701721 ?
			var is_Dir = afile.isDirectory();
		}
		catch(e) {
			continue;
		}

		if (recursive && is_Dir) {
			msgFolder.createSubfolder(afile.leafName, msgWindow);
			var newFolder = msgFolder.getChildNamed(afile.leafName);
			newFolder = newFolder.QueryInterface(Components.interfaces.nsIMsgFolder);
			buildEMLarray(afile,newFolder,true);
		}
		else {
			var emlObj = new Object;
			var afilename=afile.leafName;
			afilename = afilename.toLowerCase();
			var afilenameext = afilename.substring(afilename.lastIndexOf("."), afilename.length);
			if ( ! afile.isFile() ||  (afilenameext != ".eml" && afilenameext != ".nws"))
				continue;
			emlObj.file = afile;
			emlObj.msgFolder = msgFolder;
			gFileEMLarray[gFileEMLarrayIndex] = emlObj;
			gFileEMLarrayIndex++;
		}
	}
	return true;
}

function importEMLs() {
	var msgFolder = GetSelectedMsgFolders()[0];
	// No import for imap and news account, sorry...
	if ( (! String.trim &&  msgFolder.server.type == "imap") || msgFolder.server.type == "nntp" )  {
		alert(mboximportbundle.GetStringFromName("badfolder"));
		return;
	}
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("filePickerImportMSG"), nsIFilePicker.modeOpenMultiple);
	// Set the filepicker to open the last opened directory
	fp.appendFilter(mboximportbundle.GetStringFromName("emailFiles"), "*.eml; *.emlx; *.nws");
	fp.appendFilter("All files", "*.*");
	if (fp.show) 
		var res = fp.show();	
	else
		var res = IETopenFPsync(fp);
	if (res==nsIFilePicker.returnOK){
		var thefiles=fp.files;
		var fileArray = new Array;
		// Files are stored in an array, so that they can be imported one by one
		while(thefiles.hasMoreElements()) {
			var onefile= thefiles.getNext();
			onefile = onefile.QueryInterface(Components.interfaces.nsIFile);
			fileArray.push(onefile);
		}
		gEMLimported = 0;
		gEMLtotal = fileArray.length;
		IETwritestatus(mboximportbundle.GetStringFromName("importEMLstart"));
		var dir = fileArray[0].parent;
		trytoimportEML(fileArray[0],msgFolder,false, fileArray, false);
	}
}

var importEMLlistener = {

	OnStartCopy : function() {},

	OnStopCopy : function() {
		if (this.removeFile)
			this.file.remove(false);
		importEMLlistener.next();
	},

	SetMessageKey : function(aKey) {}, 

	onStartRequest: function (aRequest, aContext) {
		this.mData = "";	
	},
	
	onDataAvailable: function (aRequest, aContext, aStream, aSourceOffset, aLength) {
		// Here it's used the nsIBinaryInputStream, because it can read also null bytes
		var bis = Components.classes['@mozilla.org/binaryinputstream;1']
			.createInstance(Components.interfaces.nsIBinaryInputStream);
		bis.setInputStream(aStream);
		this.mData += bis.readBytes(aLength);
	},

	onStopRequest: function (aRequest, aContext, aStatus) {
		var text = this.mData;
		try {
			var index = text.search(/\r\n\r\n/);
			var header = text.substring(0,index);
			if (header.indexOf("Date: =?") > -1) {
				var mime2DecodedService = Components.classes["@mozilla.org/network/mime-hdrparam;1"]
					.getService(Components.interfaces.nsIMIMEHeaderParam);
				var dateOrig = header.match(/Date: \=\?.+\?\=\r\n/).toString();
				var dateDecoded = "Date: "+mime2DecodedService.getParameter(dateOrig.substring(6), null, "", false, {value: null})+"\r\n";
				header = header.replace(dateOrig, dateDecoded);	
			}
			var data = header+text.substring(index);
			var data = text;
		}
		catch(e) {
			var data = text;
		}

		if (! this.imap) 
			writeDataToFolder(data,this.msgFolder,this.file,this.removeFile);	
		importEMLlistener.next();
	},

	next : function() {
		if (this.allEML && gEMLimported < gFileEMLarray.length) {
			var nextFile = gFileEMLarray[gEMLimported].file;
			trytoimportEML(nextFile,gFileEMLarray[gEMLimported].msgFolder,this.removeFile, this.fileArray,this.allEML);
		}
		else if (this.fileArray && gEMLimported < this.fileArray.length) {
			var nextFile = this.fileArray[gEMLimported];
			trytoimportEML(nextFile,this.msgFolder,this.removeFile, this.fileArray, false);
		}
		else {
			// At the end we update the fodler view and summary
			this.msgFolder.updateFolder(msgWindow);
			this.msgFolder.updateSummaryTotals(true);
		}
	},

	QueryInterface : function(aIID) {
		if (aIID.equals(Components.interfaces.nsISupports) ||
	        aIID.equals(Components.interfaces.nsIInterfaceRequestor) ||
	        aIID.equals(Components.interfaces.nsIChannelEventSink) || 
	        aIID.equals(Components.interfaces.nsIProgressEventSink) ||
	        aIID.equals(Components.interfaces.nsIHttpEventSink) ||
	        aIID.equals(Components.interfaces.nsIStreamListener))
	      return this;

	    throw Components.results.NS_NOINTERFACE;
	}
};



function trytoimportEML(file,msgFolder,removeFile,fileArray,allEML) {
	if (file.path.indexOf(".emlx") > -1) {
		file =  IETemlx2eml(file);
	}

	var listener = importEMLlistener;
	importEMLlistener.msgFolder = msgFolder;
	importEMLlistener.removeFile = removeFile;
	importEMLlistener.file = file;
	importEMLlistener.fileArray = fileArray;
	importEMLlistener.allEML = allEML;
	if (String.trim && msgFolder.server.type == "imap" ) {
		importEMLlistener.imap = true;
		var cs = Components.classes["@mozilla.org/messenger/messagecopyservice;1"]
                      .getService(Components.interfaces.nsIMsgCopyService);
		cs.CopyFileMessage(file, msgFolder, null, false, 1, "", importEMLlistener, msgWindow);
		if (! removeFile) {
			gEMLimported = gEMLimported + 1;
			IETwritestatus(mboximportbundle.GetStringFromName("numEML")+gEMLimported+"/"+gEMLtotal);
		}
	}
	else {
		importEMLlistener.imap = false;
		var ios = Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService);
		var fileURI = ios.newFileURI(file);
		var channel = ios.newChannelFromURI(fileURI);
		channel.asyncOpen(listener, null);
	}	
}

function writeDataToFolder(data,msgFolder,file,removeFile) {
	var msgLocalFolder = msgFolder.QueryInterface(Components.interfaces.nsIMsgLocalMailFolder);
	// strip off the null characters, that break totally import and display
	data = data.replace(/\x00/g, "");
	var now = new Date;
	try {
		var nowString = now.toString().match(/.+:\d\d/);
		nowString = nowString.toString().replace(/\d{4} /, "");
		nowString = nowString + " " + now.getFullYear();	
	}
	catch(e) {
		var nowString = now.toString().replace(/GMT.+/, "");
	}
	
	var top  = data.substring(0,2000);

	// Fix for crazy format returned by Hotmail view-source 
	if (top.match(/X-Message-Delivery:.+\r?\n\r?\n/) || top.match(/X-Message-Info:.+\r?\n\r?\n/) ) 
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
	if (data.indexOf("X-Mozilla-Status") < 0) 
		var prologue = prologue + "X-Mozilla-Status: 0000\nX-Mozilla-Status2: 00000000\n";
	else if (IETprefs.getBoolPref("extensions.importexporttools.reset_mozilla_status")) {
		// Reset the X-Mozilla status
		data = data.replace(/X-Mozilla-Status: \d{4}/, "X-Mozilla-Status: 0000");
		data = data.replace(/X-Mozilla-Status2: \d{8}/, "X-Mozilla-Status2: 00000000");
	}
	// If the message has no X-Account-Key, we add it to it, taking it from the account selected
	if (data.indexOf("X-Account-Key") < 0) {
		var myAccountManager = Components.classes["@mozilla.org/messenger/account-manager;1"]
			.getService(Components.interfaces.nsIMsgAccountManager);
		var myAccount = myAccountManager.FindAccountForServer(msgFolder.server);
		prologue = prologue + "X-Account-Key: " + myAccount.key + "\n";
	}
	data = IETescapeBeginningFrom(data);
	// Add the prologue to the EML text
	data = prologue + data + "\n";
	// Add the email to the folder
	msgLocalFolder.addMessage(data);
	gEMLimported = gEMLimported + 1;
	IETwritestatus(mboximportbundle.GetStringFromName("numEML")+gEMLimported+"/"+gEMLtotal); 
	if (removeFile)
		file.remove(false);
}

function importEmlToFolder() {
	// To import an eml attachment in folder, as a real message, it's necessary to save it
	// in a temporary file in temp directory
	var restoreDownloadWindowPref = false;
	var msgFolder = GetSelectedMsgFolders()[0];
	// 0x0020 is MSG_FOLDER_FLAG_VIRTUAL
	var isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
	if (! String.trim &&  ( (msgFolder.server.type != "pop3" &&  msgFolder.server.type != "none") || isVirtFol) ) {
		alert(mboximportbundle.GetStringFromName("badfolder2"));
		return;
	}
	var item = document.getElementById("attachmentList").selectedItem;
	var attachment = item.attachment;
	var tempdir = Components.classes["@mozilla.org/file/directory_service;1"]
                    .getService(Components.interfaces.nsIProperties)
                    .get("TmpD", Components.interfaces.nsIFile);
		
	// Hide download window, if necessary (TB2 only)
	try {
		var downloadWindowPref = IETprefs.getBoolPref("browser.download.manager.useWindow");
		if (downloadWindowPref) {
			IETprefs.setBoolPref("browser.download.manager.useWindow", false);
			restoreDownloadWindowPref = true;
		}
	}
	catch(e) {}
	IETtempfilesize = -1;
	IETcount = 0;
	try {
		var uri = attachment.uri ? attachment.uri : attachment.messageUri;
		var tempfile = messenger.saveAttachmentToFolder(attachment.contentType , attachment.url , encodeURIComponent(attachment.displayName), uri , tempdir);
		window.setTimeout(checkToImportEMLattach,1000,tempfile,msgFolder);
	}
	catch(e) {
		alert(mboximportbundle.GetStringFromName("temp_error"));
	}
	if (restoreDownloadWindowPref)
		window.setTimeout(function() {IETprefs.setBoolPref("browser.download.manager.useWindow", true);}, 500);
}

function checkToImportEMLattach(file,msgFolder) {
	// To see if the download is finished, the extension checks the filesize
	// every second, for 20 times (20 sec. are enough for every attachment)
	if (! file.exists())
		return;
	if (file.fileSize != IETtempfilesize) {
		IETtempfilesize = file.fileSize;
		if (IETcount < 20) {
			IETcount++;
			window.setTimeout(checkToImportEMLattach,1000,file,msgFolder);
		}
		else
			file.remove(false);
		return;
	}
	// The download is finished, call the eml import function, with the "delete-file" option
	trytoimportEML(file,msgFolder,true, null,false);
}	

function openIEToptions() {
	window.openDialog("chrome://mboximport/content/mboximportOptions.xul","", "chrome,modal,centerscreen");
}

function IETcopyFolderPath() {
	var msgFolder = GetSelectedMsgFolders()[0];
	var file = msgFolder2LocalFile(msgFolder);
	IETcopyStrToClip(file.path)
}

function IETopenFolderPath() {
	var msgFolder = GetSelectedMsgFolders()[0];
	var file = msgFolder2LocalFile(msgFolder);
	try {
		// Show the directory containing the file and select the file
		file.reveal();
	} catch (e) {
		// If reveal fails for some reason (e.g., it's not implemented on unix or
		// the file doesn't exist), try using the parent if we have it.
		if (msgFolder.isServer)
			var parent = file;
		else
			var parent = file.parent.QueryInterface(Components.interfaces.nsIFile);
		if (! parent)
			return;
		try {
			// "Double click" the parent directory to show where the file should be
			parent.launch();
		} catch (e) {
			// If launch also fails (probably because it's not implemented), let the
			// OS handler try to open the parent
			 var uri = Components.classes["@mozilla.org/network/io-service;1"].
				getService(Components.interfaces.nsIIOService).newFileURI(file);
			var protocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].
				getService(Components.interfaces.nsIExternalProtocolService);
			protocolSvc.loadUrl(uri);
		}
	}
}

function IETimportSMS() {
	var msgFolder = GetSelectedMsgFolders()[0];
	if ( (msgFolder.server.type == "imap" ) || (msgFolder.server.type == "nntp" ) ) {
		alert(mboximportbundle.GetStringFromName("badfolder"));
		return;
	}
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("importSMSandroid"), nsIFilePicker.modeOpen);
	fp.appendFilter("*.xml", "*.xml");
	if (fp.show) 
		var res = fp.show();	
	else
		var res = IETopenFPsync(fp);
	if (res==nsIFilePicker.returnOK) {
		var msgLocalFolder = msgFolder.QueryInterface(Components.interfaces.nsIMsgLocalMailFolder);
		var xml =fp.file;
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", "file:///"+xml.path,true);
	 	xmlhttp.onreadystatechange=function() {
			if (xmlhttp.readyState==4) {
				var dom = xmlhttp.responseXML;
				var smss = dom.getElementsByTagName("sms");
				var uConv = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
				.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
				uConv.charset = "UTF-8";
				var abManager = Components.classes["@mozilla.org/abmanager;1"]  
					.getService(Components.interfaces.nsIAbManager);  
				var myAccountManager = Components.classes["@mozilla.org/messenger/account-manager;1"]
					.getService(Components.interfaces.nsIMsgAccountManager);
		 		if (msgFolder) {
					var incServer = msgFolder.server;
          				var identity = myAccountManager.getFirstIdentityForServer(incServer);
				}
				else
					var identity = null;
				if (identity)
					var myname = identity.fullName;
				else
					var myname = myAccountManager.defaultAccount.defaultIdentity.fullName;
				var subOn = IETprefs.getBoolPref("extensions.importexporttools.sms.add_subject");
				
				for (var i=0;i<smss.length;i++) {
					var card = null;
					var cName = null;
					var cellNum = smss[i].getAttribute("address");
					var allAddressBooks = abManager.directories; 
					while (allAddressBooks.hasMoreElements()) {
						try {
							var AB = allAddressBooks.getNext();
							if (AB instanceof Components.interfaces.nsIAbDirectory) {
								card = AB.getCardFromProperty("CellularNumber", cellNum , false)	; 
								// if (! card)
								//	card = AB.getCardFromProperty("CellularNumber", "+39"+cellNum , false); 
								if (card) {
									cName = card.displayName;
									break;		
								}
							}
						}
						catch(e) {}
					}  
					
					if (cName)
						var address = cName + " <"+ smss[i].getAttribute("address") + ">";
					else
						var address = smss[i].getAttribute("address");
					if (smss[i].getAttribute("type") == "1") {
						var from = address;
						var to = myname;
					}
					else {
						var to = address;
						var from = myname;
					}
					 
					var when = smss[i].getAttribute("date");
					var d = new Date(parseInt(when));
					var body = smss[i].getAttribute("body");
					if (subOn)
						var subject = body.substring(0,20);
					else
						var subject = "";
					var now = new Date;
					try {
						var nowString = now.toString().match(/.+:\d\d/);
						nowString = nowString.toString().replace(/\d{4} /, "");
						nowString = nowString + " " + now.getFullYear();	
					}
					catch(e) {
						var nowString = now.toString().replace(/GMT.+/, "");
					}
					var email = "From - "+nowString+"\n"+ "X-Mozilla-Status: 0001\nX-Mozilla-Status2: 00000000\n"+"Date: "+d+"\n"+"From: "+from+"\n"+"To: "+to+"\n"+"Subject: "+subject+"\nX-SMS: true\nMIME-Version: 1.0\nContent-Type: text/plain; charset=UTF-8\n\n"+body+"\n\n";
					email = uConv.ConvertFromUnicode(email);
					msgLocalFolder.addMessage(email);
				}
			}
		}	
		xmlhttp.send(null);
	}
}
