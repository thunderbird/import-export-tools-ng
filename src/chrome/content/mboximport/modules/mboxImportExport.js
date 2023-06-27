// mboxImportExport.js

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

var { ietngUtils } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/ietngUtils.js");

var window;

export async function setGlobals(gVars) {
  window = gVars.window;
  return
}

export var mboxImportExport = {

  totalImported: 0,
  totalSkipped: 0,

  importMboxSetup: async function (params) {
    // Either individual mboxes or by directory
    var fpRes;
    var mboxFiles;

    if (params.mboxImpType == "individual") {
      fpRes = await ietngUtils.openFileDialog(window, Ci.nsIFilePicker.modeOpenMultiple, "Select mbox files to import", null, null);
      if (fpRes.result == -1) {
        return;
      }
      mboxFiles = fpRes.filesArray;
    } else {
      fpRes = await ietngUtils.openFileDialog(window, Ci.nsIFilePicker.modeGetFolder, "Select folder to import mbox files", null, null);
      if (fpRes.result == -1) {
        return;
      }
      mboxFiles = await this._scanDirForMboxFiles(fpRes.folder);
    }

    var msgFolder = window.getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path);

    this.importMboxFiles(mboxFiles, msgFolder, params.mboxImpRecursive);
    await new Promise(r => window.setTimeout(r, 3000));

    ietngUtils.writeStatusLine(window, "Done Importing:" , 6000);

  },

  importMboxFiles: async function (files, msgFolder, recursive) {
    for (let i = 0; i < files.length; i++) {
      const mboxFilePath = files[i];
      console.log(mboxFilePath)
      ietngUtils.writeStatusLine(window, "Importing:" + mboxFilePath, 6000);
				//await new Promise(r => window.setTimeout(r, 4000));

      let rv = await this._isMboxFile(mboxFilePath);
      if (!(await this._isMboxFile(mboxFilePath))) {
        console.log("IETNG: Skip non-mbox file: ", mboxFilePath);
        ietngUtils.writeStatusLine(window, "IETNG: Skip non-mbox file: " + mboxFilePath, 3000);

        continue;
      }
      var subMsgFolder = await this._importMboxFile(mboxFilePath, msgFolder);
      if (recursive && await this._ifSbdExists(mboxFilePath)) {
        var subFiles = await this._scanSbdDirForFiles(mboxFilePath);
        await this.importMboxFiles(subFiles, subMsgFolder, recursive);
      }
    }
  },

  _scanDirForMboxFiles: async function (folderPath) {
    let files = await IOUtils.getChildren(folderPath);
    var mboxFiles = [];
    for (const f of files) {
      if ((await IOUtils.stat(f)).type == "regular") {
        if (f.endsWith(".msf")) {
          continue;
        }
        if (await this._isMboxFile(f)) {
          mboxFiles.push(f);
        }
      }
    }
    return mboxFiles;
  },

  _scanSbdDirForFiles: async function (folderPath) {
    let files = await IOUtils.getChildren(folderPath + ".sbd");
    var subFiles = [];
    for (const f of files) {
      if ((await IOUtils.stat(f)).type == "regular") {
        subFiles.push(f);
      }
    }
    return subFiles;
  },

  _ifSbdExists: async function (folderPath) {
    let sbdPath = folderPath + ".sbd";
    return IOUtils.exists(sbdPath);
  },

  _isMboxFile: async function (filePath) {
    let fromRegx = /^(From (?:.*?)\r?\n)[\x21-\x7E]+:/gm;

    // Read chunk as uint8
    var rawBytes = await IOUtils.read(filePath, { offset: 0, maxBytes: 500 });
    // convert to faster String for regex etc
    let strBuffer = ietngUtils.bytesToString2(rawBytes);
    //console.log(strBuffer)
    let rv = fromRegx.test(strBuffer);
    return rv;
  },

  _importMboxFile: async function (filePath, msgFolder) {
    var src = filePath;
    var subFolderName = PathUtils.filename(filePath);
    subFolderName = msgFolder.generateUniqueSubfolderName(subFolderName, null);

    msgFolder.createSubfolder(subFolderName, window.msgWindow);
    var subMsgFolder = msgFolder.getChildNamed(subFolderName);

    var subFolderPath = subMsgFolder.filePath.QueryInterface(Ci.nsIFile).path;
    var dst = subFolderPath;
    let r = await IOUtils.copy(src, dst);
    this.reindexDBandRebuildSummary(subMsgFolder);
    this.forceFolderCompact(subMsgFolder);
    return subMsgFolder;
  },


  reindexDBandRebuildSummary: function (msgFolder) {
    // Send a notification that we are triggering a database rebuild.
    MailServices.mfn.notifyFolderReindexTriggered(msgFolder);

    msgFolder.msgDatabase.summaryValid = false;

    const msgDB = msgFolder.msgDatabase;
    msgDB.summaryValid = false;
    try {
      msgFolder.closeAndBackupFolderDB("");
    } catch (e) {
      // In a failure, proceed anyway since we're dealing with problems
      msgFolder.ForceDBClosed();
    }
    msgFolder.updateFolder(window.msgWindow);
  },

  forceFolderCompact: function (msgFolder) {
    console.log(msgFolder)
    var file = msgFolder.filePath.QueryInterface(Ci.nsIFile);
    var foStream = Cc["@mozilla.org/network/file-output-stream;1"].
      createInstance(Ci.nsIFileOutputStream);
    var data = "\n\nFrom Moon\nX-Mozilla-Status: 0009\nX-Mozilla-Status2: 00800000\nDate: Fri, 08 Feb 2008 10:30:48 +0100\nFrom: nomail@nomail.no\nMIME-Version: 1.0\nTo: nomail@nomail.no\nSubject: empty\nContent-Type: text/plain\n\n\n\n";
    foStream.init(file, 0x02 | 0x08 | 0x10, 0o666, 0);
    foStream.write(data, data.length);
    foStream.close();
    msgFolder.compact(null, window.msgWindow);
    return true;
  }
}
