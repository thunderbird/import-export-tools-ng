// wextMenus
// Installs wext context and main menus
// Interface via notifytools to expMenus


// Message context menu
const ctxMenu_TopId = "ctxMenu_TopId";
const ctxMenu_Exp_EMLFormat_Id = "ctxMenu_Exp_EMLFormat_Id";
const ctxMenu_Exp_HTMLFormat_Id = "ctxMenu_Exp_HTMLFormat_Id";
const ctxMenu_Exp_PDFFormat_Id = "ctxMenu_Exp_PDFFormat_Id";
const ctxMenu_Exp_PlainTextFormat_Id = "ctxMenu_Exp_PlainTextFormat_Id";
const ctxMenu_Exp_CSVFormat_Id = "ctxMenu_Exp_CSVFormat_Id";
const ctxMenu_Exp_MboxFormat_Id = "ctxMenu_Exp_MboxFormat_Id";
const ctxMenu_Exp_Index_Id = "ctxMenu_Exp_Index_Id";
const ctxMenu_Exp_Options_Id = "ctxMenu_Exp_Options_Id";
const ctxMenu_Exp_Help_Id = "ctxMenu_Exp_Help_Id";

const ctxMenu_Exp_EMLFormatMsgsOnly_Id = "ctxMenu_Exp_EMLFormatMsgsOnly_Id";
const ctxMenu_Exp_EMLFormatCreateIndex_Id = "ctxMenu_Exp_EMLFormatCreateIndex_Id";

const ctxMenu_Exp_HTMLFormatMsgsOnly_Id = "ctxMenu_Exp_HTMLFormatMsgsOnly_Id";
const ctxMenu_Exp_HTMLFormatSaveAtts_Id = "ctxMenu_Exp_HTMLFormatSaveAtts_Id";
const ctxMenu_Exp_HTMLFormatCreateIndex_Id = "ctxMenu_Exp_HTMLFormatCreateIndex_Id";
const ctxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id = "ctxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id";


const ctxMenu_Exp_PlainTextFormatMsgsOnly_Id = "ctxMenu_Exp_PlainTextFormatMsgsOnly_Id";
const ctxMenu_Exp_PlainTextFormatSaveAtts_Id = "ctxMenu_Exp_PlainTextFormatSaveAtts_Id";
const ctxMenu_Exp_PlainTextFormatCreateIndex_Id = "ctxMenu_Exp_PlainTextFormatCreateIndex_Id";
const ctxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id = "ctxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id";

const ctxMenu_Exp_MboxFormatNewMbox_Id = "ctxMenu_Exp_MboxFormatNewMbox_Id";
const ctxMenu_Exp_MboxFormatAppendMbox_Id = "ctxMenu_Exp_MboxFormatAppendMbox_Id";

const ctxMenu_Exp_IndexHTML_Id = "ctxMenu_Exp_IndexHTML_Id";
const ctxMenu_Exp_IndexCSV_Id = "ctxMenu_Exp_IndexCSV_Id";


