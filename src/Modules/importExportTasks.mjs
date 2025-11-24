// importExportTasks.mjs

import * as prefs from "./prefCmds.mjs";


const baseExpTask = {
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
    create: true,
    messageContainerName: "messages",
    messageContainerDirectory: "",
  },
  names: {
    namePatternType: "dropdown",
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
    directory: "",
    dateFormat: "",
  },
  outputSpecific: {
    eml: {},
    html: {},
    pdf: {
      pdfPrinterName: "Microsoft_Print_to_PDF",
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
  msgList: {},
};


export async function createExportTask(params, ctxEvent, folderSet) {
  try {
    let expTask = baseExpTask;

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
  // hack setup
  console.log(params)
  expTask.expType = params.expType;
  expTask.folders = folderSet;
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = "";
  expTask.exportContainer.create = true;
  expTask.dateFormat.type = 1;
  expTask.names.extension = "eml";
  expTask.attachments.save = params.saveAttachments;

  // names
  let nameFormat = await prefs.getPref("exportEML.filename_format");
  if (nameFormat == 2) {
    expTask.names.namePatternType = "dropdown";
    expTask.names.namePatternDropdown = await prefs.getPref("export.filename_pattern");
  } else {
    expTask.names.namePatternType = "custom";
    expTask.names.namePatternCustom = await prefs.getPref("export.filename_extended_format");
  }

  // name components and constraints

  expTask.dateFormat.custom = await prefs.getPref("export.filename_date_custom_format");

  expTask.names.components.subjectMaxLen = await prefs.getPref("subject.max_length");
  expTask.names.components.recipientNameMaxLen = await prefs.getPref("recipients.max_length");
  expTask.names.components.authorNameMaxLen = await prefs.getPref("author.max_length");

  // filters and transforms
  expTask.names.filters.alphaNumericOnly = await prefs.getPref("export.filenames_toascii");
  expTask.names.filters.asciiOnly = await prefs.getPref("export.filename_filterUTF16");
  expTask.names.filters.characterFilter = await prefs.getPref("export.filename_filter_characters");
  expTask.names.transforms.latinize = await prefs.getPref("export.filename_latinize");

  // index
  expTask.index.dateFormat = await prefs.getPref("export.index_date_custom_format");


  //console.log(expTask)
  return expTask;

}

async function _build_HTML_expTask(expTask, params, ctxEvent, folderSet) {
  // hack setup
  expTask.expType = params.expType;
  expTask.folders = folderSet;
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = params.exportDirectory;
  expTask.exportContainer.create = true;
  expTask.dateFormat.type = 1;
  expTask.names.extension = "html";
  expTask.attachments.save = params.saveAttachments;
  expTask.attachments.namePattern = await prefs.getPref("export.attachments.filename_extended_format");
  console.log(expTask.attachments.namePattern)
  expTask.attachments.inlineNamePattern = await prefs.getPref("export.embedded_attachments.filename_extended_format");

  expTask.fileSave.sentDate = await prefs.getPref("export.set_filetime");

  // names
  let nameFormat = await prefs.getPref("exportEML.filename_format");
  console.log(nameFormat)
  if (nameFormat == 2) {
    expTask.names.namePatternType = "dropdown";
    expTask.names.namePatternDropdown = await prefs.getPref("export.filename_pattern");
  } else {
    expTask.names.namePatternType = "custom";
    expTask.names.namePatternCustom = await prefs.getPref("export.filename_extended_format");
  }

  // name components and constraints

  expTask.dateFormat.custom = await prefs.getPref("export.filename_date_custom_format");

  expTask.names.components.subjectMaxLen = await prefs.getPref("subject.max_length");
  expTask.names.components.recipientNameMaxLen = await prefs.getPref("recipients.max_length");
  expTask.names.components.authorNameMaxLen = await prefs.getPref("author.max_length");

  // filters and transforms
  expTask.names.filters.alphaNumericOnly = await prefs.getPref("export.filenames_toascii");
  expTask.names.filters.asciiOnly = await prefs.getPref("export.filename_filterUTF16");
  expTask.names.filters.characterFilter = await prefs.getPref("export.filename_filter_characters");
  expTask.names.transforms.latinize = await prefs.getPref("export.filename_latinize");

  // index
  expTask.index.dateFormat = await prefs.getPref("export.index_date_custom_format");
  return expTask;
}

async function _build_PDF_expTask(expTask, params, ctxEvent, folderSet) {
  // hack setup
  expTask.expType = params.expType;
  expTask.folders = folderSet;
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = params.exportDirectory;
  expTask.exportContainer.create = true;
  expTask.dateFormat.type = 1;
  expTask.names.extension = "pdf";
  expTask.attachments.save = params.saveAttachments;
  expTask.attachments.namePattern = await prefs.getPref("export.attachments.filename_extended_format");
  expTask.attachments.inlineNamePattern = await prefs.getPref("export.embedded_attachments.filename_extended_format");

  expTask.fileSave.sentDate = await prefs.getPref("export.set_filetime");

  // names
  let nameFormat = await prefs.getPref("exportEML.filename_format");
  if (nameFormat == 2) {
    expTask.names.namePatternType = "dropdown";
    expTask.names.namePatternDropdown = await prefs.getPref("export.filename_pattern");
  } else {
    expTask.names.namePatternType = "custom";
    expTask.names.namePatternCustom = await prefs.getPref("export.filename_extended_format");
  }

  // name components and constraints

  expTask.dateFormat.custom = await prefs.getPref("export.filename_date_custom_format");

  expTask.names.components.subjectMaxLen = await prefs.getPref("subject.max_length");
  expTask.names.components.recipientNameMaxLen = await prefs.getPref("recipients.max_length");
  expTask.names.components.authorNameMaxLen = await prefs.getPref("author.max_length");

  // filters and transforms
  expTask.names.filters.alphaNumericOnly = await prefs.getPref("export.filenames_toascii");
  expTask.names.filters.asciiOnly = await prefs.getPref("export.filename_filterUTF16");
  expTask.names.filters.characterFilter = await prefs.getPref("export.filename_filter_characters");
  expTask.names.transforms.latinize = await prefs.getPref("export.filename_latinize");

  // index
  expTask.index.dateFormat = await prefs.getPref("export.index_date_custom_format");
  return expTask;
}

async function _build_Plaintext_expTask(expTask, params, ctxEvent, folderSet) {
  // hack setup
  expTask.expType = params.expType;
  expTask.folders = folderSet;
  expTask.currentFolderPath = expTask.folders[0].path;
  expTask.generalConfig.exportDirectory = params.exportDirectory;
  expTask.exportContainer.create = true;
  expTask.dateFormat.type = 1;
  expTask.names.extension = "txt";
  expTask.attachments.save = params.saveAttachments;
  expTask.attachments.namePattern = await prefs.getPref("export.attachments.filename_extended_format");
  expTask.attachments.inlineNamePattern = await prefs.getPref("export.embedded_attachments.filename_extended_format");

  expTask.fileSave.sentDate = await prefs.getPref("export.set_filetime");

  // names
  let nameFormat = await prefs.getPref("exportEML.filename_format");
  if (nameFormat == 2) {
    expTask.names.namePatternType = "dropdown";
    expTask.names.namePatternDropdown = await prefs.getPref("export.filename_pattern");
  } else {
    expTask.names.namePatternType = "custom";
    expTask.names.namePatternCustom = await prefs.getPref("export.filename_extended_format");
  }

  // name components and constraints

  expTask.dateFormat.custom = await prefs.getPref("export.filename_date_custom_format");

  expTask.names.components.subjectMaxLen = await prefs.getPref("subject.max_length");
  expTask.names.components.recipientNameMaxLen = await prefs.getPref("recipients.max_length");
  expTask.names.components.authorNameMaxLen = await prefs.getPref("author.max_length");

  // filters and transforms
  expTask.names.filters.alphaNumericOnly = await prefs.getPref("export.filenames_toascii");
  expTask.names.filters.asciiOnly = await prefs.getPref("export.filename_filterUTF16");
  expTask.names.filters.characterFilter = await prefs.getPref("export.filename_filter_characters");
  expTask.names.transforms.latinize = await prefs.getPref("export.filename_latinize");

  // index
  expTask.index.dateFormat = await prefs.getPref("export.index_date_custom_format");

  return expTask;
}
