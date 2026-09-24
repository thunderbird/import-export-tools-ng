/*
	ImportExportTools NG is a derivative extension for Thunderbird 60+
	providing import and export tools for messages and folders.
	The derivative extension authors:
		Copyright (C) 2025 : Christopher Leidigh, The Thunderbird Team

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

// cleidigh - reformat, services, globals, progress meter changes

/* global IETgetPickerModeFolder, IETrunTimeDisable, buildContainerDirName,IETrunTimeEnable */

var messengerWindow = Services.wm.getMostRecentWindow("mail:3pane");

var { ExtensionParent } = ChromeUtils.importESModule(
	"resource://gre/modules/ExtensionParent.sys.mjs"
);

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
	"ImportExportToolsNG@cleidigh.kokkini.net"
);

var { IETStoragePrefs } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/IETStoragePrefs.mjs?"
	+ ietngExtension.manifest.version + messengerWindow.ietngAddon.dateForDebugging);

var { ietngUtils } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/ietngUtils.mjs?"
	+ ietngExtension.manifest.version + messengerWindow.ietngAddon.dateForDebugging);

var { logging, log } = ChromeUtils.importESModule(
	"resource://ietng/api/commonModules/loggingExp.mjs?" + ietngExtension.manifest.version + new Date()
);

// conversion to pure IOUtils implementation

