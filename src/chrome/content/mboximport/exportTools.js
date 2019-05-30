var IETexported;
var IETskipped;
var IETtotal;
var IETnosub = mboximportbundle.GetStringFromName("nosubjectmsg");
var IETmesssubdir = mboximportbundle.GetStringFromName("messsubdir");
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

if (String.trim)
	Components.utils.import("resource:///modules/gloda/mimemsg.js");

function searchANDsave() {
	var preselectedFolder = null;
	if ("GetFirstSelectedMsgFolder" in window)
		preselectedFolder = GetFirstSelectedMsgFolder();
	var args = { folder: preselectedFolder};
	window.openDialog("chrome://messenger/content/SearchDialog.xul", "", "chrome,resizable,status,centerscreen,dialog=no", args, true);
}

function IETgetSortType() {
	if (! gDBView) {
		IETsortType = 0;
		return;
	}
	switch(gDBView.sortType) {
		case 19:
			// nsMsgViewSortTypeValue bySubject = 19
			IETsortType = 1;
			break;
			
		case 20:
			// nsMsgViewSortTypeValue byAuthor = 20
			IETsortType = 2;
			break;
			
		case 28:
			// nsMsgViewSortTypeValue  byRecipient = 28
			IETsortType = 3;
			break;
			
		default:
			// For any other value of nsMsgViewSortTypeValue  the sort index is by date
			IETsortType = 0;
	}
}

function selectVirtualFolder() {
	var fTree = document.getElementById("folderTree");
	var fTreeSel = fTree.view.selection;
	if (fTreeSel.isSelected(fTreeSel.currentIndex))
		return;
	var rangeCount = fTree.view.selection.getRangeCount();
	var startIndex = {};
	var endIndex = {};
        fTree.view.selection.getRangeAt(0, startIndex, endIndex);
	fTree.view.selection.currentIndex = startIndex.value;
	FolderPaneSelectionChange();
}

function IETabortExport() {
	IETabort = true;
	IETwritestatus(mboximportbundle.GetStringFromName("exportAborted"));
	document.getElementById("IETabortIcon").collapsed = true;
}

function exportSelectedMsgs(type) {
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
	
	var needIndex = false;
	if (type > 99) {
		type = type - 100;
		needIndex = true;
	}

	if (type == 1 || type == 2 || type == 7) {
		var question = IETformatWarning(1);
		if (! question) 
			return;
		question = IETformatWarning(0);
		if (! question) 
			return;
	}

	if (type == 8 || type == 9) {
		var question = IETformatWarning(1);
		if (! question) 
			return;
	}
	
	var file = getPredefinedFolder(2);
	if (! file || type == 3 || type == 4) {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		if (type == 3) {
			fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeSave);
			fp.appendFilters(nsIFilePicker.filterAll);
		}
		else if (type == 4) {
			fp.init(window, mboximportbundle.GetStringFromName("filePickerAppend"), nsIFilePicker.modeOpen);
			fp.appendFilters(nsIFilePicker.filterAll);
		}
		else
			fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);

		if (fp.show) 
			var res = fp.show();	
		else
			var res = IETopenFPsync(fp);
		if (res==nsIFilePicker.returnOK) 
			file = fp.file;
		else
			return;
	}

	try {
		if ( file.exists() && ! file.isWritable() ) {
			alert(mboximportbundle.GetStringFromName("nowritable")); 
			return;
		}
	}
	catch(e) {}

	var msgFolder = GetSelectedMsgFolders()[0];
	if ( (msgFolder.server.type == "imap" || msgFolder.server.type == "news") && ! msgFolder.verifiedAsOnlineFolder) {
		var go = confirm(mboximportbundle.GetStringFromName("offlineWarning"));
		if (! go) 
			return;
		var isOffLineImap = true;
	}
	else
		var isOffLineImap = false;

	var emlsArray  = IETgetSelectedMessages();
	IETskipped = 0;
	if (isOffLineImap) {
		var tempArray = [];
		for (var i=0;i<emlsArray.length;i++) {
			var eml = emlsArray[i];
			var mms = messenger.messageServiceFromURI(eml).QueryInterface(Components.interfaces.nsIMsgMessageService);
			var hdr = mms.messageURIToMsgHdr(eml);
			if (hdr.flags & 0x00000080)
				tempArray.push(eml);
			else
				IETskipped = IETskipped + 1;
		}
		emlsArray = tempArray;
	}
	IETtotal = emlsArray.length;
	IETexported = 0;
	var msguri = emlsArray[0];
	
	switch(type) {
		case 1:
			exportAsHtml(msguri,emlsArray,file,false,false,false,false,null,null,null);
			break;
		case 2:
			exportAsHtml(msguri,emlsArray,file,true,false,false,false,null,null,null);
			break;
		case 3:
			saveMsgAsEML(msguri,file,true,emlsArray,null,null,false,false,null,null);
			break;
		case 4:
			if (isMbox(file) != 1) {
				var string = ("\"" + file.leafName + "\" " + mboximportbundle.GetStringFromName("nomboxfile"));
				alert(string);
				return;
			}
			saveMsgAsEML(msguri,file,true,emlsArray,null,null,false,false,null,null);
			break;
		case 5:
			var hdrArray = IETemlArray2hdrArray(emlsArray, false, file);
			createIndex(type, file, hdrArray, msgFolder, true, true);	
			break;
		case 6:
			var hdrArray = IETemlArray2hdrArray(emlsArray, false, file);
			createIndexCSV(type, file, hdrArray, msgFolder, false);	
			break;
		case 7:
			var hdrArray = IETemlArray2hdrArray(emlsArray, true, file);
			createIndexCSV(type, file, hdrArray, msgFolder, true);
			break;
		case 8:
			exportAsHtml(msguri,emlsArray,file,false,false,false,false,null,null,null, true);
			break;
		case 9:
			exportAsHtml(msguri,emlsArray,file,true,false,false,false,null,null,null, true);
			break;
		default:
			saveMsgAsEML(msguri,file,false,emlsArray,null,null,false,false,null,null);
	} 

	if (needIndex) {
		var hdrArray = IETemlArray2hdrArray(emlsArray, false, file);
		createIndex(type, file, hdrArray, msgFolder, false, false);
	}
	if (type != 5 && type != 6 && type != 7 && document.getElementById("IETabortIcon"))
		document.getElementById("IETabortIcon").collapsed = false;
	IETabort = false;
}

// Export all messages is done through more steps
//
// 1) exportAllMsgs 
//
// sets the destination directory and makes some checks about the types of the selected folders;
// all the selected folders are stored in IETglobalMsgFolders global array

function exportAllMsgs(type) {
	if (type == 1 || type == 2 || type == 7) {
		var question = IETformatWarning(1);
		if (! question) 
			return;
		question = IETformatWarning(0);
		if (! question) 
			return;
	}

	if (type == 8 || type == 9) {
		var question = IETformatWarning(1);
		if (! question) 
			return;
	}
	
	var file = getPredefinedFolder(1);
	if (! file) {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);
		if (fp.show) 
			var res = fp.show();	
		else
			var res = IETopenFPsync(fp);
		if (res==nsIFilePicker.returnOK) 
			file = fp.file;
		else
			return;
	}
	try {
		if ( ! file.isWritable()) {
			alert(mboximportbundle.GetStringFromName("nowritable")); 
			return;
		}
	}
	catch(e) {}
	IETglobalMsgFolders = GetSelectedMsgFolders(); 
	IETglobalMsgFoldersExported = 0;
	for (var i=0;i<IETglobalMsgFolders.length;i++) {
		// Check if there is a multiple selection and one of the folders is a virtual one.
		// If so, exits, because the export function can't handle this
		if (IETglobalMsgFolders.length > 1 && IETglobalMsgFolders[i].flags & 0x0020) {
			alert(mboximportbundle.GetStringFromName("virtFolAlert"));
			return;
		}
		if ( type != 3 && type !=5 && (IETglobalMsgFolders[i].server.type == "imap" || IETglobalMsgFolders[i].server.type == "news") && ! IETglobalMsgFolders[i].verifiedAsOnlineFolder) {
			var go = confirm(mboximportbundle.GetStringFromName("offlineWarning"));
			if (! go) 
				return;
			else
				break;
		}
	}
	IETglobalFile = file.clone();
	if (type != 3 && type != 5) {
		IETwritestatus(mboximportbundle.GetStringFromName("exportstart")); 
		document.getElementById("IETabortIcon").collapsed = false;  
	}
	exportAllMsgsStart(type,file,IETglobalMsgFolders[0]);
}

