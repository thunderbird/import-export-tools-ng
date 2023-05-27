// wextMenus
// Installs wext context and main menus
// Interface via notifytools to expMenus


// Message context menu
const msgCtxMenu_TopId = "msgCtxMenu_TopId";
const msgCtxMenu_Exp_EMLFormat_Id = "msgCtxMenu_Exp_EMLFormat_Id";
const msgCtxMenu_Exp_HTMLFormat_Id = "msgCtxMenu_Exp_HTMLFormat_Id";
const msgCtxMenu_Exp_PDFFormat_Id = "msgCtxMenu_Exp_PDFFormat_Id";
const msgCtxMenu_Exp_PlainTextFormat_Id = "msgCtxMenu_Exp_PlainTextFormat_Id";
const msgCtxMenu_Exp_CSVFormat_Id = "msgCtxMenu_Exp_CSVFormat_Id";
const msgCtxMenu_Exp_MboxFormat_Id = "msgCtxMenu_Exp_MboxFormat_Id";
const msgCtxMenu_Exp_Index_Id = "msgCtxMenu_Exp_Index_Id";
const msgCtxMenu_CopyToClipboard_Id = "msgCtxMenu_CopyToClipboard_Id";
const msgCtxMenu_Options_Id = "msgCtxMenu_Options_Id";
const msgCtxMenu_Help_Id = "msgCtxMenu_Help_Id";

const msgCtxMenu_Exp_EMLFormatMsgsOnly_Id = "msgCtxMenu_Exp_EMLFormatMsgsOnly_Id";
const msgCtxMenu_Exp_EMLFormatCreateIndex_Id = "msgCtxMenu_Exp_EMLFormatCreateIndex_Id";

const msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id = "msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id";
const msgCtxMenu_Exp_HTMLFormatSaveAtts_Id = "msgCtxMenu_Exp_HTMLFormatSaveAtts_Id";
const msgCtxMenu_Exp_HTMLFormatCreateIndex_Id = "msgCtxMenu_Exp_HTMLFormatCreateIndex_Id";
const msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id = "msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id";


const msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id = "msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id";
const msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id = "msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id";
const msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id = "msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id";
const msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id = "msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id";

const msgCtxMenu_Exp_MboxFormatNewMbox_Id = "msgCtxMenu_Exp_MboxFormatNewMbox_Id";
const msgCtxMenu_Exp_MboxFormatAppendMbox_Id = "msgCtxMenu_Exp_MboxFormatAppendMbox_Id";

const msgCtxMenu_Exp_IndexHTML_Id = "msgCtxMenu_Exp_IndexHTML_Id";
const msgCtxMenu_Exp_IndexCSV_Id = "msgCtxMenu_Exp_IndexCSV_Id";

const msgCtxMenu_CopyToClipboardMessage_Id = "msgCtxMenu_CopyToClipboardMessage_Id";
const msgCtxMenu_CopyToClipboardHeaders_Id = "msgCtxMenu_CopyToClipboardHeaders_Id";



