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

// cleidigh - reformat, services, globals

/* eslint-disable no-control-regex */

/* global
IETformatWarning,
IETwritestatus,
GetSelectedMsgFolders,
IETprefs,
IETnosub,
mboximportbundle,
GetSelectedMessages,
IETstoreHeaders,
*/

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

var IETprefs = Cc["@mozilla.org/preferences-service;1"]
	.getService(Ci.nsIPrefBranch);

function IETrunTimeDisable() {
	IETprefs.setIntPref("dom.max_chrome_script_run_time", 0);
}

function IETrunTimeEnable(seconds) {
	IETprefs.setIntPref("dom.max_chrome_script_run_time", seconds);
}

function IETsetComplexPref(prefname, value) {
	if (IETprefs.setStringPref) {
		IETprefs.setStringPref(prefname, value);
	} else {
		var str = Cc["@mozilla.org/supports-string;1"]
			.createInstance(Ci.nsISupportsString);
		str.data = value;
		IETprefs.setComplexValue(prefname, Ci.nsISupportsString, str);
	}
}

function IETgetComplexPref(prefname) {
	var value;
	if (IETprefs.getStringPref)
		value = IETprefs.getStringPref(prefname);
	else
		value = IETprefs.getComplexValue(prefname, Ci.nsISupportsString).data;
	return value;
}

function getPredefinedFolder(type) {
	// type 0 = folder
	// type 1 = all messages
	// type 2 = selected messages

	var use_dir;
	var dir_path;

	switch (type) {
		case 0:
			use_dir = "extensions.importexporttoolsng.exportMBOX.use_dir";
			dir_path = "extensions.importexporttoolsng.exportMBOX.dir";
			break;
		case 1:
			use_dir = "extensions.importexporttoolsng.exportEML.use_dir";
			dir_path = "extensions.importexporttoolsng.exportEML.dir";
			break;
		default:
			use_dir = "extensions.importexporttoolsng.exportMSG.use_dir";
			dir_path = "extensions.importexporttoolsng.exportMSG.dir";
	}
	if (!IETprefs.getBoolPref(use_dir))
		return null;
	try {
		var dirPathValue = IETgetComplexPref(dir_path);
		if (IETprefs.getPrefType(dir_path) === 0 || dirPathValue === "")
			return null;

		var localFile = Cc["@mozilla.org/file/local;1"]
			.createInstance(Ci.nsIFile);
		localFile.initWithPath(dirPathValue);
		if (localFile.exists())
			return localFile;

		return null;
	} catch (e) {
		return null;
	}
}

