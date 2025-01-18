// paired down Wl tests

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

var EXPORTED_SYMBOLS = ["exportTests"];

var exportTests = {
  folder: null,
  expDirFile: window.getPredefinedFolder(1),

  exportFolderEML_WL: async function (params) {
    var st1 = new Date();

    //console.log(params);
    //console.log(this.expDirFile.path);
    this.folder = window.getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path);
    //console.log(this.folder);
    let folderDir = `${this.folder.name}-WL1-2025`;
    folderDir = folderDir.replace(/[\\:?"\*\/<>|]/g, "_");
    let folderDirFile = this.expDirFile.clone();
    folderDirFile.append(folderDir);
    folderDirFile.createUnique(1, 0o0755);

    var msgArray = [...this.folder.messages];

    //console.log(msgArray);

    for (let index = 0; index < msgArray.length; index++) {
      let msguri = msgArray[index].folder.getUriForMsg(msgArray[index]);

      let msgData = await this.getRawMessage(msguri, false);
      let subject = msgArray[index].mime2DecodedSubject.slice(0, 100);
      let name = `${subject}.eml`;
      name = name.replace(/[\/\\:<>*\?\"\|]/g, "_");
      let msgFile = folderDirFile.clone();
      msgFile.append(name);
      //console.log(msgFile.path);
      msgFile.createUnique(0, 0o0755);


      this.IETwriteDataOnDisk(msgFile, msgData, false, null, null);

    }

    console.log(new Date() - st1)
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
  
};

