
var Services = globalThis.Services ||
  ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

export async function testexp(context, expTask) {

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
    //tempNsIFile.initWithPath(fpath)
    //tempNsIFile.createUnique(0, 0o0644);
    //let uname = tempNsIFile.path;
    let msgUri = msgHdr.folder.getUriForMsg(msgHdr);
    let msgdata = await _getRawMessage(msgUri, false)
    await IOUtils.writeUTF8(fpath, msgdata, {mode: "create"});
  }

  console.log(new Date() - st);
  
  return;



}

async function _getRawMessage(msgUri, aConvertData) {

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

