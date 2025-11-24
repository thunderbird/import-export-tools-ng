// export prototype

import { createExportTask } from "./importExportTasks.mjs";
import * as prefs from "./prefCmds.mjs";
import { strftime } from "./strftime.mjs";
import * as ui from "./ui.mjs";

console.log(strftime)
import { Ci } from "/Modules/CiConstants.js";

var os = navigator.platform.toLowerCase();
var osPathSeparator = os.includes("win")
  ? "\\"
  : "/";

var abort = false;

export async function exportFolders(ctxEvent, tab, functionParams) {
  abort = false;

  try {

    // for now only deal with a single folder for prototype
    /*
    if (ctxEvent.selectedFolders && ctxEvent.selectedFolders.length > 1) {
      let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("multipleFolders.title"), browser.i18n.getMessage("multipleFolders.AlertMsg") + functionParams.toString());
      if (!rv) {
        return;
      }
    }
      */

    // check for multiple folders selected
    var folderSet = await getFolderSet(ctxEvent.selectedFolders, functionParams);

    console.log(ctxEvent, functionParams, folderSet);

    // we do all main logic, folder and message iteration
    // and UI interactions in wext side

    var expTask = await createExportTask(functionParams, ctxEvent, folderSet);

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

    // UI listener
    browser.runtime.onMessage.addListener(msg => {
      if (msg.command != "UI_EVENT") {
        return null;
      }

      if (msg.source == "expStatusWin") {
        switch (msg.srcEvent) {
          case "cancelClick":
            console.log("cancel")
            // we are aborting current export
            abort = true;
            break;
        }
      }
    });

    // ev listener

    var folderMsgCount;
    var totalMsgCount = 0;

    async function _updateListener(folderName, msgCount) {
      if (abort) {
        return;
      }
      folderMsgCount += msgCount;
      browser.runtime.sendMessage({
        command: "UI_UPDATE", target: "expStatusWin",
        folderName: expTask.folders[expTask.currentFolderIndex].name, msgCount: folderMsgCount,
        maxMsgCount: expTask.folders[expTask.currentFolderIndex].totalMsgCount
      })
      console.log(folderName, `Msg count: (${folderMsgCount} / ${totalMsgCount})`)
    }

    var _updateListenerRef = _updateListener;

    browser.ExportMessages.onExpUpdate.addListener(_updateListener);

    // this outer loop is for performance testing 
    for (let index = 0; index < runs; index++) {

      //await new Promise(r => setTimeout(r, 12000));
      let st = new Date();
      console.log(new Date());

      var folderMsgCount = 0;

      // this is our folder loop
      for (var folderIndex = 0; folderIndex < expTask.folders.length; folderIndex++) {
        expTask.currentFolderIndex = folderIndex;
        expTask.currentFolderPath = expTask.folders[folderIndex].exportPath;
        folderMsgCount = 0;

        // create export container
        if (!functionParams?.subFolders ||
          (functionParams?.subFolders && folderIndex == 0)) {
          expTask.exportContainer.directory = await browser.ExportMessages.createExportContainer(expTask);
        }

        // create the status window on first folder
        if (folderIndex == 0) {
          await ui.createExportStatusWindow("Export HTML");
          await new Promise(r => setTimeout(r, 100));
        }

        // send initial ui status
        browser.runtime.sendMessage({ command: "UI_UPDATE", target: "expStatus", folderName: expTask.folders[folderIndex].name, msgCount: folderMsgCount, maxMsgCount: expTask.folders[folderIndex].totalMsgCount })

        var exportStatus = await msgIterateBatch(expTask);
        if (abort) {
          break;
        }
        _createIndex(expTask, exportStatus.msgListLog);
      }

      // tell expStatus window we are done
      browser.runtime.sendMessage({ command: "UI_CMD", target: "expStatusWin", subCommand: "finished" })

      //console.log(new Date());

      times[index] = new Date() - st;
      total += times[index];
      console.log(new Date() - st);

    }

    //console.log("wrt avg", wrtotal / runs)
    console.log("avg", total / runs)
    let exportMessage = `Folder: ${expTask.folders[expTask.currentFolderIndex].name}\n\n`;
    exportMessage += `Messages exported: ${exportStatus.msgCount}\n`;
    exportMessage += `Error count: ${exportStatus.errCount}\n\n`;
    exportMessage += `Average time: ${(total / runs) / 1000}s\n`;
    browser.ExportMessages.onExpUpdate.removeListener(_updateListener);

    //let rv = await browser.AsyncPrompts.asyncAlert("Folder Export", `${exportMessage}`);

  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
    console.log(ex);
    console.log(ex.stack);
    browser.ExportMessages.onExpUpdate.removeListener(_updateListenerRef);
  }
}

