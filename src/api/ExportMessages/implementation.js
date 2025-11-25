

var { MailServices } = ChromeUtils.importESModule("resource:///modules/MailServices.sys.mjs");
var { strftime } = ChromeUtils.importESModule("resource://ietng/api/commonModules/strftime.mjs");

var { ExtensionParent } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionParent.sys.mjs"
);

const emitter = new ExtensionCommon.EventEmitter();

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
  "ImportExportToolsNG@cleidigh.kokkini.net"
);

var { NetUtil } = ChromeUtils.importESModule(
  "resource://gre/modules/NetUtil.sys.mjs"
);

var os = Services.appinfo.OS.toLowerCase();
var osPathSeparator = os.includes("win")
  ? "\\"
  : "/";


// add Date now to query for debugging, thanks JB
//dateNow = new Date();

var { exportMessages } = ChromeUtils.importESModule(
  "resource://ietng/api/ExportMessages/Modules/exportMessages.mjs?" + ietngExtension.manifest.version + new Date()
);

//var { sorttable } = ChromeUtils.importESModule(
//  "resource://ietng/api/commonModules/sorttable.js?" + ietngExtension.manifest.version + new Date()
//);

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

        async exportMessagesES6(expTask) {
          //console.log(self.context)
          //console.log(new Date());
          //console.log(expTask)

          return exportMessages.exportMessagesES6(expTask, self.context, emitter);
        },

        getMsgHdrs: async function (msgId, msgHdrItems) {
          let msgHdr = context.extension.messageManager.get(msgId);
          var returnItems = {};

          msgHdrItems.forEach(hdrItem => {
            if (hdrItem == "flags") {
              returnItems.flags = msgHdr.flags;
            }
            if (hdrItem == "fullSubject") {
              returnItems.fullSubject = msgHdr.mime2DecodedSubject;
              if (msgHdr.flags & 0x0010) {
                returnItems.fullSubject = "Re: " + returnItems.fullSubject;
              }
            }
          });
          return returnItems;
        },

        writeIndex: async function (expTask, indexData) {
          var { sorttableSource } = ChromeUtils.importESModule("resource://ietng/api/commonModules/sorttableSource.mjs?" + ietngExtension.manifest.version + new Date());

          let indexDir = this._getIndexDirectory(expTask);
          indexData = indexData.replace("sorttable.js", sorttableSource);
          return IOUtils.writeUTF8(`${indexDir}${osPathSeparator}index.html`, indexData);
        },

        _getIndexDirectory: function (expTask) {

          let indexDir;
          // we have to sanitize the path for file system export
          // Thunderbird wont allow a forward slash in a folder name 
          // so we can count on that as our path separator

          let cleanFolderName = expTask.folders[expTask.currentFolderIndex].exportPath;
          //replace(/[\\:<>*\?\"\|]/g, "_");
          // use PathUtils.join which will give us an OS proper path
          let base = expTask.exportContainer.directory;
          indexDir = PathUtils.join(base, ...cleanFolderName.split(osPathSeparator));
          expTask.index.directory = indexDir;
          return indexDir;
        },

        async createExportContainer(expTask) {
          let dateStr = strftime.strftime("%Y%m%d-%H%M", new Date());
          let containerName = `${expTask.folders[expTask.currentFolderIndex].name}_${dateStr}`;
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

        // Event functions
        onExpUpdate: new ExtensionCommon.EventManager({
          context,
          name: "ExportMessages.onExpUpdate",
          register(fire) {
            function callback(event, folderName, msgCount) {
              // The event sends the current folder and message count .
              return fire.async(folderName, msgCount);
            }

            emitter.on("export-update", callback);
            return function () {
              emitter.off("export-update", callback);
            };
          },
        }).api(),
      },
    };
  }

onShutdown(isAppShutdown) {
      // This function is called if the extension is disabled or removed, or
      // Thunderbird closes. We usually do not have to do any cleanup, if
      // Thunderbird is shutting down entirely.
      if (isAppShutdown) {
        return;
      }
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
