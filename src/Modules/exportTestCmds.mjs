// export prototype

import { Ci } from "/Modules/CiConstants.js";

var baseExpTask = {
  expType: null,
  folders: [],
  currentFolderIndex: 0,
  recursive: false,
  expStatus: null,
  generalConfig: {
    exportDirectoryType: "prompt",
    exportDirectory: "",
  },
  exportContainer: {
    create: false,
    namePattern: "${folder}-$(date}",
    directory: "",
  },
  dateFormat: {
    type: 0,
    custom: "%Y%m%d%H%M",
  },
  messages: {
    messageContainer: false,
    create: true,
    messageContainerName: "messages",
    messageContainerDirectory: "",
  },
  msgNames: {
    namePatternType: "default",
    namePatternDefault: "${subject}-${date}-${index}",
    namePatternCustom: "${subject}-${date}-${index}",
    extension: "",
    maxLength: 254,
    nameComponents: {
      subjectMaxLen: 50,
      senderNameMaxLen: 50,
      recipientNameMaxLen: 50,
    },
    filters: [],
    substitutions: [],
  },
  attachments: {
    save: "none",
    containerStructure: "inMsgDir",
    containerNamePattern: "${subject}-Atts",
  },
  getMsg: {
    method: "self._getRawMessage",
    convertData: false,
  },
  postProcessing: [],
  msgSave: {
    type: "file",
    encoding: "UTF-8",
    date: "saveDate",
  },
  msgList: {},
};


export async function exportFolders(ctxEvent, tab, functionParams) {

  try {
    // for now only deal with a single folder for prototype
    if (ctxEvent.selectedFolders && ctxEvent.selectedFolders.length > 1) {
      let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("multipleFolders.title"), browser.i18n.getMessage("multipleFolders.AlertMsg") + functionParams.toString());
      if (!rv) {
        return;
      }
    }
    //console.log(ctxInfo, params);

    // we do all main logic, folder and message iteration
    // and UI interactions in wext side
    // we avoid msg transfer for major performance issues

    //params.ctxInfo = ctxInfo;
    var expTask = await _buildExportTask(ctxEvent, functionParams);

    // warnings

    //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), "Exporting IMAP folders");

    // get export directory
    /*
        let resultObj = await browser.ExportMessages.openFileDialog(Ci.nsIFilePicker.modeGetFolder, "Export Directory", "", Ci.nsIFilePicker.filterAll);
    
        if (resultObj.result != Ci.nsIFilePicker.returnOK) {
          return;
        }
    */

    var runs = 1;
    var total = 0;
    var times = [];

    for (let index = 0; index < runs; index++) {

      //await new Promise(r => setTimeout(r, 12000));

      let st = new Date();

      //console.log(new Date());

      //expTask.generalConfig.exportDirectory = resultObj.folder;
      expTask.generalConfig.exportDirectory =
        //"C:\\Dev\\Thunderbird Exts\\import-export-tools-ng\\scratch\\Export 128";
        "C:\\Dev\\Thunderbird\\Extensions XUL\\import-export-tools-ng\\scratch\\export2";
      //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), resultObj.folder);

      // create export container
      expTask.exportContainer.directory = await browser.ExportMessages.createExportContainer(expTask);
      //console.log(expTask);
      expTask.selectedFolder = ctxEvent.selectedFolder;
      //expTask.folders[0] = ctxEvent.selectedFolder.path;
      console.log(expTask.folders[0])
      //await msgIterateBase(expTask);
      await msgIterateBatch(expTask);

      times[index] = new Date() - st;
      total += times[index];
      console.log(new Date() - st);

    }

    //console.log("wrt avg", wrtotal / runs)
    console.log("avg", total / runs)

  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
    console.log(ex);

    console.log(ex.stack);
  }
}


async function msgIterateBatch(expTask) {

  // 1522 msgs 50MB
  // 20 run avg 1800msms

  // iterate msgs

  var wrtotal = 0;
  var msgListPage = null;
  var readRawInWext = true;
  const targetMaxMsgData = 25 * 1000 * 1000;
  var totalMsgsData = 0;
  var expResult;
  var writePromises = [];
  var writeMsgs = true;

  do {
    if (!msgListPage) {
      msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
    } else {
      msgListPage = await messenger.messages.continueList(msgListPage.id);
    }
    const messagesLen = msgListPage.messages.length;
    expTask.msgList = [];
    var getRawPromises = [];

    for (let index = 0; index < messagesLen; index++) {

      expTask.msgList.push(msgListPage.messages[index]);
      let msgId = msgListPage.messages[index].id;
      //getRawPromises.push(messenger.messages.getRaw(msgId));
      getRawPromises.push(_getprocessedMsg(msgId));

      totalMsgsData += msgListPage.messages[index].size;

      if (totalMsgsData >= targetMaxMsgData) {
        if (writeMsgs) {
          let getRarSettledPromises = await Promise.allSettled(getRawPromises);

          for (let index = 0; index < getRarSettledPromises.length; index++) {
            expTask.msgList[index].msgData = getRarSettledPromises[index].value;
            //console.log(index, expTask.msgList[index].id, expTask.msgList[index].msgData)
          }
          writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
        }

        totalMsgsData = 0;
        expTask.msgList = [];
        getRawPromises = [];
      }
    }
    if (expTask.msgList) {
      if (writeMsgs) {
        let getRarSettledPromises = await Promise.allSettled(getRawPromises);

        for (let index = 0; index < getRarSettledPromises.length; index++) {
          expTask.msgList[index].msgData = getRarSettledPromises[index].value;
          //console.log(index, expTask.msgList[index].id, expTask.msgList[index].subject, expTask.msgList[index].msgData)
        }
        writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
      }
    }

    wrtotal += expResult;

  } while (msgListPage.id);

  if (writeMsgs) {
    await Promise.allSettled(writePromises);
  }

}