var msgCtxMenuSet = [
  {
    menuId: 1,
    menuDef: {
      id: ctxMenu_TopId,
      title: "Export Messages As…"
    }
  }, {
    menuDef: {
      id: ctxMenu_Exp_EMLFormat_Id,
      title: "EML Message Format"
    }
  },
  {
    menuDef: {
      id: ctxMenu_Exp_HTMLFormat_Id,
      title: "HTML Format"
    }

  },
  {
    menuDef: {
      id: ctxMenu_Exp_PDFFormat_Id,
      title: "PDF Format"
    }

  },
  {
    menuDef: {
      id: ctxMenu_Exp_PlainTextFormat_Id,
      title: "Plain Text Format",
    }

  },
  {
    menuDef: {
      id: ctxMenu_Exp_CSVFormat_Id,
      title: "CSV Format (Spreadsheet)",
    }

  },
  {
    menuDef: {
      id: ctxMenu_Exp_MboxFormat_Id,
      title: "mbox Format",
    }

  },

  {
    menuDef: {
      id: "ctxMenu_Exp_Sep1",
      type: "separator"
    }

  },
  {
    menuDef: {
      id: ctxMenu_Exp_Index_Id,
      title: "Message Index",
    }

  },
  {
    menuDef: {
      id: "ctxMenu_Exp_Sep2",
      type: "separator"
    }

  },
  {
    menuDef: {
      id: ctxMenu_Exp_Options_Id,
      title: "Options",
      onclick: openOptions,
    }

  },
  {
    menuDef: {
      id: ctxMenu_Exp_Help_Id,
      title: "Help",
      onclick: openHelp,
    }

  },

  {
    menuDef: {
      parentId: ctxMenu_Exp_EMLFormat_Id,
      id: ctxMenu_Exp_EMLFormatMsgsOnly_Id,
      title: "Messages (Attachments Embedded)"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_EMLFormat_Id,
      id: ctxMenu_Exp_EMLFormatCreateIndex_Id,
      title: "Messages And HTML Index"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_HTMLFormat_Id,
      id: ctxMenu_Exp_HTMLFormatMsgsOnly_Id,
      title: "Messages Only"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_HTMLFormat_Id,
      id: ctxMenu_Exp_HTMLFormatSaveAtts_Id,
      title: "Messages And Attachments"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_HTMLFormat_Id,
      id: ctxMenu_Exp_HTMLFormatCreateIndex_Id,
      title: "Messages And HTML Index"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_HTMLFormat_Id,
      id: ctxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id,
      title: "Messages With Attachments And Index"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_PlainTextFormat_Id,
      id: ctxMenu_Exp_PlainTextFormatMsgsOnly_Id,
      title: "Messages Only"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_PlainTextFormat_Id,
      id: ctxMenu_Exp_PlainTextFormatSaveAtts_Id,
      title: "Messages And Attachments"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_PlainTextFormat_Id,
      id: ctxMenu_Exp_PlainTextFormatCreateIndex_Id,
      title: "Messages And HTML Index"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_PlainTextFormat_Id,
      id: ctxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id,
      title: "Messages With Attachments And Index"
    }
  },


  {
    menuDef: {
      parentId: ctxMenu_Exp_MboxFormat_Id,
      id: ctxMenu_Exp_MboxFormatNewMbox_Id,
      title: "New mbox File"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_MboxFormat_Id,
      id: ctxMenu_Exp_MboxFormatAppendMbox_Id,
      title: "Append To Existing mbox File"
    }
  },


  {
    menuDef: {
      parentId: ctxMenu_Exp_Index_Id,
      id: ctxMenu_Exp_IndexHTML_Id,
      title: "HTML Format"
    }
  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_Index_Id,
      id: ctxMenu_Exp_IndexCSV_Id,
      title: "CSV Format"
    }
  },



];



const toolsCtxMenu_TopId = "toolsCtxMenu_TopId";
const toolsCtxMenu_ExpProfile_Id = "toolsCtxMenu_ExpProfile_Id";
const toolsCtxMenu_ImpProfile_Id = "toolsCtxMenu_ImpProfile_Id";
const toolsCtxMenu_Backup_Id = "toolsCtxMenu_Backup_Id";
const toolsCtxMenu_Options_Id = "toolsCtxMenu_Options_Id";
const toolsCtxMenu_Help_Id = "toolsCtxMenu_Help_Id";

const toolsCtxMenu_ExpProfileFull_Id = "toolsCtxMenu_ExpProfileFull_Id";
const toolsCtxMenu_ExpProfileMailOnly_Id = "toolsCtxMenu_ExpProfileMailOnly_Id";
var toolsCtxMenuSet = [
  {
    menuId: 2,
    menuDef: {
      id: toolsCtxMenu_TopId,
      title: "ImportExportTools NG"
    }
  },
  {
    menuDef: {
      id: toolsCtxMenu_ExpProfile_Id,
      title: "Export Profile"
    }
  },
  {
    menuDef: {
      id: toolsCtxMenu_ImpProfile_Id,
      title: "Import Profile"
    }
  },
  {
    menuDef: {
      id: toolsCtxMenu_Backup_Id,
      title: "Backup"
    }
  },
  {
    menuDef: {
      id: "toolsCtxMenu_Exp_Sep1",
      type: "separator"
    }

  },
  {
    menuDef: {
      id: toolsCtxMenu_Options_Id,
      title: "Options",
      onclick: openOptions,
    }

  },
  {
    menuDef: {
      id: toolsCtxMenu_Help_Id,
      title: "Help",
      onclick: openHelp,
    }

  },
  {
    menuDef: {
      parentId: toolsCtxMenu_ExpProfile_Id,
      id: toolsCtxMenu_ExpProfileFull_Id,
      title: "Full Profile"
    }
  },
  {
    menuDef: {
      parentId: toolsCtxMenu_ExpProfile_Id,
      id: toolsCtxMenu_ExpProfileMailOnly_Id,
      title: "Mail Only"
    }
  },



];