// 2) exportAllMsgsStart
//
// If we must export a virtual folder is called the function for that,
// otherwise is called the "normal" function of export
 
function exportAllMsgsStart(type,file,msgFolder) {
	// 0x0020 is MSG_FOLDER_FLAG_expVIRTUAL
	var isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
	if (isVirtFol) {
		if (IETglobalMsgFolders.length == 1) {
			// To export messages from virtual folder, it's necessary to select it
			selectVirtualFolder();
			setTimeout(function(){exportAllMsgsDelayedVF(type,file,msgFolder);},1500);
		}
		else {
			IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
			exportAllMsgsStart(type,file,IETglobalMsgFolders[IETglobalMsgFoldersExported]);
		}
	}
	else
		setTimeout(function(){exportAllMsgsDelayed(type,file,msgFolder);},1000);
}

// 3a) exportAllMsgsDelayedVF
//
// The virtual folders are only a collection of messages that are really in other folders.
// So we must select the folderm do some pre-export stuff and call the export routine

function exportAllMsgsDelayedVF(type,file,msgFolder) {
	var msgUriArray = new Array;
	var total = msgFolder.getTotalMessages(false);
	if (total == 0) {
		IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
		if (IETglobalMsgFoldersExported < IETglobalMsgFolders.length) 
			exportAllMsgsStart(type,file,IETglobalMsgFolders[IETglobalMsgFoldersExported]);
		return;
	}
	
	for (i=0;i<total;i++) {
		var uri = gDBView.getURIForViewIndex(i);
		msgUriArray[i] = uri;
	}
	
	var folderType = msgFolder.server.type;
	IETtotal = msgUriArray.length
	IETexported = 0;
	IETskipped = 0;
	
	var hdrArray = new Array;
	var mustcorrectname = IETprefs.getBoolPref("extensions.importexporttools.export.filenames_toascii");
	var filex = msgFolder2LocalFile(msgFolder);
	var datedir = buildContainerDirName();
	var useContainer = IETprefs.getBoolPref("extensions.importexporttools.export.use_container_folder");

	if (useContainer) {
		// Check if the name is good or exists alredy another directory with the same name
		var filetemp = file.clone();
		if (mustcorrectname)
			var direname = nametoascii(msgFolder.name)+"_"+datedir;
		else {
			var direname = msgFolder.name+"_"+datedir;
			direname = direname.replace(/[\\:?"\*\/<>#]/g, "_");
		}
		filetemp.append(direname);
		var index1=0;
		while (filetemp.exists()) {
			index1++;
			filetemp = file.clone();
			if (mustcorrectname)
				direname = nametoascii(msgFolder.name)+"_"+datedir+"-"+index1.toString();
			else
				direname = msgFolder.name+"_"+datedir+"-"+index1.toString();
			filetemp.append(direname);
		}		
		file = filetemp.clone();
		// Create the container directory
		file.create(1,0775);
		var subfile = file.clone();
		if (type < 3) {
			subfile.append(IETmesssubdir);
			subfile.create(1,0775);
		}
	}
	else
		var subfile = file.clone();
	var file2 = file.clone();
	IETgetSortType();
	// Export the messages one by one
	for (j=0;j<msgUriArray.length;j++) {
		var msguri = msgUriArray[j];
		var msserv = messenger.messageServiceFromURI(msguri);
		var msg = msserv.messageURIToMsgHdr(msguri);
		
		if ( type != 3 && type !=5 && (msg.folder.server.type == "imap" || msg.folder.server.type == "news")
			&&  ! msg.folder.verifiedAsOnlineFolder &&
			! (msg.flags & 0x00000080) ) {
				IETskipped = IETskipped + 1;
				IETtotal = IETtotal - 1;
				continue;
		}	
		var addBody = (type == 6) ? true : false;
		var hdrStr = IETstoreHeaders(msg,msguri,subfile,addBody);
		hdrArray.push(hdrStr);		
	}
	hdrArray.sort();
	if (gDBView &&  gDBView.sortOrder == 2) 
		hdrArray.reverse();
	IETrunExport(type,subfile,hdrArray,file2,msgFolder);
}

// 3b exportAllMsgsDelayed
//
// The same of 3a for not-virtual folder

function exportAllMsgsDelayed(type,file,msgFolder) {
	try {
		IETtotal = msgFolder.getTotalMessages(false);
		if (IETtotal == 0) {
			IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
			if (IETglobalMsgFoldersExported < IETglobalMsgFolders.length) 
				exportAllMsgsStart(type,file,IETglobalMsgFolders[IETglobalMsgFoldersExported]);
			return;
		}
		IETexported = 0;
		IETskipped = 0;
		if (msgFolder.getMessages)
			// Gecko 1.8 and earlier
			var msgArray = msgFolder.getMessages(null);
		else
			// Gecko 1.9
			var msgArray = msgFolder.messages;
	}
	catch(e) {
		return;
	}
	var hdrArray = new Array;
	var mustcorrectname = IETprefs.getBoolPref("extensions.importexporttools.export.filenames_toascii");
	var filex = msgFolder2LocalFile(msgFolder);
	var datedir = buildContainerDirName();
	var useContainer = IETprefs.getBoolPref("extensions.importexporttools.export.use_container_folder");
	var skipExistingMsg = IETprefs.getBoolPref("extensions.importexporttools.export.skip_existing_msg");
	var ext = IETgetExt(type);

	if (useContainer) {	
		// Check if the name is good or exists alredy another directory with the same name
		var filetemp = file.clone();
		if (mustcorrectname)
			var direname = nametoascii(msgFolder.name)+"_"+datedir;
		else {
			var direname = msgFolder.name+"_"+datedir;
			direname = direname.replace(/[\\:?"\*\/<>#]/g, "_");
		}
		filetemp.append(direname);
		var index1=0;
		while (filetemp.exists()) {
			index1++;
			filetemp = file.clone();
			if (mustcorrectname)
				direname = nametoascii(msgFolder.name)+"_"+datedir+"-"+index1.toString();
			else
				direname = msgFolder.name+"_"+datedir+"-"+index1.toString();
			filetemp.append(direname);
		}		
		file = filetemp.clone();
		// Create the container directory
		file.create(1,0775);
		var subfile = file.clone();
		if (type < 3 || type > 6) {
			subfile.append(IETmesssubdir);
			subfile.create(1,0775);
		}

	}
	else
		var subfile = file.clone();

	var file2 = file.clone();
	IETgetSortType();
	// Export the messages one by one
	while(msgArray.hasMoreElements()) {
		var msg = msgArray.getNext();
		var skip = false;
		msg = msg.QueryInterface(Components.interfaces.nsIMsgDBHdr);
		var tempExists = false;

		if (! useContainer && skipExistingMsg) {			
			var sog = getSubjectForHdr(msg,subfile.path);
			var tempFile = subfile.clone();
			tempFile.append(sog+ext);
			var tempExists = tempFile.exists();
		}
		
		if ( tempExists || (  type != 3 && type !=5 && (msg.folder.server.type == "imap" || msg.folder.server.type == "news")
			&&  ! msg.folder.verifiedAsOnlineFolder &&
			! (msg.flags & 0x00000080)) ) {
				skip = true;
				IETskipped = IETskipped + 1;
				IETtotal = IETtotal - 1;
		}		
		
		if (! skip) {
			var addBody = (type == 6) ? true : false;
			var msguri = msg.folder.getUriForMsg(msg);
			if (addBody && IETabort) {
				IETabort = false;
				break;
			}	
			var hdrStr = IETstoreHeaders(msg,msguri,subfile,addBody);
			hdrArray.push(hdrStr);
		}
	}
	
	hdrArray.sort();
	// nsMsgViewSortOrderValue none = 0;
	// nsMsgViewSortOrderValue ascending = 1;
	// nsMsgViewSortOrderValue descending = 2;
	if (gDBView &&  gDBView.sortOrder == 2) 
		hdrArray.reverse();
	IETrunExport(type,subfile,hdrArray,file2,msgFolder);
}

// 4 IETrunExport
//
// According to the type requested, it's called the routine that performs the export

function IETrunExport(type,subfile,hdrArray,file2,msgFolder) {
	var firstUri = hdrArray[0].split("§][§^^§")[5];
	switch (type) {
		case 1:  // HTML format, with index
			exportAsHtml(firstUri,null,subfile,false,true,false,false,hdrArray,file2,msgFolder);
			break;
		case 2:  // plain text format, with index
			exportAsHtml(firstUri,null,subfile,true,true,false,false,hdrArray,file2,msgFolder);
			break;
		case 3:  // just HTML index
			createIndex(type, file2, hdrArray, msgFolder, true, true);
			break;
		case 4:  // plain text, single file, no index
			exportAsHtml(firstUri,null,subfile,true,true,false,true,hdrArray,null,null);
			break;
		case 5: // just CSV index
			createIndexCSV(type, file2, hdrArray,  msgFolder, false);
			break;
		case 6: // CSV format, with body too
			createIndexCSV(type, file2, hdrArray,  msgFolder, true);
			break;
		case 7:  // plain text, single file, no index and with attachments
			exportAsHtml(firstUri,null,subfile,true,true,false,true,hdrArray,null,null,true);
			break;
		case 8:  // HTML format, with index and attachments
			exportAsHtml(firstUri,null,subfile,false,true,false,false,hdrArray,file2,msgFolder,true);
			break;
		case 9:  // plain text format, with index and attachments
			exportAsHtml(firstUri,null,subfile,true,true,false,false,hdrArray,file2,msgFolder, true);
			break;
		default: // EML format, with index
			saveMsgAsEML(firstUri,subfile,false,null,hdrArray,null,false, false, file2,msgFolder);
	}
	if (type != 3 && type !=5 && type !=6) {
		IETabort = false;
		document.getElementById("IETabortIcon").collapsed = false;  
	}
}

function createIndex(type, file2, hdrArray, msgFolder,justIndex,subdir) {
	if (! IETprefs.getBoolPref("extensions.importexporttools.export.use_container_folder") && ! justIndex && subdir)
		return;

	var myDate=new Date();

	var clone2 = file2.clone();
	var ext = IETgetExt(type);
	if (subdir)
		var subdirname = encodeURIComponent(nametoascii(IETmesssubdir))+"/";
	else
		var subdirname = "";
	// Build the index html page
	clone2.append("index.html");
	clone2.createUnique(0,0644);
	var data = '<html>\r\n<head>\r\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\r\n<title>'+msgFolder.name+'</title>\r\n</head>\r\n<body>\r\n<h2>'+msgFolder.name+" ("+myDate.toLocaleString()+")</h2>";
	data = data + '<table width="99%" border="1">';
	data = data + "<tr><td><b>"+mboximportbundle2.GetStringFromID(1000)+"</b></td>";  // Subject
	data = data + "<td><b>"+mboximportbundle2.GetStringFromID(1009)+"</b></td>";  // From
	data = data + "<td><b>"+mboximportbundle2.GetStringFromID(1012)+"</b></td>";  // To
	data = data + "<td><b>"+mboximportbundle2.GetStringFromID(1007)+"</b></td>";  // Date
	data = data + "<td><b>"+mboximportbundle2.GetStringFromID(1028)+"</b></td>"; // Attachment
	data = data + "</tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>";
	// Fill the table with the data of the arrays
	for (i=0;i<hdrArray.length;i++) {
		var currentMsgHdr = hdrArray[i];
		// If the last char is "1", so the first letter must be modified in lower case
		if (currentMsgHdr .substring(currentMsgHdr.length-1) == "1")
			currentMsgHdr = currentMsgHdr.substring(0,1).toLowerCase()+currentMsgHdr.substring(1,currentMsgHdr.length-1);
		// Splits the array element to find the needed headers
		var hdrs = currentMsgHdr.split("§][§^^§");
		
		switch (IETsortType) {
				case 1: 
					var time = hdrs[3];
					var subj = hdrs[0];
					var recc = hdrs[1];
					var auth = hdrs[2];
					break;
					
				case 2:
					var time = hdrs[3];
					var subj = hdrs[1];
					var recc = hdrs[2];
					var auth = hdrs[0];
					break;
						
				case 3:
					var time = hdrs[3];
					var subj = hdrs[1];
					var recc = hdrs[0];
					var auth = hdrs[2];
					break;
				
				default:
					var time = hdrs[0];
					var subj = hdrs[1];
					var recc = hdrs[2];
					var auth = hdrs[3];
			}
		
		if (hdrs[6] == 1)
			var hasAtt = "*";		
		else
			var hasAtt = "&nbsp;";
	
		// Find hour and minutes of the message
		var time2 = time/1000;
		var obj = new Date(time2);
		var objHour = obj.getHours();
		var objMin = obj.getMinutes();
		if (objMin < 10)
			objMin = "0" + objMin;
		if (! justIndex) {
			var urlname = IETstr_converter(hdrs[4]);
			var url = subdirname+encodeURIComponent(urlname)+ ext;
			data = data + '\r\n<tr><td><a href="'+url+ '">'+subj+"</a></td>";
		}
		else
			data = data + "\r\n<tr><td>"+subj+"</td>";
		data = data + "\r\n<td>" + auth + "</td>";
		data = data + "\r\n<td>" + recc + "</td>";
		// The nowrap attribute is used not to break the time row
		data = data + "\r\n<td nowrap>" + convertPRTimeToString(time) + " " +objHour+"."+objMin + "</td>";
		data = data + '\r\n<td align="center">'+hasAtt+"</td></tr>";
	}
	data = data + "</table></body></html>";
	IETwriteDataOnDiskWithCharset(clone2,data,false,null,null);
}

function createIndexCSV(type, file2, hdrArray, msgFolder, addBody) {
	if (type != 7) {
		var clone2 = file2.clone();
		clone2.append("index.csv");
	}
	else {
		var clone2 = file2.clone();
		clone2.append("messages.csv");
		clone2.createUnique(0,0644);
	}			

	var subdirname = nametoascii(IETmesssubdir);
	var sep = IETprefs.getCharPref("extensions.importexporttools.csv_separator");
	var data = "";

	// Build the index csv page
	
	// Fill the table with the data of the arrays
	for (i=0;i<hdrArray.length;i++) {
		var currentMsgHdr = hdrArray[i];
		// If the last char is "1", so the first letter must be modified in lower case
		if (currentMsgHdr.substring(currentMsgHdr.length-1) == "1")
			currentMsgHdr = currentMsgHdr.substring(0,1).toLowerCase()+currentMsgHdr.substring(1,currentMsgHdr.length-1);

		// Splits the array element to find the needed headers
		var hdrs = currentMsgHdr.split("§][§^^§");
		
		switch (IETsortType) {
				case 1: 
					var time = hdrs[3];
					var subj = hdrs[0];
					var recc = hdrs[1];
					var auth = hdrs[2];
					break;
					
				case 2:
					var time = hdrs[3];
					var subj = hdrs[1];
					var recc = hdrs[2];
					var auth = hdrs[0];
					break;
						
				case 3:
					var time = hdrs[3];
					var subj = hdrs[1];
					var recc = hdrs[0];
					var auth = hdrs[2];
					break;
				
				default:
					var time = hdrs[0];
					var subj = hdrs[1];
					var recc = hdrs[2];
					var auth = hdrs[3];
		}
	
		// Find hour and minutes of the message
		var time2 = time/1000;
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
			subj = "\""+ subj + "\"";
		if (auth.indexOf(sep) > -1)
			auth = "\""+ auth + "\"";
		if (recc.indexOf(sep) > -1)
			recc = "\""+ recc + "\"";
		if (hdrs[6] == 1)
			var hasAtt = "*";
		else
			var hasAtt = " ";
	
		var body = addBody ? hdrs[7] : "";

		var record = '"'+subj.replace(/\"/g, '""')+'"'+sep+'"'+auth.replace(/\"/g, '""')+'"'+sep+'"'+recc.replace(/\"/g, '""')+'"'+sep+(convertPRTimeToString(time) + " " +objHour+":"+objMin) + sep + hasAtt+ sep + body+"\r\n";
		data = data + record;
	}
	if (document.getElementById("IETabortIcon") && addBody)
		document.getElementById("IETabortIcon").collapsed = true;
	IETwriteDataOnDiskWithCharset(clone2,data,false,null,null);
}

function saveMsgAsEML(msguri,file,append,uriArray,hdrArray,fileArray,imapFolder,clipboard,file2,msgFolder) {
    var myEMLlistner = {
	   
		scriptStream : null,
		emailtext : "",

        QueryInterface : function(iid)  {
                if (iid.equals(Components.interfaces.nsIStreamListener) ||  
                    iid.equals(Components.interfaces.nsISupports))
                 return this;
        
                throw Components.results.NS_NOINTERFACE;
                return 0;
        },
        
        onStartRequest : function (aRequest, aContext) {},
            
        onStopRequest : function (aRequest, aContext, aStatusCode) {
		this.scriptStream = null;
		if (clipboard) {
			IETcopyStrToClip(this.emailtext);
			return;
		}
		var tags = hdr.getStringProperty("keywords");
		if (tags && this.emailtext.substring(0,5000).indexOf("X-Mozilla-Keys") < 0) 
			this.emailtext = "X-Mozilla-Keys: "+tags+"\r\n" + this.emailtext;
		if (append) {
			if (this.emailtext != "") {
				var data = this.emailtext + "\n";
				// Some Imap servers don't add to the message the "From" prologue
				if (data && ! data.match(/^From/)) {
					var da = new Date;
					// Mbox format requires that the date in "From" first line is 24 characters long
					var now = da.toString().substring(0,24);
					now = now.replace(da.getFullYear()+" ","")+" "+da.getFullYear();					
					var prologue = "From - " + now + "\n";
					data = prologue+data;
				}
				data = IETescapeBeginningFrom(data);
			}
			var fileClone = file.clone();
			IETwriteDataOnDisk(fileClone,data,true,null,null);
			var sub = true;
		}
		else {
			if (! hdrArray)
				var sub = getSubjectForHdr(hdr,file.path);
			else {
				var parts = hdrArray[IETexported].split("§][§^^§");
				var sub = parts[4];
				sub = sub.replace(/[\x00-\x1F]/g,"_");
			}
			
			sub = IETstr_converter(sub);
			
			if (sub) {
				var data = this.emailtext.replace(/^From.+\r?\n/, "");
				data = IETescapeBeginningFrom(data);
				var clone = file.clone();
				// The name is taken from the subject "corrected"
				clone.append(sub+".eml");
				clone.createUnique(0,0644);
				var time = (hdr.dateInSeconds)*1000;
				IETwriteDataOnDisk(clone,data,false,null,time);
				// myEMLlistener.file2 exists just if we need the index
				if (myEMLlistner.file2) {
					var nameNoExt = clone.leafName.replace(/\.eml$/, "");
					// If the leafName of the file is not equal to "sub", we must change also
					// the corrispondent section of hdrArray[IETexported], otherwise the link
					// in the index will be wrong
					if (sub != nameNoExt) {
						parts[4] = nameNoExt;
						hdrArray[IETexported] = parts.join("§][§^^§");
					}	
				}
			}
		}
		IETexported = IETexported + 1;
		if (sub)
			IETwritestatus(mboximportbundle.GetStringFromName("exported")+" "+IETexported+" "+mboximportbundle.GetStringFromName("msgs")+" "+(IETtotal+IETskipped));

		if (IETabort) {
			IETabort = false;
				return;
		}
			
		if (IETexported < IETtotal) {
			if (fileArray) {
				var nextUri = uriArray[IETexported];
				var nextFile = fileArray[IETexported];
			}
			else if (! hdrArray) {
				var nextUri = uriArray[IETexported];
				var nextFile = file;
			}
			else {
				parts = hdrArray[IETexported].split("§][§^^§");
				var nextUri = parts[5];
				var nextFile = file;
			}
			saveMsgAsEML(nextUri,nextFile,append,uriArray,hdrArray,fileArray,imapFolder,false,file2,msgFolder);
		}
		else {
			if (myEMLlistner.file2)
				createIndex(0, myEMLlistner.file2, hdrArray, myEMLlistner.msgFolder, false,true);
			IETexported = 0
			IETtotal = 0;
			IETskipped = 0;
			if (IETglobalMsgFolders) {
				IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
				if (IETglobalMsgFoldersExported && IETglobalMsgFoldersExported < IETglobalMsgFolders.length) {
					if (imapFolder) {
						setTimeout(function() {
							exportIMAPfolder(IETglobalMsgFolders[IETglobalMsgFoldersExported],file.parent);
						}, 1000);
					}
					else
						exportAllMsgsStart(0,IETglobalFile,IETglobalMsgFolders[IETglobalMsgFoldersExported]);
				}
				else if (document.getElementById("IETabortIcon"))
					document.getElementById("IETabortIcon").collapsed = true;
			}
			else if (document.getElementById("IETabortIcon"))
				document.getElementById("IETabortIcon").collapsed = true;
		}
	},
            
        onDataAvailable : function (aRequest, aContext, aInputStream, aOffset, aCount) {
		var scriptStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
                     createInstance().QueryInterface(Components.interfaces.nsIScriptableInputStream);
		scriptStream.init(aInputStream);
           	this.emailtext+=scriptStream.read(scriptStream.available());
	     }        
        };
  
	var mms = messenger.messageServiceFromURI(msguri)
	       .QueryInterface(Components.interfaces.nsIMsgMessageService);
	var hdr = mms.messageURIToMsgHdr(msguri);
	try {
		IETlogger.write("call to saveMsgAsEML - subject = " + hdr.mime2DecodedSubject + " - messageKey = " + hdr.messageKey);	
	}
	catch(e) {
		IETlogger.write("call to saveMsgAsEML - error = "+ e);
	}
	myEMLlistner.file2 = file2;
	myEMLlistner.msgFolder = msgFolder;
	mms.streamMessage(msguri, myEMLlistner, msgWindow, null, false, null);
}


function exportAsHtml(uri,uriArray,file,convertToText,allMsgs,copyToClip,append,hdrArray,file2,msgFolder,saveAttachments) {
          
    var myTxtListener = {
		scriptStream : null,
		emailtext: "",

		 QueryInterface : function(iid)  {
	                if (iid.equals(Components.interfaces.nsIStreamListener) ||  
	                    iid.equals(Components.interfaces.nsISupports))
	                 return this;
        
	                throw Components.results.NS_NOINTERFACE;
	                return 0;
	        },      
		
		onStartRequest: function(request, context) {},
		
		onDataAvailable: function(request, context, inputStream, offset, count) {
			var scriptStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
                          createInstance().QueryInterface(Components.interfaces.nsIScriptableInputStream);
			scriptStream.init(inputStream);
           		this.emailtext+=scriptStream.read(scriptStream.available());
		},

		onStopRequest: function(request, context, statusCode) {
			var data = this.emailtext;	
			if (copyToClip) {
				IETcopyToClip(data);
				return;
			}

			this.scriptStream = null;
			var clone = file.clone();
			if (String.trim && saveAttachments && (hdr.flags & 0x10000000)) { 
				var aMsgHdr = hdr;
				MsgHdrToMimeMessage(aMsgHdr, null, function(aMsgHdr, aMsg) {
					var attachments = aMsg.allUserAttachments ? aMsg.allUserAttachments : aMsg.allAttachments;
					// attachments = attachments.filter(function (x) x.isRealAttachment);
					var footer = null;
					var noDir = true;
					for (var i=0;i<attachments.length;i++) {
						var att = attachments[i];	
						// if (att.contentType.indexOf("text/plain") == 0 )
						//	continue;
						if (noDir) {
							var attDirContainer = file.clone();
							attDirContainer.append("Attachments");
							attDirContainer.createUnique(1,0775);
							footer = '<br><hr><br><div style="font-size:12px;color:black;"><img src="data:image/gif;base64,R0lGODdhDwAPAOMAAP///zEwYmJlzQAAAPr6+vv7+/7+/vb29pyZ//39/YOBg////////////////////ywAAAAADwAPAAAESRDISUG4lQYr+s5bIEwDUWictA2GdBjhaAGDrKZzjYq3PgUw2co24+VGLYAAAesRLQklxoeiUDUI0qSj6EoH4Iuoq6B0PQJyJQIAOw==">\r\n<ul>';
							noDir = false;
						}
						var success = true;
						if (att.url.indexOf("file") == 0) {  // Detached attachments
							try {
								var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
								var attURL = decodeURIComponent(att.url.replace(/\?part.+/, ""));
								attURL = attURL.replace("file://", "");
								localFile.initWithPath(attURL);
								localFile.copyTo(attDirContainer, "");
								var attName = localFile.leafName;
								var attNameAscii = encodeURIComponent(attName);
							}
							catch(e) {
								success = false;
							}
						}
						else {
							try {
								var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
									.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
								converter.charset = "UTF-8";
								var attName = converter.ConvertFromUnicode(att.name);
								var attDirContainerClone = attDirContainer.clone();
								// var attNameAscii = attName.replace(/[^a-zA-Z0-9\-\.]/g,"_");
								var attNameAscii = encodeURIComponent(att.name);
								attDirContainerClone.append(att.name);
								messenger.saveAttachmentToFile(attDirContainerClone, att.url, uri, att.contentType, null);
							}
							catch(e) {
								success = false;
							}
						}
						if (success)
							footer = footer + '<li><a href="'+attDirContainer.leafName+"/"+attNameAscii+'">'+attDirContainer.leafName+"/"+attName+'</li></a>';
					}
					if (footer) {
						footer = footer+"</ul></div></body>";
						data = data.replace("</body>", footer);
						data = data.replace(/<\/html>(?:.|\r?\n)+/, "</html>");
					}
					myTxtListener.onAfterStopRequest(clone,data,saveAttachments);
				},true, { examineEncryptedParts: true, }); 
			}
			else
				myTxtListener.onAfterStopRequest(clone,data,saveAttachments);
		},
		
		onAfterStopRequest : function(clone,data,saveAttachments) {
			var replyTo = hdr.getProperty("replyTo");
			if (replyTo.length > 1) {
				var rt = '<tr><td><div class="headerdisplayname" style="display:inline;">Reply-to: </div> '+replyTo+'</td></tr>'
				data = data.replace("</table><br>", rt+"</table><br>");
			}

			if (this.append && convertToText)  {
				data = IEThtmlToText(data);
				data = data +"\r\n\r\n"+  IETprefs.getCharPref("extensions.importexporttools.export.mail_separator") +"\r\n\r\n";
				var nfile = clone.leafName + ".txt";
				IETwriteDataOnDiskWithCharset(clone,data,true,nfile,null);
				IETexported = IETexported + 1;
				IETwritestatus(mboximportbundle.GetStringFromName("exported")+" "+IETexported+" "+mboximportbundle.GetStringFromName("msgs")+" "+(IETtotal+IETskipped));
				if (IETexported == IETtotal) {
					if (document.getElementById("IETabortIcon"))
						document.getElementById("IETabortIcon").collapsed = true;
					return;			
				}	
				if (! hdrArray)
					var nextUri = uriArray[IETexported];
				else {
					parts = hdrArray[IETexported].split("§][§^^§");
					var nextUri = parts[5];
				}
				exportAsHtml(nextUri,uriArray,file,convertToText,allMsgs,copyToClip,append,hdrArray,file2,msgFolder,saveAttachments);
				return;
			}
			
			if (! hdrArray)
				var sub = getSubjectForHdr(hdr,file.path);
			else {
				var parts = hdrArray[IETexported].split("§][§^^§");
				var sub = parts[4];
				sub = sub.replace(/[\x00-\x1F]/g,"_");
			}

			sub = IETstr_converter(sub);
				
			// The name is taken from the subject "corrected"
			if (convertToText)
				clone.append(sub+".txt");
			else
				clone.append(sub+".html");
			var num = 0;
			while (clone.exists()) {
				num++;
				clone = file.clone();
				if (convertToText)
					clone.append(sub+"-"+num+".txt");
				else
					clone.append(sub+"-"+num+".html");								
			}
			if (myTxtListener.file2) {
				if (num > 0) {
					// If "num" is greater than 0, it means that the filename is not equal to subject
					// and so the corrispondent section of hdrArray[IETexported] must be modified too, 
					// otherwise the link the index will be wrong
					parts[4] = sub+"-"+num;
					hdrArray[IETexported] = parts.join("§][§^^§");
				}	
			}
			var time = (hdr.dateInSeconds)*1000;
			if (convertToText) {
				data = IEThtmlToText(data);
				IETwriteDataOnDiskWithCharset(clone,data,false,null,time);
			}
			else {
				if (saveAttachments) {
					// Save embedded images
					try {
						var embImgContainer = null;
						var isWin = (navigator.platform.toLowerCase().indexOf("win") > -1);
						var imgs = data.match(/<img[^>]+src=\"mailbox[^>]+>/g);
						for (var i=0;i<imgs.length;i++) {
							if (! embImgContainer) {
								embImgContainer = file.clone();
								embImgContainer.append("EmbeddedImages");
								embImgContainer.createUnique(1,0775);
							}
							var aUrl = imgs[i].match(/mailbox:\/\/\/[^\"]+/);
							var embImg = embImgContainer.clone();
							embImg.append(i+".jpg");
							messenger.saveAttachmentToFile(embImg, aUrl, uri, "image/jpeg", null);
							// var sep = isWin ? "\\" : "/";
							data = data.replace(aUrl, embImgContainer.leafName+"/"+i+".jpg");
						}		
					}
					catch(e) {
						IETlogger.write("save embedded images - error = "+ e);
					}
				}
				/* Clean HTML code generated by streamMessage and "header=filter":
				- replace author/recipients/subject with mimeDecoded values
				- strip off the reference to messageBody.css
				- add a style rule to make headers name in bold
				*/
				var tempStr = this.hdr.author.replace("<", "&lt;").replace(">","&gt;");
				data = data.replace(tempStr, this.hdr.mime2DecodedAuthor);
				tempStr = this.hdr.recipients.replace("<", "&lt;").replace(">","&gt;");
				data = data.replace(tempStr, this.hdr.mime2DecodedRecipients);
				tempStr = this.hdr.subject.replace("<", "&lt;").replace(">","&gt;");
				data = data.replace(tempStr, this.hdr.mime2DecodedSubject);
				data = data.replace("chrome:\/\/messagebody\/skin\/messageBody.css", "");
				data = data.replace("<\/head>", "<style>div.headerdisplayname {font-weight:bold;}<\/style><\/head>");
				if (! HTMLasView && this.chrset)
					data = data.replace("<head>", '<head><meta http-equiv="Content-Type" content="text/html; charset='+this.chrset+'" />');
				else
					data = data.replace("<head>", '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />');
				IETwriteDataOnDisk(clone,data,false,null,time);
			}	
			IETexported = IETexported + 1;
			IETwritestatus(mboximportbundle.GetStringFromName("exported")+" "+IETexported+" "+mboximportbundle.GetStringFromName("msgs")+" "+(IETtotal+IETskipped));

			if (IETabort) {
				IETabort = false;
				return;
			}

			if (IETexported < IETtotal) {
				if (! hdrArray)
					var nextUri = uriArray[IETexported];
				else {
					parts = hdrArray[IETexported].split("§][§^^§");
					var nextUri = parts[5];
				}
				exportAsHtml(nextUri,uriArray,file,convertToText,allMsgs,copyToClip,append,hdrArray,file2,msgFolder,saveAttachments);
			}
			else {
				var type = convertToText ? 2 : 1;
				if (myTxtListener.file2) 					
					createIndex(type, myTxtListener.file2, hdrArray, myTxtListener.msgFolder, false,true);
				if (saveAttachments)
					type += 7;
				IETexported = 0;
				IETtotal = 0;
				IETskipped = 0;
				IETglobalMsgFoldersExported = IETglobalMsgFoldersExported + 1;
				if (IETglobalMsgFoldersExported && IETglobalMsgFoldersExported < IETglobalMsgFolders.length) 
					exportAllMsgsStart(type,IETglobalFile,IETglobalMsgFolders[IETglobalMsgFoldersExported]);
				else if (document.getElementById("IETabortIcon"))
					document.getElementById("IETabortIcon").collapsed = true;
			}
		}
	};

   	 // This pref fixes also bug https://bugzilla.mozilla.org/show_bug.cgi?id=384127
	var HTMLasView = IETprefs.getBoolPref("extensions.importexporttools.export.HTML_as_displayed");
	// For additional headers see  http://lxr.mozilla.org/mozilla1.8/source/mailnews/mime/src/nsStreamConverter.cpp#452
	if (! HTMLasView && ! convertToText && ! copyToClip)
		uri = uri+"?header=saveas";
	var messageService = messenger.messageServiceFromURI(uri);
	var hdr = messageService.messageURIToMsgHdr(uri);
	try {
		IETlogger.write("call to  exportAsHtml - subject = " + hdr.mime2DecodedSubject + " - messageKey = " + hdr.messageKey);	
	}
	catch(e) {
		IETlogger.write("call to exportAsHtml - error = "+ e);
	}
	myTxtListener.append = append;
	myTxtListener.hdr = hdr;
	myTxtListener.file2 = file2;
	myTxtListener.msgFolder = msgFolder;

	/* With Thunderbird 5 or higher, nschannel+asyncConverter casues randomly a crash.
	This is probably due to some Javascript engine bug, for techincal details see
	https://bugzilla.mozilla.org/show_bug.cgi?id=692735
	To use streamMessage with "header=filter" additional header is a quite good compromise,
	as workaround against this bug. The HTML code generated is less clean than the one generated
	by asyncConverter; it's made cleaner ex-post in OnStopRequest function.
	Notice that streamMessage alone seems not to work with NEWS messages, so for them I'm forced
	to use the asyncConverter.
	I hope that in future the bug of asyncConverter will be fixed (it should be on 10 version) and so I've
	insert a preference to use it anyway.
	*/

	var useConverter = IETprefs.getBoolPref("extensions.importexporttools.export.use_converter");
	if (hdr.folder.server.type == "nntp" || useConverter) {
		var nsURI = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService).newURI(uri, null, null);
		var nschannel =  Components.classes["@mozilla.org/network/input-stream-channel;1"]
         	  .createInstance(Components.interfaces.nsIInputStreamChannel);
		nschannel.setURI(nsURI);
		var streamConverterService = Components.classes["@mozilla.org/streamConverters;1"]
      	   	  .getService(Components.interfaces.nsIStreamConverterService);
		var streamListner=streamConverterService.asyncConvertData("message/rfc822", "text/html", myTxtListener, nschannel);
		myTxtListener.chrset = hdr.Charset;
		messageService.streamMessage(uri, streamListner, msgWindow, null, false, null);	
	}
	else if (hdr.folder.server.type == "imap") {
		myTxtListener.chrset = "UTF-8";
		messageService.streamMessage(uri, myTxtListener, null, null, true, null);
	}
	else {
		myTxtListener.chrset = hdr.Charset;
		messageService.streamMessage(uri, myTxtListener, null, null, true, "header=filter");		
	}
}


function IETconvertToUTF8(string) {
	var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
	converter.charset = "UTF-8";
	try {
		var stringUTF8 = converter.ConvertToUnicode(string);
		return stringUTF8;
	}
	catch(e) {
		return string;
	}
}


function IETcopyToClip(data) {
	var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
	var str2 = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
	var justText = IETprefs.getBoolPref("extensions.importexporttools.clipboard.always_just_text");
	str.data = IEThtmlToText(data);

	// hack to clean the headers layout!!!
	data = data.replace(/<div class=\"headerdisplayname\" style=\"display:inline;\">/g, "<span>");

	var dataUTF8 = IETconvertToUTF8(data);
	str2.data = dataUTF8;
	var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable); 
	if (!trans) 
		return false;
	trans.addDataFlavor("text/html");
	trans.addDataFlavor("text/unicode");
	if (! justText)
		trans.setTransferData("text/html",str2,data.length*2);
	trans.setTransferData("text/unicode",str,data.length*2); 
	var clipid = Components.interfaces.nsIClipboard; 
	var clip = Components.classes["@mozilla.org/widget/clipboard;1"].getService(clipid); 
	if (!clip) 
		return false; 
	clip.setData(trans,null,clipid.kGlobalClipboard);
	return true;
}

function IEThtmlToText(data) {
	// This is necessay to avoid the subject ending with ":" can cause wrong parsing 
	data = data.replace(/\:\s*<\/td>/, "$%$%$");
	var toStr = { value: null };
	var formatConverter = Components.classes["@mozilla.org/widget/htmlformatconverter;1"].createInstance(Components.interfaces.nsIFormatConverter); 
	var fromStr = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
	var dataUTF8 = IETconvertToUTF8(data)
	fromStr.data = dataUTF8 ;
	try { 
		formatConverter.convert("text/html", fromStr, fromStr.toString().length, "text/unicode", toStr, {}); 
	} 
	catch(e) {
		dataUTF8 = dataUTF8.replace("$%$%$", ":");
		return dataUTF8;
 	} 
	if (toStr.value) {
		toStr = toStr.value.QueryInterface(Components.interfaces.nsISupportsString);
		var os = navigator.platform.toLowerCase();
		var strValue = toStr.toString();
		// Fix for TB13 empty line at the beginning
		strValue = strValue.replace(/^\r*\n/, "");
		// Correct the headers format in plain text
		if (os.indexOf("win") > -1) {
			var head = strValue.match(/(.+\r\n?)*/)[0];
			var text = strValue.replace(/(.+\r\n?)*/,"");
			var headcorrect = head.replace(/:\r\n/g, ": ");
		}
		else {
			var head = strValue.match(/(.+\n?)*/)[0];
			var text = strValue.replace(/(.+\n?)*/,"");
			var headcorrect = head.replace(/:\n/g, ": ");
		}
		var retValue = headcorrect+text;
		retValue = retValue.replace("$%$%$", ":");
		return retValue;
 	} 
	dataUTF8 = dataUTF8.replace("$%$%$", ":");
	return dataUTF8; 
} 

function exportVirtualFolder(msgFolder) {
	// To export virtual folder, it's necessary to select it really
	selectVirtualFolder();
	setTimeout(function() {exportVirtualFolderDelayed(msgFolder);},1500);
}

function exportVirtualFolderDelayed(msgFolder) {
	// Open the filepicker to choose the directory
	var file = getPredefinedFolder(0);
	if (! file) {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);
		if (fp.show) 
			var res = fp.show();	
		else
			var res = IETopenFPsync(fp);
		if (res==nsIFilePicker.returnOK) 
			file = fp.file;
		else
			return;
	}
	IETwritestatus(mboximportbundle.GetStringFromName("exportstart")); 
	IETtotal = msgFolder.getTotalMessages(false);
	if (IETtotal == 0) 
		return;
	IETexported = 0;
	var foldername = msgFolder.name;
	var clone = file.clone();
	clone.append(foldername);
	clone.createUnique(0,0644);
	var uriArray = new Array;
	for(i=0;i<IETtotal;i++) {	
		var msguri = gDBView.getURIForViewIndex(i);
		uriArray.push(msguri);
	}
	saveMsgAsEML(uriArray[0],clone,true,uriArray,null,null,false,false,null,null);
}		


function exportIMAPfolder(msgFolder,destdirNSIFILE) {
	if (! msgFolder.verifiedAsOnlineFolder) {
		alert(mboximportbundle.GetStringFromName("noRemoteExport"));
		IETglobalMsgFoldersExported  = IETglobalMsgFoldersExported + 1;
		if (IETglobalMsgFolders.length == IETglobalMsgFoldersExported)
			return;
		else
			exportIMAPfolder(IETglobalMsgFolders[IETglobalMsgFoldersExported],destdirNSIFILE);
	}
	var uriArray = new Array;
	var foldername = findGoodFolderName(msgFolder.name,destdirNSIFILE);
	if (msgFolder.getMessages)
		// Gecko 1.8 and earlier
		var msgArray = msgFolder.getMessages(null);
	else
		// Gecko 1.9
		var msgArray = msgFolder.messages;
	var clone = destdirNSIFILE.clone();
	clone.append(foldername);
	clone.createUnique(0,0644);
	IETtotal = msgFolder.getTotalMessages(false);
	IETexported = 0;
	IETskipped = 0;
	while(msgArray.hasMoreElements()) {
		var msg = msgArray.getNext();
		msg = msg.QueryInterface(Components.interfaces.nsIMsgDBHdr);
		msguri = msg.folder.getUriForMsg(msg);

		if (! msg.folder.verifiedAsOnlineFolder && ! (msg.flags & 0x00000080) ) {
			IETskipped = IETskipped + 1;
			IETtotal = IETtotal - 1;
		}
		else if (msguri) 
			uriArray.push(msguri);
	}
	IETwritestatus(mboximportbundle.GetStringFromName("exportstart")); 
	if (IETtotal > 0) 
		saveMsgAsEML(uriArray[0], clone,true,uriArray,null,null,true,false,null,null);
}

function IETwritestatus(text) {
	if (document.getElementById("statusText")) {
		document.getElementById("statusText").setAttribute("label", text);
		var delay = IETprefs.getIntPref("extensions.importexporttools.delay.clean_statusbar");
		if (delay > 0)
			window.setTimeout(function(){IETdeletestatus(text);}, delay);
	}
}

function IETdeletestatus(text) {
	if (document.getElementById("statusText").getAttribute("label") == text)
		document.getElementById("statusText").setAttribute("label", "");
}

function  IETwriteDataOnDisk(file,data,append,fname,time) {
	try {
		IETlogger.write("call to IETwriteDataOnDisk - file path = " + file.path);
	}
	catch (e) {
		IETlogger.write("call to IETwriteDataOnDisk - error = " + e);
	}
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Components.interfaces.nsIFileOutputStream);
	if (append) {
		if (fname)
			file.append(fname);
		foStream.init(file, 0x02 | 0x08 | 0x10, 0664, 0); // write,  create, append
	}
	else 
		foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate
	if (data)
		foStream.write(data,data.length);
	foStream.close();
	if (time && IETprefs.getBoolPref("extensions.importexporttools.export.set_filetime"))
		file.lastModifiedTime = time;
}

function IETwriteDataOnDiskWithCharset(file,data,append,fname,time) {
	var charset = IETprefs.getCharPref("extensions.importexporttools.export.text_plain_charset");
	if (charset.indexOf("(BOM)") > -1) {
		charset = "UTF-8";
		data = "\ufeff"+data;
	}
	try {
		// On Thunderbird 1.0 this will fail
		var os = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                   .createInstance(Components.interfaces.nsIConverterOutputStream);
	}
	catch(e) {
		IETwriteDataOnDisk(file,data,append,fname,time);
		return;
	}
	var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
		.createInstance(Components.interfaces.nsIFileOutputStream);
	if (append) {
		file.append(fname);
		foStream.init(file, 0x02 | 0x08 | 0x10, 0664, 0); // write,  create, append
	}
	else 
		foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate

	var os = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
                   .createInstance(Components.interfaces.nsIConverterOutputStream);
	os.init(foStream, charset, 0, "?".charCodeAt(0));
	if (data)
		os.writeString(data);
	os.close();
	foStream.close();
	if (time && IETprefs.getBoolPref("extensions.importexporttools.export.set_filetime"))
		file.lastModifiedTime = time;
}

function copyMSGtoClip() {
	var uris = IETgetSelectedMessages();
	var msguri  = uris[0];
	if (! msguri)
		return;
	exportAsHtml(msguri,null,null, null, null,true,null,null,null,null);
}

var copyHeaders = {
   getListner: function() {
        var myListner = {
	   
	   data : "",

            QueryInterface : function(iid)  {
                if (iid.equals(Components.interfaces.nsIStreamListener) ||   
                    iid.equals(Components.interfaces.nsIMsgHeaderSink) ||
                    iid.equals(Components.interfaces.nsISupports))
                 return this;
        
                throw Components.results.NS_NOINTERFACE;
                return 0;
            },
        
            onStartRequest : function (aRequest, aContext) {},
            
            onStopRequest : function (aRequest, aContext, aStatusCode) {
			if (! this.remote)
				IETcopyStrToClip(this.data);
			else {
				var data = this.data.replace(/\r/g, "");
				var headers = data.substring(0,data.indexOf("\n\n"));
				IETcopyStrToClip(headers);
			}
			return true;				
		},			
            
		onDataAvailable : function (aRequest, aContext, aInputStream, aOffset, aCount) {
			if (this.remote) {
				var scriptStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
		                     	createInstance().QueryInterface(Components.interfaces.nsIScriptableInputStream);
				scriptStream.init(aInputStream);
		           	this.data +=scriptStream.read(20000);
			}
			else {
				var channel = aRequest.QueryInterface(Components.interfaces.nsIChannel);
				var msgMailUrl = channel.URI.QueryInterface(Components.interfaces.nsIMsgMailNewsUrl);
				this.data = msgMailUrl.mimeHeaders.allHeaders;
			}
		}
        };
       return myListner;
    },

	start: function() {
	        var mess  = IETgetSelectedMessages()
		var msguri = mess[0];
		var mms = messenger.messageServiceFromURI(msguri).QueryInterface(Components.interfaces.nsIMsgMessageService);
		var streamListner = copyHeaders.getListner();
		if (msguri.indexOf("news") == 0 || msguri.indexOf("imap") ==0) 
			streamListner.remote = true;
		mms.streamMessage(msguri, streamListner, msgWindow, null, false, "filter");
	}
};

function IETescapeBeginningFrom(data) {
	// Workaround to fix the "From " in beginning line problem in body messages
	// See https://bugzilla.mozilla.org/show_bug.cgi?id=119441 and
	// https://bugzilla.mozilla.org/show_bug.cgi?id=194382
	// TB2 has uncorrect beahviour with html messages
	// This is not very fine, but I didnt' find anything better...
	var datacorrected = data.replace(/\nFrom /g, "\n From ");
	return datacorrected;
}

function IETstoreHeaders(msg, msguri, subfile,addBody) {
	var subMaxLen = IETprefs.getIntPref("extensions.importexporttools.subject.max_length")-1;
	var authMaxLen = IETprefs.getIntPref("extensions.importexporttools.author.max_length")-1;
	var recMaxLen = IETprefs.getIntPref("extensions.importexporttools.recipients.max_length")-1;
	try {
		// Cut the subject, the author and the recipients at 50 chars
		if (msg.mime2DecodedSubject) 
			var realsubject = msg.mime2DecodedSubject.substring(0, subMaxLen);
		else
			var realsubject = IETnosub;
	}
	catch(e) {
		var realsubject = IETnosub;
	}
	// Has the message the reply flag?
	if (msg.flags & 0x0010) 
		realsubject = "Re: "+realsubject;
	try {
		var author = msg.mime2DecodedAuthor.substring(0,authMaxLen);
	}
	catch(e) {
		var author = "***";
	}
	var time = msg.date;
	try {
		var recipients = msg.mime2DecodedRecipients ? msg.mime2DecodedRecipients.substring(0,recMaxLen) : "";
	}
	catch(e) {
		var recipients = "***";
	}
	author = author.replace("<", "&lt;");
	author = author.replace(">", "&gt;");
	author = author.replace(/\"/,"");
	author = author.replace(/^ +/, "");
	recipients = recipients.replace("<", "&lt;");
	recipients = recipients.replace(">", "&gt;");
	recipients = recipients.replace(/\"/,"");
	recipients = recipients.replace(/^ +/, "");
	// Correct the name of the subject, because it will be also the name of the file html
	var subject = getSubjectForHdr(msg,subfile.path);
	// Has attachments?	
	var hasAtt = (msg.flags & 0x10000000) ? 1 : 0;

	if (addBody) 
		var body = IETstoreBody(msguri);
	else
		var body = "";

	// Store the data in the arrays	
	// The time must have always 17 chars, otherwise the sorting will be wrong
	// so we add zeros at beginning until the length is 17 chars
	while (time.toString().length < 17)
		time = "0"+time;
	// The sequence §][§^^§ is the headers separator in hdrStr variable. I hope that nobody
	// will insert §][§^^§ in subject....but why should (s)he write it???
	switch (IETsortType) {
		case 1: 
			var hdrStr = realsubject+"§][§^^§"+recipients+"§][§^^§"+author+"§][§^^§"+time+"§][§^^§"+subject+"§][§^^§"+msguri+"§][§^^§"+hasAtt+"§][§^^§"+body;
			break;
					
		case 2:
			var hdrStr = author+"§][§^^§"+realsubject+"§][§^^§"+recipients+"§][§^^§"+time+"§][§^^§"+subject+"§][§^^§"+msguri+"§][§^^§"+hasAtt+"§][§^^§"+body;
			break;
				
		case 3:
			var hdrStr = recipients+"§][§^^§"+realsubject+"§][§^^§"+author+"§][§^^§"+time+"§][§^^§"+subject+"§][§^^§"+msguri+"§][§^^§"+hasAtt+"§][§^^§"+body;
			break;
				
		default:
			var hdrStr = time+"§][§^^§"+realsubject+"§][§^^§"+recipients+"§][§^^§"+author+"§][§^^§"+subject+"§][§^^§"+msguri+"§][§^^§"+hasAtt+"§][§^^§"+body;
	}
	// If the subject begins with a lowercase letter, the sorting will be wrong
	// so it is changed in uppercase. To track this and restore the original
	// first letter, we add a flag to the realsubject variable (0 or 1 at the end)
	if (hdrStr.substring(0,1) == hdrStr.substring(0,1).toUpperCase()) 
		hdrStr = hdrStr +"§][§^^§" + "0";
	else {
		hdrStr = hdrStr.substring(0,1).toUpperCase() + hdrStr.substring(1);
		hdrStr = hdrStr +"§][§^^§" + "1";
	}
	return hdrStr;
}

function IETstoreBody(msguri) {
	var content = "";
	var MsgService = messenger.messageServiceFromURI(msguri);
	var MsgStream =  Components.classes["@mozilla.org/network/sync-stream-listener;1"].createInstance();
	var consumer = MsgStream.QueryInterface(Components.interfaces.nsIInputStream);
	var ScriptInput = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance();
	var ScriptInputStream = ScriptInput.QueryInterface(Components.interfaces.nsIScriptableInputStream);
	ScriptInputStream.init(consumer);
	try {
		MsgService.streamMessage(msguri, MsgStream, null, null, true, "header=filter");
	} 
	catch (e) {
		return content;
	}
	ScriptInputStream.available();
	while (ScriptInputStream .available()) {
		content = content + ScriptInputStream.read(512);
	}

	var toStr = { value: null };
	var formatConverter = Components.classes["@mozilla.org/widget/htmlformatconverter;1"].createInstance(Components.interfaces.nsIFormatConverter); 
	var fromStr = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
	var dataUTF8 = IETconvertToUTF8(content);
	fromStr.data = dataUTF8 ;
	try { 
		formatConverter.convert("text/html", fromStr, fromStr.toString().length, "text/unicode", toStr, {}); 
	} 
	catch(e) {
		var text = dataUTF8;
 	} 
	if (toStr.value) {
		toStr = toStr.value.QueryInterface(Components.interfaces.nsISupportsString);
		var os = navigator.platform.toLowerCase();
		var strValue = toStr.toString();
		if (os.indexOf("win") > -1) 
			var text = strValue.replace(/(.+\r\n?)*/,"");
		else 
			var text = strValue.replace(/(.+\n?)*/,"");
		text = text.replace(/\r?\n+/g, "\r\n");
		text = text.replace(/^(\r\n)/g, "");
		text = text.replace(/(\r\n)$/g, "");
 	} 
	text = text.replace("$%$%$", ":");
	text = text.replace(/\"/g,'""');
	text = '"'+text+'"';
	
	IETexported = IETexported + 1;
	IETwritestatus(mboximportbundle.GetStringFromName("exported")+" "+IETexported+" "+mboximportbundle.GetStringFromName("msgs")+" "+(IETtotal+IETskipped));
	return text;
}




	
