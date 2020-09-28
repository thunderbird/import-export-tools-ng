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

// cleidigh - Update for TB68
// cleidigh - reformat, services, globals, Streamlisteners


var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

function importwrapper() {
	window.arguments[0].openProfDir = document.getElementById("openProfDir").checked;
	var params = { scandir: false, keepstructure: false, openProfDir: false, recursiveMode: false };
	if (document.getElementById("mboxgroup").selectedIndex === 1)
		window.arguments[0].keepstructure = true;
	else if (document.getElementById("mboxgroup").selectedIndex === 2)
		window.arguments[0].scandir = true;
	else if (document.getElementById("mboxgroup").selectedIndex === 3) {
		window.arguments[0].scandir = true;
		window.arguments[0].recursiveMode = true;
	}
}


window.addEventListener("dialogaccept", function(event) {
	importwrapper();
});


// handle cancel with standard listener
// Fixes #56 https://github.com/thundernest/import-export-tools-ng/issues/56

window.addEventListener("dialogcancel", function(event) {
	window.arguments[0].cancel = true;
	return true;
});
