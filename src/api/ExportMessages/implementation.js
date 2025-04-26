

var { MailServices } = ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");
var { strftime } = ChromeUtils.importESModule("resource://ietng/api/commonModules/strftime.mjs");

var { ExtensionParent } = ChromeUtils.importESModule(
	"resource://gre/modules/ExtensionParent.sys.mjs"
);

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
	"ImportExportToolsNG@cleidigh.kokkini.net"
);

// add Date now to query for debugging, thanks JB
//dateNow = new Date();

var { exportTests } = ChromeUtils.importESModule(
	"resource://ietng/api/ExportMessages/Modules/exportTests.js?" + ietngExtension.manifest.version + new Date()
);


function getThunderbirdVersion() {
  let parts = Services.appinfo.version.split(".");
  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
  };
}

var msgWindow = Services.wm.getMostRecentWindow("mail:3pane").top;

var ExportMessages = class extends ExtensionCommon.ExtensionAPI {

  getAPI(context) {
    var self = this;
    self.context = context;
    
    return {
      ExportMessages: {

        async exportMessagesStream(expTask) {
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
                    let name = `${subject}.eml`;
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

        async exportMessagesES6(expTask) {
          //console.log(self.context)
          console.log(new Date());

          await exportTests.exportMessagesES6(expTask, self.context);
        },

        async exportMessagesBase(expTask) {
          //console.log("exportMessagesBase")
          var st1 = new Date();

          // collecting promises and running the writeUTF8 calls
          // concurrently and using Promise.allSettled makes
          // a big improvement. This is possible because the prior
          // awaited createUniqueFile guarantees the independent 
          // write to file

          var writePromises = [];

          for (let index = 0; index < expTask.msgList.length; index++) {
            if (!expTask.msgList[index].msgData) {
              console.log("readmsg")
              expTask.msgList[index].msgData = await self._readMsg(expTask, msgHdrList[index]);
            }
            let subject = expTask.msgList[index].subject.slice(0, 150);
            let name = `${subject}.eml`;
            name = name.replace(/[\/\\:<>*\?\"\|]/g, "_");
            let uname = await IOUtils.createUniqueFile(expTask.exportContainer.directory, name);
            writePromises.push(IOUtils.writeUTF8(uname, expTask.msgList[index].msgData));
          }
          return Promise.allSettled(writePromises);
        },

        async createExportContainer(expTask) {
          let dateStr = strftime.strftime("%Y", new Date());
          let containerName = `${expTask.folders[expTask.currentFolderIndex].name}-${dateStr}`;
          let uName = await IOUtils.createUniqueDirectory(expTask.generalConfig.exportDirectory, containerName);
          return uName;
        },

        openFileDialog: async function (mode, title, initialDir, filter) {

          let winCtx = msgWindow;
          const tbVersion = getThunderbirdVersion();
          if (tbVersion.major >= 120) {
            winCtx = msgWindow.browsingContext;
          }
          let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
          let resultObj = {};
          fp.init(winCtx, title, mode);
          fp.appendFilters(filter);
          if (initialDir) {
            fp.displayDirectory = self._getNsIFileFromPath(initialDir);
          }
          let res = await new Promise(resolve => {
            fp.open(resolve);
          });
          if (res !== Ci.nsIFilePicker.returnOK) {
            resultObj.result = res;
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
          } else if (mode == Ci.nsIFilePicker.modeOpen) {
            resultObj.file = fp.file.path;
          }

          resultObj.result = 0;

          if (mode === Ci.nsIFilePicker.modeGetFolder) {
            resultObj.folder = fp.file.path;
            console.log(resultObj);

          }
          return resultObj;
        },


      },

    };
  }

  // private msg processing functions

  async _readMsg(expTask, msgEntry) {

    return this._getRawMessage(msgEntry.msgUri, expTask.getMsg.convertData);
  }

  async _saveMsgAttachments(expTask, msgEntry) {
    //console.log(msgEntry)
    //console.log(msgEntry.msgHdr)
    //console.log(msgEntry.msgHdr.subject)


    let containerName = `${msgEntry.msgHdr.mime2DecodedSubject}-Atts`;
    containerName = containerName.replace(/[\/\\:<>*\?\"\|]/g, "_");

    let uName = await IOUtils.createUniqueDirectory(expTask.exportContainer.directory, containerName);
    var MailService = MailServices.messageServiceFromURI(msgEntry.msgUri);

    //console.log(decodeURIComponent(attachments[0].url))
    let msgUri = msgEntry.msgUri;
    console.log(msgUri);
    console.log(MailService.getUrlForUri(msgUri).spec);

    let msgAttPartName = msgEntry.attachments[0].partName;
    let msgAttName = msgEntry.attachments[0].name;

    let msgAttUrl = `${decodeURIComponent(MailService.getUrlForUri(msgUri).spec)}?part=${msgAttPartName}&filename=${msgAttName}`;
    console.log(msgAttUrl);
    var attFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    attFile.initWithPath(PathUtils.join(uName, msgAttName));

    msgWindow.messenger.saveAttachmentToFile(attFile, msgAttUrl, msgUri, msgEntry.attachments[0].contentType, null);

  }


  async _getRawMessage(msgUri, aConvertData) {

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
        aConvertData, // aConvertData
        "" //aAdditionalHeader
      );
    });
  }

  // private support functions

  _getNsIFileFromPath(path) {
    const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    file.initWithPath(path);
    return file;
  }

};