function getSubjectForHdr(hdr, dirPath) {
	var emlNameType = IETprefs.getIntPref("extensions.importexporttoolsng.exportEML.filename_format");
	var mustcorrectname = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_toascii");
	var cutSubject = IETprefs.getBoolPref("extensions.importexporttoolsng.export.cut_subject");
	var cutFileName = IETprefs.getBoolPref("extensions.importexporttoolsng.export.cut_filename");
	var subMaxLen = cutSubject ? 50 : -1;

	// Subject
	var subj;
	if (hdr.mime2DecodedSubject) {
		subj = hdr.mime2DecodedSubject;
		if (hdr.flags & 0x0010)
			subj = "Re_" + subj;
	} else {
		subj = IETnosub;
	}

	if (subMaxLen > 0)
		subj = subj.substring(0, subMaxLen);
	subj = nametoascii(subj);

	// Date - Key
	var dateInSec = hdr.dateInSeconds;
	var msgDate8601string = dateInSecondsTo8601(dateInSec);
	var key = hdr.messageKey;

	var fname;

	if (emlNameType === 2) {
		var pattern = IETprefs.getCharPref("extensions.importexporttoolsng.export.filename_pattern");
		// Name
		var authName = formatNameForSubject(hdr.mime2DecodedAuthor, false);
		var recName = formatNameForSubject(hdr.mime2DecodedRecipients, true);
		// Sent of Drafts folder
		var isSentFolder = hdr.folder.flags & 0x0200 || hdr.folder.flags & 0x0400;
		var isSentSubFolder = hdr.folder.URI.indexOf("/Sent/");
		var smartName;

		if (isSentFolder || isSentSubFolder > -1)
			smartName = recName;
		else
			smartName = authName;

		pattern = pattern.replace("%s", subj);
		pattern = pattern.replace("%k", key);
		pattern = pattern.replace("%d", msgDate8601string);
		pattern = pattern.replace("%n", smartName);
		pattern = pattern.replace("%a", authName);
		pattern = pattern.replace("%r", recName);
		pattern = pattern.replace(/-%e/g, "");
		if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_add_prefix")) {
			var prefix = IETgetComplexPref("extensions.importexporttoolsng.export.filename_prefix");
			pattern = prefix + pattern;
		}
		fname = pattern;
	} else {
		fname = msgDate8601string + "-" + subj + "-" + hdr.messageKey;
	}
	fname = fname.replace(/[\x00-\x1F]/g, "_");
	if (mustcorrectname)
		fname = nametoascii(fname);
	else
		fname = fname.replace(/[\/\\:,<>*\?\"\|\']/g, "_");

	if (cutFileName) {
		var maxFN = 249 - dirPath.length;
		if (fname.length > maxFN)
			fname = fname.substring(0, maxFN);
	}
	return fname;
}

function formatNameForSubject(str, recipients) {
	if (recipients)
		str = str.replace(/\s*\,.+/, "");
	if (str.indexOf("<") > -1)
		str = str.replace(/\s*<.+>/, "");
	else
		str = str.replace(/[@\.]/g, "_");
	return str;
}

function dateInSecondsTo8601(secs) {
	var addTime = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_addtime");
	var msgDate = new Date(secs * 1000);
	var msgDate8601 = msgDate.getFullYear();
	var month;
	var day;
	var hours;
	var min;

	if (msgDate.getMonth() < 9)
		month = "0" + (msgDate.getMonth() + 1);
	else
		month = msgDate.getMonth() + 1;
	if (msgDate.getDate() < 10)
		day = "0" + msgDate.getDate();
	else
		day = msgDate.getDate();
	var msgDate8601string = msgDate8601.toString() + month.toString() + day.toString();
	if (addTime && IETprefs.getIntPref("extensions.importexporttoolsng.exportEML.filename_format") === 2) {
		if (msgDate.getHours() < 10)
			hours = "0" + msgDate.getHours();
		else
			hours = msgDate.getHours();
		if (msgDate.getMinutes() < 10)
			min = "0" + msgDate.getMinutes();
		else
			min = msgDate.getMinutes();

		msgDate8601string += "-" + hours.toString() + min.toString();
	}
	return msgDate8601string;
}

function IETexport_all(just_mail) {
	if ((IETprefs.getBoolPref("extensions.importexporttoolsng.export_all.warning1") && !just_mail) || (IETprefs.getBoolPref("extensions.importexporttoolsng.export_all.warning2") && just_mail)) {
		var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Ci.nsIPromptService);
		var check = { value: false };
		var result = prompts.confirmCheck(null, "ImportExportTools NG", mboximportbundle.GetStringFromName("backupWarning"), mboximportbundle.GetStringFromName("noWaring"), check);
		if (just_mail)
			IETprefs.setBoolPref("extensions.importexporttoolsng.export_all.warning2", !check.value);
		else
			IETprefs.setBoolPref("extensions.importexporttoolsng.export_all.warning1", !check.value);
		if (!result)
			return;
	}

	// Open the filepicker to choose the directory
	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);
	var res;

	if (fp.show)
		res = fp.show();
	else
		res = IETopenFPsync(fp);
	if (res === nsIFilePicker.returnOK)
		var file = fp.file;
	else
		return;

	IETwritestatus(mboximportbundle.GetStringFromName("exportstart"));
	setTimeout(IETexport_all_delayed, 1000, just_mail, file);
}

function IETexport_all_delayed(just_mail, file) {
	// get profile directory
	var profDir = Cc["@mozilla.org/file/directory_service;1"]
		.getService(Ci.nsIProperties)
		.get("ProfD", Ci.nsIFile);
	var date = buildContainerDirName();
	file.append(profDir.leafName + "-" + date);
	file.createUnique(1, 0755);
	if (just_mail) {
		profDir.append("Mail");
		profDir.copyTo(file, "");
		var profDir2 = profDir.parent;
		profDir2.append("ImapMail");
		if (profDir2.exists())
			profDir2.copyTo(file, "");
	} else {
		var entries = profDir.directoryEntries;
		var array = [];
		while (entries.hasMoreElements()) {
			var entry = entries.getNext();
			entry.QueryInterface(Ci.nsIFile);
			if (entry.leafName !== "lock" && entry.leafName !== "parent.lock")
				entry.copyTo(file, "");
		}
	}
	var clone = file.clone();
	saveExternalMailFolders(clone, profDir);
	IETwritestatus(mboximportbundle.GetStringFromName("exportOK"));
	return file;
}

