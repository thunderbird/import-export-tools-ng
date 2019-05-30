var IETprefs = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);

function IETrunTimeDisable() {
	IETprefs.setIntPref("dom.max_chrome_script_run_time", 0);
}	

function IETrunTimeEnable(seconds) {
	IETprefs.setIntPref("dom.max_chrome_script_run_time", seconds);
}

function IETsetComplexPref(prefname,value) {
	if (IETprefs.setStringPref) {
		IETprefs.setStringPref(prefname,value);
	}
	else {
		var str = Components.classes["@mozilla.org/supports-string;1"]
			.createInstance(Components.interfaces.nsISupportsString);
		str.data = value;
		IETprefs.setComplexValue(prefname, Components.interfaces.nsISupportsString, str);
	}
}

function IETgetComplexPref(prefname) {
	var value;
	if (IETprefs.getStringPref) 
		value = IETprefs.getStringPref(prefname);
	else
		value = IETprefs.getComplexValue(prefname,Components.interfaces.nsISupportsString).data;
	return value;
}

function getPredefinedFolder(type) {
	// type 0 = folder
	// type 1 = all messages
	// type 2 = selected messages
	switch(type) {
		case 0 : var use_dir = "extensions.importexporttools.exportMBOX.use_dir";
			var dir_path = "extensions.importexporttools.exportMBOX.dir";
			break;
		case 1 : var use_dir = "extensions.importexporttools.exportEML.use_dir";
			var dir_path = "extensions.importexporttools.exportEML.dir";
			break;
		default : var use_dir = "extensions.importexporttools.exportMSG.use_dir";
			var dir_path = "extensions.importexporttools.exportMSG.dir";
	}
	if (! IETprefs.getBoolPref(use_dir))
		return null;
	try {
		var dirPathValue = IETgetComplexPref(dir_path);
		if (IETprefs.getPrefType(dir_path) == 0 || dirPathValue == "")
			return null;
		else {
			var localFile = Components.classes["@mozilla.org/file/local;1"]
			.createInstance(Components.interfaces.nsIFile);
			localFile.initWithPath(dirPathValue);
			if (localFile.exists())
				return localFile;
			else
				return null;
		}
	}
	catch(e) {
		return null;
	}
}

