/*
  ImportExportTools NG is a extension for Thunderbird mail client
  providing import and export tools for messages and folders.
  The extension authors:
    Copyright (C) 2025 : Christopher Leidigh, The Thunderbird Team

  ImportExportTools NG is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */


// ietngUtils.js


var EXPORTED_SYMBOLS = ["ietngUtils"];

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");


var ietngUtils = {

  Services: globalThis.Services || ChromeUtils.import(
    'resource://gre/modules/Services.jsm'
  ).Services,

  IETprefs: Cc["@mozilla.org/preferences-service;1"]
    .getService(Ci.nsIPrefBranch),

  top: Cc["@mozilla.org/appshell/window-mediator;1"]
    .getService(Ci.nsIWindowMediator)
    .getMostRecentWindow("mail:3pane"),

  getNativeSelectedMessages: async function (wextSelectedMessages) {

    // This should be changed to use pure wext selected message list
    // Have to determine most efficient way for large message sets

    // we have three scenarios wextSelectedMessages exists,
    // there is a null id therefore fewer than 100 msgs, or
    // a valid id indicating more than 100 msgs, if no
    // wextSelectedMessages we are coming from a shortcut and have to request
    // the selected msgs

    var msgUris = [];

    var curDBView;
    var gTabmail = this.top.gTabmail;
    // Lets see where we are
    if (gTabmail.currentAbout3Pane) {
      // On 3p
      curDBView = gTabmail.currentAbout3Pane.gDBView;
    } else if (gTabmail.currentAboutMessage) {
      curDBView = gTabmail.currentAboutMessage.gDBView;
    }

    if (wextSelectedMessages) {
      // check if we have a valid id (over 100)
      if (wextSelectedMessages.id) {
        // over 100, use the dbview
        msgUris = curDBView.getURIsForSelection();
      } else {
        // under, use params.selectedMessages
        wextSelectedMessages.messages.forEach(msg => {
          let realMessage = window.ietngAddon.extension
            .messageManager.get(msg.id);

          let uri = realMessage.folder.getUriForMsg(realMessage);
          msgUris.push(uri);
        });
      }
    } else {
      // no params
      var msgIdList = await window.ietngAddon.notifyTools.notifyBackground({ command: "getSelectedMessages" });
      if (msgIdList.id) {
        msgUris = curDBView.getURIsForSelection();
      } else {
        msgIdList.messages.forEach(msg => {
          let realMessage = window.ietngAddon.extension
            .messageManager.get(msg.id);

          let uri = realMessage.folder.getUriForMsg(realMessage);
          msgUris.push(uri);
        });
      }
    }
    return msgUris;
  },

  openFileDialog: async function (window, mode, title, initialDir, filter) {

    let winCtx = window;
    const tbVersion = this.getThunderbirdVersion();
    if (tbVersion.major >= 120) {
      winCtx = window.browsingContext;
    }
    let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    let resultObj = {};
    fp.init(winCtx, title, mode);
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
      // window.setTimeout(function () { _this.refreshStatusLine(window, text); }, delay - 500);


    } else {
      alert("no status ");
    }
  },

  createStatusLine: function (window) {

    if (window.document.getElementById("ietngStatusText")) {
      return;
    }

    let s = window.document.getElementById("statusText");
    let s2 = window.document.createElement("label");
    s2.classList.add("statusbarpanel");
    s2.setAttribute("id", "ietngStatusText");
    s2.style.width = "420px";
    s2.style.overflow = "hidden";
    s.before(s2);
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
    str = str.replace(/[\\:?"\*\/<>|]/g, "_");
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

  createUniqueFolderName: function (foldername, destDirPath, structure, useMboxExt) {

    // for mbox extension we have to gyrate bit

    var destdirNSIFILE = Cc["@mozilla.org/file/local;1"]
      .createInstance(Ci.nsIFile);
    destdirNSIFILE.initWithPath(destDirPath);

    var overwrite = this.IETprefs.getBoolPref("extensions.importexporttoolsng.export.overwrite");
    var index = 0;
    var nameIndex = "";
    var NSclone = destdirNSIFILE.clone();

    // Change unsafe chars for filenames with underscore
    foldername = this.sanitizeFileOrFolderName(foldername);
    foldername = this.nameToAcii(foldername);

    if (useMboxExt) {
      foldername += ".mbox";
    }
    NSclone.append(foldername);
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
    var ext = "";
    while (NSclone.exists()) {
      index++;
      let comp = foldername.split(".");
      if (comp.length > 1) {
        ext = comp[comp.length - 1];
        nameIndex = foldername.split(`.${ext}`)[0] + "-" + index.toString() + `.${ext}`;
      } else if (!useMboxExt) {
        nameIndex = foldername + "-" + index.toString();

      } else {
        nameIndex = foldername.split(".mbox")[0] + "-" + index.toString() + ".mbox";
      }
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

  getThunderbirdVersion: function () {
    let parts = this.Services.appinfo.version.split(".");
    return {
      major: parseInt(parts[0]),
      minor: parseInt(parts[1]),
      revision: parts.length > 2 ? parseInt(parts[2]) : 0,
    };
  },



  rebuildSummary: async function (folder) {

    if (folder.locked) {
      folder.throwAlertMsg("operationFailedFolderBusy", window.msgWindow);
      return;
    }
    if (folder.supportsOffline) {
      // Remove the offline store, if any.
      await IOUtils.remove(folder.filePath.path, { recursive: true }).catch(
      );
    }

    // Send a notification that we are triggering a database rebuild.
    MailServices.mfn.notifyFolderReindexTriggered(folder);

    try {
      const msgDB = folder.msgDatabase;
      msgDB.summaryValid = false;
      folder.closeAndBackupFolderDB("");
    } catch (e) {
      // In a failure, proceed anyway since we're dealing with problems
      folder.ForceDBClosed();
    }

    folder.updateFolder(window.msgWindow);
    return;
  },

  createSubfolder: async function (msgFolder, subFolderName, tryRecovery) {

    return new Promise(async (resolve, reject) => {

      let folderListener = {
        folderAdded: function (aFolder) {
          if (aFolder.name == subFolderName && aFolder.parent == msgFolder) {
            MailServices.mfn.removeListener(folderListener);
            resolve(aFolder);
          }
        },
      };
      MailServices.mfn.addListener(folderListener, MailServices.mfn.folderAdded);


      // createSubfolder will fail under some circumstances when
      // doing large imports. Failures start around 250+ and become
      // persistent around 500+. The failures above 500 are likely
      // do to Windows file descriptor limits.
      // A rebuildSummary followed by a createSubfolder retry
      // recovers the operation in most circumstances.
      // Odd database behaviors have sometimes been observed
      // even if recovery succeeded

      try {
        let res = await window.WEXTcreateSubfolder(msgFolder, subFolderName);
      } catch (ex) {
        try {
          console.log(`IETNG: createSubfolder failed, retry for: ${subFolderName}`);
          await new Promise(r => window.setTimeout(r, 100));
          await this.rebuildSummary(msgFolder);
          await new Promise(r => window.setTimeout(r, 1000));

          let res = await window.WEXTcreateSubfolder(msgFolder, subFolderName);

          console.log("IETNG: Recovery succeeded");
        } catch (ex) {
          console.log("IETNG: Recovery failed");
          // extend exception to include msg with subfolder name
          let createSubfolderErrMsg = window.ietngAddon.extension.localeData.localizeMessage("createSubfolderErr.msg");

          ex.extendedMsg = `${createSubfolderErrMsg} ${subFolderName}`;
          reject(ex);
        }
      }
    });


  },

};