function saveExternalMailFolders(file) {
	var profDir = Cc["@mozilla.org/file/directory_service;1"]
		.getService(Ci.nsIProperties)
		.get("ProfD", Ci.nsIFile);
	file.append("ExternalMailFolders");
	file.create(1, 0775);
	var servers = Cc["@mozilla.org/messenger/account-manager;1"]
		.getService(Ci.nsIMsgAccountManager).allServers;

	var nsIArray;
	var cntServers;
	var serverFile;

	if (servers.Count) {
		nsIArray = false;
		cntServers = servers.Count();
	} else {
		nsIArray = true;
		cntServers = servers.length;
	}
	// Scan servers storage path on disk
	for (var i = 0; i < cntServers; ++i) {
		if (nsIArray)
			serverFile = servers.queryElementAt(i, Ci.nsIMsgIncomingServer).localPath;
		else
			serverFile = servers.GetElementAt(i).QueryInterface(Ci.nsIMsgIncomingServer).localPath;
		var parentDir = null;
		if (serverFile.parent && serverFile.parent.parent)
			parentDir = serverFile.parent.parent;
		if (!parentDir || !profDir.equals(parentDir)) {
			var index = 1;
			var fname = serverFile.leafName;
			while (true) {
				var clone = file.clone();
				clone.append(fname);
				if (clone.exists()) {
					fname = fname + "-" + index.toString();
					index++;
				} else {
					break;
				}
			}
			// The server storage path on disk is outside the profile, so copy it
			serverFile.copyTo(file, "");
		}
	}
}

function IETformatWarning(warning_type) {
	if (warning_type === 0 && !IETprefs.getBoolPref("extensions.importexporttoolsng.export.format_warning"))
		return true;
	if (warning_type === 1 && !IETprefs.getBoolPref("extensions.importexporttoolsng.export.import_warning"))
		return true;
	var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Ci.nsIPromptService);
	var check = { value: false };

	var text;
	var pref;

	if (warning_type === 0) {
		text = mboximportbundle.GetStringFromName("formatWarning");
		pref = "extensions.importexporttoolsng.export.format_warning";
	} else {
		text = mboximportbundle.GetStringFromName("formatWarningImport");
		pref = "extensions.importexporttoolsng.export.import_warning";
	}
	var result = prompts.confirmCheck(null, "ImportExportTools NG", text, mboximportbundle.GetStringFromName("noWaring"), check);
	IETprefs.setBoolPref(pref, !check.value);
	return result;
}

function IETremoteWarning() {
	if (!IETprefs.getBoolPref("extensions.importexporttoolsng.export.remote_warning"))
		return true;
	var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Ci.nsIPromptService);
	var check = { value: false };
	var result = prompts.confirmCheck(null, "ImportExportTools NG", mboximportbundle.GetStringFromName("remoteWarning"), mboximportbundle.GetStringFromName("noWaring"), check);
	IETprefs.setBoolPref("extensions.importexporttoolsng.export.remote_warning", !check.value);
	return result;
}