function getSubjectForHdr(hdr,dirPath) {
	var emlNameType = IETprefs.getIntPref("extensions.importexporttools.exportEML.filename_format");	
	var mustcorrectname = IETprefs.getBoolPref("extensions.importexporttools.export.filenames_toascii");
	var cutSubject =  IETprefs.getBoolPref("extensions.importexporttools.export.cut_subject");
	var cutFileName = IETprefs.getBoolPref("extensions.importexporttools.export.cut_filename");
	var subMaxLen = cutSubject ? 50 : -1;

	// Subject
	if (hdr.mime2DecodedSubject) {
		var subj = hdr.mime2DecodedSubject;
		if (hdr.flags & 0x0010) 
			subj="Re_"+subj;
	}
	else
		var subj =IETnosub;
	if (subMaxLen > 0)
	 	subj = subj.substring(0, subMaxLen);
	subj = nametoascii(subj);

	// Date - Key
	var dateInSec = hdr.dateInSeconds;
	var msgDate8601string = dateInSecondsTo8601(dateInSec);
	var key = hdr.messageKey;

	if (emlNameType == 2) {
		var pattern = IETprefs.getCharPref("extensions.importexporttools.export.filename_pattern");
		// Name
		var authName = formatNameForSubject(hdr.mime2DecodedAuthor, false);
		var recName = formatNameForSubject(hdr.mime2DecodedRecipients, true);
		// Sent of Drafts folder
		var isSentFolder = hdr.folder.flags & 0x0200 ||  hdr.folder.flags & 0x0400;
		var isSentSubFolder = hdr.folder.URI.indexOf("/Sent/");
		if ( isSentFolder || isSentSubFolder > -1)
			var smartName = recName;
		else 
			var smartName = authName;

		pattern = pattern.replace("%s",subj);
		pattern = pattern.replace("%k",key);
		pattern = pattern.replace("%d", msgDate8601string);
		pattern = pattern.replace("%n", smartName);
		pattern = pattern.replace("%a", authName);
		pattern = pattern.replace("%r", recName);
		pattern = pattern.replace(/-%e/g, "");
		if (IETprefs.getBoolPref("extensions.importexporttools.export.filename_add_prefix")) {
			var prefix = IETgetComplexPref("extensions.importexporttools.export.filename_prefix");
			pattern = prefix + pattern;
		}
		var fname = pattern;
	}
	else {
		var fname = msgDate8601string+"-"+subj+"-"+hdr.messageKey;
	}
	fname = fname.replace(/[\x00-\x1F]/g,"_");
	if (mustcorrectname)
		fname = nametoascii(fname);
	else
		fname = fname.replace(/[\/\\:,<>*\?\"\|\']/g,"_");
		
	if (cutFileName) {
		var maxFN = 249 - dirPath.length;
		if (fname.length > maxFN)
			fname = fname.substring(0,maxFN);
	}
	return fname;
}

function formatNameForSubject(str,recipients) {
	if (recipients)
		str = str.replace(/\s*\,.+/,"");
	if (str.indexOf("<") > -1)
		str = str.replace(/\s*<.+>/, "");
	else
		str = str.replace(/[@\.]/g, "_");
	return str;
}

function dateInSecondsTo8601(secs) {
	var addTime = IETprefs.getBoolPref("extensions.importexporttools.export.filenames_addtime");
	var msgDate = new Date(secs*1000);
	var msgDate8601 = msgDate.getFullYear();
	if (msgDate.getMonth() < 9)
		var month = "0"+(msgDate.getMonth()+1);
	else
		var month = msgDate.getMonth()+1;
	if (msgDate.getDate() < 10)
		var day = "0"+ msgDate.getDate();
	else
		var day = msgDate.getDate();
	var msgDate8601string = msgDate8601.toString()+month.toString()+day.toString();
	if (addTime &&  IETprefs.getIntPref("extensions.importexporttools.exportEML.filename_format") == 2) {
		if (msgDate.getHours() < 10)
			var hours = "0"+msgDate.getHours();
		else
			var hours = msgDate.getHours();
		if (msgDate.getMinutes() < 10)
			var min = "0"+msgDate.getMinutes();
		else
			var min = msgDate.getMinutes();
		msgDate8601string += "-"+ hours.toString() + min.toString();
	}
	return msgDate8601string;
}

function IETexport_all(just_mail) {
	if ( (IETprefs.getBoolPref("extensions.importexporttools.export_all.warning1") && ! just_mail) || (IETprefs.getBoolPref("extensions.importexporttools.export_all.warning2") && just_mail) ) {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Components.interfaces.nsIPromptService);
		var check = {value: false};
		var result = prompts.confirmCheck(null, "ImportExportTools", mboximportbundle.GetStringFromName("backupWarning"), mboximportbundle.GetStringFromName("noWaring") , check); 
		if (just_mail)
			IETprefs.setBoolPref("extensions.importexporttools.export_all.warning2", ! check.value);
		else
			IETprefs.setBoolPref("extensions.importexporttools.export_all.warning1", ! check.value);
		if (! result) 
			return;
	}

	// Open the filepicker to choose the directory
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);
	if (fp.show) 
		var res = fp.show();	
	else
		var res = IETopenFPsync(fp);
	if (res==nsIFilePicker.returnOK) 
		var file = fp.file;
	else
		return;

	IETwritestatus(mboximportbundle.GetStringFromName("exportstart"));
	setTimeout(IETexport_all_delayed, 1000, just_mail,file);
}
	
