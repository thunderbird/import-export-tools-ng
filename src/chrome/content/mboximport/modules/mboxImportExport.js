// mboxImportExport.js

import openFileDialog from "./ietngUtils.js";
export async function mboxDispatcher(params) {
  console.log("utest", Utils)

  switch () {
    case value:
      
      break;
  
    default:
      break;
  }

 return  
}

export var mboxImportExport = {

  importMboxSetup: async function (params) {
    // Either individual mboxes or by directory
    var fpRes;
    if (params.mboxImpType == "Individual") {
      fpRes = await openFileDialog(window, Ci.nsIFilePicker.modeOpenMultiple,"Select mbox files", null, null);
      if (fpRes.result == -1) {
        return;
      }
    } else {
      fpRes = await openFileDialog(window, Ci.nsIFilePicker.modeGetFolder,"Select folder to import mbox files", null, null);
      if (fpRes.result == -1) {
        return;
      }
      mboxFiles = _scanDirForMboxFiles(res.folder);
    }
  },

  importMboxFiles:  async function (files, msgFolder, recursive) {
    for (let i = 0; i < files.length; i++) {
      const mboxFilePath = files[i];
      var subMsgFolder = await _importMboxFile(mboxFilePath, msgFolder);
      if (recursive && await _ifSbdExists(mboxFilePath)) {
        var subFiles = await _scanSbdDirForFiles(mboxFilePath);
        console.log("sf",subFiles)
        importMboxFiles(subFiles, subMsgFolder, recursive);
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
        if (isMboxFile(f)) {
          mboxFiles.push(f);
        }
      }
    }
  },

  _scanSbdDirForFiles:  async function (folderPath) {
    let files = await IOUtils.getChildren(folderPath + ".sbd");
    var subFiles = [];
    for (const f of files) {
      if ((await IOUtils.stat(f)).type == "regular") {
        subFiles.push(f);
      }
    }
    return subFiles;
  },
  
  _ifSbdExists:async function (folderPath) {
    let sbdPath = folderPath + ".sbd";
    return IOUtils.exists(sbdPath);
  },

  _isMboxFile: async function (filePath) {
    var data = await IOUtils
  },
  
  _importMboxFileasync: function (filePath, msgFolder) {
    var src = filePath;
    console.log(filePath)
    var subFolderName = PathUtils.filename(filePath);
    subFolderName = msgFolder.generateUniqueSubfolderName(subFolderName, null);
  
    msgFolder.createSubfolder(subFolderName, top.msgWindow);
    var subMsgFolder = msgFolder.getChildNamed(subFolderName);
    //await new Promise(resolve => setTimeout(resolve, 200));
  
    var subFolderPath = subMsgFolder.filePath.QueryInterface(Ci.nsIFile).path;
    console.log(subFolderPath)
    var dst = subFolderPath;
    console.log(src, dst)
    let r = await IOUtils.copy(src, dst);
    reindexDBandRebuildSummary(subMsgFolder);
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
    msgFolder.updateFolder(top.msgWindow);
  }
}