function isMbox(file) {
	if (file.isDirectory() || !file.exists())
		return 0;
	if (file.fileSize === 0)
		return 1;
	try {
		// check if the file is a mbox file, reading the first 4 chars.
		// a mbox file must begin with "From"
		var istream = Cc["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Ci.nsIFileInputStream);
		istream.init(file, 0x01, 0444, 0);
		istream.QueryInterface(Ci.nsILineInputStream);
		var line = {};
		istream.readLine(line);
		istream.close();
		if (line.value.indexOf("From ???@???") === 0)
			return 2;
		var first4chars = line.value.substring(0, 4);
		if (first4chars !== "From")
			return 0;

		return 1;
	} catch (e) { return 0; }
}

function IETstr_converter(str) {
	var convStr;
	try {
		var charset = IETprefs.getCharPref("extensions.importexporttoolsng.export.filename_charset");
		if (charset === "")
			return str;
		var uConv = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
			.createInstance(Ci.nsIScriptableUnicodeConverter);
		uConv.charset = charset;
		convStr = uConv.ConvertFromUnicode(str);
	} catch (e) {
		return str;
	}
	return convStr;
}

function nametoascii(str) {
	if (!IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_toascii")) {
		str = str.replace(/[\x00-\x19]/g, "_");
		return str.replace(/[\/\\:,<>*\?\"\|]/g, "_");
	}
	if (str)
		str = str.replace(/[^a-zA-Z0-9\-]/g, "_");
	else
		str = "Undefinied_or_empty";
	return str;
}

function buildContainerDirName() {
	// Build the name for the container directory
	var myDate = new Date();
	var datedir = myDate.getFullYear().toString();
	if (myDate.getMonth() + 1 > 9)
		datedir = datedir + (myDate.getMonth() + 1).toString();
	else
		datedir = datedir + "0" + (myDate.getMonth() + 1).toString();
	if (myDate.getDate() > 9)
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
	var clip = Cc["@mozilla.org/widget/clipboardhelper;1"]
		.getService(Ci.nsIClipboardHelper);
	clip.copyString(str);
}

function IETcleanName(str) {
	str = str.replace(/[\\:?"\*\/<>#]/g, "_");
	str = str.replace(/[\x00-\x19]/g, "_");
	return str;
}

function IETgetExt(type) {
	if (type === 1 || type === 8)
		return ".html";
	else if (type === 0)
		return ".eml";

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
	let thread = Cc["@mozilla.org/thread-manager;1"].getService().currentThread;
	while (!done) {
		thread.processNextEvent(true);
	}
	return rv;
}

function IETgetPickerModeFolder() {
	var dir = null;
	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);
	var res;

	if (fp.show)
		res = fp.show();
	else
		res = IETopenFPsync(fp);
	if (res === nsIFilePicker.returnOK) {
		dir = fp.file;
		if (dir && !dir.isWritable()) {
			alert(mboximportbundle.GetStringFromName("nowritable"));
			dir = null;
		}
	}
	return dir;
}

function IETpickFile(el) {
	var box = el.previousSibling;
	var nsIFilePicker = Ci.nsIFilePicker;
	var fp = Cc["@mozilla.org/filepicker;1"]
		.createInstance(nsIFilePicker);
	fp.init(window, "", nsIFilePicker.modeGetFolder);
	var res;

	if (fp.show)
		res = fp.show();
	else
		res = IETopenFPsync(fp);
	if (res === nsIFilePicker.returnOK)
		box.value = fp.file.path;
}

function IETemlx2eml(file) {
	// For EMLX files, see http://mike.laiosa.org/2009/03/01/emlx.html
	var istream = Cc["@mozilla.org/network/file-input-stream;1"].
		createInstance(Ci.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Ci.nsILineInputStream);
	var firstLine = true;

	// read lines into array
	var line = {}, lines = [], hasmore;
	do {
		hasmore = istream.readLine(line);
		if (line.value.indexOf("<?xml version=") > -1) {
			line.value = " ";
			hasmore = false;
		}
		if (!firstLine)
			lines.push(line.value);
		else
			firstLine = false;
	} while (hasmore);
	istream.close();
	var data = lines.join("\r\n");
	var tempFile = Cc["@mozilla.org/file/directory_service;1"]
		.getService(Ci.nsIProperties)
		.get("TmpD", Ci.nsIFile);
	tempFile.append(file.leafName + ".eml");
	tempFile.createUnique(0, 0666);
	var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
		createInstance(Ci.nsIFileOutputStream);
	foStream.init(tempFile, 0x02 | 0x08 | 0x20, 0666, 0);
	foStream.write(data, data.length);
	foStream.close();
	var extService = Cc['@mozilla.org/uriloader/external-helper-app-service;1']
		.getService(Ci.nsPIExternalAppLauncher);
	extService.deleteTemporaryFileOnExit(tempFile);
	return tempFile;
}

function IETstoreFormat() {
	// it will return 0 for Mbox format, 1 for Maildir format, 2 for unknown format
	var msgFolder = GetSelectedMsgFolders()[0];
	var storeFormat = 0;
	try {
		var store = msgFolder.server.getCharValue("storeContractID");
		if (store && store.includes("maildirstore"))
			storeFormat = 1;
		else if (store && !store.includes("berkeleystore")) {
			storeFormat = 2;
		}
	} catch (e) { }

	return storeFormat;
}

function IETgetSelectedMessages() {
	// TB3 has not GetSelectedMessages function
	var msgs;

	if (typeof GetSelectedMessages === "undefined")
		msgs = gFolderDisplay.selectedMessageUris;
	else
		msgs = GetSelectedMessages();
	return msgs;
}

var IETlogger = {
	write: function (string) {
		if (!IETprefs.getBoolPref("extensions.importexporttoolsng.log.enable"))
			return;
		if (!IETlogger.file) {
			IETlogger.file = Cc["@mozilla.org/file/directory_service;1"]
				.getService(Ci.nsIProperties)
				.get("ProfD", Ci.nsIFile);
			IETlogger.file.append("ImportExportToolsNG.log");
		}
		var now = new Date();
		var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
			.createInstance(Ci.nsIFileOutputStream);

		var flag;
		if (IETlogger.file.exists() && IETlogger.file.fileSize > 204800)
			flag = "0x20";
		else
			flag = "0x10";
		foStream.init(IETlogger.file, 0x02 | 0x08 | flag, 0664, 0);
		var data = now.getTime() + ": " + string + "\r\n";
		foStream.write(data, data.length);
		foStream.close();
	},
};

function IETemlArray2hdrArray(emlsArray, needBody, file) {
	var hdrArray = [];
	for (var k = 0; k < emlsArray.length; k++) {
		var msguri = emlsArray[k];
		var msserv = messenger.messageServiceFromURI(msguri);
		var msg = msserv.messageURIToMsgHdr(msguri);
		var hdrStr = IETstoreHeaders(msg, msguri, file, needBody);
		hdrArray.push(hdrStr);
	}
	return hdrArray;
}


