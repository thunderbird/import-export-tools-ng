// paired down Wl tests


var { ExtensionParent } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionParent.sys.mjs"
);

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
  "ImportExportToolsNG@cleidigh.kokkini.net"
);

var { MailServices } = ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");

var { strftime } = ChromeUtils.importESModule("resource://ietng/api/commonModules/strftime.mjs");

var { names } = ChromeUtils.importESModule(
  "resource://ietng/api/commonModules/namesModule.mjs?" + ietngExtension.manifest.version + new Date()
);

var { MutexAsync } = ChromeUtils.importESModule(
  "resource://ietng/api/commonModules/mutex-async.mjs?" + ietngExtension.manifest.version + new Date()
);

//console.log("es6 exportMessages")

var os = Services.appinfo.OS.toLowerCase();
var osPathSeparator = os.includes("win")
  ? "\\"
  : "/";

var w3p = Services.wm.getMostRecentWindow("mail:3pane");

// we need a mutex for pdf export
// the concurrency with using allSettled gains us about 10% performance 
// however, this also allows asynchronous reentrancy
// since pdf output requires two steps, loadPrintBrowser and print printBrowser
// we must make this an atomic locked critical section
// we also need the mutex as a global across exportMessagesES6 calls
// so we define here

const pdfWriteMutex = new MutexAsync({ warnOnOverlap: true });

