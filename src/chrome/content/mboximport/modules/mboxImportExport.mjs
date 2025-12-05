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


// mboxImportExport.mjs
// convert for esm modules

var window = Cc["@mozilla.org/appshell/window-mediator;1"]
  .getService(Ci.nsIWindowMediator)
  .getMostRecentWindow("mail:3pane");

var { AppConstants } = ChromeUtils.importESModule("resource://gre/modules/AppConstants.sys.mjs");
var Ietng_ESM = parseInt(AppConstants.MOZ_APP_VERSION, 10) >= 128;

var { ExtensionParent } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionParent.sys.mjs"
);

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
  "ImportExportToolsNG@cleidigh.kokkini.net"
);

var { MailServices } = Ietng_ESM
  ? ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs")
  : ChromeUtils.import("resource:///modules/MailServices.jsm");

var { ietngUtils } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/ietngUtils.mjs?"
  + ietngExtension.manifest.version + window.ietngAddon.dateForDebugging);

var { Subprocess } = ChromeUtils.importESModule("resource://gre/modules/Subprocess.sys.mjs");
var { parse5322 } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/email-addresses.mjs");
var { strftime } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/strftime.mjs");

Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/importMboxModule-5.js", window.ietngAddon, "UTF-8");
console.log("IETNG: mboximportExport.mjs -v15t1");

