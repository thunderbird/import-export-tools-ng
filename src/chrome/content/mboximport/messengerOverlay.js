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

/* global IETprefs, IETgetComplexPref */

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

function IETmessOverlayInit() {
	var last = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.last");
	var frequency = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.frequency");
	if (frequency === 0)
		return;
	var now = new Date;
	var time = now.getTime();
	time = time / 1000;
	var days = 24 * 60 * 60 * frequency;

	if ((time - last) < days)
		return;

	var WM = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);
	var os = navigator.platform.toLowerCase();
	var wins;
	if (os.includes("mac"))
		wins = WM.getEnumerator(null);
	else
		wins = WM.getEnumerator("mail:3pane");
	if (!wins.hasMoreElements()) {
		if (IETprefs.getBoolPref("extensions.importexporttoolsng.autobackup.use_modal_dialog"))
			window.openDialog("chrome://mboximport/content/autobackup.xul", "", "chrome,centerscreen,modal", last, time, now);
		else
			window.openDialog("chrome://mboximport/content/autobackup.xul", "", "chrome,centerscreen", last, time, now);
	}


}

// Up to 10 hotkeys can be defined in:
// extensions.importexporttoolsng.experimental.hot_keys

// example hot key entry (array of JSON objects)
// id		- the key index (1-10)
// key			- the key ( single character)
// modifiers	- the key modifiers, space separated list ('control', 'shift', 'alt', 'accel')
// oncommand	- a direct command string 

// [{"id": "1", "key": "P", "modifiers": "control shift", "oncommand": "goDoCommand('cmd_printpreview')"}, {"id": "2", "key": "D", "modifiers": "control shift", "oncommand": "exportSelectedMsgs(5)"}]

function setupHotKeys() {
	var hotKeysStr = IETgetComplexPref("extensions.importexporttoolsng.experimental.hot_keys");

	console.debug(hotKeysStr);

	if (hotKeysStr !== "") {
		try {
			var hotKeysArray = JSON.parse(hotKeysStr);

			for (let index = 0; (index < hotKeysArray.length && index < 10); index++) {
				var hotKey = hotKeysArray[index];
				if (hotKey) {
					let id = hotKey.id || "";
					if (id === "" || id < 1 || id > 10) {
						console.debug('bad ID');
						continue;
					}

					let hkeyElement = document.getElementById(`hot-key${id}`);
					
					let key = hotKey.key || "";
					if (key === "" || key.length !== 1) {
						console.debug('Bad hotkey');
					}
					let modifiers = hotKey.modifiers || "";
					let oncommand = hotKey.oncommand || "";

					 
				hkeyElement.setAttribute("key", key);
				hkeyElement.setAttribute("modifiers", modifiers);
				hkeyElement.setAttribute("oncommand", oncommand);
				// console.debug(hkeyElement.outerHTML);
				}

			}
			// console.debug(document.getElementById(`hot-key1`).parentElement.outerHTML);

		} catch (error) {
			console.debug('Bad hot key format:\n'+error);
		}
	}
}

setupHotKeys();

window.addEventListener("unload", IETmessOverlayInit, false);