function  IETexport_all_delayed(just_mail,file) {
	// get profile directory
	var profDir = Components.classes["@mozilla.org/file/directory_service;1"]
           .getService(Components.interfaces.nsIProperties)
           .get("ProfD", Components.interfaces.nsIFile);
	var date = buildContainerDirName();
	file.append(profDir.leafName+"-"+date);
	file.createUnique(1,0755);
	if (just_mail) {
		profDir.append("Mail");
		profDir.copyTo(file,"");
		var profDir2 = profDir.parent;
		profDir2.append("ImapMail");
		if (profDir2.exists())
			profDir2.copyTo(file,"");
	}	
	else {
		var entries = profDir.directoryEntries;
		var array = [];
		while(entries.hasMoreElements()) {
			var entry = entries.getNext();	
			entry.QueryInterface(Components.interfaces.nsIFile);
			if (entry.leafName != "lock" && entry.leafName != "parent.lock")
				entry.copyTo(file,"");
		}
	}
	var clone = file.clone();
	saveExternalMailFolders(clone,profDir);
	IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	return file;
}

function saveExternalMailFolders(file) {
	var profDir = Components.classes["@mozilla.org/file/directory_service;1"]
           .getService(Components.interfaces.nsIProperties)
           .get("ProfD", Components.interfaces.nsIFile);
	file.append("ExternalMailFolders");
	file.create(1,0775);
	var servers = Components.classes["@mozilla.org/messenger/account-manager;1"]
	.getService(Components.interfaces.nsIMsgAccountManager).allServers;
	if (servers.Count) {
		var nsIArray = false;
		var cntServers = servers.Count();
	}
	else {
		var nsIArray = true;
		var cntServers = servers.length;
	}
	// Scan servers storage path on disk
	for (var i = 0; i < cntServers; ++i) {
		if (nsIArray) 
			var serverFile = servers.queryElementAt(i, Components.interfaces.nsIMsgIncomingServer).localPath;	
		else
			var serverFile = servers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer).localPath;
		var parentDir = null;
		if (serverFile.parent && serverFile.parent.parent)
			parentDir = serverFile.parent.parent;
		if (! parentDir || ! profDir.equals(parentDir)) {
			var index = 1;
			var fname = serverFile.leafName;
			while(true) {
				var clone = file.clone();
				clone.append(fname);
				if (clone.exists()) {
					fname = fname + "-"+index.toString();
					index++;
				}
				else
					break;
			}			
			// The server storage path on disk is outside the profile, so copy it
			serverFile.copyTo(file,"");
		}
	}
}

function IETformatWarning(warning_type) {
	if (warning_type == 0 && ! IETprefs.getBoolPref("extensions.importexporttools.export.format_warning") )
		return true;
	if (warning_type == 1 && ! IETprefs.getBoolPref("extensions.importexporttools.export.import_warning") )
		return true;
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Components.interfaces.nsIPromptService);
	var check = {value: false};
	if (warning_type == 0)  {
		var text = mboximportbundle.GetStringFromName("formatWarning");
		var pref = "extensions.importexporttools.export.format_warning";
	}
	else {
		var text = mboximportbundle.GetStringFromName("formatWarningImport");
		var pref = "extensions.importexporttools.export.import_warning";
	}
	var result = prompts.confirmCheck(null, "ImportExportTools", text , mboximportbundle.GetStringFromName("noWaring") , check); 
	IETprefs.setBoolPref(pref, ! check.value);
	return result;
}

function IETremoteWarning() {
	if ( ! IETprefs.getBoolPref("extensions.importexporttools.export.remote_warning") )
		return true;
	var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Components.interfaces.nsIPromptService);
	var check = {value: false};
	var result = prompts.confirmCheck(null, "ImportExportTools", mboximportbundle.GetStringFromName("remoteWarning"), mboximportbundle.GetStringFromName("noWaring") , check); 
	IETprefs.setBoolPref("extensions.importexporttools.export.remote_warning", ! check.value);
	return result;
}

