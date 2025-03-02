// paired down Wl tests

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
console.log("es6 exportMessages")

//var EXPORTED_SYMBOLS = ["exportTests"];

export var exportTests = {
  folder: null,
  expDirFile: window.getPredefinedFolder(1),

  exportMessagesES6: async function (expTask) {

    var writePromises = [];
    const msgListLen = expTask.msgList.length;

    for (let index = 0; index < msgListLen; index++) {

      let subject = expTask.msgList[index].subject.slice(0, 150);
      let name = `${subject}.html`;
      name = name.replace(/[\/\\:<>*\?\"\|]/g, "_");

      IOUtils.createUniqueFile(expTask.exportContainer.directory, name)
        .then((name => writePromises.push(IOUtils.writeUTF8(name, expTask.msgList[index].msgData))));
    }
    return Promise.allSettled(writePromises);
  },



  exportFolderEML_WL: async function (params) {

    //console.log(params);
    let runs = 1;
    //console.log(this.expDirFile.path);

    this.folder = window.getMsgFolderFromAccountAndPath(params.selectedFolder.accountId, params.selectedFolder.path);

    for (let index = 0; index < runs; index++) {

      var st1 = new Date();

      /*
      //console.log(this.folder);
      let folderDir = `${this.folder.name}-WL1-2025`;
      folderDir = folderDir.replace(/[\\:?"\*\/<>|]/g, "_");
      let folderDirFile = this.expDirFile.clone();
      folderDirFile.append(folderDir);
      folderDirFile.createUnique(1, 0o0755);
*/
      let folderDirFile = {};
      folderDirFile.path = params.exportContainer.directory;
      var msgArray = [...this.folder.messages];

      var st2 = new Date();

      let nameArray;
      //nameArray = this.createUniqueNameArray(msgArray);

      //console.log(new Date() - st2)


      //await this.saveMessages_NsIFile(msgArray, false, folderDirFile);
      await this.saveMessages_IOUtils(msgArray, false, folderDirFile.path, nameArray);

      //console.log(new Date() - st1)

    }

    return;
  },

  exportFolderEML_Exp_MsgList: async function (expTask) {

    await this.saveMessages_IOUtils(msgArray, false, folderDirFile.path, nameArray);

  },


  getRawMessage: async function (msgUri, aConvertData) {

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

  saveMessages_NsIFile: async function (msgUriArray, aConvertData, folderDirFile) {
    let msgArrayLen = msgUriArray.length;
    let idx = 0;
    var _self = this;

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
          onStopRequest(request, status) {
            if (Components.isSuccessCode(status)) {

              let subject = msgUriArray[idx].mime2DecodedSubject.slice(0, 100);
              let name = `${subject}-${msgUriArray[idx].key}.eml`;
              name = name.replace(/[\/\\:<>*\?\"\|]/g, "_");
              let msgFile = folderDirFile.clone();
              msgFile.append(name);
              msgFile.createUnique(0, 0o0755);
              _self.IETwriteDataOnDisk(msgFile, this._data, false, null, null);

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

