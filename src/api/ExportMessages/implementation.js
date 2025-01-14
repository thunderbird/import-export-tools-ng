var Services = globalThis.Services ||
  ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { strftime } = ChromeUtils.import("chrome://mboximport/content/mboximport/modules/strftime.js");
var { testexp } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/testexp.js");

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
    let self = this;

    return {
      ExportMessages: {

        async exportMessages(expTask) {
          await testexp(context, expTask)
          return

          let bname = "testmsg";
          let msgdata = "z".repeat(50000);
          var fname;
          var tempNsIFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
          
          //console.log(expTask)
          let st = new Date();
          for (let index = 0; index < expTask.msgList.length; index++) {
            
            let msgHdr = context.extension.messageManager.get(expTask.msgList[index].id);
            let key = msgHdr.messageKey;
            let subject = msgHdr.mime2DecodedSubject.slice(0, 150)
            fname = `${subject}.eml`;
            fname = fname.replace(/[\/\\:<>*\?\"\|]/g, "_");

            //console.log(fname)
            let fpath = PathUtils.join("C:\\Dev\\ptest", fname)
            //let uname = await IOUtils.createUniqueFile(expTask.exportContainer.directory, fname)
            tempNsIFile.initWithPath(fpath)
						tempNsIFile.createUnique(0, 0o0644);
            let uname = tempNsIFile.path;
            let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
            let msgdata = await self._getRawMessage(msgUri, false)
            await IOUtils.writeUTF8(uname, msgdata);
          }

          console.log(new Date() - st);
          
          return;


          // iterate msgList and create new hdr array

          //console.log(new Date())
          //console.log(new Date() - expTask.st0)

          var st1 = new Date();

          let msgHdrList = [];
          for (let index = 0; index < expTask.msgList.length; index++) {
            let msgHdr = context.extension.messageManager.get(expTask.msgList[index].id);
            let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
            msgHdrList.push({ msgId: expTask.msgList[index].id, msgHdr: msgHdr, msgUri: msgUri, attachments: expTask.msgList[index].attachments });

            // operate on each message inline
            let msgData = await self._readMsg(expTask, msgHdrList[index]);
            let subject = msgHdr.mime2DecodedSubject.slice(0, 150)
            let name = `${subject}.eml`
            name = name.replace(/[\/\\:<>*\?\"\|]/g, "_");
            //name = PathUtils.join(expTask.exportContainer.directory, name)
            let uname = await IOUtils.createUniqueFile(expTask.exportContainer.directory, name)
            IOUtils.writeUTF8(uname, msgData);
            

            // if (expTask.msgList[index].attachments.length) {
            //   await self._saveMsgAttachments(expTask, msgHdrList[index]);
            // }
          }

          console.log(new Date() - st1)
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
            console.log(resultObj)

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
    console.log(msgUri)
    console.log(MailService.getUrlForUri(msgUri).spec)
    
    let msgAttPartName = msgEntry.attachments[0].partName;
    let msgAttName = msgEntry.attachments[0].name;

    let msgAttUrl = `${decodeURIComponent(MailService.getUrlForUri(msgUri).spec)}?part=${msgAttPartName}&filename=${msgAttName}`
    console.log(msgAttUrl)
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
