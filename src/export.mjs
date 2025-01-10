// export prototype

import {Ci}  from "./CiConstants.js";

var baseExpTask = {
  expType: null,
  folders: [],
  recursive: false,
  expStatus: null,
  generalConfig: {
    exportDirectoryType: "prompt",
    exportDirectory: "",
  },
  exportContainer: {
    create: false,
    namePattern: "${folder}-$(date}-${index}",
  },
  dateFormat: {
    type: 0,
    custum: "%Y%m%d%H%M",
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
    method: "getRawMessage",
    decode: false,
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
  console.log(ctxInfo, params)

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
  console.log(expTask)

  expTask.generalConfig.exportDirectory = resultObj.folder;
  console.log(expTask)

  let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), resultObj.folder);

  // create export container
  rv = await browser.ExportMessages.createExportContainer(expTask);
  console.log(rv)
  // iterate msgs
  } catch (ex) {
  let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
  console.log(ex)

  console.log(ex.stack)
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
  expTask.folders = params.ctxInfo.selectedFolder;
  expTask.generalConfig.exportDirectory = "C:\\Dev\\test";
  expTask.exportContainer.create = true;
  expTask.dateFormat.type = 1;
  expTask.msgNames.extension = "eml";

  return expTask;
  
}


export async function test(ctxInfo, params) {
  console.log(ctxInfo, params)
}
