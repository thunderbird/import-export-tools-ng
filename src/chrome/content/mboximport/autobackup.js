var gBackupPrefBranch = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);

var autoBackup = {

	onOK : function() {
		setTimeout(autoBackup.start, 500);
		document.getElementById("start").removeAttribute("collapsed");
		document.getElementById("go").collapsed = true;
		document.documentElement.getButton("accept").disabled = true;
		autoBackup.time = window.arguments[1];
		autoBackup.now = window.arguments[2];
		// saveMode values:
		// 0 = save all; 1 = save just if new; 
		// 2 = save just if new with custom name, save all with unique name
		autoBackup.saveMode = gBackupPrefBranch.getIntPref("extensions.importexporttools.autobackup.save_mode");
		autoBackup.type = gBackupPrefBranch.getIntPref("extensions.importexporttools.autobackup.type");
		return false;
	},

	load : function() {
		var os = navigator.platform.toLowerCase();
		if (os.indexOf("mac") > -1)
			document.getElementById("macWarn").removeAttribute("collapsed");
		var label = document.getElementById("last").textContent;
		autoBackup.last = window.arguments[0];
		if (autoBackup.last > 0) {
			var last = autoBackup.last  * 1000;
			var time = new Date(last);
			var localTime = time.toLocaleString();
			document.getElementById("last").textContent = label.replace("$t", localTime);
		}
		else
			document.getElementById("last").textContent = label.replace("$t", "");
	},
	
	getDir : function() {
		try {
			var dir = gBackupPrefBranch.getCharPref("extensions.importexporttools.autobackup.dir");
			var file = Components.classes["@mozilla.org/file/local;1"]
				.createInstance(Components.interfaces.nsIFile); 
			file.initWithPath(dir); 
			if (! file.exists() || ! file.isDirectory())
				file = null;
		}
		catch(e) {
			var file = null;
		}
		if (! file) {
			file = IETgetPickerModeFolder();
			autoBackup.filePicker = true;
		}
		return file;
	},

	writeLog : function(data,append) {
		var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
			.createInstance(Components.interfaces.nsIFileOutputStream);
		if (append)
			foStream.init(autoBackup.logFile, 0x02 | 0x08 | 0x10, 0664, 0); 
		else
			foStream.init(autoBackup.logFile, 0x02 | 0x08 | 0x20, 0666, 0);
		foStream.write(data,data.length);
		foStream.close();
	},

	start : function() {
		// "dir" is the target directory for the backup
		var dir = autoBackup.getDir();
		if (! dir)
			return;
		var strbundle = document.getElementById("backupStr");
		if (! dir.exists() || ! dir.isWritable) {
			alert(strbundle.getString("noBackup"));
			window.close();
			return;
		}
		var nameType = gBackupPrefBranch.getIntPref("extensions.importexporttools.autobackup.dir_name_type");
		if (nameType == 1) {
			try {
				var dirName = gBackupPrefBranch.getCharPref("extensions.importexporttools.autobackup.dir_custom_name");
			}
			catch(e) {
				var dirName = null;
			}
		}
		else
			var dirName = null;
		
		autoBackup.IETmaxRunTime = gBackupPrefBranch.getIntPref("dom.max_chrome_script_run_time");
		IETrunTimeDisable();	
		try {
			var offlineManager = Components.classes["@mozilla.org/messenger/offline-manager;1"]                 
        	                .getService(Components.interfaces.nsIMsgOfflineManager);
			offlineManager.synchronizeForOffline(false, false, false, true, msgWindow);
		}
		catch(e) {} 

		var clone = dir.clone();
		autoBackup.profDir = Components.classes["@mozilla.org/file/directory_service;1"]
	           .getService(Components.interfaces.nsIProperties)
        	   .get("ProfD", Components.interfaces.nsIFile);
		
		if (dirName && ! autoBackup.filePicker) {
			clone.append(dirName);
			if (! clone.exists())
				clone.create(1,0755);
		}
		else {		
			var date = buildContainerDirName();
			clone.append(autoBackup.profDir.leafName+"-"+date);
			clone.createUnique(1,0755);
			autoBackup.unique = true;
		}
	
		// Here "clone" is the container directory for the backup
			
		var str = "Backup date: "+autoBackup.now.toLocaleString()+"\r\n\r\n"+"Saved files:\r\n";
		autoBackup.logFile = clone.clone();
		autoBackup.logFile.append("Backup.log");
		autoBackup.writeLog(str,false);
		
		var oldLogFile = clone.clone();
		oldLogFile.append("BackupTime.txt");
		if (oldLogFile.exists())
			oldLogFile.remove(false);

		autoBackup.array1 = [];
		autoBackup.array2 = [];

		autoBackup.scanExternal(clone);

		if (autoBackup.type == 1) { // just mail
			var profDirMail = autoBackup.profDir.clone();
			profDirMail.append("Mail");	
			autoBackup.scanDir(profDirMail,clone,autoBackup.profDir);
			profDirMail  = autoBackup.profDir.clone();
			profDirMail.append("ImapMail");
			if (profDirMail.exists())
				autoBackup.scanDir(profDirMail,clone,autoBackup.profDir);
		}	
		else 
			autoBackup.scanDir(autoBackup.profDir, clone, autoBackup.profDir);
		autoBackup.write(0);
	},

	end : function(sec) {
		if (sec == 0)
			window.close();
		else
			window.setTimeout(autoBackup.end,1000,sec-1);
	},

	save : function(entry,destDir,root) {
		if ((autoBackup.unique && autoBackup.saveMode !=1) || autoBackup.saveMode ==0)
			var force = true;
		else
			var force = false;
		var lmt = entry.lastModifiedTime / 1000;
		// Check if exists a older file to replace in the backup directory
		if (force || lmt > autoBackup.last) {
			var entrypath = entry.parent.path;
			var filepath = destDir.path;
			var newpath = entrypath.replace(root.path,filepath);
			var LF = Components.classes["@mozilla.org/file/local;1"]
				.createInstance(Components.interfaces.nsIFile);
			LF.initWithPath(newpath);
			var LFclone = LF.clone();
			LFclone.append(entry.leafName);
			if (LFclone.exists())
				LFclone.remove(false);	
			try {
				autoBackup.array1.push(entry);
				autoBackup.array2.push(LF);
			}
			catch(e)  {}
		}
	},

	// dirToScan is the directory to scan
	// destDir is the target directory for the backup
	// root is the root directory of the files to save --> it's the profile directory or the external directory of the account
	scanDir : function(dirToScan,destDir,root) {
		if (! dirToScan.exists())
			return;
		var entries = dirToScan.directoryEntries;
		while(entries.hasMoreElements()) {
			var entry = entries.getNext();	
			entry.QueryInterface(Components.interfaces.nsIFile);
			if (entry.exists()) {
				if (entry.leafName != "lock" && entry.leafName != "parent.lock" && entry.leafName != ".parentlock") {
					if (entry.isDirectory())
						autoBackup.scanDir(entry,destDir,root);
					else 
						autoBackup.save(entry,destDir,root);
				}
			}
			else {
				var error = "\r\n***Error - non-existent file: "+entry.path+"\r\n";
				autoBackup.writeLog(error,true);
			}
		}
	},

	write : function(index) {
		try {
			autoBackup.array1[index].copyTo(autoBackup.array2[index], "");
			var logline = autoBackup.array1[index].path + "\r\n";
			autoBackup.writeLog(logline,true);
		}
		catch(e) {
			if (autoBackup.array1[index]) 
				var error = "\r\n***Error with file "+ autoBackup.array1[index].path + "\r\nError Type: "+e+"\r\n\r\n";
			else
				var error = "\r\n***Error Type: "+e+"\r\n\r\n";
			autoBackup.writeLog(error,true);
		}
		index++;
		if (autoBackup.array1.length > index) {
			var c = index / autoBackup.array1.length * 100;
			document.getElementById("pm").value = parseInt(c);
			window.setTimeout(autoBackup.write,50,index);		
		}
		else {
			document.getElementById("pm").value = 100;
			gBackupPrefBranch.setIntPref("extensions.importexporttools.autobackup.last", autoBackup.time);
			IETrunTimeEnable(autoBackup.IETmaxRunTime);
			document.getElementById("start").collapsed = true;
			document.getElementById("done").removeAttribute("collapsed");
			autoBackup.end(2);
		}
	},

	scanExternal : function(destDir) {
		var file = destDir.clone();
		file.append("ExternalMailFolders");
		if (! file.exists())
			file.create(1,0775);
		var servers = Components.classes["@mozilla.org/messenger/account-manager;1"]
			.getService(Components.interfaces.nsIMsgAccountManager).allServers;
		if (servers.Count)
			var cntServers = servers.Count();
		else 
			// Thunderbird >17 return nsIArray
			var cntServers = servers.length;
		// Scan servers storage path on disk
		for (var i = 0; i < cntServers; ++i) {
			var parentDir = null;
			if (servers.Count)
				var serverFile = servers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer).localPath;
			else
				var serverFile = servers.queryElementAt(i, Components.interfaces.nsIMsgIncomingServer).localPath;
			if (serverFile.parent && serverFile.parent.parent)
				parentDir = serverFile.parent.parent;
			var clone = file.clone();
			clone.append(serverFile.leafName);
			// Now "clone" path is  --> <directory backup>/ExternalMailFolder/<account root directory leafname>
			if (! parentDir || ! autoBackup.profDir.equals(parentDir)) 	
				autoBackup.scanDir(serverFile,clone,serverFile);
		}
	}
};




