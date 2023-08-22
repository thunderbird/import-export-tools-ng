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


// mboxImportExport.js

//var EXPORTED_SYMBOLS = ["mboxImportExport"];

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

var { ietngUtils } = ChromeUtils.import("chrome://mboximport/content/mboximport/modules/ietngUtils.js");
var { Subprocess } = ChromeUtils.importESModule("resource://gre/modules/Subprocess.sys.mjs");
var { parse5322 } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/email-addresses.js");

Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/importMboxTest.js", window, "UTF-8");


var window;



export var mboxImportExport = {

  mboximportbundle: Services.strings.createBundle("chrome://mboximport/locale/mboximport.properties"),
  totalImported: 0,
  totalSkipped: 0,
  toCompactFolderList: [],

  setGlobals: async function (gVars) {
    window = gVars.window;
    return
  },

  importMboxSetup: async function (params) {
    console.log("setup")
    ietngUtils.writeStatusLine(window, "setup", 8000);

    // Either individual mboxes or by directory
    var fpRes;
    var mboxFiles;

    this.totalImported = 0;
    this.totalSkipped = 0;
    this.toCompactFolderList = [];


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

    await this.importMboxFiles(mboxFiles, msgFolder, params.mboxImpRecursive);

    let total = this.totalImported + this.totalSkipped;
    let doneMsg = this.mboximportbundle.GetStringFromName("importDone");
    let result = `${doneMsg}: ${this.totalImported}/${total}`;

    ietngUtils.writeStatusLine(window, result, 8000);
    this.compactAllFolders();
    // wait for status done, remove our status element
    await new Promise(r => window.setTimeout(r, 8000));
    window.document.getElementById("ietngStatusText").remove();
  },

  importMboxFiles: async function (files, msgFolder, recursive) {
    console.log("imp mboxf")
    for (let i = 0; i < files.length; i++) {
      const mboxFilePath = files[i];
      let impMsg = this.mboximportbundle.GetStringFromName("importing");

      ietngUtils.writeStatusLine(window, impMsg + ": " + PathUtils.filename(mboxFilePath), 6000);
      await new Promise(r => window.setTimeout(r, 100));

      let rv = await this._isMboxFile(mboxFilePath);
      if (!(await this._isMboxFile(mboxFilePath))) {
        let skipNonMboxMsg = this.mboximportbundle.GetStringFromName("skipNonMbox");

        console.log("IETNG: " + skipNonMboxMsg + ": " + mboxFilePath);
        ietngUtils.writeStatusLine(window, skipNonMboxMsg + ": " + PathUtils.filename(mboxFilePath), 3000);
        this.totalSkipped++;
        continue;
      }
      var subMsgFolder = await this._importMboxFile(mboxFilePath, msgFolder);
      if (subMsgFolder) {
        this.totalImported++;
      }
      if (recursive && await this._ifSbdExists(mboxFilePath)) {
        var subFiles = await this._scanSbdDirForFiles(mboxFilePath);
        await this.importMboxFiles(subFiles, subMsgFolder, recursive);
      }
    }
  },


  copyAndFixMboxFile: async function (source, destination) {
    if (!(await this._isMboxFile(source))) {

      console.log("copy borked mbox")
      console.log(new Date())
      // Read initial block, check for existing first From
      let firstBlock = await IOUtils.read(source, { maxBytes: 10000 });
      let strBuffer = ietngUtils.bytesToString2(firstBlock);
      console.log(strBuffer)
      let fromRegx = /^From: ([^\n\r]*)$/m;
      let dateRegx = /^Date: ([^\n\r]*)$/m;
      let deliveryDateRegx = /^Delivery-date: ([^\n\r]*)$/m;

      let fromStr = strBuffer.match(fromRegx);
      let dateStr = strBuffer.match(dateRegx);
      let deliveryDateStr = strBuffer.match(deliveryDateRegx);

      console.log(fromStr)
      console.log(dateStr)
      console.log(deliveryDateStr)

      let dateMatch = dateStr || deliveryDateStr;
      let date = dateMatch[1] || "";
      console.log(date)

      console.log(parse5322.parseFrom(fromStr[1])[0].address)
      console.log(parse5322.parseOneAddress(fromStr[1]).address)
      let fromAddr = parse5322.parseOneAddress(fromStr[1]).address;

      let FromSeparator = "From - " + fromAddr + " " + date + "\r";
      console.log(FromSeparator)
      await IOUtils.write(destination, ietngUtils.stringToBytes(FromSeparator));

      if (window.navigator.platform.toLowerCase().includes("win")) {

        let env = Subprocess.getEnvironment();
        console.log(env)

        //let arrParams = ["/c","timeout /t 10 /nobreak &dir&timeout /t 5 /nobreak"]
        let arrParams = ["/c", "copy", destination, "+", source, destination]
        //let arrParams = ["/c","dir"]


        let p = await Subprocess.call({ command: env.ComSpec, arguments: arrParams, stderr: "stdout" })
        console.log(p)
        p.stdin.close()
        let result = await p.stdout.readString();
        result += await p.stdout.readString();
        result += await p.stdout.readString();

        console.log(result);

        let { exitCode } = await p.wait();
        console.log(p, exitCode)

        //await window.printingtools.test(source, destination)
        console.log(new Date())
        if (p.exitCode) {
          alert(result)
        }
      } else {
        //alert("")
        // under non windows platforms we assume the shell is bash
        // find it
        let bashPath = await Subprocess.pathSearch("bash");
        let argsArr = ["-c", `cat "${source}" >> "${destination}"`];
        console.log(argsArr[1])
        let proc = await Subprocess.call({ command: bashPath, arguments: argsArr, stderr: "stdout" });
        proc.stdin.close();
        let result = "";
        let string;
        while ((string = await proc.stdout.readString())) {
          result += string;
        }

        console.log(result);

        let { exitCode } = await proc.wait();
        console.log(proc)
        console.log(proc.exitCode)

        if (proc.exitCode) {
          alert(result)
        }
      }
    } else {
      console.log("copy normal mbox")
      console.log(new Date())

      await IOUtils.copy(source, destination);
      console.log(new Date())

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
    if ((await IOUtils.stat(filePath)).size == 0) {
      return true;
    }

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
    //let r = await IOUtils.copy(src, dst);

    await mboxCopyImport({ srcPath: src, destPath: dst });

    this.reindexDBandRebuildSummary(subMsgFolder);
    this.toCompactFolderList.push(subMsgFolder);
    return subMsgFolder;
  },


  exportFoldersToMbox: async function (rootMsgFolder, destPath, inclSubfolders, flattenSubfolders) {

    let uniqueName = ietngUtils.createUniqueFolderName(rootMsgFolder.name, destPath, false);
    let fullFolderPath = PathUtils.join(destPath, uniqueName);

    await this.buildAndExportMbox(rootMsgFolder, fullFolderPath);

    //console.log(inclSubfolders)
    //console.log(rootMsgFolder.hasSubFolders)

    // This is our structured subfolder export if subfolders exist
    if (inclSubfolders && rootMsgFolder.hasSubFolders && !flattenSubfolders) {
      let fullSbdDirPath = PathUtils.join(destPath, uniqueName + ".sbd");
      await IOUtils.makeDirectory(fullSbdDirPath);
      await this.exportSubFolders(rootMsgFolder, fullSbdDirPath);
    }

  },

  exportSubFolders: async function (msgFolder, fullSbdDirPath) {

    console.log(msgFolder.name)
    console.log(fullSbdDirPath)

    for (let subMsgFolder of msgFolder.subFolders) {

      console.log("sf ", subMsgFolder.name)
      let fullSubMsgFolderPath = PathUtils.join(fullSbdDirPath, subMsgFolder.prettyName);
      console.log("fullSubMsgFolderPath ", fullSubMsgFolderPath)
      await this.buildAndExportMbox(subMsgFolder, fullSubMsgFolderPath);
      if (subMsgFolder.hasSubFolders) {
        let fullNewSbdDirPath = PathUtils.join(fullSbdDirPath, subMsgFolder.prettyName + ".sbd");
        console.log(fullNewSbdDirPath)

        await IOUtils.makeDirectory(fullNewSbdDirPath);
        await this.exportSubFolders(subMsgFolder, fullNewSbdDirPath);
      } else {
        //return;
      }

    }
  },


  buildAndExportMbox: async function (msgFolder, dest) {
    let st = new Date();
    console.log("Start: ", st, dest, msgFolder.prettyName)
    //var mboxDestPath = PathUtils.join(dest.path, msgFolder.prettyName);
    var mboxDestPath = dest;
    var folderMsgs = msgFolder.messages;
    var sep = "";
    const maxFileSize = 1021000000;
    const kFileChunkSize = 10000000;

    const getMsgLoop = async (emlsArray, startIndex) => {

      var msgsBuffer = "";
      var index = 0;
      var totalBytes = 0;
      var totalMessages = msgFolder.getTotalMessages(false);
      var totalTime;
      var fromAddr;
      let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: .*?(?:\r?\n)[\x21-\x7E]+: )/gm;

      console.log("Total msgs: ", totalMessages)

      let r = await IOUtils.write(mboxDestPath, new Uint8Array(), { mode: "overwrite" })

      while (folderMsgs.hasMoreElements()) {
        let msgHdr = folderMsgs.getNext();
        msgHdr = msgHdr.QueryInterface(Ci.nsIMsgDBHdr);
        let msgUri = msgFolder.getUriForMsg(msgHdr);

        try {
          fromAddr = parse5322.parseFrom(msgHdr.author)[0].address;
        } catch (ex) {
          fromAddr = "";
        }

        let rawBytes = await this.getRawMessage(msgUri);

        //console.log(rawBytes.substring(0,500))

        if (index) {
          sep = "\n";
        }

        let fromHdr = `${sep}From - ${fromAddr}\n`;
        //console.log(rawBytes.substring(0, 5))
        var firstLineIndex;
        if (rawBytes.substring(0, 5) == "From ") {
          fromHdr = "";
          firstLineIndex = rawBytes.indexOf("\n")
          console.log("fi ", firstLineIndex)
          console.log(rawBytes.substring(0, firstLineIndex))
        } else {
          firstLineIndex = -1;
        }

        rawBytes = rawBytes.substring(firstLineIndex + 1).replace(fromRegx, ">$1" )
        //console.log(rawBytes)
        msgsBuffer = msgsBuffer + fromHdr + rawBytes;

        //if (msgsBuffer.length >= kFileChunkSize || index == totalMessages - 1 || totalBytes >= maxFileSize) {
        if (msgsBuffer.length >= kFileChunkSize || index == (totalMessages - 1)) {
          ietngUtils.writeStatusLine(window, "Exporting " + msgFolder.name + " Msgs: " + (index + 1) + " - " + ietngUtils.formatBytes(totalBytes, 2), 14000);

          //console.log("write ", index + 1)
          let outBuffer = ietngUtils.stringToBytes(msgsBuffer)
          let r = await IOUtils.write(mboxDestPath, outBuffer, { mode: "append" })

          totalBytes += outBuffer.length;

          msgsBuffer = "";
          if (index == totalMessages - 1 || totalBytes >= maxFileSize) {
            ietngUtils.writeStatusLine(window, "Exporting " + msgFolder.name + " Msgs: " + (index + 1) + " - " + ietngUtils.formatBytes(totalBytes, 2) + " Time: " + ((new Date() - st) / 1000) + "s", 14000);

            totalTime = (new Date() - st) / 1000;
            break;
          }
          //IETwritestatus("Msgs: " + (index + 1))
        }
        index++;

      }
      console.log(totalBytes)
      console.log(`Exported Folder: ${msgFolder.prettyName}\n\nTotal bytes: ${totalBytes}\nTotal messages: ${index++}\n\nExport Time: ${totalTime}s`);
      return index;
    };

    let rv = await getMsgLoop("", 0);
    console.log(rv)

    let end = new Date();
    console.log("End: ", end, (end - st) / 1000)
  },

  getRawMessage: async function (msgUri) {
    /*
    // If this message is a sub-message (an attachment of another message), get it
    // as an attachment from the parent message and return its raw content.
    let subMsgPartName = getSubMessagePartName(msgHdr);
    if (subMsgPartName) {
      let parentMsgHdr = getParentMsgHdr(msgHdr);
      let attachment = await getAttachment(parentMsgHdr, subMsgPartName);
      return attachment.raw.reduce(
        (prev, curr) => prev + String.fromCharCode(curr),
        ""
      );
    }
  	
    // Messages opened from file do not have a folder property, but
    // have their url stored as a string property.
    let msgUri = msgHdr.folder
      ? msgHdr.folder.generateMessageURI(msgHdr.messageKey)
      : msgHdr.getStringProperty("dummyMsgUrl");
  */


    let service = MailServices.messageServiceFromURI(msgUri);
    return new Promise((resolve, reject) => {
      let streamlistener = {
        _data: [],
        _stream: null,
        onDataAvailable(aRequest, aInputStream, aOffset, aCount) {
          if (!this._stream) {
            this._stream = Cc[
              "@mozilla.org/scriptableinputstream;1"
            ].createInstance(Ci.nsIScriptableInputStream);
            this._stream.init(aInputStream);
          }
          this._data.push(this._stream.read(aCount));
        },
        onStartRequest() { },
        onStopRequest(request, status) {
          if (Components.isSuccessCode(status)) {
            resolve(this._data.join(""));
          } else {
            reject(
              new ExtensionError(
                `Error while streaming message <${msgUri}>: ${status}`
              )
            );
          }
        },
        QueryInterface: ChromeUtils.generateQI([
          "nsIStreamListener",
          "nsIRequestObserver",
        ]),
      };

      // This is not using aConvertData and therefore works for news:// messages.
      service.streamMessage(
        msgUri,
        streamlistener,
        null, // aMsgWindow
        null, // aUrlListener
        false, // aConvertData
        "" //aAdditionalHeader
      );
    });
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

  compactAllFolders: function () {
    this.toCompactFolderList.forEach(msgFolder => {
      this.forceFolderCompact(msgFolder);
    });
  },

  forceFolderCompact: function (msgFolder) {
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
