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

var EXPORTED_SYMBOLS = ["ietngUtils"];

var ietngUtils = {

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


  bytesToString: function (buffer) {
    var string = "";
    for (var i = 0; i < buffer.length; i++) {
      string += String.fromCharCode(buffer[i]);
    }
    return string;
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
    console.log("inserted status")
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
  },



  sanitizeFileOrFolderName: function (str) {
    str = str.replace(/[\\:?"\*\/<>#]/g, "_");
    str = str.replace(/[\x00-\x19]/g, "_");
    return str;
  },

  nameToAcii: function (str) {
    if (!this.IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_toascii")) {
      str = str.replace(/[\x00-\x19]/g, "_");
      // Allow ',' and single quote character which is valid
      return str.replace(/[\/\\:<>*\?\"\|]/g, "_");
    }
    if (str)
      str = str.replace(/[^a-zA-Z0-9\-]/g, "_");
    else
      str = "Undefinied_or_empty";
    return str;
  },

  createUniqueFolderName: function (foldername, destDirPath, structure) {

    var destdirNSIFILE = Cc["@mozilla.org/file/local;1"]
      .createInstance(Ci.nsIFile);
    destdirNSIFILE.initWithPath(destDirPath);

    var overwrite = this.IETprefs.getBoolPref("extensions.importexporttoolsng.export.overwrite");
    var index = 0;
    var nameIndex = "";
    var NSclone = destdirNSIFILE.clone();

    // Change unsafe chars for filenames with underscore
    foldername = this.sanitizeFileOrFolderName(foldername);
    NSclone.append(foldername);
    foldername = this.nameToAcii(foldername);
    // if the user wants to overwrite the files with the same name in the folder destination
    // the function must delete the existing files and then return the original filename.
    // If it's a structured export, it's deleted also the filename.sbd subdirectory
    if (overwrite) {
      if (NSclone.exists()) {
        NSclone.remove(false);
        if (structure) {
          var NSclone2 = destdirNSIFILE.clone();
          NSclone2.append(foldername + ".sbd");
          NSclone2.remove(true);
        }
      }
      return foldername;
    }
    NSclone = destdirNSIFILE.clone();
    NSclone.append(foldername);
    while (NSclone.exists()) {
      index++;
      nameIndex = foldername + "-" + index.toString();
      NSclone = destdirNSIFILE.clone();
      NSclone.append(nameIndex);
    }
    if (nameIndex !== "")
      return nameIndex;

    return foldername;
  },

  formatBytes: function (bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1024,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

};