async function getFolderSet(selectedFolders, functionParams) {
  var fullFolderSet = selectedFolders;

  // if we are doing subfolders we need to prune then get all subfolders 
  if (functionParams.subFolders) {
    // pruning removes overlapping subfolders
    let prunedFolders = selectedFolders;
    selectedFolders.forEach(folder => {
      prunedFolders = prunedFolders.filter(pfolder => pfolder == folder || !pfolder.path.startsWith(folder.path))
    });
    fullFolderSet = prunedFolders;

    // add all subfolders under top folders recurseivly

    async function getSubFolders(folder) {
      let subFolders = await browser.folders.getSubFolders(folder.id);
      fullFolderSet = fullFolderSet.concat(subFolders);
      if (subFolders) {
        for (const subFolder of subFolders) {
          await getSubFolders(subFolder);
        }
      }
    }
    let topFolders = fullFolderSet;
    for (const folder of topFolders) {
      await getSubFolders(folder);
    }
  }
  console.log("full set", fullFolderSet)

  // get path of shortest parent

  var firstParents = await browser.folders.getParentFolders(fullFolderSet[0].id)
  let basePathLen = firstParents.length

  if (!firstParents.length) {
    firstParents.push({ path: "/" });
  }

  let basePath = firstParents[0].path;

  for (let index = 1; index < fullFolderSet.length; index++) {
    let parentfolders = await browser.folders.getParentFolders(fullFolderSet[index].id);

    if (parentfolders.length < basePathLen) {
      basePathLen = parentfolders.length;
      basePath = parentfolders[0].path;
    }
  }

  console.log("base", basePath)

  // create relative export paths with localization

  for (const [index, folder] of fullFolderSet.entries()) {
    let parentfolders = await browser.folders.getParentFolders(folder.id);
    //console.log(parentfolders)

    fullFolderSet[index].exportPath = folder.name.replace(/[\\:<>*\?\"\|]/g, "_");

    for (const [index2, folderParent] of parentfolders.entries()) {
      if (folderParent.path == basePath) {
        break;
      }
      fullFolderSet[index].exportPath =
        `${parentfolders[index2].name.replace(/[\\:<>*\?\"\|]/g, "_")}${osPathSeparator}${fullFolderSet[index].exportPath}`;

    }
    console.log(fullFolderSet[index].path, fullFolderSet[index].exportPath)
  }



  // add folder path and totalMsgCount 
  for (const [index, folder] of fullFolderSet.entries()) {
    fullFolderSet[index].totalMsgCount = (await browser.folders.getFolderInfo(folder.id)).totalMessageCount;
  }
  return fullFolderSet;
}

async function msgIterateBatch(expTask) {
  console.log(abort)
  // 1522 msgs 50MB
  // 20 run avg 1800msms

  // iterate msgs

  var wrtotal = 0;
  var msgListPage = null;
  var readRawInWext = true;
  const targetMaxMsgData = 25 * 1000 * 1000;
  var totalMsgsData = 0;
  var totalMsgs = 0;

  var expResult;
  var writePromises = [];
  var writeMsgs = true;
  var expId = 0;

  try {
    do {
      if (abort) {
        break;
      }
      if (!msgListPage) {
        msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
      } else {
        msgListPage = await messenger.messages.continueList(msgListPage.id);
      }
      const messagesLen = msgListPage.messages.length;
      expTask.msgList = [];
      var getBodyPromises = [];

      totalMsgs += messagesLen;

      for (let index = 0; index < messagesLen; index++) {

        if (abort) {
          break;
        }
        expTask.msgList.push(msgListPage.messages[index]);
        let msgId = msgListPage.messages[index].id;

        getBodyPromises.push(_getprocessedMsg(expTask, msgId, msgListPage.messages[index]));

        totalMsgsData += msgListPage.messages[index].size;

        if (totalMsgsData >= targetMaxMsgData) {
          if (writeMsgs) {
            let getBodySettledPromises = await Promise.allSettled(getBodyPromises);

            for (let index = 0; index < getBodySettledPromises.length; index++) {
              expTask.msgList[index].msgData = getBodySettledPromises[index].value;
              //console.log(index, expTask.msgList[index].id, expTask.msgList[index])
            }
            expTask.id = expId++;
            //console.log("ExpId", expTask.id, "numMsgs", expTask.msgList.length)
            writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
            //await browser.ExportMessages.exportMessagesES6(expTask);

          }

          totalMsgsData = 0;
          expTask.msgList = [];
          getBodyPromises = [];
        }
      }
      if (expTask.msgList) {
        if (writeMsgs) {
          let getBodySettledPromises = await Promise.allSettled(getBodyPromises);
          // console.log(new Date());

          for (let index = 0; index < getBodySettledPromises.length; index++) {
            expTask.msgList[index].msgData = getBodySettledPromises[index].value;
            //console.log(index, expTask.msgList[index].id, expTask.msgList[index].subject, expTask.msgList[index])
          }
          expTask.id = expId++;
          //console.log("ExpId", expTask.id, "numMsgs", expTask.msgList.length)
          writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
          //await browser.ExportMessages.exportMessagesES6(expTask);

        }
      }

      wrtotal += expResult;

    } while (msgListPage.id);

    if (writeMsgs) {
      var msgsStatus = await Promise.allSettled(writePromises);
      console.log(msgsStatus)
      console.log(msgsStatus.length)

      let msgListLog = [];
      let msgCount = 0;
      let errCount = 0;

      for (let index = 0; index < msgsStatus.length; index++) {
        //console.log(msgsStatus[index].value);
        //console.log(msgsStatus[index].value.length);

        for (let vindex = 0; vindex < msgsStatus[index].value.length; vindex++) {
          const fileStatus = msgsStatus[index].value[vindex].fileStatus;
          fileStatus.fileSize = msgsStatus[index].value[vindex].value;
          const error = msgsStatus[index].value[vindex].error;
          if (fileStatus.fileType == "message") {
            msgCount++;
            if (error.error != "none") {
              errCount++;
            }
            msgListLog.push({ fileStatus: fileStatus, error: error });
          }
        }
      }

      //console.log(msgListLog)

      console.log("total msgs:", totalMsgs)
      //console.log("total promises:", tp)

      return { msgListLog: msgListLog, msgCount: msgCount, errCount: errCount };

      //console.log(new Date());
    }
  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);

  }
}

async function _getprocessedMsg(expTask, msgId, msg) {

  return new Promise(async (resolve, reject) => {

    //console.log("id1", msgId)

    //let msgId = expTask.msgList[index].id;

    try {

      var extraHeaders = await browser.ExportMessages.getMsgHdrs(msgId, ["fullSubject"]);
      if (expTask.expType == "eml") {
        let rawMsg = await browser.messages.getRaw(msgId);
        //console.log(rawMsg)
        if (rawMsg.decryptionStatus == "fail") {
          resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [], extraHeaders: extraHeaders });
          return;
        }
        resolve({ rawMsg: rawMsg, msgBodyType: "text/raw", inlineParts: [], attachmentParts: [], extraHeaders: extraHeaders });
        return;
      }

      // for PDF we only do getFull if we are saving attachments
      if (expTask.expType == "pdf") {
        if (expTask.attachments.save == "none") {
          resolve({ msgBody: null, msgBodyType: "pdf/none", inlineParts: [], attachmentParts: [], extraHeaders: extraHeaders });
          return;
        }

      }

      let fullMsg = await browser.messages.getFull(msgId, { decrypt: true });
      //console.log(fullMsg)
      //var extraHeaders = { subjectHdr: fullMsg.headers.subject[0], "reply-to": fullMsg.headers["reply-to"] };
      if (fullMsg.decryptionStatus == "fail") {
        resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [], extraHeaders: extraHeaders });
        return;
      }
      let parts = fullMsg.parts;

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

          if (expTask.expType != "pdf" && contentType == "text/html" && part?.body) {
            let charsetMatch = part.body.match(/charset=([^;"]*)/i);
            if (charsetMatch && charsetMatch.length == 2) {
              part.body = part.body.replace(charsetMatch[1], "UTF-8")
            }
            htmlParts.push({ contentType: part.contentType, body: part?.body });
          }
          if (expTask.expType != "pdf" && part.contentType == "text/plain" && part?.body) {
            textParts.push({ contentType: part.contentType, body: part?.body });
          }

          if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("inline")) {
            //console.log("cd inline", part)
            //console.log(msgId, part.headers["content-disposition"])
            let cd = part.headers["content-disposition"][0];
            //console.log(part.headers)
            if (cd.startsWith("inline;") && !cd.includes('filename="Deleted:')) {
              //console.log("inline", part.headers)
              //console.log("inline", part.headers["content-id"])
              try {
                let contentId = part.headers["content-id"][0];
                let inlineBody = await browser.messages.getAttachmentFile(msgId, part.partName);
                inlineParts.push({ partType: "inline", contentType: part.contentType, partBody: inlineBody, name: part.name, contentId: contentId });
                //console.log("push inline att", attachmentParts)

              } catch {
                let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
                attachmentParts.push({ partType: "attachment", contentType: part.contentType, partBody: attachmentBody, name: part.name });
                //console.log("push inline to att", attachmentParts)
              }
            }
          }

          if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("attachment")) {

            let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
            attachmentParts.push({ partType: "attachment", contentType: part.contentType, partBody: attachmentBody, name: part.name });
            //console.log("push  att", attachmentParts)
          }

          if (part.parts) {
            await getParts(part.parts)
          }
        }
      }

      await getParts(parts)

      //console.log(htmlParts, textParts)
      //console.log("ip", inlineParts)
      //console.log("ap", attachmentParts)


      // we have collected the body parts
      // we preprocess according to the export type
      // and the body parts we have
      // at this level we do text to html conversion 
      // or html to text conversion if necessary 
      // then a header table added

      switch (expTask.expType) {
        case "eml":
          break;
        case "html":
          if (htmlParts.length) {
            htmlParts[0].body = await _preprocessBody(expTask, msg, htmlParts[0].body, "text/html", extraHeaders);
            resolve({ msgBody: htmlParts[0].body, msgBodyType: "text/html", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          } else if (textParts.length) {
            htmlParts.push(textParts[0]);
            htmlParts[0].body = await _preprocessBody(expTask, msg, textParts[0].body, "text/plain", extraHeaders);
            htmlParts[0].extraHeaders = textParts[0].extraHeaders;
            textParts = [];
            resolve({ msgBody: htmlParts[0].body, msgBodyType: "text/html", inlineParts: inlineParts, attachmentParts, extraHeaders: extraHeaders });
          } else {
            resolve({ msgBody: null, msgBodyType: "none", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          }
          break;
        case "pdf":
          resolve({ msgBody: null, msgBodyType: "none", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          break;
        case "plaintext":

          if (textParts.length) {

            textParts[0].body = await _preprocessBody(expTask, msg, textParts[0].body, "text/plain", extraHeaders);
            resolve({ msgBody: textParts[0].body, msgBodyType: "text/plain", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          } else if (htmlParts.length) {
            textParts.push(htmlParts[0]);
            textParts[0].body = await _preprocessBody(expTask, msg, textParts[0].body, "text/html", extraHeaders);
            htmlParts = [];
            resolve({ msgBody: textParts[0].body, msgBodyType: "text/plain", inlineParts: inlineParts, attachmentParts, extraHeaders: extraHeaders });
          } else {
            resolve({ msgBody: null, msgBodyType: "none", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          }
          break;
      }


    } catch (ex) {
      console.log(ex, msg)
      //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
      reject(ex);
    }
  });
}



async function _preprocessBody(expTask, msg, body, msgBodyType, extraHeaders) {
  // so we need to do different processing 
  // depending upon both expType and our body type
  // critical to break things up and not have 
  // spaghetti conditionals

  let processedMsgBody;

  switch (expTask.expType) {
    case "eml":
      //processedMsgBody = await _processBodyForEML(expTask, index);
      break;
    case "html":
      processedMsgBody = await _processBodyForHTML(expTask, msg, body, msgBodyType, extraHeaders);
      break;
    case "pdf":
      //processedMsgBody = await _processBodyForPDF(expTask, index);
      break;
    case "plaintext":
      processedMsgBody = await _processBodyForPlaintext(expTask, msg, body, msgBodyType, extraHeaders);
      break;
  }
  return processedMsgBody;
}

async function _processBodyForEML(expTask, index) {
  return expTask.msgList[index].msgData.rawMsg;
}

async function _processBodyForHTML(expTask, msg, msgBody, msgBodyType, extraHeaders) {
  // we process depending upon body content type

  if (msgBodyType == "text/html") {
    // first check if this is headless html where 
    // there is no html or body tags
    if (!/<HTML[^>]*>/i.test(msgBody)) {
      // wrap body with <html><body>
      msgBody = `<html>\n<body>\n${msgBody}\n</body>\n</html>`;
    }
    return _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders);
  }
  // we have text/plain
  msgBody = _convertTextToHTML(msgBody);
  msgBody = await _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders);
  return msgBody;
}

async function _processBodyForPlaintext(expTask, msg, msgBody, msgBodyType, extraHeaders) {
  // we process depending upon body content type

  //console.log(extraHeaders)

  if (msgBodyType == "text/html") {
    // first check if this is headless html where 
    // there is no html or body tags
    if (!/<HTML[^>]*>/i.test(msgBody)) {
      // wrap body with <html><body>
      msgBody = `<html>\n<body>\n${msgBody}\n</body>\n</html>`;
    }
    msgBody = await browser.messengerUtilities.convertToPlainText(msgBody, { flowed: true });
    return _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders);
  }
  // we have text/plain
  msgBody = await _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders);
  return msgBody;
}

async function _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders) {
  //console.log("hdr", extraHeaders)

  let recipients;
  if (msg.recipients == []) {
    recipients = "(none)";
  } else {
    recipients = msg.recipients.join(", ").replaceAll('"', '');
  }

  let ccList;
  if (msg.ccList == []) {
    ccList = "";
  } else {
    ccList = msg.ccList.join(", ").replaceAll('"', '');
  }
  let bccList;
  if (msg.bccList == []) {
    bccList = "";
  } else {
    bccList = msg.bccList.join(", ").replaceAll('"', '');
  }

  // header localization 
  let hdrSubject = browser.i18n.getMessage("msgHdr.Subject");
  let hdrFrom = browser.i18n.getMessage("msgHdr.From");
  let hdrTo = browser.i18n.getMessage("msgHdr.To");
  let hdrDate = browser.i18n.getMessage("msgHdr.Date");

  // for most locales Cc and Bcc are used as is
  // we will have an option to use localized versions later
  // for now some Asian locales warrant localized versions 

  let hdrCc = browser.i18n.getMessage("msgHdr.Cc");
  let hdrBcc = browser.i18n.getMessage("msgHdr.Bcc");

  if (["zh-CN",].includes(browser.i18n.getUILanguage())) {
    hdrCc = browser.i18n.getMessage("msgHdr.CcLocal");
    hdrBcc = browser.i18n.getMessage("msgHdr.BccLocal");
  }


  if (expTask.expType == "html") {
    recipients = _encodeSpecialTextToHTML(recipients);
    ccList = _encodeSpecialTextToHTML(ccList);
    bccList = _encodeSpecialTextToHTML(bccList);

    let hdrRows = "";
    hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrSubject}:</b></td><td>${extraHeaders.fullSubject}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrFrom}:</b></td><td>${msg.author}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrTo}:</b></td><td>${recipients}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrDate}:</b></td><td>${msg.date}</td></tr>`;

    if (ccList != "") {
      hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrCc}:</b></td><td>${ccList}</td></tr>`;
    }

    if (bccList != "") {
      hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrBcc}:</b></td><td>${bccList}</td></tr>`;
    }

    let hdrTable = `\n<table border-collapse="true" border=0>${hdrRows}</table><br>\n`;

    //let rpl = "$1 " + tbl1.replace(/\$/, "$$$$");

    if (msgBodyType == "text/plain") {
      let tp = `<html>\n<head>\n</head>\n<body tp>\n${hdrTable}\n${msgBody}</body>\n</html>\n`;
      //console.log(tp)
      return tp;
    }
    msgBody = msgBody.replace(/(<BODY[^>]*>)/i, "$1" + hdrTable);
    //console.log(rp)
    return msgBody;
  }

  // plaintext export


  let hdr = "";
  hdr += `${hdrSubject}:  ${extraHeaders.fullSubject}\r\n`;
  hdr += `${hdrFrom} :  ${msg.author}\r\n`;
  hdr += `${hdrTo}:  ${recipients}\r\n`;
  hdr += `${hdrDate}:  ${msg.date}\r\n`;

  if (ccList != "") {
    hdr += `${hdrCc}:  ${ccList}\r\n`;
  }
  if (bccList != "") {
    hdr += `${hdrBcc}:  ${bccList}\r\n`;
  }

  return `${hdr}\r\n${msgBody}`;
}

function convertCharsetToUTF8(charset, string) {
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
}

function _convertTextToHTML(plaintext) {
  // we can do a lot here, but will start with the basics
  // note we only convert the text, header, styling and html 
  // wrapper is done later

  //console.log(plaintext)

  let htmlConvertedText;
  // first encode special characters
  htmlConvertedText = _encodeSpecialTextToHTML(plaintext);
  htmlConvertedText = htmlConvertedText.replace(/\r?\n/g, "<br>\n");

  return htmlConvertedText;
}


async function _createIndex(expTask, msgListLog) {

  // we create as text/html since we are saving as an html document

  try {
    const attIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADFUlEQVR4nO2aTagOURjHH+KGuMXCZ0m3aycLKcqGEsICG2VhYXG7xYIsRSzIRjZ0EYnkY+EjG4qV8rWyQG5ZKPmIheQj3x/Pv5k3c+d9zpw5M2dm3nM9v/p33/vOOU/Pf94z55x5ZogURVEURVEURVEUpZPoYi1irWf1sdax5rNGNplUHcxlnWd9YP0R9JY1wJrZVIJVMYZ1jPWLZONpfWXtZI1oIlnfTGHdo3zG07pM0ckLlsmsh1TMfEuna8/aE/jlH1O2uR+sd6zflnabas69NDbz91krKFoNwHjWBtZTQ/sXrLH1pV8Om/mTrNGGvt2sW4Z+QYwCm/njZF/rMW+8F/peqiZlf/gw3+Kg0P+N53y94tM8WCvEwB7CdOk0im/zYJkhVreflP3hYh67ukOs5TnibhFiffaZuA9czQ/E3z8j+1C+K8R74Df9criaP5I6viQjdp8h5l7fJoqCZaqMeajfEBuT33ehPSbAOf6tuIOd220qZx7aKMQ2mYfOVOKmANLk5Goe+/6eVNws869Y06sy5MojkpM8QfnMQxdSMbPMf2EtrMyNIxNJTvIs5Tf/hDUpEdNmPs+SWSmY7WfEn3tJTnRBfNxmfpA1LRE7CPMY8kvj/00j4CJFw/SU4XiQ5jFMW9f7tsT3pjkgSxj2SfNrqMPNj2LdoH9JXU8cy1oFhoV5sIOGJoZNSG98DPuAOzSMzWPoS8WIq4k22AlmbYYgnKSpiT5BmAdbSU7yHA2t0eNmZjO1V3wxR+Ay6Uq0DcY8uEntSaIgOS6jD1aHnvhvmqDMA2n47y4YKzjzKDtLya4qECs482ACyQm7Jtvxm5wsPlF70tsd+gdtHkgPMTHT5ylqBm8e7CLZwB5LP7zgELx5MIv1jWQjh6l9qcPEiZP209AnKPMtULo27fAwR1xjHWVdoejJrqltkOYBVoMid31J4Q2P1XUn7pPZrNdUzPxHCvSXT4NCJJ7ju5h/zprXRLJVgZsePKh4SfZffT914LM7X6BIspi1j6IaPQomqO4eYK2kgN7eUBRFURRF+S/4CwPqfEibwrHFAAAAAElFTkSuQmCC"
    const downArrowIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADsQAAA7EB9YPtSQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHPSURBVHic7dzBVtpAAIXh+zLFfV3QZ4bnqnZT9Q3swuaoYCSBwGRmvu+c7FwMuT+BjSQAAAAAAAAAAAAAAAAAAAAAAAAAQOvukuyTPPy/9kk2RU9Ul6rv312SpySvB9dzkm3Bc9Vim7d7dXj/nlJJBPscH364XiKC72zzdo/G7t+u3NGme8z4Cxgi+FXsdOt1n6+fnB+vP8VON8NDvn8RIjg2ZfzXJL9LHXCOXU6/EB8H70499qv7CNjk6y8xIjg2Z/znVPIlMEl+Jvmb6RH0+HEw9bFf7RtFBOOaH38ggmPdjD8Qwbvuxh+IoOPxBz1H0P34gx4jMP6BniIw/ogeIjD+CS1HYPyJWozA+DO1FIHxz9RCBMa/UM0RGH8hNUZg/IXVFIHxr6SGCIx/ZWuOwPg3ssYIjH9ja4rA+IWsIQLjF1YyAuOvRIkIjL8yt4zA+Ct1iwiMv3LXjMD4lbhGBMavzJIRGL9SS0Rg/MpdEoHxG3FOBMZvzJz/uX+Z+bfGr8ScJ4HxG7VUBMav2KURGL8B50Zg/IbMjcD4DZoagfEbdioC43dg7MeY/Zh1Rzb5/HPsuyQ/ip4IAAAAAAAAAAAAAAAAAAAAAAAAAOjeP1TCsZ3QSll0AAAAAElFTkSuQmCC";
    const upArrowIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAOwAAADsAEnxA+tAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAgVJREFUeJzt3UFOFEEYhuHPsDExeiJPIZGjuAKXuhXv4Q2UuDAewXtwAIOL4Y8JDJnpoWeqq/p5kl4QWFTq/TLNChIAAAAAAAAAAAAAAAAAAAAAFu1F6wM0cpbkPMnb+69/JfmW5G+zE3Eyr5PcJLl78Nzcf4+BvUryM4/j1/M7yZtWh+O4dsU3goHtG98IBjQ1vhEM5ND4RjCA58Y3go7NFd8IOjR3fCPoyNT4H5N8mPDzRrBgh8QvRtC558QvRtCpOeIXI+jMnPGLEXTiGPGLESzcMeMXI1ioU8QvRrAwp4xfjGAhWsQvRtBYy/jFCBpZQvxiBCe2pPjFCE5kifGLERzZkuMXIziSHuIXI5hZT/GLEcykx/jFCJ6p5/jFCA40QvxiBBONFL8YwZ5GjF+MYIeR4xcjeMIa4hcjeGBN8YsR3Ftj/LL6Eaw5flntCMT/b3UjEP+x1YxA/KcNPwLxdxt2BOLvb7gRiD/dMCMQ/3Ddj+As2//86lPPVZtjLtpV9r+/m2zufDEuIv4cpozgotEZt/oaH/tz2fd1cN3qgNtcR/w57TOCL81Ot8WuV4CP/el2vQ7etzvaY2dJfmT7QS8bnqt3l9l+p9+zsF8Ck+Rlks9J/iS5zea/cLxreqIxnGdzl7fZ3O2nbO4aAAAAAAAAAAAAAAAAAAAAAAAAAAAAGMA/0nbvD8X+7HoAAAAASUVORK5CYII=";

    let indexData = "";
    let titleDate = strftime.strftime(expTask.index.dateFormat, new Date());

    let styles = '<style>\r\n';
    styles += 'table { border-collapse: collapse; }\r\n';
    //styles += `table.sortable th:not(.sorttable_sorted):not(.sorttable_sorted_reverse):not(.sorttable_nosort):after { content: " \\2304\\2303"}`;
    styles += `table.sortable th::after, th.sorttable_sorted::after, th.sorttable_sorted_reverse::after { content: " ";  display: inline-block; width: 20px;  height: 16px;}`;
    styles += `th.sorttable_sorted::after { background: no-repeat url(${downArrowIcon}); background-size: 80%; float: right; padding-bottom: -8px}`;
    styles += `th.sorttable_sorted_reverse::after { background: no-repeat url(${upArrowIcon}); background-size: 80%; float: right}`;
    styles += `#sorttable_sortfwdind, #sorttable_sortrevind { display: none; }`;

    styles += 'th { background-color: #e6ffff; }\r\n';
    styles += 'th, td { padding: 4px; text-align: left; vertical-align: center; }\r\n';
    styles += 'tr:nth-child(even) { background-color: #f0f0f0; }\r\n';
    styles += 'tr:nth-child(odd) { background-color: #fff; }\r\n';
    styles += 'tr>:nth-child(5) { text-align: center; }\r\n';
    styles += 'tr>:nth-child(6) { text-align: right; }\r\n';
    styles += '.msgError { background-color: red !important; color: white;}\r\n';
    styles += 'a:link { text-decoration: none;}\n';
    styles += '.msgError a:link { color:rgb(198, 198, 230);}\n';

    styles += '</style>\r\n';

    indexData = '<html>\r\n<head>\r\n';

    indexData += styles;
    indexData += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n';
    indexData += `<title>Folder: ${expTask.folders[expTask.currentFolderIndex].name}</title>\n</head>\n<body>\n`;
    indexData += `<h2>Folder: ${expTask.folders[expTask.currentFolderIndex].name}&nbsp;&nbsp;&nbsp;&nbsp;Date: ${titleDate}</h2>\n`;

    indexData += '<table width="99%" border="1" class="sortable">\n';

    indexData += "<tr><th><b>" + "Subject" + "</b></th>"; // Subject
    indexData += "<th><b>" + "From" + "</b></th>"; // From
    indexData += "<th><b>" + "To" + "</b></th>"; // To
    indexData += "<th id='dateHdr'><b>" + "Date" + "</b></th>"; // Date

    indexData += "<th style='padding-left: 12px;' class='sorttable_nosort' ><b>" + "<img src='" + attIcon + "' height='20px' width='20px'></b></th>"; // Attachment

    //const sizeStr = window.ietng.extension.localeData.localizeMessage("Size");
    let sizeStr = "Size";
    indexData += "<th><b>" + sizeStr + "</b></th>"; // Attachment

    indexData += "</tr>";

    console.log(msgListLog)
    for (let index = 0; index < msgListLog.length; index++) {
      const msgItem = msgListLog[index].fileStatus;
      const errItem = msgListLog[index].error;
      let errClass = "";
      if (errItem.error != "none") {
        console.log("err", errItem)
        errClass = " class='msgError' ";
      }

      //console.log(msgItem)
      let recipients;
      if (msgItem.headers.recipients == []) {
        recipients = "(none)";
      } else {
        recipients = msgItem.headers.recipients.map(recipient => {
          recipient = recipient.slice(0, 50)
          recipient = recipient.replaceAll('"', '');
          recipient = _encodeSpecialTextToHTML(recipient);
          return recipient;
        });
        recipients = recipients.join(",<br>");
      }

      let fpParts = msgItem.filePath.split(osPathSeparator);
      var filename = fpParts[fpParts.length - 1];
      let messageContainerName = "";
      if (expTask.messages.messageContainer) {
        messageContainerName = encodeURIComponent(expTask.messages.messageContainerName) + "/";
      }
      let relUrl = "./" + messageContainerName + encodeURIComponent(`${filename}`);
      let fullSubject = msgItem.headers.subject;
      if (fullSubject.startsWith(".")) {
        fullSubject = "[No Decryption]" + fullSubject;
      }
      let aHref = `<a href="${relUrl}">${_encodeSpecialTextToHTML(fullSubject).slice(0, 50)}</a>`;

      let attachments = "";
      if (msgItem.hasAttachments) {
        attachments = msgItem.hasAttachments;
      }
      indexData += `\n<tr ${errClass}><td sorttable_customkey="${fullSubject}">${aHref}</td>`;
      indexData += "\n<td>" + _encodeSpecialTextToHTML(msgItem.headers.author.slice(0, 50).replace('"', '')) + "</td>";
      indexData += "\n<td>" + recipients + "</td>";
      indexData += `\n<td style='text-align: right;' sorttable_customkey="${strftime.strftime("%s", msgItem.headers.date)}" nowrap>${strftime.strftime(expTask.index.dateFormat, msgItem.headers.date)}</td>`;
      indexData += "\n<td>" + attachments + "</td>";
      indexData += "\n<td nowrap>" + _formatBytes(msgItem.headers.size, 2) + "</td>";
      indexData += "</tr>";
    }

    indexData += "</table>\n<script>\nsorttable.js\n</script>\n</body></html>\n";
    let rv = await browser.ExportMessages.writeIndex(expTask, indexData);
  } catch (ex) {
    console.log(ex, filename);
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${filename}\n${ex.message}\n\n${ex.stack}`);
  }

}

function _formatBytes(bytes, decimals) {
  if (bytes == 0) return '0 Bytes';
  var k = 1024,
    dm = decimals || 2,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


// body and index processing functions to be consolidated

function _encodeSpecialTextToHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  if (!str) {
    return "";
  }
  return str.replace(/[&<>"]/g, function (m) { return map[m]; });
}