var msgCtxMenuSet = [
  {
    menuId: 1,
    menuDef: {
      id: msgCtxMenu_TopId,
      title: localizeMenuTitle("msgCtxMenu_TopId.title")
    }
  }, {
    menuDef: {
      id: msgCtxMenu_Exp_EMLFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_EMLFormat_Id.title")
    }
  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_HTMLFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormat_Id.title")
    }

  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_PDFFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PDFFormat_Id.title")
    }

  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_PlainTextFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormat_Id.title"),
    }

  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_CSVFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_CSVFormat_Id.title")
    }

  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_MboxFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_MboxFormat_Id.title"),
    }

  },
  {
    menuDef: {
      id: "msgCtxMenu_Exp_Sep1",
      type: "separator"
    }
  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_Index_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_Index_Id.title"),
    }
  },
  {
    menuDef: {
      id: "msgCtxMenu_Exp_Sep2",
      type: "separator"
    }
  },
  {
    menuDef: {
      id: msgCtxMenu_CopyToClipboard_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboard_Id.title"),
    }
  },

  {
    menuDef: {
      id: "msgCtxMenu_Exp_Sep3",
      type: "separator"
    }
  },

  {
    menuDef: {
      id: msgCtxMenu_Options_Id,
      title: localizeMenuTitle("msgCtxMenu_Options_Id.title"),
      onclick: openOptions,
    }

  },
  {
    menuDef: {
      id: msgCtxMenu_Help_Id,
      title: localizeMenuTitle("msgCtxMenu_Help_Id.title"),
      onclick: openHelp,
    }

  },

  {
    menuDef: {
      parentId: msgCtxMenu_Exp_EMLFormat_Id,
      id: msgCtxMenu_Exp_EMLFormatMsgsOnly_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_EMLFormatMsgsOnly_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_EMLFormat_Id,
      id: msgCtxMenu_Exp_EMLFormatCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_EMLFormatCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_HTMLFormat_Id,
      id: msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_HTMLFormat_Id,
      id: msgCtxMenu_Exp_HTMLFormatSaveAtts_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormatSaveAtts_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_HTMLFormat_Id,
      id: msgCtxMenu_Exp_HTMLFormatCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormatCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_HTMLFormat_Id,
      id: msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_PlainTextFormat_Id,
      id: msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_PlainTextFormat_Id,
      id: msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_PlainTextFormat_Id,
      id: msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_PlainTextFormat_Id,
      id: msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_MboxFormat_Id,
      id: msgCtxMenu_Exp_MboxFormatNewMbox_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_MboxFormatNewMbox_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_MboxFormat_Id,
      id: msgCtxMenu_Exp_MboxFormatAppendMbox_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_MboxFormatAppendMbox_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_Index_Id,
      id: msgCtxMenu_Exp_IndexHTML_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_IndexHTML_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_Index_Id,
      id: msgCtxMenu_Exp_IndexCSV_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_IndexCSV_Id.title")
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_CopyToClipboard_Id,
      id: msgCtxMenu_CopyToClipboardMessage_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboardMessage_Id.title"),
      onclick: copyToClipboard
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_CopyToClipboard_Id,
      id: msgCtxMenu_CopyToClipboardHeaders_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboardHeaders_Id.title"),
      onclick: copyToClipboard
    }
  },
];

function localizeMenuTitle(id) {
  return browser.i18n.getMessage(id);
}

const toolsCtxMenu_TopId = "toolsCtxMenu_TopId";
const toolsCtxMenu_Exp_Profile_Id = "toolsCtxMenu_Exp_Profile_Id";
const toolsCtxMenu_Imp_Profile_Id = "toolsCtxMenu_Imp_Profile_Id";
const toolsCtxMenu_Backup_Id = "toolsCtxMenu_Backup_Id";
const toolsCtxMenu_Options_Id = "toolsCtxMenu_Options_Id";
const toolsCtxMenu_Help_Id = "toolsCtxMenu_Help_Id";

const toolsCtxMenu_Exp_ProfileFull_Id = "toolsCtxMenu_Exp_ProfileFull_Id";
const toolsCtxMenu_Exp_ProfileMailOnly_Id = "toolsCtxMenu_Exp_ProfileMailOnly_Id";

/*
(id:\s(\w+),\n\s+title:\s)"[\w\s]+"
$1localizeMenuTitle("$2.title")

*/


