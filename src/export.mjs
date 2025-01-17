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

    let resultObj = await browser.ExportMessages.openFileDialog(Ci.nsIFilePicker.modeGetFolder, "Export Directory", "", Ci.nsIFilePicker.filterAll);

    if (resultObj.result != Ci.nsIFilePicker.returnOK) {
      return;
    }

    var runs = 1;
    var total = 0;
    var times = [];

    for (let index = 0; index < runs; index++) {

      let st = new Date();

      //console.log(new Date());

      expTask.generalConfig.exportDirectory = resultObj.folder;

      //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), resultObj.folder);

      // create export container
      expTask.exportContainer.directory = await browser.ExportMessages.createExportContainer(expTask);
      //console.log(expTask);
      // iterate msgs

      var wrtotal = 0;
      var msgListPage = null;
      do {
        console.log(msgListPage);

        if (!msgListPage) {
          console.log("list")
          msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
        } else {
          console.log("cont list")

          msgListPage = await messenger.messages.continueList(msgListPage.id);
        }
        const messagesLen = msgListPage.messages.length;
        expTask.msgList = new Array(messagesLen);
        for (let index = 0; index < messagesLen; index++) {
          let msgId = msgListPage.messages[index].id;
          if (expTask.attachments.save != "none") {
            try {
              expTask.msgList[index] = { id: msgId, attachments: await messenger.messages.listAttachments(msgId) };
            } catch (ex) {
              expTask.msgList[index] = { id: msgId, attachments: [] };
            }
          } else {
            expTask.msgList[index] = { id: msgId, attachments: [] };
          }
        }

        var expResult;

        expTask.st0 = st;
        expResult = await browser.ExportMessages.exportMessages(expTask);
        wrtotal += expResult;

        console.log(msgListPage.id)
      } while (msgListPage.id);
      /*
        while (msgListPage.id) {
          msgListPage = await messenger.messages.continueList(msgListPage.id);
          const messagesLen = msgListPage.messages.length;
          expTask.msgList = new Array(messagesLen);
          for (let index = 0; index < messagesLen; index++) {
            let msgId = msgListPage.messages[index].id;
            if (expTask.attachments.save != "none") {
              try {
                expTask.msgList[index] = { id: msgId, attachments: await messenger.messages.listAttachments(msgId) };
              } catch (ex) {
                expTask.msgList[index] = { id: msgId, attachments: [] };
                console.log(msgListPage.messages[index]);
              }
            } else {
              expTask.msgList[index] = { id: msgId, attachments: [] };
              //console.log(expTask.msgList[index]);
            }
          }
  
  
  
          expTask.st0 = st;
          expResult = await browser.ExportMessages.exportMessages(expTask);
          wrtotal += expResult;
  
        }
  
  */
      times[index] = new Date() - st;
      total += times[index];
      console.log(new Date() - st);

    }

    console.log("wrt avg", wrtotal / runs)
    console.log("avg", total / runs)

  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
    console.log(ex);

    console.log(ex.stack);
  }

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