const folderCtxMenu_TopId = "folderCtxMenu_TopId";
const folderCtxMenu_Exp_FolderMbox_Id = "folderCtxMenu_Exp_FolderMbox_Id";
const folderCtxMenu_Exp_FolderMboxOnly_Id = "folderCtxMenu_Exp_FolderMboxOnly_Id";
const folderCtxMenu_Exp_FolderMboxZipped_Id = "folderCtxMenu_Exp_FolderMboxZipped_Id";
const folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id = "folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id";
const folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id = "folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id";
const folderCtxMenu_Exp_RemoteFolderMbox_Id = "folderCtxMenu_Exp_RemoteFolderMbox_Id";
const folderCtxMenu_Exp_AllMessages_Id = "folderCtxMenu_Exp_AllMessages_Id";
const folderCtxMenu_Exp_SearchExport_Id = "folderCtxMenu_Exp_SearchExport_Id";
const folderCtxMenu_Imp_MboxFiles_Id = "folderCtxMenu_Imp_MboxFiles_Id";
const folderCtxMenu_Imp_MboxFilesIndv_Id = "folderCtxMenu_Imp_MboxFilesIndv_Id";
const folderCtxMenu_Imp_MboxFilesIndvRecursive_Id = "folderCtxMenu_Imp_MboxFilesIndvRecursive_Id";
const folderCtxMenu_Imp_MboxFilesDir_Id = "folderCtxMenu_Imp_MboxFilesDir_Id";
const folderCtxMenu_Imp_MboxFilesDirRecursive_Id = "folderCtxMenu_Imp_MboxFilesDirRecursive_Id";

const folderCtxMenu_Imp_EMLFormat_Id = "folderCtxMenu_Imp_EMLFormat_Id";
const folderCtxMenu_Imp_EMLFormatMsgs_Id = "folderCtxMenu_Imp_EMLFormatMsgs_Id";
const folderCtxMenu_Imp_EMLFormatDir_Id = "folderCtxMenu_Imp_EMLFormatDir_Id";
const folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id = "folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id";

const folderCtxMenu_CopyFolderPath_Id = "folderCtxMenu_CopyFolderPath_Id";
const folderCtxMenu_OpenFolderDir_Id = "folderCtxMenu_OpenFolderDir_Id";
const folderCtxMenu_Options_Id = "folderCtxMenu_Options_Id";
const folderCtxMenu_Help_Id = "folderCtxMenu_Help_Id";

var folderCtxMenuSet = [
  {
    menuId: 3,
    menuDef: {
      id: folderCtxMenu_TopId,
      title: "ImportExportTools NG"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_FolderMbox_Id,
      title: "Folder Export (mbox)"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxOnly_Id,
      title: "As mbox File"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxZipped_Id,
      title: "Single Zipped mbox File"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id,
      title: "Structured With Subfolders"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id,
      title: "With Flattened Subfolders"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_RemoteFolderMbox_Id,
      title: "Export Remote Folder"
    }
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep1",
      type: "separator"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_AllMessages_Id,
      title: "Export All Messages In Folder"
    }
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep2",
      type: "separator"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_SearchExport_Id,
      title: "Search And Export Messages"
    }
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep3",
      type: "separator"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Imp_MboxFiles_Id,
      title: "Import mbox Files"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesIndv_Id,
      title: "… Individual mbox Files"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesIndvRecursive_Id,
      title: "… Individual mbox Files (with sbd structure)"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesDir_Id,
      title: "… All mbox Files from directory"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesDirRecursive_Id,
      title: "… All mbox Files from directory (with sbd structure)"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Imp_EMLFormat_Id,
      title: "Import EML Messages"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatMsgs_Id,
      title: "Individual EML Messages"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatDir_Id,
      title: "All EML Messages From A Directory"
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id,
      title: "All EML Messages From A Directory And Subdirectories"
    }
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep4",
      type: "separator"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_CopyFolderPath_Id,
      title: "Copy Folder Path"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_OpenFolderDir_Id,
      title: "Open Folder Directory"
    }
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep5",
      type: "separator"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Options_Id,
      title: "Options",
      onclick: openOptions,
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Help_Id,
      title: "Help",
      onclick: openHelp,
    }
  },
];



await createMenus("", msgCtxMenuSet, { defaultContexts: ["message_list"], defaultOnclick: wextctx_ExportAs });
await createMenus("", toolsCtxMenuSet, { defaultContexts: ["tools_menu"], defaultOnclick: wextctx_toolsMenu });
await createMenus("", folderCtxMenuSet, { defaultContexts: ["folder_pane"], defaultOnclick: wextctx_folderMenu });


async function createMenus(menuType, menuArray, options) {
  var defaultParentId = menuArray[0].menuDef.id;
  for (let index = 0; index < menuArray.length; index++) {
    let menuObj = menuArray[index];
    if (index > 0 && !menuObj.menuDef.parentId) {
      menuObj.menuDef.parentId = defaultParentId;
    }
    if (!menuObj.menuDef.contexts) {
      menuObj.menuDef.contexts = options.defaultContexts;
    }
    if (!menuObj.menuDef.onclick) {
      menuObj.menuDef.onclick = options.defaultOnclick;
    }
    await messenger.menus.create(menuObj.menuDef);

  }

}

// Message Context Menu Handlers


