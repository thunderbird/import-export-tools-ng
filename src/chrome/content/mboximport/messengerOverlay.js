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

// cleidigh - Convert in-line script, reformat, globals

/* global IETprefs, IETgetComplexPref, setupHotKeys */

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

function IETmessOverlayInit() {
	Services.console.logStringMessage("Start backup check");
	var last = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.last");
	var frequency = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.frequency");
	if (frequency === 0)
		return;
	
	if (frequency === 99)
		frequency = 0.001;

	var now = new Date;
	var time = now.getTime();
	time = time / 1000;
	var days = 24 * 60 * 60 * frequency;
	// var days = 0.005;
	console.debug('OverlayBackup');
	console.debug(time-last);
	console.debug(days);

	if ((time - last) < (days - (60 * 5)))
		return;

	console.debug('Open dialogue');
	var WM = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);
	var os = navigator.platform.toLowerCase();
	var wins;
	if (os.includes("mac"))
		wins = WM.getEnumerator(null);
	else
		wins = WM.getEnumerator("mail:3pane");
	if (!wins.hasMoreElements()) {
		if (IETprefs.getBoolPref("extensions.importexporttoolsng.autobackup.use_modal_dialog")) {
			console.debug('openModel');
			window.openDialog("chrome://mboximport/content/mboximport/autobackup.xhtml", "", "chrome,centerscreen,modal", last, time, now);
		} else {
			console.debug('openD');
			window.openDialog("chrome://mboximport/content/mboximport/autobackup.xhtml", "", "chrome,centerscreen", last, time, now);
		}
		console.debug('after open ');
	} else {
		console.debug('open with more elements');
		window.openDialog("chrome://mboximport/content/mboximport/autobackup.xhtml", "", "chrome,centerscreen,modal", last, time, now);
	}

	// btest();
	
	// window.openDialog("chrome://mboximport/content/mboximport/autobackup.xhtml", "", "chrome,centerscreen,modal", last, time, now);

}

function getDir() {
	var file = null;

	try {
		// var dir = gBackupPrefBranch.getCharPref("extensions.importexporttoolsng.autobackup.dir");
		file = Cc["@mozilla.org/file/local;1"]
			.createInstance(Ci.nsIFile);
		file.initWithPath(dir);
		if (!file.exists() || !file.isDirectory())
			file = null;
	} catch (e) {
		file = null;
	}
	if (!file) {
		file = IETgetPickerModeFolder();
		// autoBackup.filePicker = true;
	}
	return file;
}


function btest() {
	console.debug('btest start');
	var dir = autoBackup.getDir();
	if (!dir)
		return;
	console.debug(dir.leafName);
	var entries = dir.directoryEntries;
	while (entries.hasMoreElements()) {
		var entry = entries.getNext();
		entry.QueryInterface(Ci.nsIFile);
		console.debug(entry.leafName);
	}
	console.debug('btest end');
}

function keyEvent(e) {
	console.debug(`Key event: ${e.code}  `);
	// console.debug(`${e.target.outerHTML}`);

	// var d = document.body.outerHTML();
	// console.debug(d.substring(0,100));

	d = e.target.outerHTML;
	console.debug(d.substring(0,100));
}

// setup hotkeys for the main window
setupHotKeys("messenger");
setupHotKeysObserver();

// Services.console.logStringMessage("before listeners");
// window.addEventListener("beforeunload", IETmessOverlayInit, false);
// window.addEventListener("keydown", keyEvent, false);
