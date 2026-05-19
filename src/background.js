/*
	ImportExportTools NG is a extension for Thunderbird mail client
	providing import and export tools for messages and folders.
	The extension authors:
		Copyright (C) 2026 : Christopher Leidigh

	ImportExportTools NG is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */


// background.js - this kicks off the WindowListener framework

import { openHelp } from "/Modules/miscCmds.mjs";
import * as prefMgmt from "/Modules/prefMgmt.mjs";
import { prefCmds } from "./Modules/prefCmds.mjs";

import "/Modules/menus.mjs";
import "/Modules/wextAPI.mjs";

// now start
main();

// open help on install / update
browser.runtime.onInstalled.addListener(async (info) => {
	if (info.reason != "install" && info.reason != "update") {
		return;
	}

	// let messengerOL start
	await new Promise(resolve => window.setTimeout(resolve, 100));

	// add option to not show help - #458
	let showOnInstallAndUpdate = await prefCmds.getPref("help.showOnInstallAndUpdate")
	console.log(showOnInstallAndUpdate)
	if (showOnInstallAndUpdate || showOnInstallAndUpdate == null) {
		await openHelp({ opentype: "tab" });
	}
});

async function main() {
	console.log(`ImportExportTools NG v${browser.runtime.getManifest().version}`);

	// legacy pref migration for v15
	//prefMigration.legacyPrefMigration();


	await prefMgmt.initializePrefs();

	let showOnInstallAndUpdate = await prefCmds.getPref("help.showOnInstallAndUpdate")
	console.log(showOnInstallAndUpdate)

	await browser.LegacyHelper.registerGlobalUrls([
		["resource", "ietng", "."],
	]);

	messenger.WindowListener.registerDefaultPrefs("defaults/preferences/prefCmds.js");

	// Register all necessary content, Resources, and locales

	messenger.WindowListener.registerChromeUrl([
		["content", "mboximport", "chrome/content/mboximport"],
		["resource", "mboximport", "chrome/", "contentaccessible=yes"],
	]);

	messenger.WindowListener.registerOptionsPage("chrome://mboximport/content/mboximport/mboximportOptions.xhtml");

	// Register each overlay script Which controls subsequent fragment loading

	messenger.WindowListener.registerWindow(
		"chrome://messenger/content/messenger.xhtml",
		"chrome://mboximport/content/mboximport/messengerOL.js");

	messenger.WindowListener.registerWindow(
		"chrome://messenger/content/SearchDialog.xhtml",
		"chrome://mboximport/content/mboximport/SearchDialogOL.js");

	messenger.WindowListener.registerWindow(
		"chrome://messenger/content/messengercompose/messengercompose.xhtml",
		"chrome://mboximport/content/mboximport/messengercomposeOL.js");

	messenger.WindowListener.registerWindow(
		"chrome://messenger/content/messageWindow.xhtml",
		"chrome://mboximport/content/mboximport/messageWindowOL.js");

	messenger.WindowListener.startListening();
}
