/*
  ImportExportTools NG is a extension for Thunderbird mail client
  providing import and export tools for messages and folders.
  The extension authors:
    Copyright (C) 2026 : Christopher Leidigh

  ImportExportTools NG is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// importExportTasks.mjs

// We build the export task objects based on format and options

import { prefCmds } from "./prefCmds.mjs";


const baseExpTask = {
  expMethod: "folders",
  expType: null,
  id: 0,
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
    messageContainerName: "messages",
    messageContainerDirectory: "",
  },
  names: {
    namePatternType: "simple",
    namePatternDropdown: "",
    namePatternDefault: "${subject}-${date}-${index}",
    namePatternCustom: "${subject}-${date}-${index}",
    extension: "",
    maxLength: 254,
    components: {
      subjectMaxLen: 50,
      authorNameMaxLen: 50,
      recipientNameMaxLen: 50,
    },
    filters: {
      alphaNumericOnly: false,
      asciiOnly: false,
      characterFilter: "",
    },
    transforms: {
      latinize: false,
    },
  },
  attachments: {
    save: "none",
    containerStructure: "perMsgDir",
    namePattern: "${subject}",
    inlineNamePattern: "${subject}",

  },
  index: {
    create: true,
    directory: "",
    dateFormat: "",
  },
  outputSpecific: {
    eml: {},
    html: {},
    pdf: {
      pdfPrinterName: "Mozilla_Save_to_PDF",
    },
  },
  getMsg: {
    method: "self._getRawMessage",
    convertData: false,
  },
  postProcessing: [],
  fileSave: {
    type: "file",
    encoding: "UTF-8",
    sentDate: false,
  },
  debug: {
    options: "",
  },
  msgList: {},
};


export async function createExportTask(params, ctxEvent, folderSet) {
  try {

    // we need a deep clone with structuredClone so
    // our default baseExpTask object is not modified
    let expTask = structuredClone(baseExpTask);

    switch (params.expType) {
      case "eml":
        expTask = await _build_EML_expTask(expTask, params, ctxEvent, folderSet);
        break;
      case "html":
        expTask = await _build_HTML_expTask(expTask, params, ctxEvent, folderSet);
        break;
      case "pdf":
        expTask = await _build_PDF_expTask(expTask, params, ctxEvent, folderSet);
        break;
      case "plaintext":
        expTask = await _build_Plaintext_expTask(expTask, params, ctxEvent, folderSet);
        break;
    }
    return expTask;
  } catch (ex) {
    throw (ex);
  }
}

async function _build_EML_expTask(expTask, params, ctxEvent, folderSet) {

  if (params.expMethod) {
    expTask.expMethod = params.expMethod;
  }
  expTask.expType = params.expType;
  expTask.exportFormatText = browser.i18n.getMessage("exportFormatEML");
  expTask.folders = folderSet;
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = "";
  if (params.expMethod == "selectedMsgs") {
    expTask.exportContainer.create = false;
  } else {
    expTask.exportContainer.create = true;
  }

  expTask.dateFormat.type = 1;
  expTask.names.extension = "eml";
  expTask.attachments.save = params.saveAttachments;

  // containers
  expTask.messages.messageContainer = false;

  // names
  let nameFormat = await prefCmds.getPref("export.names.defaults.msgNameFormatType");
  if (nameFormat == 2) {
    expTask.names.namePatternType = "simple";
    expTask.names.namePatternDropdown = await prefCmds.getPref("export.names.defaults.msgNameSimpleFormat");
  } else {
    expTask.names.namePatternType = "custom";
    expTask.names.namePatternCustom = await prefCmds.getPref("export.names.defaults.msgNameCustomFormat");
  }

  expTask.fileSave.sentDate = await prefCmds.getPref("export.general.setMsgDateOnFilesAndDirs");

  // name components and constraints

  expTask.dateFormat.custom = await prefCmds.getPref("export.names.defaults.components.dateFormat.custom");

  expTask.names.components.subjectMaxLen = await prefCmds.getPref("export.names.defaults.components.subjectMaxLen");
  expTask.names.components.recipientNameMaxLen = await prefCmds.getPref("export.names.defaults.components.recipientMaxLen");
  expTask.names.components.authorNameMaxLen = await prefCmds.getPref("export.names.defaults.components.authorMaxLen");

  // filters and transforms
  expTask.names.filters.alphaNumericOnly = await prefCmds.getPref("export.names.defaults.filters.alphaNumericOnly");
  expTask.names.filters.asciiOnly = await prefCmds.getPref("export.names.defaults.filters.asciiOnly");
  expTask.names.filters.characterFilter = await prefCmds.getPref("export.names.defaults.filters.characterFilter");
  expTask.names.transforms.latinize = await prefCmds.getPref("export.names.defaults.transforms.latinize");

  // index
  expTask.index.create = params.index;
  expTask.index.dateFormat = await prefCmds.getPref("index.dateFormat");

  // debug and logging
  expTask.debug.logTypes = await prefCmds.getPref("debug.logTypes");

  return expTask;
}

async function _build_HTML_expTask(expTask, params, ctxEvent, folderSet) {
  if (params.expMethod) {
    expTask.expMethod = params.expMethod;
  }
  expTask.expType = params.expType;
  expTask.exportFormatText = browser.i18n.getMessage("exportFormatHTML");

  expTask.folders = folderSet;
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = params.exportDirectory;
  if (params.expMethod == "selectedMsgs") {
    expTask.exportContainer.create = false;
    // containers
    expTask.messages.messageContainer = false;
  } else {
    expTask.exportContainer.create = true;
  }
  expTask.dateFormat.type = 1;
  expTask.names.extension = "html";
  expTask.attachments.save = params.saveAttachments;
  expTask.attachments.containerStructure = await prefCmds.getPref("export.general.msgAndAttachmentsStructure");
  expTask.attachments.namePattern = await prefCmds.getPref("export.names.defaults.attachmentDirsFormat");
  expTask.attachments.inlineNamePattern = await prefCmds.getPref("export.names.defaults.inlineAttachmentDirsFormat");

  expTask.fileSave.sentDate = await prefCmds.getPref("export.general.setMsgDateOnFilesAndDirs");

  // names
  let nameFormat = await prefCmds.getPref("export.names.defaults.msgNameFormatType");
  if (nameFormat == 2) {
    expTask.names.namePatternType = "simple";
    expTask.names.namePatternDropdown = await prefCmds.getPref("export.names.defaults.msgNameSimpleFormat");
  } else {
    expTask.names.namePatternType = "custom";
    expTask.names.namePatternCustom = await prefCmds.getPref("export.names.defaults.msgNameCustomFormat");
  }

  // name components and constraints

  expTask.dateFormat.custom = await prefCmds.getPref("export.names.defaults.components.dateFormat.custom");

  expTask.names.components.subjectMaxLen = await prefCmds.getPref("export.names.defaults.components.subjectMaxLen");
  expTask.names.components.recipientNameMaxLen = await prefCmds.getPref("export.names.defaults.components.recipientMaxLen");
  expTask.names.components.authorNameMaxLen = await prefCmds.getPref("export.names.defaults.components.authorMaxLen");

  // filters and transforms
  expTask.names.filters.alphaNumericOnly = await prefCmds.getPref("export.names.defaults.filters.alphaNumericOnly");
  expTask.names.filters.asciiOnly = await prefCmds.getPref("export.names.defaults.filters.asciiOnly");
  expTask.names.filters.characterFilter = await prefCmds.getPref("export.names.defaults.filters.characterFilter");
  expTask.names.transforms.latinize = await prefCmds.getPref("export.names.defaults.transforms.latinize");

  // index
  expTask.index.create = params.index;
  expTask.index.dateFormat = await prefCmds.getPref("index.dateFormat");

  // debug and logging
  expTask.debug.logTypes = await prefCmds.getPref("debug.logTypes");
  return expTask;
}

async function _build_PDF_expTask(expTask, params, ctxEvent, folderSet) {
  if (params.expMethod) {
    expTask.expMethod = params.expMethod;
  }
  expTask.expType = params.expType;
  expTask.exportFormatText = browser.i18n.getMessage("exportFormatPDF");

  expTask.folders = folderSet;
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = params.exportDirectory;
  if (params.expMethod == "selectedMsgs") {
    expTask.exportContainer.create = false;
    expTask.messages.messageContainer = false;
  } else {
    expTask.exportContainer.create = true;
  }
  expTask.dateFormat.type = 1;
  expTask.names.extension = "pdf";
  expTask.attachments.save = params.saveAttachments;
  expTask.attachments.containerStructure = await prefCmds.getPref("export.general.msgAndAttachmentsStructure");

  expTask.attachments.namePattern = await prefCmds.getPref("export.names.defaults.attachmentDirsFormat");
  expTask.attachments.inlineNamePattern = await prefCmds.getPref("export.names.defaults.inlineAttachmentDirsFormat");

  expTask.fileSave.sentDate = await prefCmds.getPref("export.general.setMsgDateOnFilesAndDirs");

  // names
  let nameFormat = await prefCmds.getPref("export.names.defaults.msgNameFormatType");
  if (nameFormat == 2) {
    expTask.names.namePatternType = "simple";
    expTask.names.namePatternDropdown = await prefCmds.getPref("export.names.defaults.msgNameSimpleFormat");
  } else {
    expTask.names.namePatternType = "custom";
    expTask.names.namePatternCustom = await prefCmds.getPref("export.names.defaults.msgNameCustomFormat");
  }

  // name components and constraints

  expTask.dateFormat.custom = await prefCmds.getPref("export.names.defaults.components.dateFormat.custom");

  expTask.names.components.subjectMaxLen = await prefCmds.getPref("export.names.defaults.components.subjectMaxLen");
  expTask.names.components.recipientNameMaxLen = await prefCmds.getPref("export.names.defaults.components.recipientMaxLen");
  expTask.names.components.authorNameMaxLen = await prefCmds.getPref("export.names.defaults.components.authorMaxLen");

  // filters and transforms
  expTask.names.filters.alphaNumericOnly = await prefCmds.getPref("export.names.defaults.filters.alphaNumericOnly");
  expTask.names.filters.asciiOnly = await prefCmds.getPref("export.names.defaults.filters.asciiOnly");
  expTask.names.filters.characterFilter = await prefCmds.getPref("export.names.defaults.filters.characterFilter");
  expTask.names.transforms.latinize = await prefCmds.getPref("export.names.defaults.transforms.latinize");

  // index
  expTask.index.create = params.index;
  expTask.index.dateFormat = await prefCmds.getPref("index.dateFormat");

  // debug and logging
  expTask.debug.logTypes = await prefCmds.getPref("debug.logTypes");
  return expTask;
}

async function _build_Plaintext_expTask(expTask, params, ctxEvent, folderSet) {
  if (params.expMethod) {
    expTask.expMethod = params.expMethod;
  }
  expTask.expType = params.expType;
  expTask.exportFormatText = browser.i18n.getMessage("exportFormatPlaintext");

  expTask.folders = folderSet;
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = params.exportDirectory;
  if (params.expMethod == "selectedMsgs") {
    expTask.exportContainer.create = false;
    expTask.messages.messageContainer = false;
  } else {
    expTask.exportContainer.create = true;
  }
  expTask.dateFormat.type = 1;
  expTask.names.extension = "txt";
  expTask.attachments.save = params.saveAttachments;
  expTask.attachments.containerStructure = await prefCmds.getPref("export.general.msgAndAttachmentsStructure");

  expTask.attachments.namePattern = await prefCmds.getPref("export.names.defaults.attachmentDirsFormat");
  expTask.attachments.inlineNamePattern = await prefCmds.getPref("export.names.defaults.inlineAttachmentDirsFormat");

  expTask.fileSave.sentDate = await prefCmds.getPref("export.general.setMsgDateOnFilesAndDirs");

  // names
  let nameFormat = await prefCmds.getPref("export.names.defaults.msgNameFormatType");
  if (nameFormat == 2) {
    expTask.names.namePatternType = "simple";
    expTask.names.namePatternDropdown = await prefCmds.getPref("export.names.defaults.msgNameSimpleFormat");
  } else {
    expTask.names.namePatternType = "custom";
    expTask.names.namePatternCustom = await prefCmds.getPref("export.names.defaults.msgNameCustomFormat");
  }

  // name components and constraints

  expTask.dateFormat.custom = await prefCmds.getPref("export.names.defaults.components.dateFormat.custom");

  expTask.names.components.subjectMaxLen = await prefCmds.getPref("export.names.defaults.components.subjectMaxLen");
  expTask.names.components.recipientNameMaxLen = await prefCmds.getPref("export.names.defaults.components.recipientMaxLen");
  expTask.names.components.authorNameMaxLen = await prefCmds.getPref("export.names.defaults.components.authorMaxLen");

  // filters and transforms
  expTask.names.filters.alphaNumericOnly = await prefCmds.getPref("export.names.defaults.filters.alphaNumericOnly");
  expTask.names.filters.asciiOnly = await prefCmds.getPref("export.names.defaults.filters.asciiOnly");
  expTask.names.filters.characterFilter = await prefCmds.getPref("export.names.defaults.filters.characterFilter");
  expTask.names.transforms.latinize = await prefCmds.getPref("export.names.defaults.transforms.latinize");

  // index
  expTask.index.create = params.index;
  expTask.index.dateFormat = await prefCmds.getPref("index.dateFormat");

  // debug and logging
  expTask.debug.logTypes = await prefCmds.getPref("debug.logTypes");
  return expTask;
}