export var mboxImportExport = {

  IETprefs: Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch),
  totalImported: 0,
  totalSkipped: 0,
  toCompactFolderList: [],

  setGlobals: async function (gVars) {
    window = gVars.window;
    return;
  },

  importMboxSetup: async function (params) {
    // create our ietng status line
    ietngUtils.createStatusLine(window);

    // Either individual mboxes or by directory
    var fpRes;
    var mboxFiles;

    this.totalImported = 0;
    this.totalSkipped = 0;
    this.toCompactFolderList = [];

    let selectMboxFiles_title = ietngUtils.localizeMsg("selectMboxFiles_title");
    let selectFolderForMboxes_title = ietngUtils.localizeMsg("selectFolderForMboxes_title");

    var warningMsg = window.ietngAddon.extension.localeData.localizeMessage("Warning.msg");
    var errorMsg = window.ietngAddon.extension.localeData.localizeMessage("Error.msg");
    var largeFolderImportMsg = window.ietngAddon.extension.localeData.localizeMessage("largeFolderImport.msg");

    try {

      if (params.mboxImpType == "individual") {
        fpRes = await ietngUtils.openFileDialog(window, Ci.nsIFilePicker.modeOpenMultiple, selectMboxFiles_title, null, null);
        if (fpRes.result == -1) {
          return;
        }
        mboxFiles = fpRes.filesArray;
      } else {
        fpRes = await ietngUtils.openFileDialog(window, Ci.nsIFilePicker.modeGetFolder, selectFolderForMboxes_title, null, null);
        if (fpRes.result == -1) {
          return;
        }
        mboxFiles = await this._scanDirForMboxFiles(fpRes.folder);
      }


      var msgFolder;

      msgFolder = window.getMsgFolderFromAccountAndPath(params.selectedAccount.id, params.selectedFolder.path);

      await this.importMboxFiles(mboxFiles, msgFolder, params.mboxImpRecursive);

      let total = this.totalImported + this.totalSkipped;
      let doneMsg = ietngUtils.localizeMsg("importDone");
      let result = `${doneMsg}: ${this.totalImported}/${total}`;

      await new Promise(r => window.setTimeout(r, 2500));

      ietngUtils.writeStatusLine(window, result, 8000);
      // wait for status done, remove our status element
      await new Promise(r => window.setTimeout(r, 8000));
      window.document.getElementById("ietngStatusText").remove();
    } catch (ex) {
      let errMsg = ex;
      if (ex.extendedMsg) {
        errMsg += `\n\n${ex.extendedMsg}`;
      }
      errMsg += `\n\n${ex.stack}`;

      window.document.getElementById("ietngStatusText").remove();
      Services.prompt.alert(window, errorMsg, errMsg);
      console.log(`IETNG: ${errMsg}`);
      return { status: "error" };
    }

    if (this.totalImported > 200) {
      Services.prompt.alert(window, warningMsg, largeFolderImportMsg);
    }
    return { status: "ok" };
  },

  importMboxFiles: async function (files, msgFolder, recursive) {

    var useCopyImport;
    var skipMbox;

    for (let i = 0; i < files.length; i++) {
      useCopyImport = false;
      skipMbox = false;

      const mboxFilePath = files[i];

      let stat = await IOUtils.stat(mboxFilePath);
      let fname = PathUtils.filename(mboxFilePath);

      let over4GBskipMsg = ietngUtils.localizeMsg("over4GBskipMsg");

      if (stat.size > 170000000000) {
        console.log(`Mbox ${fname} larger than 4GB, skipping`);
        //window.alert(`Mbox ${fname} ${over4GBskipMsg}`);

        let prompt = Services.prompt;
        let buttonFlags = (prompt.BUTTON_POS_0) * (prompt.BUTTON_TITLE_IS_STRING) + (prompt.BUTTON_POS_1) * (prompt.BUTTON_TITLE_IS_STRING);
        let buttonReturn = Services.prompt.confirmEx(window, "Mbox over 4GB",
          "This mbox exceeds the 4GB direct import size.\n\nDo you want to use the copy import method ?\n\nThis method will not do mbox processing.\nIf the mbox has not been processed, some messages may\nbe corrupted.",

          buttonFlags,
          "Use Copy Import",
          "Skip mbox import",
          "",
          null, {});

        console.log(buttonReturn)
        if (buttonReturn == 0) {
          useCopyImport = true;
        } else {
          skipMbox = true;
        }
      }

      let impMsg = ietngUtils.localizeMsg("importing");

      ietngUtils.writeStatusLine(window, impMsg + ": " + PathUtils.filename(mboxFilePath), 6000);

      let rv = await this._isMboxFile(mboxFilePath);
      if (!(await this._isMboxFile(mboxFilePath))) {
        let skipNonMboxMsg = ietngUtils.localizeMsg("skipNonMbox");

        console.log("IETNG: " + skipNonMboxMsg + ": " + mboxFilePath);
        ietngUtils.writeStatusLine(window, skipNonMboxMsg + ": " + PathUtils.filename(mboxFilePath), 3000);
        this.totalSkipped++;
        continue;
      }

      var subMsgFolder;
      if (useCopyImport) {
        console.log("usecopy")
        subMsgFolder = await this._copyImportMboxFile(mboxFilePath, msgFolder);

      } else if (!skipMbox) {
        subMsgFolder = await this._importMboxFile(mboxFilePath, msgFolder);
      } else {
        subMsgFolder = await this._createEmptyMboxFile(mboxFilePath, msgFolder);

      }
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

      console.log("copy borked mbox");
      console.log(new Date());
      // Read initial block, check for existing first From
      let firstBlock = await IOUtils.read(source, { maxBytes: 10000 });
      let strBuffer = ietngUtils.bytesToString2(firstBlock);
      console.log(strBuffer);
      let fromRegx = /^From: ([^\n\r]*)$/m;
      let dateRegx = /^Date: ([^\n\r]*)$/m;
      let deliveryDateRegx = /^Delivery-date: ([^\n\r]*)$/m;

      let fromStr = strBuffer.match(fromRegx);
      let dateStr = strBuffer.match(dateRegx);
      let deliveryDateStr = strBuffer.match(deliveryDateRegx);

      console.log(fromStr);
      console.log(dateStr);
      console.log(deliveryDateStr);

      let dateMatch = dateStr || deliveryDateStr;
      let date = dateMatch[1] || "";
      console.log(date);

      console.log(parse5322.parseFrom(fromStr[1])[0].address);
      console.log(parse5322.parseOneAddress(fromStr[1]).address);
      let fromAddr = parse5322.parseOneAddress(fromStr[1]).address;

      let FromSeparator = "From - " + fromAddr + " " + date + "\r";
      console.log(FromSeparator);
      await IOUtils.write(destination, ietngUtils.stringToBytes(FromSeparator));

      if (window.navigator.platform.toLowerCase().includes("win")) {

        let env = Subprocess.getEnvironment();

        let arrParams = ["/c", "copy", destination, "+", source, destination];

        let p = await Subprocess.call({ command: env.ComSpec, arguments: arrParams, stderr: "stdout" });
        console.log(p);
        p.stdin.close();
        let result = await p.stdout.readString();
        result += await p.stdout.readString();
        result += await p.stdout.readString();

        console.log(result);

        let { exitCode } = await p.wait();
        console.log(p, exitCode);

        console.log(new Date());
        if (p.exitCode) {
          alert(result);
        }
      } else {
        // under non windows platforms we assume the shell is bash
        // find it
        let bashPath = await Subprocess.pathSearch("bash");
        let argsArr = ["-c", `cat "${source}" >> "${destination}"`];
        console.log(argsArr[1]);
        let proc = await Subprocess.call({ command: bashPath, arguments: argsArr, stderr: "stdout" });
        proc.stdin.close();
        let result = "";
        let string;
        while ((string = await proc.stdout.readString())) {
          result += string;
        }

        console.log(result);

        let { exitCode } = await proc.wait();
        console.log(proc);
        console.log(proc.exitCode);

        if (proc.exitCode) {
          alert(result);
        }
      }
    } else {
      console.log("copy normal mbox");
      console.log(new Date());

      await IOUtils.copy(source, destination);
      console.log(new Date());

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

    let fromRegx = /^(From (?:.*?)(?:\r|\n|\r\n))[\x21-\x7E]+:/gm;

    // Read chunk as uint8
    var rawBytes = await IOUtils.read(filePath, { offset: 0, maxBytes: 500 });
    // convert to faster String for regex etc
    let strBuffer = ietngUtils.bytesToString2(rawBytes);
    let rv = fromRegx.test(strBuffer);

    return rv;
  },

  _copyImportMboxFile: async function (filePath, msgFolder) {
    var src = filePath;
    var subFolderName;
    if (src.endsWith(".mbox")) {
      subFolderName = PathUtils.filename(filePath.split(".mbox")[0]);
    } else {
      subFolderName = PathUtils.filename(filePath);
    }

    subFolderName = msgFolder.generateUniqueSubfolderName(subFolderName, null);

    await ietngUtils.createSubfolder(msgFolder, subFolderName)

    var subMsgFolder = msgFolder.getChildNamed(subFolderName);
    var subFolderPath = subMsgFolder.filePath.QueryInterface(Ci.nsIFile).path;
    var dst = subFolderPath;

    // build our mbox in new subfolder
    //await mboxCopyImport({ srcPath: src, destPath: dst });
    console.log(src)
    await IOUtils.copy(src, dst, {})
    // this forces an mbox to be reindexed and build new msf
    await ietngUtils.rebuildSummary(subMsgFolder);
    // give up some time to ui
    await new Promise(r => window.setTimeout(r, 200));

    return subMsgFolder;

  },

  _createEmptyMboxFile: async function (filePath, msgFolder) {
    var src = filePath;
    var subFolderName;
    if (src.endsWith(".mbox")) {
      subFolderName = PathUtils.filename(filePath.split(".mbox")[0]);
    } else {
      subFolderName = PathUtils.filename(filePath);
    }

    subFolderName = msgFolder.generateUniqueSubfolderName(subFolderName, null);

    await ietngUtils.createSubfolder(msgFolder, subFolderName)

    var subMsgFolder = msgFolder.getChildNamed(subFolderName);
    return subMsgFolder;
  },

  _importMboxFile: async function (filePath, msgFolder) {
    var src = filePath;
    var subFolderName;
    if (src.endsWith(".mbox")) {
      subFolderName = PathUtils.filename(filePath.split(".mbox")[0]);
    } else {
      subFolderName = PathUtils.filename(filePath);
    }

    subFolderName = msgFolder.generateUniqueSubfolderName(subFolderName, null);

    await ietngUtils.createSubfolder(msgFolder, subFolderName)

    var subMsgFolder = msgFolder.getChildNamed(subFolderName);
    var subFolderPath = subMsgFolder.filePath.QueryInterface(Ci.nsIFile).path;
    var dst = subFolderPath;

    // build our mbox in new subfolder
    await window.ietngAddon.mboxCopyImport({ srcPath: src, destPath: dst });

    // this forces an mbox to be reindexed and build new msf
    await ietngUtils.rebuildSummary(subMsgFolder);
    // give up some time to ui
    await new Promise(r => window.setTimeout(r, 200));

    return subMsgFolder;
  },

  exportFoldersToMbox: async function (rootMsgFolder, destPath, inclSubfolders, flattenSubfolders) {

    let useMboxExt = false;
    if ((!inclSubfolders || flattenSubfolders) && this.IETprefs.getBoolPref("extensions.importexporttoolsng.export.mbox.use_mboxext")) {
      useMboxExt = true;
    }

    let rootFolderName;
    if (!rootMsgFolder.localizedName) {
      rootFolderName = rootMsgFolder.prettyName;
    } else {
      rootFolderName = rootMsgFolder.localizedName;
    }
    let uniqueName = ietngUtils.createUniqueFolderName(rootFolderName, destPath, false, useMboxExt);
    let fullFolderPath = PathUtils.join(destPath, uniqueName);

    ietngUtils.createStatusLine(window);

    let msgFolderSize = rootMsgFolder.sizeOnDisk;

    rootMsgFolder = rootMsgFolder.QueryInterface(Ci.nsIMsgFolder);

    await this.buildAndExportMbox(rootMsgFolder, fullFolderPath);

    // This is our structured subfolder export if subfolders exist
    if (inclSubfolders && rootMsgFolder.hasSubFolders && !flattenSubfolders) {

      let fullSbdDirPath = PathUtils.join(destPath, uniqueName + ".sbd");
      await IOUtils.makeDirectory(fullSbdDirPath);
      await this.exportSubFolders(rootMsgFolder, fullSbdDirPath);
    } else if (inclSubfolders && rootMsgFolder.hasSubFolders && flattenSubfolders) {
      await this.exportSubFoldersFlat(rootMsgFolder, destPath, useMboxExt);
    }

    // wait before removing status text, should be delayed removal
    await new Promise(r => window.setTimeout(r, 2000));
    window.document.getElementById("ietngStatusText").remove();
  },

  exportSubFolders: async function (msgFolder, fullSbdDirPath) {

    for (let subMsgFolder of msgFolder.subFolders) {
      let subMsgFolderName;
      if (!subMsgFolder.localizedName) {
        subMsgFolderName = subMsgFolder.prettyName;
      } else {
        subMsgFolderName = subMsgFolder.localizedName;
      }
      let uniqueName = ietngUtils.createUniqueFolderName(subMsgFolderName, fullSbdDirPath, false, false);

      let fullSubMsgFolderPath = PathUtils.join(fullSbdDirPath, uniqueName);
      await this.buildAndExportMbox(subMsgFolder, fullSubMsgFolderPath);
      if (subMsgFolder.hasSubFolders) {
        let fullNewSbdDirPath = PathUtils.join(fullSbdDirPath, uniqueName + ".sbd");
        await IOUtils.makeDirectory(fullNewSbdDirPath);
        await this.exportSubFolders(subMsgFolder, fullNewSbdDirPath);
      }
    }
  },

  exportSubFoldersFlat: async function (msgFolder, fullFolderPath, useMboxExt) {

    for (let subMsgFolder of msgFolder.subFolders) {
      let subMsgFolderName;
      if (!subMsgFolder.localizedName) {
        subMsgFolderName = subMsgFolder.prettyName;
      } else {
        subMsgFolderName = subMsgFolder.localizedName;
      }
      let uniqueName = ietngUtils.createUniqueFolderName(subMsgFolderName, fullFolderPath, false, useMboxExt);
      let fullSubMsgFolderPath = PathUtils.join(fullFolderPath, uniqueName);

      await this.buildAndExportMbox(subMsgFolder, fullSubMsgFolderPath);
      if (subMsgFolder.hasSubFolders) {
        await this.exportSubFoldersFlat(subMsgFolder, fullFolderPath, useMboxExt);
      }
    }
  },

  buildAndExportMbox: async function (msgFolder, dest) {
    var exportingMsg = ietngUtils.localizeMsg("exportingMsg");
    var messagesMsg = ietngUtils.localizeMsg("messagesMsg");
    let timeMsg = ietngUtils.localizeMsg("timeMsg");

    let st = new Date();
    //console.log("Start: ", st, msgFolder.prettyName);

    var mboxDestPath = dest;
    var isVirtualFolder = msgFolder.flags & Ci.nsMsgFolderFlags.Virtual;

    // if we can't get msgFolder.messages just make empty mbox
    // this happens with the root folder on pop3 accounts
    try {
      var folderMsgs = msgFolder.messages;
    } catch (ex) {
      let r = await IOUtils.write(mboxDestPath, new Uint8Array(), { mode: "overwrite" });

      return;
    }
    var sep = "";
    //const maxFileSize = 1021000000;
    const kMaxFileSize = 30000000000;
    const kFileChunkSize = 10000000;

    var msgsBuffer = "";
    var index = 0;
    var totalBytes = 0;
    var totalMessages = msgFolder.getTotalMessages(false);
    var totalTime;
    var fromAddr;
    let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: .*?(?:\r?\n)[\x21-\x7E]+: )/gm;


    var vfMsgUris = [];
    if (isVirtualFolder) {
      vfMsgUris = await this._getVirtualFolderUriArray(msgFolder);
      if (vfMsgUris.length == 0) {
        return 1;
      }
    }

    //console.log("Total msgs: ", totalMessages);

    let r = await IOUtils.write(mboxDestPath, new Uint8Array(), { mode: "overwrite" });

    // we have to use different iterators for normal vs virtual folders
    function hasMoreMsgs() {
      if (isVirtualFolder) {
        return vfMsgUris.length;
      } else {
        return folderMsgs?.hasMoreElements();
      }
    };

    while (hasMoreMsgs()) {
      let msgUri;
      let msgHdr;

      if (vfMsgUris.length) {
        msgUri = vfMsgUris.shift();
        msgHdr = window.messenger.msgHdrFromURI(msgUri);
      } else {
        msgHdr = folderMsgs.getNext();
        msgUri = msgFolder.getUriForMsg(msgHdr);
      }
      msgHdr = msgHdr.QueryInterface(Ci.nsIMsgDBHdr);

      try {
        fromAddr = parse5322.parseFrom(msgHdr.author)[0].address;
      } catch (ex) {
        fromAddr = "";
      }

      // fix date format to use UTC per RFC 4155 - addresses #455
      // fix date format to match asctime format: Tue Nov 06 12:30:00 1967
      // Date is UTC of received date
      // addresses @xetdx And #537
      let msgDate = (new Date(msgHdr.dateInSeconds * 1000));
      msgDate.setMinutes(msgDate.getMinutes() + msgDate.getTimezoneOffset());
      let msgDateStr = strftime.strftime("%a %b %d %H:%M:%S %Y", msgDate);

      // get message as 8b string
      try {
        var rawBytes = await this.getRawMessage(msgUri, false);

      } catch (ex) {
        // create placeholder error msg with header info and exception
        rawBytes = `From: ${msgHdr.author}\n`;
        rawBytes += `To: ${msgHdr.recipients}\n`;
        rawBytes += `Date: ${msgDateStr}\n`;
        rawBytes += `Subject: MsgError:: ${msgHdr.subject}\n\n`;
        rawBytes += `${ex}\n\n\n`;
        console.log("IETNG: Message export error:");
        console.log(rawBytes);
      }

      if (index) {
        sep = "\n";
      }

      // fix From format to use RFC 4155 format- addresses #455

      let fromHdr = `${sep}From ${fromAddr} ${msgDateStr}\n`;
      // If TB gives us a From_ separator, null out
      if (rawBytes.substring(0, 5) == "From ") {
        rawBytes = rawBytes.replace(/^(From (?:.*?)\r?\n)/, "");
      } else {
        // may need to look ahead
      }

      // TB seems to have Local Folder messages with Mozilla-Status expunged
      // flag set despite messages being visible and alive
      // If we export these will be purged on import so we reset
      // Mozilla-Status and Mozilla-Status2 to 0000, 00000000 

      let m = rawBytes.matchAll(/(^X-Mozilla-Status: [0-9A-Fa-f]{3})([0-9A-Fa-f])/gm)
      m = [...m];
      if (m[0]) {
        let b = (parseInt(m[0][2], 16))
        const kExpungeBit = 0x8;
        let mask = ~kExpungeBit;
        b &= mask;
        b = b.toString(16)
        rawBytes = rawBytes.replace(m[0][0], m[0][1] + b);
      }

      // do only single From_ escape, assume pre escape handling by TB
      rawBytes = rawBytes.replace(fromRegx, ">$1");

      rawBytes = rawBytes.replaceAll(/\r\n/g, "\n");

      msgsBuffer = msgsBuffer + fromHdr + rawBytes;

      // tbd translate 
      if (msgsBuffer.length >= kFileChunkSize || index == (totalMessages - 1)) {
        ietngUtils.writeStatusLine(window, `${exportingMsg}  ` + msgFolder.name + " " + messagesMsg + ": " + (index + 1) + " - " + ietngUtils.formatBytes(totalBytes, 2), 14000);

        let outBuffer = ietngUtils.stringToBytes(msgsBuffer);
        let r = await IOUtils.write(mboxDestPath, outBuffer, { mode: "append" });

        totalBytes += outBuffer.length;

        msgsBuffer = "";
        if (index == totalMessages - 1 || totalBytes >= kMaxFileSize) {
          ietngUtils.writeStatusLine(window, `${exportingMsg}  ` + msgFolder.name + " " + messagesMsg + ": " + (index + 1) + " - " + ietngUtils.formatBytes(totalBytes, 2) + "  " + timeMsg + ":  " + ((new Date() - st) / 1000) + "s", 14000);

          totalTime = (new Date() - st) / 1000;
          break;
        }
      }
      index++;

    }
    // console.log(totalBytes);
    // console.log(`Exported Folder: ${msgFolder.prettyName}\n\nTotal bytes: ${totalBytes}\nTotal messages: ${index + 1}\n\nExport Time: ${totalTime}s`);

    let end = new Date();
    //console.log("End: ", end, (end - st) / 1000);
  },

  getRawMessage: async function (msgUri, aConvertData) {

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
              new Error(
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
        aConvertData, // aConvertData
        "" //aAdditionalHeader
      );
    });
  },


  rebuildSummary: async function (folder) {

    if (folder.locked) {
      folder.throwAlertMsg("operationFailedFolderBusy", window.msgWindow);
      return;
    }
    if (folder.supportsOffline) {
      // Remove the offline store, if any.
      await IOUtils.remove(folder.filePath.path, { recursive: true }).catch(
        console.error
      );
    }

    // Send a notification that we are triggering a database rebuild.
    MailServices.mfn.notifyFolderReindexTriggered(folder);

    folder.msgDatabase.summaryValid = false;

    const msgDB = folder.msgDatabase;
    msgDB.summaryValid = false;
    try {
      folder.closeAndBackupFolderDB("");
    } catch (e) {
      // In a failure, proceed anyway since we're dealing with problems
      folder.ForceDBClosed();
    }

    folder.updateFolder(window.msgWindow);


    return;
  },

  compactAllFolders: async function () {
    for (let index = 0; index < this.toCompactFolderList.length; index++) {
      const msgFolder = this.toCompactFolderList[index];

      // console.log(msgFolder.name);
      window.gTabmail.currentTabInfo.folder = msgFolder;

      this.forceFolderCompact(msgFolder);
      for (let index = 0; index < 100; index++) {
        break;
        window.gTabmail.currentTabInfo.folder = msgFolder;
        console.log(msgFolder.getTotalMessages(false));
        try {
          let m = msgFolder.messages;
          console.log("ms", m);

          break;
        } catch (ex) {
          console.log("wait", ex);
        }
        await new Promise(r => window.setTimeout(r, 100));

      }

    };
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
  },

  _getVirtualFolderUriArray: async function (msgFolder) {

    // temporarily select virtual folder so we can expand and iterate
    let curMsgFolder = window.gTabmail.currentTabInfo.folder;
    window.gTabmail.currentTabInfo.folder = msgFolder;
    var gDBView = window.gTabmail.currentAbout3Pane.gDBView;

    // give ui time
    //await new Promise(r => window.setTimeout(r, 0));

    // we have to expand all threads to iterate
    // unless and until the view is expanded, we
    // iterate over all messages. 
    // we wait until rowCount == numMsgsInView

    gDBView.doCommand(Ci.nsMsgViewCommandType.expandAll);

    var waitCnt = 100;
    while (waitCnt--) {
      if (gDBView.rowCount == gDBView.numMsgsInView) {
        break;
      }
      await new Promise(r => window.setTimeout(r, 50));
    }

    var uriArray = [];
    var msgUri;
    for (let i = 0; i < gDBView.numMsgsInView; i++) {
      // error handling changed in 102
      // https://searchfox.org/comm-central/source/mailnews/base/content/junkCommands.js#428
      // Resolves #359
      try {
        msgUri = gDBView.getURIForViewIndex(i);
        uriArray.push(msgUri);
      } catch (ex) {
        continue; // ignore errors for dummy rows
      }
    }

    // collapse threads, not exactly starting point, but ok
    gDBView.doCommand(Ci.nsMsgViewCommandType.collapseAll);
    // jump back to top folder
    window.gTabmail.currentTabInfo.folder = curMsgFolder;
    return uriArray;
  },

  _touchCopyFolderMsg: async function (msgFolder) {

    var tempEMLFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    tempEMLFile = tempEMLFile.QueryInterface(Ci.nsIFile);
    // this needs to be dynamic for real use!!!
    tempEMLFile.initWithPath("C:\\Dev\\dummyMsg.eml");

    window.gTabmail.currentTabInfo.folder = msgFolder;

    let newKey;

    await new Promise((resolve, reject) => {
      MailServices.copy.copyFileMessage(
        tempEMLFile,
        msgFolder,
        null,
        false,
        Ci.nsMsgMessageFlags.Read,
        "",
        {
          OnStartCopy() {
            //console.log("copy start");
          },
          OnProgress(progress, progressMax) { },
          SetMessageKey(key) {
            //console.log("set key ", key);
            newKey = key;
          },
          GetMessageId(messageId) {
          },
          OnStopCopy(status) {
            if (status == Cr.NS_OK) {
              //console.log("copy ok");
              resolve();
            } else {
            }
          },
        },
        window.msgWindow
      );
    });

    await new Promise((resolve, reject) => {
      msgFolder.deleteMessages(
        [msgFolder.GetMessageHeader(newKey)],
        window.msgWindow,
        false,
        true,
        {
          OnStartCopy() {
            //console.log("delete start");
          },
          OnProgress(progress, progressMax) { },
          SetMessageKey(key) {
            //console.log("set key ", key);
            newKey = key;
          },
          GetMessageId(messageId) {
          },
          OnStopCopy(status) {
            if (status == Cr.NS_OK) {
              //console.log("delete ok");
              resolve();
            } else {
            }
          },
        },
        false
      );
    });

    var dbDone;
    // @implements {nsIUrlListener}
    let urlListener = {
      OnStartRunningUrl(url) {
        dbDone = false;
      },
      OnStopRunningUrl(url, status) {
        console.log("compact done", status);
        dbDone = true;
      }
    };

    msgFolder.compact(urlListener, window.msgWindow);

    while (!dbDone) {
      await new Promise(r => window.setTimeout(r, 100));
    }
  },

  // base function to set global search priority
  _setGlobalSearchEnabled: function (msgFolder, searchEnable) {
    if (searchEnable) {
      Gloda.resetFolderIndexingPriority(msgFolder, true);
    } else {
      Gloda.setFolderIndexingPriority(
        msgFolder,
        Gloda.getFolderForFolder(msgFolder).kIndexingNeverPriority);
    }
  }
};
