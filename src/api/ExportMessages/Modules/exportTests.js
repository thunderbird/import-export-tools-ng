// paired down Wl tests

var { MailServices } = ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");
//console.log("es6 exportMessages")

var os = Services.appinfo.OS.toLowerCase();
var osPathSeparator = os.includes("win")
  ? "\\"
  : "/";

var w3p = Services.wm.getMostRecentWindow("mail:3pane");

export var exportTests = {
  folder: null,
  expDirFile: w3p.getPredefinedFolder(1),

  exportMessagesES6: async function (expTask, context) {
    var msgsDir = this._getMsgsDirectory(expTask);
    var writePromises = [];
    const msgListLen = expTask.msgList.length;
    var updatedInlineFilenames = [];
    //console.log(expTask)

    for (let index = 0; index < msgListLen; index++) {

      if (!expTask.msgList[index].msgData) {
        //console.log(index, "skip", expTask.msgList[index])
        expTask.msgList[index].msgData = {};
        expTask.msgList[index].msgData.inlineParts = [];
        expTask.msgList[index].msgData.attachmentParts = [];
        let rawMsgBody = await this._getRawMessage(expTask.msgList[index].id, true, context);
        expTask.msgList[index].msgData.msgBody = this._convertToUnicode(rawMsgBody);
        expTask.msgList[index].msgData.msgBodyType = "raw"
      }

      let subject = expTask.msgList[index].subject.slice(0, 150);
      let name = `${subject}`;
      name = name.replace(/[\/\\:<>*\?\"\|]/g, "_");
      if (name == "...") {
        name = "NoKey"
      }
      var attsDir = this._getAttachmentsDirectory(expTask, name);

      //console.log(expTask)
      if (expTask.attachments.save != "none") {
        for (const inlinePart of expTask.msgList[index].msgData.inlineParts) {
          let inlineBody = await this.fileToUint8Array(inlinePart.inlinePartBody);
          IOUtils.createUniqueFile(attsDir, inlinePart.name)
            .then((unqName => {
              let partIdName = inlinePart.contentId.replaceAll(/<(.*)>/g, "$1");
              partIdName = partIdName.replaceAll(/\./g, "\\.");
              let partRegex = new RegExp(`src="cid:${partIdName}"`, "g");
              let unqFilename = PathUtils.filename(unqName);
              let currentDir = "." + osPathSeparator;
              let relUnqPartPath = currentDir;
              if (expTask.attachments.containerStructure == "perMsgDir") {
                relUnqPartPath = relUnqPartPath
                  + PathUtils.split(unqName)[PathUtils.split(unqName).length - 2]
                  + osPathSeparator + unqFilename;
              } else {
                relUnqPartPath = relUnqPartPath + unqFilename;
              }
              expTask.msgList[index].msgData.msgBody =
                expTask.msgList[index].msgData.msgBody.replaceAll(partRegex, `src="${relUnqPartPath}"`);
              writePromises.push(IOUtils.write(unqName, inlineBody));
            }));
        }

        for (const attachmentPart of expTask.msgList[index].msgData.attachmentParts) {
          let attachmentBody = await this.fileToUint8Array(attachmentPart.attachmentBody)
          IOUtils.createUniqueFile(attsDir, attachmentPart.name)
            .then((name => writePromises.push(IOUtils.write(name, attachmentBody))));
        }
      }
      //console.log(expTask)
      if (expTask.msgList[index].msgData.msgBodyType != "raw") {
        expTask.msgList[index].msgData.msgBody = await this._preprocessBody(expTask, index);
      }

      if (false) {
        await this.saveAsPDF(expTask, index, context);
      } else {
        IOUtils.createUniqueFile(msgsDir, `${name}.${expTask.msgNames.extension}`)
          .then((name) => {
            if (expTask.expType == "eml" && expTask.msgList[index].msgData.rawMsg) {
              writePromises.push(IOUtils.writeUTF8(name, expTask.msgList[index].msgData.rawMsg));
            } else {
              writePromises.push(IOUtils.writeUTF8(name, expTask.msgList[index].msgData.msgBody));
            }
          });
      }
    }
    return Promise.allSettled(writePromises);
  },

  _getMsgsDirectory: function (expTask) {

    let msgsDir;
    // we have to sanitize the path for file system export
    // Thunderbird wont allow a forward slash in a folder name 
    // so we can count on that as our path separator

    let cleanFolderName = expTask.folders[expTask.currentFolderIndex].name.replace(/[\\:<>*\?\"\|]/g, "_");
    // use PathUtils.join which will give us an OS proper path
    let base = expTask.exportContainer.directory;
    msgsDir = PathUtils.join(base, cleanFolderName);
    if (expTask.messages.messageContainer) {
      msgsDir = PathUtils.join(msgsDir, expTask.messages.messageContainerName);
    }
    expTask.messages.messageContainerDirectory = msgsDir;
    return msgsDir;
  },

  _getAttachmentsDirectory: function (expTask, msgName) {
    let attsDir;
    let msgsDir = expTask.messages.messageContainerDirectory;
    // switch on structure type
    switch (expTask.attachments.containerStructure) {
      case "inMsgDir":
        attsDir = msgsDir;
        break;
      case "perMsgDir":
        if (msgName.endsWith(".")) {
          msgName += ";";
        }
        attsDir = PathUtils.join(msgsDir, msgName);
        break;
    }
    return attsDir;
  },

  fileToUint8Array: async function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const arrayBuffer = event.target.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        resolve(uint8Array);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(file);
    });
  },

  _preprocessBody: async function (expTask, index) {
    // so we need to do different processing 
    // depending upon both expType and our body type
    // critical to break things up and not have 
    // spaghetti conditionals

    let processedMsgBody;

    switch (expTask.expType) {
      case "html":
        processedMsgBody = await this._preprocessHForHTML(expTask, index);
        break;
    }
    return processedMsgBody;
  },

  _preprocessHForHTML: async function (expTask, index) {
    // we process depending upon body content type

    let msgData = expTask.msgList[index].msgData;
    let msgItem = expTask.msgList[index];

    if (msgData.msgBodyType == "text/html") {
      return this._insertHdrTable(expTask, index, msgData.msgBody);
    }
    // we have text/plain
    msgData.msgBody = this._convertTextToHTML(msgData.msgBody);
    return this._insertHdrTable(expTask, index, msgData.msgBody);
  },

  _insertHdrTable: function (expTask, index, msgBody) {
    let msgData = expTask.msgList[index].msgData;
    let msgItem = expTask.msgList[index];

    //console.log(msgItem)
    let hdrRows = "";
    hdrRows += `<tr><td>Subject:</td><td>${msgItem.subject}</td></tr>`;
    hdrRows += `<tr><td>From:</td><td>${msgItem.author}</td></tr>`;
    hdrRows += `<tr><td>To:</td><td>${msgItem.recipients}</td></tr>`;
    hdrRows += `<tr><td>Date:</td><td>${msgItem.date}</td></tr>`;

    let hdrTable = `<table border-collapse="true" border=0>${hdrRows}</table><br>`;
    //console.log(tbl1)

    //let rpl = "$1 " + tbl1.replace(/\$/, "$$$$");

    if (msgData.msgBodyType == "text/plain") {
      return `<html>\n<head>\n</head>\n<body>\n${hdrTable}\n${msgBody}</body>\n</html>\n`;
    }
    return msgBody.replace(/(<BODY.*>)/i, hdrTable);
  },

  _encodeSpecialTextToHTML: function (str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return str.replace(/[&<>"]/g, function (m) { return map[m]; });
  },

  _convertTextToHTML: function (plaintext) {
    // we can do a lot here, but will start with the basics
    // note we only convert the text, header, styling and html 
    // wrapper is done later

    let htmlConvertedText;
    // first encode special characters
    htmlConvertedText = this._encodeSpecialTextToHTML(plaintext);
    htmlConvertedText = htmlConvertedText.replace(/\r?\n/g, "<br>\n");

    return htmlConvertedText;
  },

  saveAsPDF: async function (expTask, idx, context, pageSettings = {}) {

    let msgHdr = context.extension.messageManager.get(expTask.msgList[idx].id);
    let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
    let filePath = expTask.exportContainer.directory;

    console.log(msgHdr)
    console.log(msgUri)

    let m = await this.getRawMessage(msgUri, true)
    console.log(m)

    let psService = Cc[
      "@mozilla.org/gfx/printsettings-service;1"
    ].getService(Ci.nsIPrintSettingsService);

    // pdf changes for 102
    // newPrintSettings => createNewPrintSettings()
    // printSetting.printToFile deprecated in 102, not needed in 91
    let printSettings;
    if (psService.newPrintSettings) {
      printSettings = psService.newPrintSettings;
    } else {
      printSettings = psService.createNewPrintSettings();
    }

    printSettings.printerName = "Mozilla_Save_to_PDF";
    psService.initPrintSettingsFromPrefs(printSettings, true, printSettings.kInitSaveAll);


    printSettings.isInitializedFromPrinter = true;
    printSettings.isInitializedFromPrefs = true;

    printSettings.printSilent = true;
    printSettings.outputFormat = Ci.nsIPrintSettings.kOutputFormatPDF;

    // print setup for PDF printing changed somewhere around 102.3
    // also on 91.x The change first appeared in Linux
    // the printToFile gets deprecated and replaced by
    // outputDestination
    // As an XPCOM object you must check property existence
    // Addresses #351

    if (printSettings.outputDestination !== undefined) {
      printSettings.outputDestination = Ci.nsIPrintSettings.kOutputDestinationFile;
    }

    if (printSettings.printToFile !== undefined) {
      printSettings.printToFile = true;
    }

    if (pageSettings.paperSizeUnit)
      printSettings.paperSizeUnit = pageSettings.paperSizeUnit;

    if (pageSettings.paperWidth)
      printSettings.paperWidth = pageSettings.paperWidth;

    if (pageSettings.paperHeight)
      printSettings.paperHeight = pageSettings.paperHeight;

    if (pageSettings.orientation)
      printSettings.orientation = pageSettings.orientation;
    if (pageSettings.scaling)
      printSettings.scaling = pageSettings.scaling;
    if (pageSettings.shrinkToFit)
      printSettings.shrinkToFit = pageSettings.shrinkToFit;
    if (pageSettings.showBackgroundColors)
      printSettings.printBGColors = pageSettings.showBackgroundColors;
    if (pageSettings.showBackgroundImages)
      printSettings.printBGImages = pageSettings.showBackgroundImages;
    if (pageSettings.edgeLeft)
      printSettings.edgeLeft = pageSettings.edgeLeft;
    if (pageSettings.edgeRight)
      printSettings.edgeRight = pageSettings.edgeRight;
    if (pageSettings.edgeTop)
      printSettings.edgeTop = pageSettings.edgeTop;
    if (pageSettings.edgeBottom)
      printSettings.edgeBottom = pageSettings.edgeBottom;
    if (pageSettings.marginLeft)
      printSettings.marginLeft = pageSettings.marginLeft;
    if (pageSettings.marginRight)
      printSettings.marginRight = pageSettings.marginRight;
    if (pageSettings.marginTop)
      printSettings.marginTop = pageSettings.marginTop;
    if (pageSettings.marginBottom)
      printSettings.marginBottom = pageSettings.marginBottom;
    if (pageSettings.headerLeft)
      printSettings.headerStrLeft = pageSettings.headerLeft;
    if (pageSettings.headerCenter)
      printSettings.headerStrCenter = pageSettings.headerCenter;
    if (pageSettings.headerRight)
      printSettings.headerStrRight = pageSettings.headerRight;
    if (pageSettings.footerLeft)
      printSettings.footerStrLeft = pageSettings.footerLeft;
    if (pageSettings.footerCenter)
      printSettings.footerStrCenter = pageSettings.footerCenter;
    if (pageSettings.footerRight)
      printSettings.footerStrRight = pageSettings.footerRight;

    /*
    let customDateFormat = IETgetComplexPref("extensions.importexporttoolsng.export.filename_date_custom_format");
    if (customDateFormat !== "") {
      let customDate = strftime.strftime(customDateFormat, new Date());
      printSettings.headerStrRight = printSettings.headerStrRight.replace("%d", customDate);
      printSettings.headerStrLeft = printSettings.headerStrLeft.replace("%d", customDate);
      printSettings.headerStrCenter = printSettings.headerStrCenter.replace("%d", customDate);
      printSettings.footerStrRight = printSettings.footerStrRight.replace("%d", customDate);
      printSettings.footerStrLeft = printSettings.footerStrLeft.replace("%d", customDate);
      printSettings.footerStrCenter = printSettings.footerStrCenter.replace("%d", customDate);
    }
  */
    // console.log("IETNG: Save as PDF: ", new Date());
    // console.log("IETNG: message count: ", IETprintPDFmain.uris.length);
    // We can simply by using PrintUtils.loadPrintBrowser eliminating
    // the fakeBrowser NB: if the printBrowser does not exist we
    // can create with PrintUtils as well


    var errCounter = 0;
    let mainWindow = Services.wm.getMostRecentWindow("mail:3pane");

    let uri = msgUri;

    try {
      var messageService = MailServices.messageServiceFromURI(uri);
      let aMsgHdr = messageService.messageURIToMsgHdr(uri);

      let fileName = expTask.msgList[idx].subject + ".pdf";
      fileName = fileName.replace(/[\/\\:<>*\?\"\|]/g, "_");
      console.log(fileName)
      console.log(expTask.msgList[idx])
      let uniqueFileName;
      uniqueFileName = await IOUtils.createUniqueFile(filePath, fileName);
      printSettings.toFileName = uniqueFileName;
      console.log(uri)

      await mainWindow.PrintUtils.loadPrintBrowser(messageService.getUrlForUri(uri).spec);
      console.log(mainWindow.PrintUtils.printBrowser.contentDocument)
      let doc = mainWindow.PrintUtils.printBrowser.contentDocument;

      var table = doc.querySelector(".moz-header-part1");
      table.style.border = "thick solid black"
      console.log(doc)

      await mainWindow.PrintUtils.printBrowser.browsingContext.print(printSettings);
      var time = (aMsgHdr.dateInSeconds) * 1000;

      //if (time && IETprefs.getBoolPref("extensions.importexporttoolsng.export.set_filetime")) {
      //					await IOUtils.setModificationTime(uniqueFileName, time);
      //			}
      //IETwritestatus(mboximportbundle.GetStringFromName("exported") + ": " + fileName);
      // When we got here, everything worked, and reset error counter.
      errCounter = 0;
    } catch (ex) {
      // Something went wrong, wait a bit and try again.
      // We did not inc i, so we will retry the same file.
      //
      errCounter++;
      console.log(`Re-trying to print message ${idx + 1} (${uri}).`, ex);
      if (errCounter > 3) {
        console.log(`We retried ${errCounter} times to print message ${idx + 1} and abort.`);
      } else {
        // dec idx so next loop repeats msg that erred
        idxdx--;
      }
      await new Promise(r => mainWindow.setTimeout(r, 150));
    }

  },

  _getRawMessage: async function (msgId, aConvertData, context) {

    let msgHdr = context.extension.messageManager.get(msgId);
    let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
    let service = MailServices.messageServiceFromURI(msgUri);
    return new Promise((resolve, reject) => {
      let streamlistener = {
        _data: [],
        _data2: "",
        _stream: null,
        onDataAvailable(aRequest, aInputStream, aOffset, aCount) {
          if (!this._stream) {
            this._stream = Cc[
              "@mozilla.org/scriptableinputstream;1"
            ].createInstance(Ci.nsIScriptableInputStream);
            this._stream.init(aInputStream);
          }
          //this._data.push(this._stream.read(aCount));
          this._data2 += this._stream.read(aCount);

        },
        onStartRequest() { },
        onStopRequest(request, status) {
          if (Components.isSuccessCode(status)) {
            //resolve(this._data.join(""));
            resolve(this._data2);
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
        aConvertData, // aConvertData
        "" //aAdditionalHeader
      );
    });
  },

  _convertToUnicode: function (text, charset) {
    const conv = Cc[
      "@mozilla.org/intl/scriptableunicodeconverter"
    ].createInstance(Ci.nsIScriptableUnicodeConverter);
    try {
      conv.charset = charset || "UTF-8";
      return conv.ConvertToUnicode(text);
    } catch (ex) {
      return text;
    }
  },

  saveMessages_IOUtils: async function (msgUriArray, aConvertData, folderDirPath, nameArray) {
    let msgArrayLen = msgUriArray.length;
    let idx = 0;
    var _self = this;
    var writePromises = [];

    do {
      let msguri = msgUriArray[idx].folder.getUriForMsg(msgUriArray[idx]);

      let service = MailServices.messageServiceFromURI(msguri);
      let pr = await new Promise((resolve, reject) => {
        let streamlistener = {
          _data: "",
          _stream: null,
          onDataAvailable(aRequest, aInputStream, aOffset, aCount) {
            if (!this._stream) {
              this._stream = Cc[
                "@mozilla.org/scriptableinputstream;1"
              ].createInstance(Ci.nsIScriptableInputStream);
              this._stream.init(aInputStream);
            }
            //this._data.push(this._stream.read(aCount));
            this._data += this._stream.read(aCount);

          },
          onStartRequest() { },
          async onStopRequest(request, status) {
            if (Components.isSuccessCode(status)) {

              let subject = msgUriArray[idx].mime2DecodedSubject.slice(0, 100);
              let name = `${subject}-${msgUriArray[idx].messageKey}.eml`;
              //console.log(name, msgUriArray[idx].messageKey)
              name = name.replace(/[\/\\:<>*\?\"\|]/g, "_");
              let uname = await IOUtils.createUniqueFile(folderDirPath, name);
              //await IOUtils.writeUTF8(uname, this._data);
              //await IOUtils.writeUTF8(PathUtils.join(folderDirPath, name), this._data, {mode: "overwrite"});
              writePromises.push(IOUtils.writeUTF8(uname, this._data));

              //writePromises.push(IOUtils.writeUTF8(PathUtils.join(folderDirPath,nameArray[idx]), this._data));
              resolve(1);
            } else {
              reject(
                new ExtensionError(
                  `Error while streaming message <${msgUriArray[idx]}>: ${status}`
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
          msguri,
          streamlistener,
          null, // aMsgWindow
          null, // aUrlListener
          aConvertData, // aConvertData
          "" //aAdditionalHeader
        );
      });
    } while (++idx < msgArrayLen);
    return Promise.allSettled(writePromises);
  },


  saveMessages_IOUtilsMsgList: async function (context, expTask, nameArray) {
    let aConvertData = false;
    let msgArrayLen = expTask.msgList.length;
    let idx = 0;
    var writePromises = [];

    do {
      let msgHdr = context.extension.messageManager.get(expTask.msgList[idx].id);
      let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
      let service = MailServices.messageServiceFromURI(msgUri);
      let pr = await new Promise((resolve, reject) => {
        let streamlistener = {
          _data: "",
          _stream: null,
          onDataAvailable(aRequest, aInputStream, aOffset, aCount) {
            if (!this._stream) {
              this._stream = Cc[
                "@mozilla.org/scriptableinputstream;1"
              ].createInstance(Ci.nsIScriptableInputStream);
              this._stream.init(aInputStream);
            }
            this._data += this._stream.read(aCount);
          },
          onStartRequest() { },
          async onStopRequest(request, status) {
            if (Components.isSuccessCode(status)) {

              let subject = expTask.msgList[idx].subject.slice(0, 100);
              let name = `${subject}-${msgHdr.messageKey}.eml`;
              //console.log(name, msgUriArray[idx].messageKey)
              name = name.replace(/[\/\\:<>*\?\"\|]/g, "_");
              let uname = await IOUtils.createUniqueFile(expTask.exportContainer.directory, name);
              writePromises.push(IOUtils.writeUTF8(uname, this._data));
              resolve(1);
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
    } while (++idx < msgArrayLen);
    return Promise.allSettled(writePromises);
  },

  IETwriteDataOnDisk: function (file, data, append, fname, time) {

    var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
      .createInstance(Ci.nsIFileOutputStream);
    if (append) {
      if (fname)
        file.append(fname);
      foStream.init(file, 0x02 | 0x08 | 0x10, 0o0664, 0); // write, create, append
    } else
      foStream.init(file, 0x02 | 0x08 | 0x20, 0o0664, 0); // write, create, truncate
    if (data)
      foStream.write(data, data.length);
    foStream.close();
  },

  createUniqueNameArray(hdrArray) {
    let arrayLen = hdrArray.length;
    let nameArray = new Array(arrayLen);

    for (let index = 0; index < arrayLen; index++) {
      let subject = hdrArray[index].mime2DecodedSubject.slice(0, 100);
      var baseName = `${subject}.eml`;
      baseName = baseName.replace(/[\/\\:<>*\?\"\|]/g, "_");
      var nidx = 1;
      var name = baseName;
      do {

        var newName = nameArray.find(n => n == name);
        if (!newName) {
          nameArray[index] = name;
        } else {
          name = `${baseName}-${nidx}`;
          nidx++;
        }
      } while (newName);
    }
    //console.log(nameArray)
    return nameArray;
  }
};

