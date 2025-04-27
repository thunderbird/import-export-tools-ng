// export prototype

import { createExportTask } from "./importExportTasks.mjs";
import * as prefs from "./prefCmds.mjs";
import { Ci } from "/Modules/CiConstants.js";


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

    var expTask = await createExportTask(functionParams, ctxEvent);

    // warnings

    //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), "Exporting IMAP folders");

    // get export directory

    let useFolderExportDir = await prefs.getPref("exportEML.use_dir");
    let folderExportDir = await prefs.getPref("exportEML.dir");
    if (useFolderExportDir && folderExportDir != "") {
      expTask.generalConfig.exportDirectory = folderExportDir;
    } else {
      let resultObj = await browser.ExportMessages.openFileDialog(Ci.nsIFilePicker.modeGetFolder, "Export Directory", "", Ci.nsIFilePicker.filterAll);
      if (resultObj.result != Ci.nsIFilePicker.returnOK) {
        return;
      }
      expTask.generalConfig.exportDirectory = resultObj.folder;
    }

    var runs = 1;
    var total = 0;
    var times = [];

    for (let index = 0; index < runs; index++) {

      //await new Promise(r => setTimeout(r, 12000));

      let st = new Date();

      console.log(new Date());


      //      let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), src);

      // create export container
      expTask.exportContainer.directory = await browser.ExportMessages.createExportContainer(expTask);
      expTask.selectedFolder = ctxEvent.selectedFolder;

      await msgIterateBatch(expTask);
      console.log(new Date());

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

  try {
    do {
      if (!msgListPage) {
        msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
      } else {
        msgListPage = await messenger.messages.continueList(msgListPage.id);
      }
      const messagesLen = msgListPage.messages.length;
      expTask.msgList = [];
      var getBodyPromises = [];

      for (let index = 0; index < messagesLen; index++) {

        expTask.msgList.push(msgListPage.messages[index]);
        let msgId = msgListPage.messages[index].id;
        //getRawPromises.push(messenger.messages.getRaw(msgId));
        //getRawPromises.push(messenger.messages.getFull(msgId));

        if (0 && expTask.expType == "eml") {
          getBodyPromises.push(messenger.messages.getRaw(msgId));
        } else {
          console.log(index)
          getBodyPromises.push(_getprocessedMsg(expTask, msgId));
        }

        totalMsgsData += msgListPage.messages[index].size;

        if (totalMsgsData >= targetMaxMsgData) {
          if (writeMsgs) {
            let getBodySettledPromises = await Promise.allSettled(getBodyPromises);

            for (let index = 0; index < getBodySettledPromises.length; index++) {
              if (expTask.expType == "eml") {
                console.log(getBodySettledPromises[index].value)

                expTask.msgList[index].msgData = {};
                expTask.msgList[index].msgData.msgBody = getBodySettledPromises[index].value;
              } else {
                console.log(getBodySettledPromises[index].value)
                expTask.msgList[index].msgData = getBodySettledPromises[index].value;
              }
              //console.log(index, expTask.msgList[index].id, expTask.msgList[index].msgData)
            }
            writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
          }

          totalMsgsData = 0;
          expTask.msgList = [];
          getBodyPromises = [];
        }
      }
      if (expTask.msgList) {
        if (writeMsgs) {
          let getBodySettledPromises = await Promise.allSettled(getBodyPromises);
          console.log(new Date());

          for (let index = 0; index < getBodySettledPromises.length; index++) {
            if (expTask.expType == "eml") {
              //console.log(getBodySettledPromises[index].value)

              //expTask.msgList[index].msgData = { msgBody: "666" };
              //expTask.msgList[index].msgData = {};
              //expTask.msgList[index].msgData = {msgBody: getBodySettledPromises[index].value};
              //console.log(expTask.msgList[index])
              expTask.msgList[index].msgData = getBodySettledPromises[index].value;
              console.log(getBodySettledPromises[index].value)

            } else {
              console.log(getBodySettledPromises[index].value)
              expTask.msgList[index].msgData = getBodySettledPromises[index].value;
            }

            //console.log(index, expTask.msgList[index].id, expTask.msgList[index].subject, expTask.msgList[index].msgData)
          }
          console.log(expTask)

          writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
        }
      }

      wrtotal += expResult;

    } while (msgListPage.id);

    if (writeMsgs) {
      await Promise.allSettled(writePromises);
      console.log(new Date());
    }
  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);

  }
}

async function _getprocessedMsg(expTask, msgId) {
  return new Promise(async (resolve, reject) => {

    //console.log("id1", msgId)

    try {

      if (expTask.expType == "eml") {
        let rawMsg = await browser.messages.getRaw(msgId);
        console.log(rawMsg)
        if (rawMsg.decryptionStatus == "fail") {
          resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [] });
          return;
        }
        resolve({ msgBody: rawMsg, msgBody2: rawMsg, msgBodyType: "text/raw", inlineParts: [], attachmentParts: [] });
        return;
      }
      let fm = await browser.messages.getFull(msgId, { decrypt: false });
      console.log(fm)
      if (fm.decryptionStatus == "fail") {
        resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [] });
        return;
      }
      let parts = fm.parts;

      //console.log(fm)
      var textParts = [];
      var htmlParts = [];
      var inlineParts = [];
      var attachmentParts = [];

      async function getParts(parts) {
        //console.log("getParts", parts)

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
            //console.log(part.headers)
            if (cd.startsWith("inline;") && !cd.includes('filename="Deleted:')) {
              //console.log("inline", part.headers)
              //console.log("inline", part.headers["content-id"])
              let contentId = part.headers["content-id"][0]

              let inlineBody = await browser.messages.getAttachmentFile(msgId, part.partName);
              //inlineBody = await fileToUint8Array(inlineBody);
              inlineParts.push({ ct: part.contentType, inlinePartBody: inlineBody, name: part.name, contentId: contentId });
            }
          }

          if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("attachment")) {
            let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
            attachmentParts.push({ ct: part.contentType, attachmentBody: attachmentBody, name: part.name });
          }

          if (part.parts) {
            await getParts(part.parts)
          }
        }
      }

      await getParts(parts)

      if (htmlParts.length) {
        resolve({ msgBody: htmlParts[0].b, msgBodyType: "text/html", inlineParts: inlineParts, attachmentParts: attachmentParts });
      } else {
        resolve({ msgBody: textParts[0].b, msgBodyType: "text/plain", inlineParts: inlineParts, attachmentParts });
      }

    } catch (ex) {
      //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
      reject(ex);
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



export async function test(ctxInfo, params) {
  console.log(ctxInfo, params);
}