var toolsCtxMenuSet = [
  {
    menuId: 2,
    menuDef: {
      id: toolsCtxMenu_TopId,
      title: localizeMenuTitle("toolsCtxMenu_TopId.title")
    }
  },
  {
    menuDef: {
      id: toolsCtxMenu_Exp_Profile_Id,
      title: localizeMenuTitle("toolsCtxMenu_Exp_Profile_Id.title")
    }
  },
  {
    menuDef: {
      id: toolsCtxMenu_Imp_Profile_Id,
      title: localizeMenuTitle("toolsCtxMenu_Imp_Profile_Id.title")
    }
  },
  {
    menuDef: {
      id: toolsCtxMenu_Backup_Id,
      title: localizeMenuTitle("toolsCtxMenu_Backup_Id.title")
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
      title: localizeMenuTitle("toolsCtxMenu_Options_Id.title"),
      onclick: openOptions,
    }

  },
  {
    menuDef: {
      id: toolsCtxMenu_Help_Id,
      title: localizeMenuTitle("toolsCtxMenu_Help_Id.title"),
      onclick: openHelp,
    }

  },
  {
    menuDef: {
      parentId: toolsCtxMenu_Exp_Profile_Id,
      id: toolsCtxMenu_Exp_ProfileFull_Id,
      title: localizeMenuTitle("toolsCtxMenu_Exp_ProfileFull_Id.title")
    }
  },
  {
    menuDef: {
      parentId: toolsCtxMenu_Exp_Profile_Id,
      id: toolsCtxMenu_Exp_ProfileMailOnly_Id,
      title: localizeMenuTitle("toolsCtxMenu_Exp_ProfileMailOnly_Id.title")
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

const folderCtxMenu_Imp_MaildirFiles_Id = "folderCtxMenu_Imp_MaildirFiles_Id";

const folderCtxMenu_Imp_EMLFormat_Id = "folderCtxMenu_Imp_EMLFormat_Id";
const folderCtxMenu_Imp_EMLFormatMsgs_Id = "folderCtxMenu_Imp_EMLFormatMsgs_Id";
const folderCtxMenu_Imp_EMLFormatDir_Id = "folderCtxMenu_Imp_EMLFormatDir_Id";
const folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id = "folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id";

const folderCtxMenu_CopyFolderPath_Id = "folderCtxMenu_CopyFolderPath_Id";
const folderCtxMenu_OpenFolderDir_Id = "folderCtxMenu_OpenFolderDir_Id";
const folderCtxMenu_Options_Id = "folderCtxMenu_Options_Id";
const folderCtxMenu_Help_Id = "folderCtxMenu_Help_Id";


const folderCtxMenu_Exp_EMLFormat_Id = "folderCtxMenu_Exp_EMLFormat_Id";
const folderCtxMenu_Exp_HTMLFormat_Id = "folderCtxMenu_Exp_HTMLFormat_Id";
const folderCtxMenu_Exp_PDFFormat_Id = "folderCtxMenu_Exp_PDFFormat_Id";
const folderCtxMenu_Exp_PlainTextFormat_Id = "folderCtxMenu_Exp_PlainTextFormat_Id";
const folderCtxMenu_Exp_CSVFormat_Id = "folderCtxMenu_Exp_CSVFormat_Id";
const folderCtxMenu_Exp_MboxFormat_Id = "folderCtxMenu_Exp_MboxFormat_Id";
const folderCtxMenu_Exp_Index_Id = "folderCtxMenu_Exp_Index_Id";
const folderCtxMenu_Exp_Options_Id = "folderCtxMenu_Exp_Options_Id";
const folderCtxMenu_Exp_Help_Id = "folderCtxMenu_Exp_Help_Id";

const folderCtxMenu_Exp_EMLFormatMsgsOnly_Id = "folderCtxMenu_Exp_EMLFormatMsgsOnly_Id";
const folderCtxMenu_Exp_EMLFormatCreateIndex_Id = "folderCtxMenu_Exp_EMLFormatCreateIndex_Id";

const folderCtxMenu_Exp_HTMLFormatMsgsOnly_Id = "folderCtxMenu_Exp_HTMLFormatMsgsOnly_Id";
const folderCtxMenu_Exp_HTMLFormatSaveAtts_Id = "folderCtxMenu_Exp_HTMLFormatSaveAtts_Id";
const folderCtxMenu_Exp_HTMLFormatCreateIndex_Id = "folderCtxMenu_Exp_HTMLFormatCreateIndex_Id";
const folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id = "folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id";


const folderCtxMenu_Exp_PlainTextFormatMsgsOnly_Id = "folderCtxMenu_Exp_PlainTextFormatMsgsOnly_Id";
const folderCtxMenu_Exp_PlainTextFormatSaveAtts_Id = "folderCtxMenu_Exp_PlainTextFormatSaveAtts_Id";
const folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id = "folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id";
const folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id = "folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id";
const folderCtxMenu_Exp_PlainTextFormatSingleFile_Id = "folderCtxMenu_Exp_PlainTextFormatSingleFile_Id";
const folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id = "folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id";
const folderCtxMenu_Exp_IndexHTML_Id = "folderCtxMenu_Exp_IndexHTML_Id";
const folderCtxMenu_Exp_IndexCSV_Id = "folderCtxMenu_Exp_IndexCSV_Id";


var folderCtxMenuSet = [
  {
    menuId: 3,
    menuDef: {
      id: folderCtxMenu_TopId,
      title: localizeMenuTitle("folderCtxMenu_TopId.title")
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_FolderMbox_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMbox_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxOnly_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMboxOnly_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxZipped_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMboxZipped_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id.title")
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_RemoteFolderMbox_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_RemoteFolderMbox_Id.title")
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
      title: localizeMenuTitle("folderCtxMenu_Exp_AllMessages_Id.title")
    }
  },

  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_EMLFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_EMLFormat_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_HTMLFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_HTMLFormat_Id.title")
    }

  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_PDFFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PDFFormat_Id.title")
    }

  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_PlainTextFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormat_Id.title"),
    }

  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_CSVFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_CSVFormat_Id.title"),
    }

  },


  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: "folderCtxMenu_Exp_Sep2",
      type: "separator"
    }

  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_Index_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_Index_Id.title"),
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
      id: folderCtxMenu_Exp_SearchExport_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_SearchExport_Id.title")
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
      id: folderCtxMenu_Imp_MboxFiles_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFiles_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesIndv_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFilesIndv_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesIndvRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFilesIndvRecursive_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesDir_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFilesDir_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesDirRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFilesDirRecursive_Id.title")
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Imp_MaildirFiles_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MaildirFiles_Id.title"),
      onclick: importMaildirFiles
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Imp_EMLFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_EMLFormat_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatMsgs_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_EMLFormatMsgs_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatDir_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_EMLFormatDir_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id.title")
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
      id: folderCtxMenu_CopyFolderPath_Id,
      title: localizeMenuTitle("folderCtxMenu_CopyFolderPath_Id.title")
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_OpenFolderDir_Id,
      title: localizeMenuTitle("folderCtxMenu_OpenFolderDir_Id.title")
    }
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep6",
      type: "separator"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Options_Id,
      title: localizeMenuTitle("folderCtxMenu_Options_Id.title"),
      onclick: openOptions,
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Help_Id,
      title: localizeMenuTitle("folderCtxMenu_Help_Id.title"),
      onclick: openHelp,
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_EMLFormat_Id,
      id: folderCtxMenu_Exp_EMLFormatCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_EMLFormatCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: folderCtxMenu_Exp_HTMLFormatCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id.title")
    }
  },

  
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatSingleFile_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatSingleFile_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id.title")
    }
  },

  {
    menuDef: {
      parentId: folderCtxMenu_Exp_Index_Id,
      id: folderCtxMenu_Exp_IndexHTML_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_IndexHTML_Id.title")
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_Index_Id,
      id: folderCtxMenu_Exp_IndexCSV_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_IndexCSV_Id.title")
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

await createtitles("folderCtxMenu", folderCtxMenuSet, null);
//await editMenus("", toolsCtxMenuSet, null);


async function createtitles(name, menuArray, options) {
  console.log("start")
  var defaultParentId = menuArray[0].menuDef.id;
  var titleArray = [];
  for (let index = 0; index < menuArray.length; index++) {
    let menuObj = menuArray[index];
    
    if (menuObj.menuDef.type) {
      continue;
    }
    let titleObj = {key: menuObj.menuDef.id + ".title", text: menuObj.menuDef.title}
    titleArray.push(titleObj);
  }
  console.log(titleArray)
  let basePath = "C:\\Dev\\Thunderbird";
  let path = basePath + "\\" + name +".json";
  let params = {path: path, obj: titleArray};
  console.log(params)
  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_SaveJSON", params: params });
  console.log("done")
}

async function editMenus(menuType, menuArray, options) {
  console.log("start")
  var defaultParentId = menuArray[0].menuDef.id;
  var newArray = [];
  for (let index = 0; index < menuArray.length; index++) {
    let menuObj = menuArray[index];
    let titleObj = {key: menuObj.menuDef.id + ".title", value: menuObj.menuDef.title}
    let title = menuObj.title;
    //title = 
    newArray.push(menuObj);
  }
  console.log(newArray)
  let params = {path: "C:\\Dev\\Thunderbird\\tools2.json", obj: newArray};

  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_SaveJSON", params: params });
  console.log("done")
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
    case msgCtxMenu_Exp_EMLFormatMsgsOnly_Id:
    case msgCtxMenu_Exp_EMLFormatCreateIndex_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_EML_Format", params: params });
      break;
    case msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id:
    case msgCtxMenu_Exp_HTMLFormatSaveAtts_Id:
    case msgCtxMenu_Exp_HTMLFormatCreateIndex_Id:
    case msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_HTML_Format", params: params });
      break;
    case msgCtxMenu_Exp_PDFFormat_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PDF_Format", params: params });
      break;
    case msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id:
    case msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id:
    case msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id:
    case msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PlainText_Format", params: params });
      break;
    case msgCtxMenu_Exp_CSVFormat_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_CSV_Format", params: params });
      break;
    case msgCtxMenu_Exp_MboxFormatNewMbox_Id:
      params.mboxExpType = "newMbox";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Mbox_Format", params: params });
      break;
    case msgCtxMenu_Exp_MboxFormatAppendMbox_Id:
      params.mboxExpType = "appendMbox";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Mbox_Format", params: params });
      break;
    case msgCtxMenu_Exp_IndexHTML_Id:
      params.indexType = "indexHTML";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Index", params: params });
      break;
    case msgCtxMenu_Exp_IndexCSV_Id:
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
    case toolsCtxMenu_Exp_ProfileFull_Id:
      params.profileExportType = "full";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Exp_Profile", params: params });
      break;
    case toolsCtxMenu_Exp_ProfileMailOnly_Id:
      params.profileExportType = "mailOnly";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Exp_Profile", params: params });
      break;
    case toolsCtxMenu_Imp_Profile_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Imp_Profile", params: params });
      break;
    case toolsCtxMenu_Backup_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Backup" });
      break;
    default:
      break;
  }
}

// messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_", params: params });

async function wextctx_folderMenu(ctxEvent) {
  console.log(ctxEvent);
  var params = {};
  switch (ctxEvent.parentMenuItemId) {
    case folderCtxMenu_TopId:
      switch (ctxEvent.menuItemId) {
        case folderCtxMenu_Exp_RemoteFolderMbox_Id:
          console.log("rem")
          params.localFolder = false;
          params.zipped = false;
          params.includeSubfolders = false;
          params.flattenSubfolders = false;
          messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ExpFolderRemote", params: params });
          break;
        case folderCtxMenu_Exp_SearchExport_Id:
          messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ExpSearch", params: params });
          break;
        case folderCtxMenu_CopyFolderPath_Id:
          messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_CopyFolderPath", params: params });
          break;
        case folderCtxMenu_OpenFolderDir_Id:
          messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_OpenFolderDir", params: params });
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

  console.log("sw men")
  if (ctxEvent.menuItemId.includes("Atts")) {
    params.saveAtts = true;
  }
  if (ctxEvent.menuItemId.includes("Index")) {
    params.createIndex = true;
  }
  if (ctxEvent.menuItemId.includes("SingleFile")) {
    params.singleFile = true;
  }

  console.log(params)
  switch (ctxEvent.menuItemId) {
    case folderCtxMenu_Exp_EMLFormatMsgsOnly_Id:
    case folderCtxMenu_Exp_EMLFormatCreateIndex_Id:
      console.log("exp eml")
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_EML_Format", params: params });
      break;
    case folderCtxMenu_Exp_HTMLFormatMsgsOnly_Id:
    case folderCtxMenu_Exp_HTMLFormatSaveAtts_Id:
    case folderCtxMenu_Exp_HTMLFormatCreateIndex_Id:
    case folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_HTML_Format", params: params });
      break;
    case folderCtxMenu_Exp_PDFFormat_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_PDF_Format", params: params });
      break;
    case folderCtxMenu_Exp_PlainTextFormatMsgsOnly_Id:
    case folderCtxMenu_Exp_PlainTextFormatSaveAtts_Id:
    case folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id:
    case folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id:
    case folderCtxMenu_Exp_PlainTextFormatSingleFile_Id:
    case folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_PlainText_Format", params: params });
      break;
    case folderCtxMenu_Exp_CSVFormat_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_CSV_Format", params: params });
      break;

    case folderCtxMenu_Exp_IndexHTML_Id:
      params.indexType = "indexHTML";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_Index", params: params });
      break;
    case folderCtxMenu_Exp_IndexCSV_Id:
      params.indexType = "indexCSV";
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_Index", params: params });
      break;

    default:
      break;
  }


}

async function copyToClipboard(ctxEvent) {
  let params = {};
  if (ctxEvent.menuItemId == msgCtxMenu_CopyToClipboardMessage_Id) {
    params.clipboardType = "Message";
  } else {
    params.clipboardType = "Headers";
  }
  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_CopyToClipboard", params: params });
}

async function importMaildirFiles() {
  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImpMaildirFiles" });
}

async function openOptions() {
  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_OpenOptions" });
}

async function openHelp() {
  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_OpenHelp" });
}