async function wextctx_ExportAs(ctxEvent) {
  console.log(ctxEvent)
  var params = {};
  if (ctxEvent.menuItemId.includes("Atts")) {
    params.saveAtts = true;
  }
  if (ctxEvent.menuItemId.includes("Index")) {
    params.createIndex = true;
  }

  switch (ctxEvent.menuItemId) {
    case ctxMenu_Exp_EMLFormatMsgsOnly_Id:
    case ctxMenu_Exp_EMLFormatCreateIndex_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_EML_Format", params: params });
      break;
    case ctxMenu_Exp_HTMLFormatMsgsOnly_Id:
    case ctxMenu_Exp_HTMLFormatSaveAtts_Id:
    case ctxMenu_Exp_HTMLFormatCreateIndex_Id:
    case ctxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_HTML_Format", params: params });
      break;
    case ctxMenu_Exp_PDFFormat_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PDF_Format", params: params });
      break;
    case ctxMenu_Exp_PlainTextFormatMsgsOnly_Id:
    case ctxMenu_Exp_PlainTextFormatSaveAtts_Id:
    case ctxMenu_Exp_PlainTextFormatCreateIndex_Id:
    case ctxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PlainText_Format", params: params });
      break;
    case ctxMenu_Exp_CSVFormat_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_CSV_Format", params: params });
      break;
    case ctxMenu_Exp_MboxFormatNewMbox_Id:
      params.mboxExpType = "newMbox";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Mbox_Format", params: params });
      break;
    case ctxMenu_Exp_MboxFormatAppendMbox_Id:
      params.mboxExpType = "appendMbox";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Mbox_Format", params: params });
      break;
    case ctxMenu_Exp_IndexHTML_Id:
      params.indexType = "indexHTML";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Index", params: params });
      break;
    case ctxMenu_Exp_IndexCSV_Id:
      params.indexType = "indexCSV";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Index", params: params });
      break;

    default:
      break;
  }

}

async function wextctx_toolsMenu(ctxEvent) {
  var params = {};
  switch (ctxEvent.menuItemId) {
    case toolsCtxMenu_ExpProfileFull_Id:
      params.profileExportType = "full";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Exp_Profile", params: params });
      break;
    case toolsCtxMenu_ExpProfileMailOnly_Id:
      params.profileExportType = "mailOnly";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Exp_Profile", params: params });
      break;
    case toolsCtxMenu_ImpProfile_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Imp_Profile", params: params });
      break;
    case toolsCtxMenu_Backup_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Backup" });
      break;
    default:
      break;
  }
}


async function wextctx_folderMenu(ctxEvent) {
  console.log(ctxEvent);
  var params = {};
  switch (ctxEvent.parentMenuItemId) {
    case folderCtxMenu_TopId:
      switch (ctxEvent.menuItemId) {
        case value:

          break;

        default:
          break;
      }
    case folderCtxMenu_Exp_FolderMbox_Id:
      switch (ctxEvent.menuItemId) {
        case folderCtxMenu_Exp_FolderMboxOnly_Id:
          params.localFolder = true;
          params.zipped = false;
          params.includeSubfolders = false;
          params.flattenSubfolders = false;
          break;
        case folderCtxMenu_Exp_FolderMboxZipped_Id:
          params.localFolder = true;
          params.zipped = true;
          params.includeSubfolders = false;
          params.flattenSubfolders = false;
          break;

        case folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id:
          params.localFolder = true;
          params.zipped = false;
          params.includeSubfolders = true;
          params.flattenSubfolders = false;
          break;
        case folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id:
          params.localFolder = true;
          params.zipped = false;
          params.includeSubfolders = true;
          params.flattenSubfolders = true;
          break;
        default:
          return;

      }
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ExpFolderMboxFormat", params: params });
      return;

    case folderCtxMenu_Imp_MboxFiles_Id:
      switch (ctxEvent.menuItemId) {
        case folderCtxMenu_Imp_MboxFilesIndv_Id:
          params.mboxImpType = "individual";
          params.mboxImpRecursive = false;
          break;
        case folderCtxMenu_Imp_MboxFilesIndvRecursive_Id:
          params.mboxImpType = "individual";
          params.mboxImpRecursive = true;
          break;
        case folderCtxMenu_Imp_MboxFilesDir_Id:
          params.mboxImpType = "directory";
          params.mboxImpRecursive = false;
          break;
        case folderCtxMenu_Imp_MboxFilesDirRecursive_Id:
          params.mboxImpType = "directory";
          params.mboxImpRecursive = true;
          break;
        default:
          return;
      }

      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImpMbox", params: params });
      break;

    default:
      break;
  }
  //messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImportEML" });
}

async function openOptions() {
  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_OpenOptions" });
}

async function openHelp() {
  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_OpenHelp" });
}

