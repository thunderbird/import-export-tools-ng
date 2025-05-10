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
        containerStructure: "perMsgDir",
        containerNamePattern: "${subject}-Atts",
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


export async function createExportTask(params, ctxEvent) {
  try {
        let expTask = baseExpTask;

        switch (params.expType) {
          case "eml":
            expTask = await _build_EML_expTask(expTask, params, ctxEvent);
            break;
          case "html":
            expTask = await _build_HTML_expTask(expTask, params, ctxEvent);
            break;
            case "pdf":
            expTask = await _build_PDF_expTask(expTask, params, ctxEvent);
            break;
        }
        return expTask;
      } catch (ex) {
        throw (ex);
      }
}

  async function _build_EML_expTask(expTask, params, ctxEvent) {
    // hack setup
    console.log(params)
    expTask.expType = params.expType;
    expTask.folders = [ctxEvent.selectedFolder];
    expTask.currentFolderPath = expTask.folders[0].path;
    expTask.generalConfig.exportDirectory = "";
    expTask.exportContainer.create = true;
    expTask.dateFormat.type = 1;
    expTask.msgNames.extension = "eml";
    expTask.attachments.save = params.saveAttachments;

    //console.log(expTask)
    return expTask;

  }

  async function _build_HTML_expTask(expTask, params, ctxEvent) {
    // hack setup
    expTask.expType = params.expType;
    expTask.folders = [ctxEvent.selectedFolder];
    expTask.currentFolderPath = expTask.folders[0].path;
    expTask.generalConfig.exportDirectory = params.exportDirectory;
    expTask.exportContainer.create = true;
    expTask.dateFormat.type = 1;
    expTask.msgNames.extension = "html";
    expTask.attachments.save = params.saveAttachments;
    
    expTask.fileSave.sentDate = await prefs.getPref("export.set_filetime");
    console.log(expTask.fileSave.receivedDate)
    //console.log(expTask)
    return expTask;

  }

async function _build_PDF_expTask(expTask, params, ctxEvent) {
    // hack setup
    expTask.expType = params.expType;
    expTask.folders = [ctxEvent.selectedFolder];
    expTask.currentFolderPath = expTask.folders[0].path;
    expTask.generalConfig.exportDirectory = params.exportDirectory;
    expTask.exportContainer.create = true;
    expTask.dateFormat.type = 1;
    expTask.msgNames.extension = "pdf";
    expTask.attachments.save = params.saveAttachments;
    
    expTask.fileSave.sentDate = await prefs.getPref("export.set_filetime");
    return expTask;
  }

