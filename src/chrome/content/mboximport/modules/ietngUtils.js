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


// ietngUtils.js

export var ietngUtils = {

  IETprefs: Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefBranch),

  openFileDialog: async function (window, mode, title, initialDir, filter) {

    let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    let resultObj = {};
    fp.init(window, title, mode);
    fp.appendFilters(filter);
    if (initialDir) {
      fp.displayDirectory = nsiFileFromPath(initialDir);
    }
    let res = await new Promise(resolve => {
      fp.open(resolve);
    });
    if (res !== Ci.nsIFilePicker.returnOK) {
      resultObj.result = -1;
      return resultObj;
    }

    // no fp.files on Linux if not modeOpenMultiple
    if (mode == Ci.nsIFilePicker.modeOpenMultiple) {
      var files = fp.files;
      var paths = [];
      while (files.hasMoreElements()) {
        var arg = files.getNext().QueryInterface(Ci.nsIFile);
        paths.push(arg.path);
      }
      resultObj.filesArray = paths;
    } else {
      resultObj.file = fp.file;
    }

    resultObj.result = 0;

    if (mode === Ci.nsIFilePicker.modeGetFolder) {
      resultObj.folder = fp.file.path;
    }
    return resultObj;
  },

  stringToBytes: function (str) {
    var bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes;
  },

  bytesToString2: function (bytes) {
    return bytes.reduce(function (str, b) {
      return str + String.fromCharCode(b);
    }, "");
  },

  writeStatusLine: function (window, text, statusDelay) {
    if (window.document.getElementById("ietngStatusText")) {
      window.document.getElementById("ietngStatusText").setAttribute("label", text);
      window.document.getElementById("ietngStatusText").setAttribute("value", text);
      window.document.getElementById("ietngStatusText").innerText = text;

      var delay = this.IETprefs.getIntPref("extensions.importexporttoolsng.delay.clean_statusbar");
      if (statusDelay) {
        delay = statusDelay;
      }
      var _this = this;
      if (delay > 0) {
        window.setTimeout(function () { _this.deleteStatusLine(window, text); }, delay);
      }
      //window.setTimeout(function () { _this.refreshStatusLine(window, text); }, delay - 500);


    }
  },

  createStatusLine: function (window) {
    let s = window.document.getElementById("statusText")
    let s2 = window.document.createElement("label")
    s2.classList.add("statusbarpanel");
    s2.setAttribute("id", "ietngStatusText")
    s2.style.width = "420px";
    s2.style.overflow = "hidden"
    s.before(s2)

  },

  deleteStatusLine: function (window, text) {
    try {
      if (window.document.getElementById("ietngStatusText").getAttribute("label") === text) {
        window.document.getElementById("ietngStatusText").setAttribute("label", "");
        window.document.getElementById("ietngStatusText").setAttribute("value", "");
        window.document.getElementById("ietngStatusText").innerText = "";

        if (text.includes("Err")) {
          delay = 15000;
        }
      }
    } catch (e) { }
  }

}

