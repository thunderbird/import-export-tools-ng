// export prototype

import { Ci } from "./CiConstants.js";

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
    messageContainer: true,
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
    containerType: "perMsg",
    containerNamePattern: "$subject}-Atts",
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


export async function exportFolders(ctxInfo, params) {

  try {
    // for now only deal with a single folder for prototype
    if (ctxInfo.selectedFolders && ctxInfo.selectedFolders.length > 1) {
      let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("multipleFolders.title"), browser.i18n.getMessage("multipleFolders.AlertMsg") + params.toString());
      if (!rv) {
        return;
      }
    }
    console.log(ctxInfo, params);

    // we do all main logic, folder and message iteration
    // and UI interactions in wext side
    // we avoid msg transfer for major performance issues

    params.ctxInfo = ctxInfo;
    var expTask = await _buildExportTask(params);

    // warnings

    //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), "Exporting IMAP folders");

    // get export directory
    /*
        let resultObj = await browser.ExportMessages.openFileDialog(Ci.nsIFilePicker.modeGetFolder, "Export Directory", "", Ci.nsIFilePicker.filterAll);
    
        if (resultObj.result != Ci.nsIFilePicker.returnOK) {
          return;
        }
    */

    var runs = 20;
    var total = 0;
    var times = [];

    for (let index = 0; index < runs; index++) {

      let st = new Date();

      //console.log(new Date());

      //expTask.generalConfig.exportDirectory = resultObj.folder;
      expTask.generalConfig.exportDirectory =
        "C:\\Dev\\Thunderbird\\Extensions XUL\\import-export-tools-ng\\scratch\\export2";
      //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), resultObj.folder);

      // create export container
      expTask.exportContainer.directory = await browser.ExportMessages.createExportContainer(expTask);
      //console.log(expTask);
      expTask.selectedFolder = ctxInfo.selectedFolder;
      //console.log(ctxInfo, expTask)

      await iterate2(expTask);

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

async function getIndexedRaw(msgId, index) {
  let gd = messenger.messages.getRaw(msgId);
  return { gd };

}


async function iterate2(expTask) {

  // 1522 msgs 50MB
  // 20 run avg 3150ms
  // no write 1100ms avg


  // iterate msgs

  var wrtotal = 0;
  var msgListPage = null;
  var readRawInWext = true;
  const targetMaxMsgData = 25 * 1000 * 1000;
  var totalMsgsData = 0;
  var expResult;
  var writePromises = [];
  do {
    if (!msgListPage) {
      msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
    } else {
      msgListPage = await messenger.messages.continueList(msgListPage.id);
    }
    const messagesLen = msgListPage.messages.length;
    //console.log(messagesLen)
    expTask.msgList = [];
    var getRawPromises = [];

    for (let index = 0; index < messagesLen; index++) {
      //console.log("push", index)

      expTask.msgList.push(msgListPage.messages[index])
      let msgId = msgListPage.messages[index].id;
      if (readRawInWext) {
        //console.log("add data", expTask.msgList.length - 1)

        //expTask.msgList[expTask.msgList.length - 1].msgData = await messenger.messages.getRaw(msgId);
        getRawPromises.push(messenger.messages.getRaw(msgId));
        totalMsgsData += msgListPage.messages[index].size;
        //console.log(expTask.msgList[index].msgRawData)
      }
      /*
      if (expTask.attachments.save != "none") {
        try {
          expTask.msgList[index].attachments = await messenger.messages.listAttachments(msgId);
        } catch (ex) {
          expTask.msgList[index].attachments = [];
        }
      } else {
        console.log("empty att list", index)
        expTask.msgList[index].attachments = [];
      }
*/

      if (totalMsgsData >= targetMaxMsgData) {
        if (1) {
          let p = await Promise.allSettled(getRawPromises);

          for (let index = 0; index < p.length; index++) {
            expTask.msgList[index].msgData = p[index].value;
          }
        }

//        expResult = await browser.ExportMessages.exportMessages(expTask);
        writePromises.push(browser.ExportMessages.exportMessages(expTask));

        //console.log(expTask.msgList)
        totalMsgsData = 0;
        expTask.msgList = [];
        getRawPromises = [];
      }
    }

    //expTask.st0 = st;
    if (expTask.msgList) {
      if (1) {
        let p = await Promise.allSettled(getRawPromises);

        for (let index = 0; index < p.length; index++) {
          expTask.msgList[index].msgData = p[index].value;
        }
      }

      //expResult = await browser.ExportMessages.exportMessages(expTask);
      writePromises.push(browser.ExportMessages.exportMessages(expTask));

      //console.log(expTask.msgList)
      //console.log(expTask.msgList)
      //expResult = await browser.ExportMessages.exportMessages(expTask);
    }

    wrtotal += expResult;

  } while (msgListPage.id);

  await Promise.allSettled(writePromises);
}

async function iterate1(expTask) {

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

  do {
    if (!msgListPage) {
      msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
    } else {
      msgListPage = await messenger.messages.continueList(msgListPage.id);
    }
    const messagesLen = msgListPage.messages.length;
    //console.log(messagesLen)
    expTask.msgList = [];
    for (let index = 0; index < messagesLen; index++) {
      //console.log("push", index)

      expTask.msgList.push(msgListPage.messages[index])
      let msgId = msgListPage.messages[index].id;
      if (readRawInWext) {
        //console.log("add data", expTask.msgList.length - 1)

        expTask.msgList[expTask.msgList.length - 1].msgData = await messenger.messages.getRaw(msgId);
        totalMsgsData += msgListPage.messages[index].size;
        //console.log(expTask.msgList[index].msgRawData)
      }
      /*
      if (expTask.attachments.save != "none") {
        try {
          expTask.msgList[index].attachments = await messenger.messages.listAttachments(msgId);
        } catch (ex) {
          expTask.msgList[index].attachments = [];
        }
      } else {
        console.log("empty att list", index)
        expTask.msgList[index].attachments = [];
      }
*/

      if (totalMsgsData >= targetMaxMsgData) {
        //expResult = await browser.ExportMessages.exportMessages(expTask);
        totalMsgsData = 0;
        expTask.msgList = [];
      }
    }

    //expTask.st0 = st;
    if (expTask.msgList) {
      //console.log(expTask.msgList)
      //expResult = await browser.ExportMessages.exportMessages(expTask);
    }

    wrtotal += expResult;

  } while (msgListPage.id);

}

async function _buildExportTask(params) {
  var expTask = baseExpTask;

  switch (params.expType) {
    case "eml":
      expTask = await _build_EML_expTask(expTask, params);
      break;

  }
  return expTask;
}

async function _build_EML_expTask(expTask, params) {
  // hack setup
  expTask.expType = "eml";
  expTask.folders = [params.ctxInfo.selectedFolder];
  expTask.generalConfig.exportDirectory = "C:\\Dev\\test";
  expTask.exportContainer.create = true;
  expTask.dateFormat.type = 1;
  expTask.msgNames.extension = "eml";
  expTask.attachments.save = "none";

  return expTask;

}


export async function test(ctxInfo, params) {
  console.log(ctxInfo, params);
}
