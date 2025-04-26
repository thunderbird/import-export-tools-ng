// importExportTasks.mjs

import * as prefs from "./prefCmds.mjs";


  const baseExpTask = {
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
        }
        return expTask;
      } catch (ex) {
        throw (ex);
      }
}

  async function _build_EML_expTask(expTask, params, ctxEvent) {
    // hack setup
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

    //console.log(expTask)
    return expTask;

  }