export var exportMessages = {
  self: this,
  context: null,
  emitter: null,
  folder: null,
  expDirFile: w3p.getPredefinedFolder(1),

  exportMessagesES6: async function (expTask, context, emitter) {


    console.log("start exptask id", expTask.id, expTask.msgList.length)

    this.context = context;
    this.emitter = emitter;
    var self = this;
    var fileStatusList = [];
    var errors = [];

    var msgsDir = this._getMsgsDirectory(expTask);
    var writePromises = [];
    const msgListLen = expTask.msgList.length;
    var attachmentFilenames = [];

    //let md = expTask.msgList
    //console.log(md)

    for (let index = 0; index < msgListLen; index++) {

      // if there are no body parts we have two scenarios
      // it can be a message with blocked remote content
      // where getFull gives us nothing. In this case
      // we fall back to _getRawMessage using the SimpleHtml
      // flag so the export is similar to the view in the UI.
      //
      // The second case is for pdf export where we purposely
      // do not pass any bodys as we do not use for export
      // in the pdf case, the message is exported using  the
      // msgUri and print of the printBrowser

      //console.log(expTask)
      if (expTask.msgList[index].msgData.msgBodyType == "none" &&
        expTask.expType != "pdf"
      ) {
        //console.log(index, "no msgData", expTask.msgList[index])
        
        expTask.msgList[index].msgData.inlineParts = [];
        expTask.msgList[index].msgData.attachmentParts = [];
        let rawMsgBody = await this._getRawMessage(expTask.msgList[index].id, true, context);
        //console.log(rawMsgBody)
        expTask.msgList[index].msgData.msgBody = this._convertToUnicode(rawMsgBody);
        expTask.msgList[index].msgData.msgBodyType = "text/html";
        
      }

      //console.log(expTask.msgList[index].msgData)

      let generatedMsgName = await names.generateFromPattern(expTask.names.namePatternType, expTask, index, context);
      //console.log(generatedMsgName)
      var name = generatedMsgName;


      //console.log("expId", expTask.id, index, "msgid", expTask.msgList[index].id, name)
      try {
        var attDirs = await this._getAttachmentsDirectorys(expTask, index, context);
        var maxFilePathLen = msgsDir.length + (252 - msgsDir.length) / 2;

        //console.log(maxFilePathLen)
        //var maxFilePathLen = 500
        var currentFileType = "";
        var currentFileName = "";


        //console.log(expTask)
        if (expTask.attachments.save != "none") {
          attachmentFilenames = [];

          //console.log("saving attachments")
          //console.log("inlinep", expTask.msgList[index].msgData.inlineParts)
          //console.log("attp", expTask.msgList[index].msgData.attachmentParts)

          // we do not export inline attachments for pdf export
          // these are part of the streamed message

          if (expTask.expType != "pdf") {
            for (const inlinePart of expTask.msgList[index].msgData.inlineParts) {
              let writePromise;
              currentFileType = "inline";
              currentFileName = inlinePart.name;
              let inlineBody = await this.fileToUint8Array(inlinePart.partBody);
              //console.log(attDirs, inlinePart)
              let unqFilename = await IOUtils.createUniqueFile(attDirs.inlineDir, inlinePart.name.slice(0, maxFilePathLen - 5));

              let partIdName = inlinePart.contentId.replaceAll(/<(.*)>/g, "$1");
              partIdName = partIdName.replaceAll(/\./g, "\\.");
              let partRegex = new RegExp(`src="cid:${partIdName}"`, "g");

              let filename = encodeURIComponent(PathUtils.filename(unqFilename));
              // we must replace inlinepart references
              let relUnqPartPath = "./";
              if (expTask.attachments.containerStructure == "perMsgDir") {
                relUnqPartPath = relUnqPartPath
                  + encodeURIComponent(PathUtils.split(unqFilename)[PathUtils.split(unqFilename).length - 2])
                  + "/" + filename;
              } else {
                relUnqPartPath = relUnqPartPath + filename;
              }

              // pdf output from Thunderbird includes inline attachments so no
              // need to fixup links
              // we may not need to save either

              expTask.msgList[index].msgData.msgBody =
                expTask.msgList[index].msgData.msgBody.replaceAll(partRegex, `src="${relUnqPartPath}"`);

              writePromise = __writeFile("inline", unqFilename, expTask, index, inlineBody);
              if (expTask.fileSave.sentDate) {
                writePromise.then(async (size) => {
                  let dateInMs = new Date(expTask.msgList[index].date).getTime();
                  await IOUtils.setModificationTime(unqFilename, dateInMs);
                });
              }
              writePromises.push(writePromise);
            }
          }


          for (const attachmentPart of expTask.msgList[index].msgData.attachmentParts) {
            let writePromise;
            //console.log(attachmentPart)
            currentFileType = "attachment";
            currentFileName = attachmentPart?.name;
            // some attachments seen without a name
            if (!currentFileName) {
              currentFileName = "message.txt";
              attachmentPart.name = "message.txt";
            }
            let attachmentBody = await this.fileToUint8Array(attachmentPart.partBody)
            /*
             console.log(attachmentBody)
             function bytesToString(buffer) {
               var string = "";
               for (var i = 0; i < buffer.length; i++) {
                 string += String.fromCharCode(buffer[i]);
               }
               return string;
             }
             attachmentBody = bytesToString(attachmentBody)
             console.log(attachmentBody)
 
             attachmentBody = this._convertCharsetToUTF8("Windows-1252", attachmentBody)
             console.log(attachmentBody)
 */

            //console.log(attsDir.length, `"${attsDir}"`)
            //console.log(attachmentPart.name.slice(0, maxFilePathLen - 5))
            let unqFilename = await IOUtils.createUniqueFile(attDirs.attachmentsDir, attachmentPart.name.slice(0, maxFilePathLen - 5));
            writePromise = __writeFile("attachment", unqFilename, expTask, index, attachmentBody);
            if (expTask.fileSave.sentDate) {
              writePromise.then(async (size) => {
                let dateInMs = new Date(expTask.msgList[index].date).getTime();
                await IOUtils.setModificationTime(unqFilename, dateInMs);
              });
            }
            writePromises.push(writePromise);

            attachmentFilenames.push(PathUtils.filename(unqFilename));
          }
        }

        expTask.msgList[index].msgData.msgBody = await this._preprocessBody(expTask, index, attDirs.attachmentsDir, attachmentFilenames);

      } catch (ex) {
        //console.log("err", "expId", expTask.id, ex, index, "id", expTask.msgList[index].id, name)
        let errMsg = `IETNG: There was an error creating a file Type: ${currentFileType}:\n${currentFileName}\nMsgName:${name}\n\n${ex}\n\n${ex.msg}\n\n${ex.stack}\n`;
        console.log(errMsg);
        console.log(expTask.msgList[index]);

        //errors.push({ index: index, ex: ex, msg: ex.message, stack: ex.stack });
        expTask.msgList[index].msgData.msgBody = await _createErrMessage(index, ex, currentFileType, currentFileName);
        expTask.msgList[index].msgData.error = { error: "error", index: index, ex: ex, msg: ex.message, stack: ex.stack };
      }

      let unqFilename = await IOUtils.createUniqueFile(msgsDir, `${name}.${expTask.names.extension}`);
      if (expTask.expType == "pdf") {
        await __writePdfFile(unqFilename, expTask, index);
        if (expTask.fileSave.sentDate) {
          let dateInMs = new Date(expTask.msgList[index].date).getTime();
          await IOUtils.setModificationTime(unqFilename, dateInMs);
        }
        writePromises.push(__pdfPromise(expTask, index, unqFilename));
      } else {
        let writePromise = __writeFile("message", unqFilename, expTask, index);
        if (expTask.fileSave.sentDate) {
          writePromise.then(async (size) => {
            let dateInMs = new Date(expTask.msgList[index].date).getTime();
            await IOUtils.setModificationTime(unqFilename, dateInMs);
          });
        }
        writePromises.push(writePromise);
      }

      // send msg count update for ui
      if ((index + 1) % 10 == 0 && index != 0) {
        //console.log("fire taskid:", expTask.id)
        emitter.emit("export-update", "inbox", 10);
      } else if (index == msgListLen - 1) {
        //console.log("fire event end", expTask.id, index)
        emitter.emit("export-update", "inbox", (index + 1) % 10);

      }
      //console.log("idx", expTask.id, index)
    }

    //console.log("expId", expTask.id, "wp final total", writePromises.length)

    let settledWritePromises = await Promise.allSettled(writePromises);
    //console.log("expId", expTask.id, "wp final total", writePromises.length)

    //console.log("expId", expTask.id, "status", fileStatusList)
    //console.log("expId", expTask.id, "errs", errors)
    //console.log(settledWritePromises)


    for (let index = 0; index < errors.length; index++) {
      let err = errors[index];
      settledWritePromises[index].error = err;
      //console.log(err)
    }

    for (let index = 0; index < fileStatusList.length; index++) {
      let fileStatus = fileStatusList[index];
      settledWritePromises[index].fileStatus = fileStatus;
      //console.log(settledWritePromises)
      //console.log("expId", expTask.id, index, "fs", fileStatus)
    }

    if (errors.length) {
      console.log(settledWritePromises)
    }
    //console.log("expId", expTask.id, "promises", settledWritePromises)

    console.log("finish exptask id", expTask.id)

    return settledWritePromises;


    // inline functions

    async function __writeFile(fileType, unqName, expTask, index, data = null) {
      var writePromise;
      try {
        //console.log(expTask.msgList[index])
        if (fileType == "message") {
          var hdrs = {};
          hdrs.recipients = expTask.msgList[index].recipients;
          hdrs.author = expTask.msgList[index].author;
          hdrs.date = expTask.msgList[index].date;
          hdrs.size = expTask.msgList[index].size;
          hdrs.subject = expTask.msgList[index].msgData.extraHeaders.fullSubject;

          fileStatusList.push({
            index: index, fileType: fileType, id: expTask.msgList[index].id,
            filePath: unqName, headers: hdrs, hasAttachments: expTask.msgList[index].msgData.attachmentParts.length,
            attachmentFilenames: attachmentFilenames
          });

          if (expTask.msgList[index].msgData.error) {
            errors.push(expTask.msgList[index].msgData.error);
          } else {
            errors.push({ error: "none" });
          }
          //console.log("fileStatus", fileStatusList)
          //console.log("expId", expTask.id, "statusnum", msgStatusList.length, unqName, )

          if (expTask.expType == "pdf") {
            writePromise = __writePdfFile(unqName, expTask, index);
            //await __writePdfFile(unqName, expTask, index);
          } else {
            if (expTask.msgList[index].msgData.err) {
              console.log("write err", unqName, unqName.length)
            }
            writePromise = IOUtils.writeUTF8(unqName, expTask.msgList[index].msgData.msgBody)
          }
        } else {
          fileStatusList.push({ index: index, fileType: fileType, id: expTask.msgList[index].id, filePath: unqName });
          errors.push({ error: "none" });
          writePromise = IOUtils.write(unqName, data)
        }
      } catch (ex) {
        console.log("err expId", expTask.id, unqName, ex)
        expTask.msgList[index].msgData.msgBody = await _createErrMessage(index, ex, currentFileType, currentFileName);
        expTask.msgList[index].msgData.error = { error: "error", index: index, ex: ex, msg: ex.message, stack: ex.stack };
        if (hdrs.subject == undefined || hdrs.subject == null) {
          hdrs.subject = expTask.msgList[index].subject;
        }
        fileStatusList.push({
          index: index, fileType: fileType, id: expTask.msgList[index].id,
          filePath: unqName, headers: hdrs, hasAttachments: expTask.msgList[index].msgData.attachmentParts.length,
          attachmentFilenames: attachmentFilenames
        });
        errors.push({ index: index, ex: ex, msg: ex.message, stack: ex.stack });
        writePromise = IOUtils.writeUTF8(unqName, expTask.msgList[index].msgData.msgBody)

        return writePromise;
      }

      return writePromise;
    }

    async function __writePdfFile(unqFilename, expTask, index) {
      let unlock = await pdfWriteMutex.lock();

      let msgHdr = self.context.extension.messageManager.get(expTask.msgList[index].id);
      let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
      let messageService = MailServices.messageServiceFromURI(msgUri);

      console.log("start print")

      //console.log(msgUri)
      await w3p.PrintUtils.loadPrintBrowser(messageService.getUrlForUri(msgUri).spec);
      //console.log(w3p.PrintUtils.printBrowser.contentDocument)
      self._insertDOMHdrTable(w3p.PrintUtils.printBrowser.contentDocument)
      let pdfPrintSettings = self._getPdfPrintSettings(unqFilename, expTask);
      await w3p.PrintUtils.printBrowser.browsingContext.print(pdfPrintSettings);
      console.log("after print")
      unlock();
    }

    async function __pdfPromise(expTask, index, unqFilename) {

      let hdrs = {
        subject: expTask.msgList[index].msgData.extraHeaders.fullSubject,
        recipients: expTask.msgList[index].recipients,
        author: expTask.msgList[index].author,
        date: expTask.msgList[index].date,
        size: expTask.msgList[index].size,
      };
      fileStatusList.push({
        index: index, fileType: "message",
        id: expTask.msgList[index].id, filePath: unqFilename, headers: hdrs,
        hasAttachments: expTask.msgList[index].msgData.attachmentParts.length,
        attachmentFilenames: attachmentFilenames
      });

      if (expTask.msgList[index].msgData.error) {
        errors.push(expTask.msgList[index].msgData.error);
      } else {
        errors.push({ error: "none" });
      }

      return 0;
    }

    async function _createErrMessage(index, ex, currentFileType) {
      let exMsg = ex.msg ? ex.msg : "";
      let msgBody = `There was an error creating a file Type: ${currentFileType}:\n${currentFileName}\n\n${ex}\n\n${exMsg}\n\n${ex.stack}`;
      name = "[Err] " + name;
      expTask.msgList[index].subject = name;
      // we have text/plain
      expTask.msgList[index].msgData.msgBodyType = "text/plain";
      msgBody = self._convertTextToHTML(msgBody);
      return self._insertHdrTable(expTask, index, msgBody);

    }

  }, // exportMessagesES6 end

  _getMsgsDirectory: function (expTask) {

    let msgsDir;
    // we have to sanitize the path for file system export
    // Thunderbird wont allow a forward slash in a folder name 
    // so we can count on that as our path separator

    let cleanFolderName = expTask.folders[expTask.currentFolderIndex].
      exportPath;
    console.log(cleanFolderName)

    // use PathUtils.join which will give us an OS proper path
    let base = expTask.exportContainer.directory;
    console.log(base)

    msgsDir = PathUtils.join(base, ...cleanFolderName.split(osPathSeparator));
    console.log(msgsDir)
    if (expTask.messages.messageContainer) {
      msgsDir = PathUtils.join(msgsDir, expTask.messages.messageContainerName);
    }
    expTask.messages.messageContainerDirectory = msgsDir;
    return msgsDir;
  },

  _getAttachmentsDirectorys: async function (expTask, index, context) {
    let attsDir;
    let inlineDir;
    let msgsDir = expTask.messages.messageContainerDirectory;
    // switch on structure type
    switch (expTask.attachments.containerStructure) {
      case "inMsgDir":
        attsDir = msgsDir;
        break;
      case "perMsgDir":
        let maxFilePathLen = msgsDir.length + (252 - msgsDir.length) / 2;
        let generatedAttsName = await names.generateFromPattern("customAttachments", expTask, index, context);
        attsDir = PathUtils.join(msgsDir, generatedAttsName);
        attsDir = attsDir.slice(0, maxFilePathLen);
        attsDir = attsDir.trimEnd();
        if (attsDir.endsWith(".")) {
          attsDir += ";";
        }
        generatedAttsName = await names.generateFromPattern("customInline", expTask, index, context);
        inlineDir = PathUtils.join(msgsDir, generatedAttsName);
        inlineDir = inlineDir.slice(0, maxFilePathLen);
        inlineDir = inlineDir.trimEnd();
        if (inlineDir.endsWith(".")) {
          inlineDir += ";";
        }
        break;
      default:
        throw new Error(`Invalid attachments directory structure type: ${expTask.attachments.containerStructure}`);
    }
    return { attachmentsDir: attsDir, inlineDir: inlineDir };
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

  _preprocessBody: async function (expTask, index, attsDir, attachmentFilenames) {
    // so we need to do different processing 
    // depending upon both expType and our body type
    // critical to break things up and not have 
    // spaghetti conditionals

    let processedMsgBody;

    switch (expTask.expType) {
      case "eml":
        processedMsgBody = await this._processBodyForEML(expTask, index);
        break;
      case "html":
        processedMsgBody = await this._processBodyForHTML(expTask, index, attsDir, attachmentFilenames);
        break;
      case "pdf":
        processedMsgBody = await this._processBodyForPDF(expTask, index);
        break;
      default:
        let msgData = expTask.msgList[index].msgData;
        return msgData.msgBody;
    }
    return processedMsgBody;
  },

  _processBodyForEML: async function (expTask, index) {
    return expTask.msgList[index].msgData.rawMsg;
  },

  _processBodyForHTML: async function (expTask, index, attsDir, attachmentFilenames) {
    // we process depending upon body content type

    let msgData = expTask.msgList[index].msgData;
    let msgItem = expTask.msgList[index];


    if (msgData.msgBodyType == "text/html") {
      // first check if this is headless html where 
      // there is no html or body tags
      if (!/<HTML[^>]*>/i.test(msgData.msgBody)) {
        // wrap body with <html><body>
        msgData.msgBody = `<html>\n<body>\n${msgData.msgBody}\n</body>\n</html>`;
      }
      if (attachmentFilenames.length) {
        msgData.msgBody = this._insertAttachmentTable(expTask, msgData.msgBody, attsDir, attachmentFilenames);
      }

      return msgData.msgBody;
      //console.log(msgData.msgBody)

      return this._insertHdrTable(expTask, index, msgData.msgBody);
    }

    // we have text/plain
    msgData.msgBody = this._convertTextToHTML(msgData.msgBody);
    msgData.msgBody = this._insertHdrTable(expTask, index, msgData.msgBody);
    if (attachmentFilenames.length) {
      msgData.msgBody = this._insertAttachmentTable(expTask, msgData.msgBody, attsDir, attachmentFilenames);
    }
    return msgData.msgBody;
  },

  _processBodyForPDF: async function (expTask, index) {
    return null;
    let msgHdr = this.context.extension.messageManager.get(expTask.msgList[index].id);
    let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
    let messageService = MailServices.messageServiceFromURI(msgUri);

    console.log(msgUri)
    await w3p.PrintUtils.loadPrintBrowser(messageService.getUrlForUri(msgUri).spec);
    console.log(w3p.PrintUtils.printBrowser.contentDocument)
    let document = w3p.PrintUtils.printBrowser.contentDocument;

    // we have to modify DOM for header
    //await this._insertDOMHdrTable(document);

    return null;
  },

  _insertHdrTable: function (expTask, index, msgBody) {
    let msgData = expTask.msgList[index].msgData;
    let msgItem = expTask.msgList[index];

    //console.log(msgItem)
    let hdrRows = "";
    hdrRows += `<tr><td style='padding-right: 10px'><b>Subject:</b></td><td>${msgItem.subject}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>From:</b></td><td>${msgItem.author}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>To:</b></td><td>${msgItem.recipients}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>Date:</b></td><td>${msgItem.date}</td></tr>`;

    let hdrTable = `\n<table border-collapse="true" border=0>${hdrRows}</table><br>\n`;

    //let rpl = "$1 " + tbl1.replace(/\$/, "$$$$");

    //console.log(msgData.msgBodyType)
    if (msgData.msgBodyType == "text/plain") {
      let tp = `<html>\n<head>\n</head>\n<body tp>\n${hdrTable}\n${msgBody}</body>\n</html>\n`;
      return tp;
    }
    let rp = msgBody.replace(/(<BODY[^>]*>)/i, "$1" + hdrTable);

    return rp;
  },

  _insertDOMHdrTable: async function (document) {
    let table = document.querySelector(".moz-header-part1");
    let table2 = document.querySelector(".moz-header-part2");
    let table3 = document.querySelector(".moz-header-part3");
    table.style.background = "#ffffff";
    if (table2) {
      table2.style.background = "#ffffff";
    }
    if (table3) {
      table2.style.background = "#ffffff";
    }
  },

  _insertAttachmentTable: function (expTask, msgBody, attsDir, attachmentFilenames) {
    let attList = `<br><div style="width: 60%">\n<fieldset style="border-style: solid none none none; border-top: 1px solid black;"><legend>Attachments</legend></fieldset>\n`;
    let relAttsDir = "./";
    if (expTask.attachments.containerStructure == "perMsgDir") {
      relAttsDir += PathUtils.filename(attsDir);
    }

    attachmentFilenames.forEach(filename => {
      let attHref = `<a href="${relAttsDir}/${filename}">${filename}</a>`;
      attList += `<li style="padding-left: 20px">${attHref}</li>\n`;
    });

    attList += "</div>\n";
    msgBody = msgBody.replace(/<\/BODY>/i, `${attList}</body>`);
    return msgBody;
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

    //console.log(plaintext)

    let htmlConvertedText;
    // first encode special characters
    htmlConvertedText = this._encodeSpecialTextToHTML(plaintext);
    htmlConvertedText = htmlConvertedText.replace(/\r?\n/g, "<br>\n");

    return htmlConvertedText;
  },


  _getRawMessage: async function (msgId, aConvertData) {

    let msgHdr = this.context.extension.messageManager.get(msgId);
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

  _getPdfPrintSettings: function (pdfFilename, expTask) {
    let psService = Cc[
      "@mozilla.org/gfx/printsettings-service;1"
    ].getService(Ci.nsIPrintSettingsService);

    let printSettings;
    printSettings = psService.createNewPrintSettings();
    printSettings.printerName = expTask.outputSpecific.pdf.pdfPrinterName;

    psService.initPrintSettingsFromPrefs(printSettings, true, printSettings.kInitSaveAll);
    printSettings.isInitializedFromPrinter = true;
    printSettings.isInitializedFromPrefs = true;
    printSettings.printSilent = true;
    printSettings.outputFormat = Ci.nsIPrintSettings.kOutputFormatPDF;
    printSettings.outputDestination = Ci.nsIPrintSettings.kOutputDestinationFile;
    printSettings.toFileName = pdfFilename;
    return printSettings;
  },

  _convertCharsetToUTF8: function (charset, string) {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder(charset);
      const encoded = encoder.encode(string);
      const decoded = decoder.decode(encoded);
      console.log("Converted to utf-8 from:", charset);

      return decoded;
    } catch (e) {
      console.error("Error converting to utf-8", e);
      return string;
    }
  },

};

