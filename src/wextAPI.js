/*
	ImportExportTools NG is a extension for Thunderbird mail client
	providing import and export tools for messages and folders.
	The extension authors:
		Copyright (C) 2023 : Christopher Leidigh, The Thunderbird Team

	ImportExportTools NG is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */


// wextAPI.js

messenger.NotifyTools.onNotifyBackground.addListener(async (info) => {
	let rv;
	switch (info.command) {
		case "windowsGetAll":
			var w = await browser.windows.getAll(info.options);
			return w;
		case "getCurrentURL":
			// method one: via tabs in focused window
			try {
				var w = await browser.windows.getAll({ populate: true });
			} catch {
				return "unknown";
			}

			let cw = w.find(fw => fw.focused)
			let url1 = cw.tabs.find(t => t.active).url;
			if (!url1) {
				url1 = "undefinedURL";
			}
			return url1;
		case "getSelectedMessages":
			var msgList = [];
			try {
				msgList = await browser.mailTabs.getSelectedMessages();
			} catch {
				msgList = null;
			}
			return msgList;
		case "getFullMessage":

			rv = await getFullMessage(info.messageId);
			return rv;
		case "createFolder":
			console.log(window.folder)
			break;
		case "openHelp":
			window.wextOpenHelp({ bmark: info.bmark });
			break;
		case "shutdown":
			console.log("shut")
			await messenger.menus.refresh();
			await messenger.menus.removeAll();
			break;
		case "createSubfolder":
			try {
				let res = await messenger.folders.create(info.folderId, info.childName);
				return res;
			} catch (ex) {
				return ex;
			}
	}
	return false;
}
);