function isMbox(file) {
	if (file.isDirectory() || ! file.exists())
		return 0;
	if (file.fileSize == 0)
		return 1;
	try {
		// check if the file is a mbox file, reading the first 4 chars.
		// a mbox file must begin with "From"
		var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
	                .createInstance(Components.interfaces.nsIFileInputStream);
		istream.init(file, 0x01, 0444, 0);
		istream.QueryInterface(Components.interfaces.nsILineInputStream);
		var line = {};
		istream.readLine(line);
		istream.close();
		if (line.value.indexOf("From ???@???") == 0)
			return 2;		
		var first4chars = line.value.substring(0,4);
		if ( first4chars != "From" )
			return 0;
		else
			return 1;
	}
	catch(e) { return 0; }
}

function IETstr_converter(str) {
	var convStr;
	try {
		var charset = IETprefs.getCharPref("extensions.importexporttools.export.filename_charset");
		if (charset == "")
			return str;
		var uConv = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
		.createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
		uConv.charset = charset;
		convStr = uConv.ConvertFromUnicode(str);
	}
	catch(e) {
		return str;
	}
	return convStr;	
}

function nametoascii(str) {
	if (! IETprefs.getBoolPref("extensions.importexporttools.export.filenames_toascii")) {
		str = str.replace(/[\x00-\x19]/g,"_");
		return str.replace(/[\/\\:,<>*\?\"\|]/g,"_");
	}
	if (str)
		str = str.replace(/[^a-zA-Z0-9\-]/g,"_");
	else
		str = "Undefinied_or_empty";
	return str;
}

function buildContainerDirName() {
	// Build the name for the container directory
	var myDate=new Date();
	var datedir = myDate.getFullYear().toString();
	if (myDate.getMonth()+1 > 9)
	 	datedir = datedir + (myDate.getMonth()+1).toString();
	else
		datedir = datedir + "0" + (myDate.getMonth()+1).toString();
	if (myDate.getDate()>9)
		datedir = datedir + myDate.getDate().toString();
	else
		datedir = datedir + "0" + myDate.getDate().toString();
	var hours = myDate.getHours();
	var minutes = myDate.getMinutes();
	if (hours < 10)
		datedir = datedir + "-0" + hours;
	else
		datedir = datedir + "-" + hours;
	if (minutes < 10)
		datedir = datedir + "0" + minutes;
	else
		datedir = datedir + minutes;
	return datedir;
}

function IETcopyStrToClip(str) {
	var clip = Components.classes["@mozilla.org/widget/clipboardhelper;1"]
		.getService(Components.interfaces.nsIClipboardHelper);
	clip.copyString(str);
}

function IETcleanName(str) {
	str = str.replace(/[\\:?"\*\/<>#]/g, "_");
	str = str.replace(/[\x00-\x19]/g,"_");
	return str;
}

function IETgetExt(type) {
	if (type == 1 || type == 8)
		return ".html";
	else if (type == 0)
		return ".eml";
	else
		return ".txt";
}

// credit for this code to Jorg K
// see https://bugzilla.mozilla.org/show_bug.cgi?id=1427722
function IETopenFPsync(fp) {
	let done = false;
	let rv, result;
	fp.open(result => {
		rv = result;
		done = true;
	});
	let thread = Components.classes["@mozilla.org/thread-manager;1"].getService().currentThread;
	while (!done) {
		thread.processNextEvent(true);
	}
	return rv;
}

function IETgetPickerModeFolder() {
	var dir = null;
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);
	if (fp.show) 
		var res = fp.show();	
	else
		var res = IETopenFPsync(fp);
	if (res==nsIFilePicker.returnOK) {
		dir = fp.file;		
		if (dir && ! dir.isWritable()) {
			alert(mboximportbundle.GetStringFromName("nowritable")); 
			dir = null;
		}
	}
	return dir;
}

function IETpickFile(el) {
	var box = el.previousSibling;
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"]
		.createInstance(nsIFilePicker);
	fp.init(window, "", nsIFilePicker.modeGetFolder);
	if (fp.show) 
		var res = fp.show();	
	else
		var res = IETopenFPsync(fp);
	if (res == nsIFilePicker.returnOK)			
		box.value = fp.file.path;
}

function IETemlx2eml(file) {
	// For EMLX files, see http://mike.laiosa.org/2009/03/01/emlx.html
	var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].  
              createInstance(Components.interfaces.nsIFileInputStream);  
	istream.init(file, 0x01, 0444, 0);  
	istream.QueryInterface(Components.interfaces.nsILineInputStream);  
	var firstLine = true;  
	
	// read lines into array  
	var line = {}, lines = [], hasmore;  
	do {
		hasmore = istream.readLine(line); 
		if (line.value.indexOf("<?xml version=") > -1) {
			line.value =" ";
			hasmore = false;
		}
		if (! firstLine) 
			lines.push(line.value);   
		else
			firstLine = false;
	} while(hasmore);  
  	istream.close();  
  	var data = lines.join("\r\n");
	var tempFile = 	Components.classes["@mozilla.org/file/directory_service;1"]
                    .getService(Components.interfaces.nsIProperties)
                    .get("TmpD", Components.interfaces.nsIFile);
	tempFile.append(file.leafName+".eml");
	tempFile.createUnique(0, 0666);
	 var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].  
                   createInstance(Components.interfaces.nsIFileOutputStream);  
	foStream.init(tempFile, 0x02 | 0x08 | 0x20, 0666, 0);   
	foStream.write(data,data.length);  
	foStream.close();
	var extService = Components.classes['@mozilla.org/uriloader/external-helper-app-service;1']
		.getService(Components.interfaces.nsPIExternalAppLauncher)
	extService.deleteTemporaryFileOnExit(tempFile);
	return tempFile;
}

function IETstoreFormat() {
	// it will return 0 for Mbox format, 1 for Maildir format, 2 for unknown format
	var msgFolder = GetSelectedMsgFolders()[0];
	var storeFormat = 0;
	try {
		var store = msgFolder.server.getCharValue("storeContractID");
		if (store && store.indexOf("maildirstore") > -1)
			storeFormat = 1;
		else if (store && store.indexOf("berkeleystore") < 0)
			storeFormat = 2;
	}
	catch(e) {}
	return storeFormat;
}

function IETgetSelectedMessages() {
	// TB3 has not GetSelectedMessages function
	if ( typeof GetSelectedMessages  == "undefined" )
		 var msgs  = gFolderDisplay.selectedMessageUris;
	else
		var msgs = GetSelectedMessages();
	return msgs;
}

var IETlogger = {
	write : function(string) {
		if (! IETprefs.getBoolPref("extensions.importexporttools.log.enable"))
			return;
		if (! IETlogger.file) {
			IETlogger.file = Components.classes["@mozilla.org/file/directory_service;1"]
	                     .getService(Components.interfaces.nsIProperties)
	                     .get("ProfD", Components.interfaces.nsIFile);
			IETlogger.file.append("ImportExportTools.log");
		}
		var now = new Date();
		var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                     .createInstance(Components.interfaces.nsIFileOutputStream);
		if (IETlogger.file.exists() && IETlogger.file.fileSize > 204800)
			var flag = "0x20";
		else
			var flag = "0x10";
		foStream.init(IETlogger.file, 0x02 | 0x08 | flag, 0664, 0);
		var data = now.getTime() + ": " + string + "\r\n";
		foStream.write(data, data.length);
		foStream.close();
	}		
};

function IETemlArray2hdrArray(emlsArray,needBody, file) {
	var hdrArray = [];
	for (var k=0;k<emlsArray.length;k++) {
		var msguri = emlsArray[k];
		var msserv = messenger.messageServiceFromURI(msguri);
		var msg = msserv.messageURIToMsgHdr(msguri);
		var hdrStr = IETstoreHeaders(msg,msguri,file,needBody);
		hdrArray.push(hdrStr);
	}
	return hdrArray;
}