var autoBackup = {

	backupStart: 0,

	load: async function () {
		logging.init({logTypes: await IETStoragePrefs.getComplexPref("debug.logTypes")});
		log("backup", "Starting backup");

		try {
			var os = navigator.platform.toLowerCase();
			if (os.indexOf("mac") > -1)
				document.getElementById("macWarn").removeAttribute("collapsed");
			var label = document.getElementById("last").textContent;
			autoBackup.last = window.arguments[0];
			autoBackup.now = window.arguments[1];
			autoBackup.mode = window.arguments[2];

			if (autoBackup.last > 0) {
				var last = autoBackup.last * 1000;
				var time = new Date(last);
				var localTime = time.toLocaleString();
				document.getElementById("last").textContent = label.replace("$t", localTime);
			} else {
				document.getElementById("last").textContent = label.replace("$t", "(none)");
			}

			if (autoBackup.mode != "auto") {
				document.getElementById("autoModeDesc").hidden = true;
			}
			let backupStartMsg;
			for (let time = 15; time > 0; time--) {
				await new Promise(resolve => setTimeout(resolve, 1000));
				backupStartMsg = document.getElementById("go").textContent;
				//console.log(backupStartMsg, time)
				document.getElementById("go").textContent = backupStartMsg.replace(time.toString(), (time - 1).toString());
			}
			await autoBackup.start();
			//await this.onOK();
		} catch (ex) {
			console.error(ex);
			let exStr = ex + "\n\n" + ex.stack;
			alert(exStr)
		}
	},

	getDir: async function () {
		var file = null;
		let dirPath = null;

		// handle empty pref
		try {
			dirPath = await IETStoragePrefs.getComplexPref("extensions.importexporttoolsng.autobackup.dir");

		} catch (ex) {
			dirPath = null;
		}

		if (dirPath) {
			try {
				if (!await IOUtils.exists(dirPath) || (await IOUtils.stat(dirPath)).type != "directory") {
					alert("IETNG: dir doesn't exist or not dir")
					dirPath = null;
				}

			} catch (e) {
				alert("IETNG: ex\n" + e);
				dirPath = null;
			}
		}

		if (!dirPath) {
			let fpRes = await ietngUtils.openFileDialog(Ci.nsIFilePicker.modeGetFolder, ietngUtils.localizeMsg("filePickerExport"), null, Ci.nsIFilePicker.filterAll);
			console.log(fpRes)
			if (fpRes.result != Ci.nsIFilePicker.returnOK) {
				dirPath = null;
			} else {
				dirPath = fpRes.folder;
				autoBackup.filePicker = true;
			}
		}
		return dirPath;
	},

	writeLog: async function (data, append) {
		if (!append) {
			await IOUtils.writeUTF8(autoBackup.logFilePath, data);
		} else {
			await IOUtils.writeUTF8(autoBackup.logFilePath, data, { mode: "append" });
		}
	},

	start: async function () {
		console.log("start")

		this.backupStart = new Date();
		document.getElementById("start").removeAttribute("collapsed");
		document.getElementById("go").collapsed = true;
		//document.documentElement.getButton("accept").disabled = true;
		// saveMode values:
		// 0 = save all; 1 = save just if new;
		// 2 = save just if new with custom name, save all with unique name
		autoBackup.saveMode = await IETStoragePrefs.getIntPref("extensions.importexporttoolsng.autobackup.save_mode");
		autoBackup.type = await IETStoragePrefs.getIntPref("extensions.importexporttoolsng.autobackup.type");


		// "dir" is the target directory for the backup
		//temp
		let dir = await autoBackup.getDir();
		if (!dir) {
			autoBackup.end();
		}
		//temp
		//dir = await IOUtils.getDirectory(dir)
		console.log(dir)

		let w = Services.wm.getMostRecentWindow("mail:3pane");

		if (!(await IOUtils.exists(dir))) {
			Services.prompt.alert(w, "Error", w.ietngAddon.extension.localeData.localizeMessage("noBackup"));
			window.close();
			return;
		}

		var nameType = await IETStoragePrefs.getIntPref("extensions.importexporttoolsng.autobackup.dir_name_type");

		var dirName = null;
		if (nameType === 1) {
			try {
				dirName = await IETStoragePrefs.getComplexPref("extensions.importexporttoolsng.autobackup.dir_custom_name");
			} catch (e) {
				dirName = null;
			}
		}

		try {
			var offlineManager = Cc["@mozilla.org/messenger/offline-manager;1"]
				.getService(Ci.nsIMsgOfflineManager);
			offlineManager.synchronizeForOffline(false, false, false, true, msgWindow);
		} catch (e) { }

		autoBackup.profDir = await IOUtils.getDirectory(PathUtils.profileDir);

		autoBackup.profDirPath = PathUtils.profileDir;

		if (dirName && !autoBackup.filePicker) {
			autoBackup.backupDirPath = dir;
			// custom name
			let customNamePath = PathUtils.join(dir, dirName);
			if (!(await IOUtils.exists(customNamePath))) {
				await IOUtils.makeDirectory(customNamePath);
			}
			autoBackup.backupContainerPath = customNamePath;

		} else {
			autoBackup.backupDirPath = dir;
			var date = buildContainerDirName();
			let baseDirName = PathUtils.filename(autoBackup.profDirPath).replaceAll(".", "_");
			autoBackup.backupContainerBaseName = baseDirName;

			baseDirName += `-${date}`;
			let uniqueBackupContainerPath = await IOUtils.createUniqueDirectory(autoBackup.backupDirPath, baseDirName);
			autoBackup.backupContainerPath = uniqueBackupContainerPath;
			autoBackup.unique = true;
		}

		let str = "Backup date: " + autoBackup.now.toLocaleString() + "\r\n\r\n" + "Saved files:\r\n";
		autoBackup.logFilePath = PathUtils.join(autoBackup.backupContainerPath, "IETNG_Backup.log");

		await autoBackup.writeLog(str, false);

		let oldLogFilePath = PathUtils.join(autoBackup.backupContainerPath, "BackupTime.txt");
		if (await IOUtils.exists(oldLogFilePath)) {
			await IOUtils.remove(oldLogFilePath);
		}
		autoBackup.array1 = [];
		autoBackup.array2 = [];

		await autoBackup.scanExternal(autoBackup.backupContainerPath);

		if (autoBackup.type === 1) { // just mail
			let profDirMailPath = PathUtils.join(autoBackup.profDirPath, "Mail");
			await autoBackup.scanDir(profDirMailPath, autoBackup.backupContainerPath, autoBackup.profDirPath);
			let profDirImapMailPath = PathUtils.join(autoBackup.profDirPath, "ImapMail");

			if (await IOUtils.exists(profDirImapMailPath)) {
				await autoBackup.scanDir(profDirImapMailPath, autoBackup.backupContainerPath, autoBackup.profDirPath);
			}
		} else {
			await autoBackup.scanDir(autoBackup.profDirPath, autoBackup.backupContainerPath, autoBackup.profDirPath);
		}

		await autoBackup.write(0);
	},

	end: async function () {
		console.log("end")
		await new Promise(resolve => setTimeout(resolve, 4000));
		window.close();
	},

	save: async function (entryPath, destDirPath, rootPath) {
		console.log("save:", entryPath)

		var force = false;
		if ((autoBackup.unique && autoBackup.saveMode !== 1) || autoBackup.saveMode === 0)
			force = true;

		let lmt = (await IOUtils.stat(entryPath)).lastModified / 1000;
		// Check if exists a older file to replace in the backup directory
		if (force || lmt > autoBackup.last) {
			var filepath = destDirPath;
			var newpath = entryPath.replace(rootPath, filepath);
			let LFPath = newpath;

			console.log("saving", entryPath, "\nas:", LFPath)

			autoBackup.array1.push(entryPath);
			autoBackup.array2.push(LFPath);
		}
	},

	// dirToScan is the directory to scan
	// destDir is the target directory for the backup
	// root is the root directory of the files to save --> it's the profile directory or the external directory of the account
	scanDir: async function (dirToScanPath, destDirPath, rootPath) {
		console.log("scanDir", dirToScanPath)

		if (!await IOUtils.exists(dirToScanPath)) {
			console.log("dir doesn't exist ")
			return;
		}

		if (!await IOUtils.hasChildren(dirToScanPath)) {
			await autoBackup.save(dirToScanPath, destDirPath, rootPath);
			return;
		}

		let children = await IOUtils.getChildren(dirToScanPath);
		for (const entry of children) {
			if (await IOUtils.exists(entry)) {
				if (PathUtils.filename(entry) !== "lock" && PathUtils.filename(entry) !== "parent.lock" && PathUtils.filename(entry) !== ".parentlock") {

					if ((await IOUtils.stat(entry)).type == "directory") {
						await autoBackup.scanDir(entry, destDirPath, rootPath);
					} else {
						await autoBackup.save(entry, destDirPath, rootPath);
					}
				}
			} else {
				let error = "\r\n***Error - non-existent file: " + entry.path + "\r\n";
				await autoBackup.writeLog(error, true);
			}
		}
	},

	write: async function (index) {
		console.log("write", index)

		for (let index = 0; index < autoBackup.array1.length; index++) {

			try {
				let src = autoBackup.array1[index];
				let dest = autoBackup.array2[index];

				let fileInfo = await IOUtils.stat(src);
				if (fileInfo.size > 1024 * 1024 * 100) {
					console.log(src, `${fileInfo.size / (1024 * 1024)}MB Add delay: ${100 * (fileInfo.size / (1024 * 1024 * 100)) / 1000} S`);
					await new Promise(resolve => setTimeout(resolve, 100 * (fileInfo.size / (1024 * 1024 * 100))));
				}

				if (fileInfo.type == "directory") {
					await IOUtils.makeDirectory(dest);
				} else {
					await IOUtils.copy(src, dest);
				}

				let logline = autoBackup.array1[index] + "\r\n";
				await autoBackup.writeLog(logline, true);
				await new Promise(resolve => setTimeout(resolve, 20));

			} catch (e) {
				console.log(e)
				var error;
				if (autoBackup.array1[index])
					error = "\r\n***Error with file " + autoBackup.array1[index].path + "\r\nError Type: " + e + "\r\n\r\n";
				else
					error = "\r\n***Error Type: " + e + "\r\n\r\n";
				await autoBackup.writeLog(error, true);
			}

			var c = (index / autoBackup.array1.length) * 100;
			document.getElementById("pm").value = parseInt(c);

		}
		document.getElementById("pm").value = 100;
		await IETStoragePrefs.setIntPref("extensions.importexporttoolsng.autobackup.last", autoBackup.now / 1000);
		// new remove old backups #663

		await autoBackup.removeOldBackups();
		let backupDuration = (new Date() - this.backupStart) / 1000;
		if (backupDuration < 60) {
			document.getElementById("done").textContent = `${document.getElementById("done").textContent} (${backupDuration.toFixed(0)} S)`;
		} else {
			document.getElementById("done").textContent = `${document.getElementById("done").textContent} (${(backupDuration / 60).toFixed(1)} M)`;
		}
		document.getElementById("start").collapsed = true;

		document.getElementById("done").removeAttribute("collapsed");
		console.log("IETNG: Backup time: " + backupDuration + " S");

		await autoBackup.end();
	},

	removeOldBackups: async function () {
		console.log("removeOldBackups")

		let retainNumBackups = await IETStoragePrefs.getIntPref("extensions.importexporttoolsng.autobackup.retainNumBackups");
		if (retainNumBackups == 0) {
			return;
		}

		console.log(autoBackup.backupDirPath)
		console.log(autoBackup.backupContainerBaseName)

		let removeBackupsList = (await IOUtils.getChildren(autoBackup.backupDirPath))
			.filter(fn => PathUtils.filename(fn).startsWith(autoBackup.backupContainerBaseName)
				&& fn != autoBackup.backupContainerPath);

		removeBackupsList = await Promise.all(removeBackupsList.map(async fn => {
			return { fn: fn, lastModified: (await IOUtils.stat(fn)).lastModified };
		}));

		removeBackupsList.sort((a, b) => a.lastModified - b.lastModified);

		let rn = Math.max(0, removeBackupsList.length - retainNumBackups + 1);

		removeBackupsList = removeBackupsList.slice(0, rn);

		for (const fo of removeBackupsList) {
			await IOUtils.remove(fo.fn, { recursive: true });
		}
	},

	scanExternal: async function (destDirPath) {
		console.log("scanExternal")

		let { MailServices } = ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");

		let extMailFoldersPath = PathUtils.join(destDirPath, "ExternalMailFolders");

		if (!await IOUtils.exists(extMailFoldersPath)) {
			await IOUtils.makeDirectory(extMailFoldersPath);
		}

		for (let server of MailServices.accounts.allServers) {
			var parentDir = null;
			let serverFile = server.localPath;

			if (serverFile.parent && serverFile.parent.parent) {
				parentDir = serverFile.parent.parent;
			}
			let accountDestDirPath = PathUtils.join(extMailFoldersPath, PathUtils.filename(serverFile.path));

			if (!parentDir || !autoBackup.profDir.equals(parentDir))
				await autoBackup.scanDir(serverFile.path, accountDestDirPath, serverFile.path);
		}
	},
};

async function cancelButtonListener(event) {
	window.close();
}

const cancelButton = document.getElementById("cancelButton");

cancelButton.addEventListener("click", cancelButtonListener);

window.addEventListener("load", async function (event) {
	i18n.updateDocument({ extension: window.opener.ietngAddon.extension });
	await autoBackup.load();
});