async function _getprocessedMsg(msgId) {
  return new Promise(async (resolve, reject) => {

    //console.log("id1", msgId)

    let fm = await browser.messages.getFull(msgId);
    console.log(fm)
    if (fm.decryptionStatus == "fail") {
    console.log("dfail")
      resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [] });
    console.log("dfail2")
      return;
    }
    let parts = fm.parts;

    //console.log(fm)
    var textParts = [];
    var htmlParts = [];
    var inlineParts = [];
    var attachmentParts = [];

    async function getParts(parts) {
      console.log("getParts", parts)

      for (const part of parts) {
        //console.log(part)
        // we could have multiple sub parts
        let contentType = part.contentType;
        let size = part.size;
        let body = part?.body;

        if (contentType == "text/html" && body) {
          htmlParts.push({ ct: part.contentType, b: part.body });
        }
        if (part.contentType == "text/plain" && body) {
          //body = body.replaceAll(/\r?\n/g, "<br>\n");
          textParts.push({ ct: part.contentType, b: body });
        }

        if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("inline")) {
          //console.log(msgId, part)
          //console.log(msgId, part.headers["content-disposition"])
          let cd = part.headers["content-disposition"][0];
          console.log(part.headers)
          if (cd.startsWith("inline;") && !cd.includes('filename="Deleted:')) {
            console.log("inline", part.headers)
            console.log("inline", part.headers["content-id"])
            let contentId = part.headers["content-id"][0]
            console.log("inline", contentId)

            console.log("inline", part.headers["content-disposition"])

            let inlineBody = await browser.messages.getAttachmentFile(msgId, part.partName);
            //inlineBody = await fileToUint8Array(inlineBody);
            inlineParts.push({ ct: part.contentType, inlinePartBody: inlineBody, name: part.name, contentId: contentId });
          }
        }

        if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("attachment")) {
          let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
          //attachmentBody = await fileToUint8Array(attachmentBody);
          attachmentParts.push({ ct: part.contentType, attachmentBody: attachmentBody, name: part.name });
        }

        if (part.parts) {
          console.log("call gp")
          await getParts(part.parts)
        }
      }
    }

    await getParts(parts)

    //console.log("html", htmlParts)
    //console.log("text", textParts, textParts.length)
    //console.log("inline", inlineParts, inlineParts.length)

    /*
    for (const inlinePart of inlineParts) {
      let partIdName = inlinePart.contentId.replaceAll(/<(.*)>/g, "$1");
      partIdName = partIdName.replaceAll(/\./g, "\\.")

      let partRegex = new RegExp(`src="cid:${partIdName}"`, "g");

      htmlParts[0].b = htmlParts[0].b.replaceAll(partRegex, `src="${inlinePart.name}"`);
    }
*/

    if (htmlParts.length) {
      resolve({ msgBody: htmlParts[0].b, msgBodyType: "text/html", inlineParts: inlineParts, attachmentParts: attachmentParts });
    } else {
      resolve({ msgBody: textParts[0].b, msgBodyType: "text/plain", inlineParts: inlineParts, attachmentParts });
    }
  });


}

async function fileToUint8Array(file) {
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
}


async function msgIterateBase(expTask) {

  // 1522 msgs 50MB
  // 20 run avg 4061ms
  // no write 1600ms avg


  // iterate msgs

  var wrtotal = 0;
  var msgListPage = null;
  var readRawInWext = true;
  const targetMaxMsgData = 25 * 1000 * 1000;
  var totalMsgsData = 0;
  var expResult;
  var writeMsgs = true;


  do {
    if (!msgListPage) {
      msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
    } else {
      msgListPage = await messenger.messages.continueList(msgListPage.id);
    }
    const messagesLen = msgListPage.messages.length;
    expTask.msgList = [];
    for (let index = 0; index < messagesLen; index++) {

      expTask.msgList.push(msgListPage.messages[index])
      let msgId = msgListPage.messages[index].id;
      if (readRawInWext) {
        expTask.msgList[expTask.msgList.length - 1].msgData = await messenger.messages.getRaw(msgId);
      }
      totalMsgsData += msgListPage.messages[index].size;

      if (totalMsgsData >= targetMaxMsgData) {
        if (writeMsgs) {
          expResult = await browser.ExportMessages.exportMessagesBase(expTask);
        }
        totalMsgsData = 0;
        expTask.msgList = [];
      }
    }

    if (expTask.msgList) {
      //console.log(expTask.msgList)
      if (writeMsgs) {
        expResult = await browser.ExportMessages.exportMessagesBase(expTask);
      }
    }

    wrtotal += expResult;

  } while (msgListPage.id);

}

async function _buildExportTask(ctxEvent, params) {
  var expTask = baseExpTask;

  switch (params.expType) {
    case "eml":
      expTask = await _build_EML_expTask(expTask, ctxEvent, params);
      break;

  }
  return expTask;
}

async function _build_EML_expTask(expTask, ctxEvent, params) {
  // hack setup
  expTask.expType = "eml";
  expTask.folders = [ctxEvent.selectedFolder];
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = "C:\\Dev\\test";
  expTask.exportContainer.create = true;
  expTask.dateFormat.type = 1;
  expTask.msgNames.extension = "eml";
  expTask.attachments.save = "none";

  //expTask.currentFolderPath = 
    //expTask.currentFolderPath.slice(1).replaceAll("/","\\")
  console.log(expTask)
  return expTask;

}


export async function test(ctxInfo, params) {
  console.log(ctxInfo, params);
}
