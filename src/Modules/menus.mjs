/*
  ImportExportTools NG is a extension for Thunderbird mail client
  providing import and export tools for messages and folders.
  The extension authors:
    Copyright (C) 2025 : Christopher Leidigh, The Thunderbird Team

  ImportExportTools NG is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// wextMenus
// Installs wext context and main menus
// Interface via notifytools to expMenuDispatcher

import * as miscCmds from "/Modules/miscCmds.mjs";
import * as exportCmds from "/Modules/exportCmds.mjs";



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
      title: localizeMenuTitle("msgCtxMenu_TopId.title"),
    },
  }, {
    menuDef: {
      id: msgCtxMenu_Exp_EMLFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_EMLFormat_Id.title"),
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_HTMLFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormat_Id.title"),
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_PDFFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PDFFormat_Id.title"),
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_PlainTextFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormat_Id.title"),
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_CSVFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_CSVFormat_Id.title"),
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_MboxFormat_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_MboxFormat_Id.title"),
    },
  },
  {
    menuDef: {
      id: "msgCtxMenu_Exp_Sep1",
      type: "separator",
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_Exp_Index_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_Index_Id.title"),
    },
  },
  {
    menuDef: {
      id: "msgCtxMenu_Exp_Sep2",
      type: "separator",
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_CopyToClipboard_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboard_Id.title"),
    },
  },
  {
    menuDef: {
      id: "msgCtxMenu_Exp_Sep3",
      type: "separator",
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_Options_Id,
      title: localizeMenuTitle("ctxMenu_Options.title"),
      onclick: miscCmds.openOptions,
    },
  },
  {
    menuDef: {
      id: msgCtxMenu_Help_Id,
      title: localizeMenuTitle("ctxMenu_Help.title"),
      onclick: miscCmds.openHelp,
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_EMLFormat_Id,
      id: msgCtxMenu_Exp_EMLFormatMsgsOnly_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_EMLFormatMsgsOnly_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_EMLFormat_Id,
      id: msgCtxMenu_Exp_EMLFormatCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_EMLFormatCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_HTMLFormat_Id,
      id: msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_HTMLFormat_Id,
      id: msgCtxMenu_Exp_HTMLFormatSaveAtts_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormatSaveAtts_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_HTMLFormat_Id,
      id: msgCtxMenu_Exp_HTMLFormatCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormatCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_HTMLFormat_Id,
      id: msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_PlainTextFormat_Id,
      id: msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_PlainTextFormat_Id,
      id: msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_PlainTextFormat_Id,
      id: msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_PlainTextFormat_Id,
      id: msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_MboxFormat_Id,
      id: msgCtxMenu_Exp_MboxFormatNewMbox_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_MboxFormatNewMbox_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_MboxFormat_Id,
      id: msgCtxMenu_Exp_MboxFormatAppendMbox_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_MboxFormatAppendMbox_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_Index_Id,
      id: msgCtxMenu_Exp_IndexHTML_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_IndexHTML_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_Exp_Index_Id,
      id: msgCtxMenu_Exp_IndexCSV_Id,
      title: localizeMenuTitle("msgCtxMenu_Exp_IndexCSV_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgCtxMenu_CopyToClipboard_Id,
      id: msgCtxMenu_CopyToClipboardMessage_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboardMessage_Id.title"),
      onclick: menuFunctionDispatcher
    },
    dispatchOptions: {
      dispatchFunction: miscCmds.copyToClipboard,
      functionParams: { clipboardType: "Message", ctx: "msgCtx" }
    }
  },
  {
    menuDef: {
      parentId: msgCtxMenu_CopyToClipboard_Id,
      id: msgCtxMenu_CopyToClipboardHeaders_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboardHeaders_Id.title"),
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: miscCmds.copyToClipboard,
      functionParams: { clipboardType: "Headers", ctx: "msgCtx" }
    }
  },
];


// Menubar Tools menu

const toolsCtxMenu_TopId = "toolsCtxMenu_TopId";
const toolsCtxMenu_Exp_Profile_Id = "toolsCtxMenu_Exp_Profile_Id";
const toolsCtxMenu_Imp_Profile_Id = "toolsCtxMenu_Imp_Profile_Id";
const toolsCtxMenu_Backup_Id = "toolsCtxMenu_Backup_Id";
const toolsCtxMenu_Options_Id = "toolsCtxMenu_Options_Id";
const toolsCtxMenu_Help_Id = "toolsCtxMenu_Help_Id";

const toolsCtxMenu_Exp_ProfileFull_Id = "toolsCtxMenu_Exp_ProfileFull_Id";
const toolsCtxMenu_Exp_ProfileMailOnly_Id = "toolsCtxMenu_Exp_ProfileMailOnly_Id";

var toolsCtxMenuSet = [
  {
    menuId: 2,
    menuDef: {
      id: toolsCtxMenu_TopId,
      title: localizeMenuTitle("ctxMenu_ExtensionName.title"),
    },
  },
  {
    menuDef: {
      id: toolsCtxMenu_Exp_Profile_Id,
      title: localizeMenuTitle("toolsCtxMenu_Exp_Profile_Id.title"),
    },
  },
  {
    menuDef: {
      id: toolsCtxMenu_Imp_Profile_Id,
      title: localizeMenuTitle("toolsCtxMenu_Imp_Profile_Id.title"),
    },
  },
  {
    menuDef: {
      id: toolsCtxMenu_Backup_Id,
      title: localizeMenuTitle("toolsCtxMenu_Backup_Id.title"),
    },
  },
  {
    menuDef: {
      id: "toolsCtxMenu_Exp_Sep1",
      type: "separator",
    },

  },
  {
    menuDef: {
      id: toolsCtxMenu_Options_Id,
      title: localizeMenuTitle("ctxMenu_Options.title"),
      onclick: miscCmds.openOptions,
    },

  },
  {
    menuDef: {
      id: toolsCtxMenu_Help_Id,
      title: localizeMenuTitle("ctxMenu_Help.title"),
      onclick: miscCmds.openHelp,
    },

  },
  {
    menuDef: {
      parentId: toolsCtxMenu_Exp_Profile_Id,
      id: toolsCtxMenu_Exp_ProfileFull_Id,
      title: localizeMenuTitle("toolsCtxMenu_Exp_ProfileFull_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: toolsCtxMenu_Exp_Profile_Id,
      id: toolsCtxMenu_Exp_ProfileMailOnly_Id,
      title: localizeMenuTitle("toolsCtxMenu_Exp_ProfileMailOnly_Id.title"),
    },
  },
];

// Folder context menu

const folderCtxMenu_TopId = "folderCtxMenu_TopId";

const folderCtxMenu_Exp_Account_Id = "folderCtxMenu_Exp_Account_Id";

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
const folderCtxMenu_Exp_EMLFormatCreateIndexRecursive_Id = "folderCtxMenu_Exp_EMLFormatCreateIndexRecursive_Id";

const folderCtxMenu_Exp_HTMLFormatMsgsOnly_Id = "folderCtxMenu_Exp_HTMLFormatMsgsOnly_Id";
const folderCtxMenu_Exp_HTMLFormatSaveAtts_Id = "folderCtxMenu_Exp_HTMLFormatSaveAtts_Id";
const folderCtxMenu_Exp_HTMLFormatCreateIndex_Id = "folderCtxMenu_Exp_HTMLFormatCreateIndex_Id";
const folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id = "folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id";
const folderCtxMenu_Exp_HTMLFormatCreateIndexRecursive_Id = "folderCtxMenu_Exp_HTMLFormatCreateIndexRecursive_Id";
const folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndexRecursive_Id = "folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndexRecursive_Id";

const folderCtxMenu_Exp_PDFFormatCreateIndex_Id = "folderCtxMenu_Exp_PDFFormatCreateIndex_Id";
const folderCtxMenu_Exp_PDFFormatSaveAttsCreateIndex_Id = "folderCtxMenu_Exp_PDFFormatSaveAttsCreateIndex_Id";

const folderCtxMenu_Exp_PDFFormatCreateIndexRecursive_Id = "folderCtxMenu_Exp_PDFFormatCreateIndexRecursive_Id";


const folderCtxMenu_Exp_PlainTextFormatMsgsOnly_Id = "folderCtxMenu_Exp_PlainTextFormatMsgsOnly_Id";
const folderCtxMenu_Exp_PlainTextFormatSaveAtts_Id = "folderCtxMenu_Exp_PlainTextFormatSaveAtts_Id";
const folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id = "folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id";
const folderCtxMenu_Exp_PlainTextFormatCreateIndexRecursive_Id = "folderCtxMenu_Exp_PlainTextFormatCreateIndexRecursive_Id";
const folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndexRecursive_Id = "folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndexRecursive_Id";

const folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id = "folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id";
const folderCtxMenu_Exp_PlainTextFormatSingleFile_Id = "folderCtxMenu_Exp_PlainTextFormatSingleFile_Id";
const folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id = "folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id";
const folderCtxMenu_Exp_IndexHTML_Id = "folderCtxMenu_Exp_IndexHTML_Id";
const folderCtxMenu_Exp_IndexCSV_Id = "folderCtxMenu_Exp_IndexCSV_Id";
const folderCtxMenu_InvalidSelection_Id = "folderCtxMenu_InvalidSelection";

var folderCtxMenuSet = [
  {
    menuId: 3,
    menuDef: {
      id: folderCtxMenu_TopId,
      title: localizeMenuTitle("ctxMenu_ExtensionName.title"),
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_InvalidSelection_Id,
      title: localizeMenuTitle("invalidFolderSelection"),
      visible: false,
      onclick: invalidSelection,
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_Account_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_Account_Id.title"),
      visible: false,
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_FolderMbox_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMbox_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxOnly_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMboxOnly_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxZipped_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMboxZipped_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_FolderMbox_Id,
      id: folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id.title"),
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_RemoteFolderMbox_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_RemoteFolderMbox_Id.title"),
      visible: false,
    },
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep1",
      type: "separator",
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_AllMessages_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_AllMessages_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_EMLFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_EMLFormat_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_HTMLFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_HTMLFormat_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_PDFFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PDFFormat_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_PlainTextFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormat_Id.title"),
    },

  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_CSVFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_CSVFormat_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: "folderCtxMenu_Exp_Sep2",
      type: "separator",
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_AllMessages_Id,
      id: folderCtxMenu_Exp_Index_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_Index_Id.title"),
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Exp_SearchExport_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_SearchExport_Id.title"),
    },
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep4",
      type: "separator",
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Imp_MboxFiles_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFiles_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesIndv_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFilesIndv_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesIndvRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFilesIndvRecursive_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesDir_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFilesDir_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_MboxFiles_Id,
      id: folderCtxMenu_Imp_MboxFilesDirRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MboxFilesDirRecursive_Id.title"),
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Imp_MaildirFiles_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_MaildirFiles_Id.title"),
      onclick: miscCmds.importMaildirFiles,
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Imp_EMLFormat_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_EMLFormat_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatMsgs_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_EMLFormatMsgs_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatDir_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_EMLFormatDir_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Imp_EMLFormat_Id,
      id: folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id,
      title: localizeMenuTitle("folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id.title"),
    },
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep5",
      type: "separator",
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_CopyFolderPath_Id,
      title: localizeMenuTitle("folderCtxMenu_CopyFolderPath_Id.title"),
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_OpenFolderDir_Id,
      title: localizeMenuTitle("folderCtxMenu_OpenFolderDir_Id.title"),
    },
  },
  {
    menuDef: {
      id: "folderCtxMenu_Sep6",
      type: "separator",
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Options_Id,
      title: localizeMenuTitle("ctxMenu_Options.title"),
      onclick: miscCmds.openOptions,
    },
  },
  {
    menuDef: {
      id: folderCtxMenu_Help_Id,
      title: localizeMenuTitle("ctxMenu_Help.title"),
      onclick: miscCmds.openHelp,
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_EMLFormat_Id,
      id: "folderCtxMenu_EML_newexp",
      title: "(New) " + localizeMenuTitle("folderCtxMenu_Exp_EMLFormatCreateIndex_Id.title"),
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: exportCmds.exportFolders,
      functionParams: { expType: "eml", saveAttachments: "none", index: false }
    }
  },

  {
    menuDef: {
      parentId: folderCtxMenu_Exp_EMLFormat_Id,
      id: folderCtxMenu_Exp_EMLFormatCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_EMLFormatCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_EMLFormat_Id,
      id: folderCtxMenu_Exp_EMLFormatCreateIndexRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_EMLFormatCreateIndexRecursive_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: "folderCtxMenu_HTML_newexp",
      title: "(New) " + localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatCreateIndex_Id.title"),
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: exportCmds.exportFolders,
      functionParams: { expType: "html", saveAttachments: "none", index: false }
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: "folderCtxMenu_HTML_atts_newexp",
      title: "(New) " + localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id.title"),    
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: exportCmds.exportFolders,
      functionParams: { expType: "html", saveAttachments: "all", index: false }
    }
  },

  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: "folderCtxMenu_HTML_subfolders_newexp",
      title: "(New) " + localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatCreateIndexRecursive_Id.title"),    
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: exportCmds.exportFolders,
      functionParams: { expType: "html", saveAttachments: "all", index: false, subFolders: true }
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: folderCtxMenu_Exp_HTMLFormatCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: folderCtxMenu_Exp_HTMLFormatCreateIndexRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatCreateIndexRecursive_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_HTMLFormat_Id,
      id: folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndexRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndexRecursive_Id.title"),

    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PDFFormat_Id,
      id: "folderCtxMenu_PDF_newexp",
      title: "(New) " + localizeMenuTitle("folderCtxMenu_Exp_PDFFormatCreateIndex_Id.title"),
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: exportCmds.exportFolders,
      functionParams: { expType: "pdf", saveAttachments: "none", index: false }
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PDFFormat_Id,
      id: "folderCtxMenu_PDF_atts_newexp",
      title: "(new) " + localizeMenuTitle("folderCtxMenu_Exp_PDFFormatSaveAttsCreateIndex_Id.title"),
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: exportCmds.exportFolders,
      functionParams: { expType: "pdf", saveAttachments: "all", index: false }
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PDFFormat_Id,
      id: folderCtxMenu_Exp_PDFFormatCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PDFFormatCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PDFFormat_Id,
      id: folderCtxMenu_Exp_PDFFormatCreateIndexRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PDFFormatCreateIndexRecursive_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: "folderCtxMenu_Plaintext_newexp",
      title: "(New) " + localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id.title"),
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: exportCmds.exportFolders,
      functionParams: { expType: "plaintext", saveAttachments: "none", index: true }
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: "folderCtxMenu_Plaintext_atts_newexp",
      title: "(New) " + localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id.title"),
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: exportCmds.exportFolders,
      functionParams: { expType: "plaintext", saveAttachments: "all", index: false }
    }
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatCreateIndexRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatCreateIndexRecursive_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndexRecursive_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndexRecursive_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatSingleFile_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatSingleFile_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_PlainTextFormat_Id,
      id: folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_Index_Id,
      id: folderCtxMenu_Exp_IndexHTML_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_IndexHTML_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: folderCtxMenu_Exp_Index_Id,
      id: folderCtxMenu_Exp_IndexCSV_Id,
      title: localizeMenuTitle("folderCtxMenu_Exp_IndexCSV_Id.title"),
    },
  },
];


// attachments menu
const attCtxMenu_Top_Id = "attCtxMenu_Top_Id";

// messageDisplay copyToClipboard menu
const msgDisplayCtxMenu_Top_Id = "msgDisplayCtxMenu_Top_Id";
const msgDisplayCtxMenu_CopyToClipboardMessage_Id = "msgDisplayCtxMenu_CopyToClipboardMessage_Id";
const msgDisplayCtxMenu_CopyToClipboardHeaders_Id = "msgDisplayCtxMenu_CopyToClipboardHeaders_Id";

var msgDisplayCtxMenuSet = [
  {
    menuDef: {
      id: msgDisplayCtxMenu_Top_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboard_Id.title"),
    },
  },
  {
    menuDef: {
      parentId: msgDisplayCtxMenu_Top_Id,
      id: msgDisplayCtxMenu_CopyToClipboardMessage_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboardMessage_Id.title"),
      onclick: menuFunctionDispatcher,
    },
    dispatchOptions: {
      dispatchFunction: miscCmds.copyToClipboard,
      functionParams: { clipboardType: "Message", ctx: "msgDisplayCtx" }
    }
  },
  {
    menuDef: {
      parentId: msgDisplayCtxMenu_Top_Id,
      id: msgDisplayCtxMenu_CopyToClipboardHeaders_Id,
      title: localizeMenuTitle("msgCtxMenu_CopyToClipboardHeaders_Id.title"),
      onclick: menuFunctionDispatcher,
    }, dispatchOptions: {
      dispatchFunction: miscCmds.copyToClipboard,
      functionParams: { clipboardType: "Headers", ctx: "msgDisplayCtx" }
    }
  },
];

// Create all menus
await createMenus("", msgCtxMenuSet, { defaultContexts: ["message_list", "page"], defaultOnclick: wextctx_ExportAs });
await createMenus("", toolsCtxMenuSet, { defaultContexts: ["tools_menu"], defaultOnclick: wextctx_toolsMenu });
await createMenus("", folderCtxMenuSet, { defaultContexts: ["folder_pane"], defaultOnclick: wextctx_folderMenu });
await messenger.menus.create({
  id: "attCtxMenu_Top_Id", title: localizeMenuTitle("attCtxMenu_Top_Id.title"),
  contexts: ["message_attachments"], onclick: miscCmds.importEmlAttToFolder, visible: false
});


// Helper for creating menus efficiently
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

async function menuFunctionDispatcher(ctxEvent, tab) {
  try {
  let menu;
  if (ctxEvent.menuItemId.startsWith("folderCtxMenu")) {
    menu = folderCtxMenuSet;
  } else if (ctxEvent.menuItemId.startsWith("msgCtxMenu")) {
    menu = msgCtxMenuSet;
  } else if (ctxEvent.menuItemId.startsWith("msgDisplayCtxMenu")) {
    menu = msgDisplayCtxMenuSet;
  }
  let menuOptions = getMenuFunctionOptions(menu, ctxEvent.menuItemId);
  menuOptions.dispatchFunction(ctxEvent, tab, menuOptions.functionParams);
} catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("error.msg"), ex);

}
}

function getMenuFunctionOptions(menu, menuId) {
  let menuItem = menu.find(menuObj => {
    if (menuObj.menuDef.id == menuId) {
      return true;
    }
  });
  return menuItem.dispatchOptions;
}

// Message Context Menu Handlers

async function wextctx_ExportAs(ctxEvent, tab) {
  // console.log(ctxEvent, tab);

  var params = {};
  params.targetWinId = tab.windowId;
  params.tabType = tab.type;

  var rv;

  // we need the accountId and path of the folder to get
  // the actual selected folder in legacy side
  // we don't get these in the messageDisplay so have to
  // get indirectly from messageDisplay

  try {

    if (!ctxEvent.pageUrl) {

      params.selectedFolder = ctxEvent.displayedFolder;
      params.selectedAccount = ctxEvent.selectedAccount;
      params.selectedMessages = ctxEvent.selectedMessages;

    } else {
      let msg = (await messenger.messageDisplay.getDisplayedMessage(tab.id));
      params.selectedMessages = { id: 0, messages: [msg] };
      params.selectedFolder = msg.folder;
    }

    if (ctxEvent.menuItemId.includes("MsgsOnly")) {
      params.msgsOnly = true;
    }
    if (ctxEvent.menuItemId.includes("Atts")) {
      params.saveAtts = true;
    }
    if (ctxEvent.menuItemId.includes("Index")) {
      params.createIndex = true;
    }

    switch (ctxEvent.menuItemId) {
      case msgCtxMenu_Exp_EMLFormatMsgsOnly_Id:
      case msgCtxMenu_Exp_EMLFormatCreateIndex_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_EML_Format", params: params });
        break;
      case msgCtxMenu_Exp_HTMLFormatMsgsOnly_Id:
      case msgCtxMenu_Exp_HTMLFormatSaveAtts_Id:
      case msgCtxMenu_Exp_HTMLFormatCreateIndex_Id:
      case msgCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_HTML_Format", params: params });
        break;
      case msgCtxMenu_Exp_PDFFormat_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PDF_Format", params: params });
        break;
      case msgCtxMenu_Exp_PlainTextFormatMsgsOnly_Id:
      case msgCtxMenu_Exp_PlainTextFormatSaveAtts_Id:
      case msgCtxMenu_Exp_PlainTextFormatCreateIndex_Id:
      case msgCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PlainText_Format", params: params });
        break;
      case msgCtxMenu_Exp_CSVFormat_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_CSV_Format", params: params });
        break;
      case msgCtxMenu_Exp_MboxFormatNewMbox_Id:
        params.mboxExpType = "newMbox";
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Mbox_Format", params: params });
        break;
      case msgCtxMenu_Exp_MboxFormatAppendMbox_Id:
        params.mboxExpType = "appendMbox";
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Mbox_Format", params: params });
        break;
      case msgCtxMenu_Exp_IndexHTML_Id:
        params.indexType = "indexHTML";
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Index", params: params });
        break;
      case msgCtxMenu_Exp_IndexCSV_Id:
        params.indexType = "indexCSV";
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Index", params: params });
        break;

      default:
        break;
    }
  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("Error.msg"), `${ex}\n\n${ex.stack}`);

  }
}


async function wextctx_toolsMenu(ctxEvent, tab) {
  var params = {};
  params.targetWinId = tab.windowId;

  switch (ctxEvent.menuItemId) {
    case toolsCtxMenu_Exp_ProfileFull_Id:
      params.profileExportType = "full";
      rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Exp_Profile", params: params });
      break;
    case toolsCtxMenu_Exp_ProfileMailOnly_Id:
      params.profileExportType = "mailOnly";
      rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Exp_Profile", params: params });
      break;
    case toolsCtxMenu_Imp_Profile_Id:
      rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Imp_Profile", params: params });
      break;
    case toolsCtxMenu_Backup_Id:
      rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Backup", params: params });
      break;
    default:
      break;
  }
}

async function wextctx_folderMenu(ctxEvent, tab) {
  //console.log(ctxEvent, tab);

  var params = {};
  params.targetWinId = tab.windowId;
  var selectedFolders;
  if (ctxEvent.selectedFolders) {
    selectedFolders = ctxEvent.selectedFolders;
  } else if (ctxEvent.selectedFolder) {
    selectedFolders = [ctxEvent.selectedFolder];
  } else if (ctxEvent.selectedAccount) {
    selectedFolders = "/";
  } else {
    return;
  }

  if ((ctxEvent.menuItemId.includes("Recursive") ||
    ctxEvent.menuItemId.includes("SubFolders")) &&
    selectedFolders.length > 1) {
    let prunedFolders = selectedFolders;
    selectedFolders.forEach(folder => {
      prunedFolders = prunedFolders.filter(pfolder => pfolder == folder || !pfolder.path.startsWith(folder.path))
    });
    selectedFolders = prunedFolders;
  }

  var rv;

  for (const [index, folder] of selectedFolders.entries()) {

    params.selectedFolder = folder;
    if (index == 0) {
      params.warnings = true;
      params.fileDialog = true;
      params.exportFolderPath = "";
    } else {
      params.warnings = false;
      params.fileDialog = false;
    }

    // we need the accountId and path of the folder to get
    // the actual selected folder in legacy side
    if (!params.selectedFolder) {
      params.selectedFolder = {};
      params.selectedFolder.path = "/";
    }

    params.selectedAccount = ctxEvent.selectedAccount;
    if (!params.selectedAccount) {
      params.selectedAccount = {};
      params.selectedAccount.id = params.selectedFolder.accountId;
    }

    switch (ctxEvent.parentMenuItemId) {
      case folderCtxMenu_TopId:
        switch (ctxEvent.menuItemId) {
          case folderCtxMenu_Exp_Account_Id:
            params.localFolder = true;
            params.zipped = false;
            params.includeSubfolders = false;
            params.flattenSubfolders = false;
            rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ExpFolderMboxFormat", params: params });
            return;
          case folderCtxMenu_Exp_RemoteFolderMbox_Id:
            params.localFolder = false;
            params.zipped = false;
            params.includeSubfolders = false;
            params.flattenSubfolders = false;
            rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ExpFolderRemote", params: params });
            break;
          case folderCtxMenu_Exp_SearchExport_Id:
            rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ExpSearch", params: params });
            return;
          case folderCtxMenu_CopyFolderPath_Id:
            rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_CopyFolderPath", params: params });
            return;
          case folderCtxMenu_OpenFolderDir_Id:
            rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_OpenFolderDir", params: params });
            return;
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
            break;
        }

        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ExpFolderMboxFormat", params: params });
        break;
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

        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImpMbox", params: params });
        break;
      case folderCtxMenu_Imp_EMLFormat_Id:
        switch (ctxEvent.menuItemId) {
          case folderCtxMenu_Imp_EMLFormatMsgs_Id:
            params.emlImpType = "individual";
            rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImpEML", params: params });
            break;
          case folderCtxMenu_Imp_EMLFormatDir_Id:
            params.emlImpType = "directory";
            params.emlImpRecursive = false;
            rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImpEMLAll", params: params });
            break;
          case folderCtxMenu_Imp_EMLFormatDirAndSubdir_Id:
            params.emlImpType = "directory";
            params.emlImpRecursive = true;
            rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImpEMLAll", params: params });
            break;
        }
      default:
        break;
    }

    if (ctxEvent.menuItemId.includes("Atts")) {
      params.saveAtts = true;
    }
    if (ctxEvent.menuItemId.includes("Index")) {
      params.createIndex = true;
    }
    if (ctxEvent.menuItemId.includes("SingleFile")) {
      params.singleFile = true;
    }
    if (ctxEvent.menuItemId.includes("Recursive")) {
      params.recursive = true;
    }

    switch (ctxEvent.menuItemId) {
      case folderCtxMenu_Exp_EMLFormatMsgsOnly_Id:
      case folderCtxMenu_Exp_EMLFormatCreateIndex_Id:
      case folderCtxMenu_Exp_EMLFormatCreateIndexRecursive_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_EML_Format", params: params });
        break;
      case folderCtxMenu_Exp_HTMLFormatMsgsOnly_Id:
      case folderCtxMenu_Exp_HTMLFormatSaveAtts_Id:
      case folderCtxMenu_Exp_HTMLFormatCreateIndex_Id:
      case folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndex_Id:
      case folderCtxMenu_Exp_HTMLFormatCreateIndexRecursive_Id:
      case folderCtxMenu_Exp_HTMLFormatSaveAttsCreateIndexRecursive_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_HTML_Format", params: params });
        break;
      case folderCtxMenu_Exp_PDFFormatCreateIndex_Id:
      case folderCtxMenu_Exp_PDFFormatCreateIndexRecursive_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_PDF_Format", params: params });
        break;
      case folderCtxMenu_Exp_PlainTextFormatMsgsOnly_Id:
      case folderCtxMenu_Exp_PlainTextFormatSaveAtts_Id:
      case folderCtxMenu_Exp_PlainTextFormatCreateIndex_Id:
      case folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndex_Id:
      case folderCtxMenu_Exp_PlainTextFormatCreateIndexRecursive_Id:
      case folderCtxMenu_Exp_PlainTextFormatSaveAttsCreateIndexRecursive_Id:
      case folderCtxMenu_Exp_PlainTextFormatSingleFile_Id:
      case folderCtxMenu_Exp_PlainTextFormatSingleFileSaveAtts_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_PlainText_Format", params: params });
        break;
      case folderCtxMenu_Exp_CSVFormat_Id:
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_CSV_Format", params: params });
        break;

      case folderCtxMenu_Exp_IndexHTML_Id:
        params.indexType = "indexHTML";
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_Index", params: params });
        break;
      case folderCtxMenu_Exp_IndexCSV_Id:
        params.indexType = "indexCSV";
        rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_FolderExp_Index", params: params });
        break;

      default:
        break;
    }
    if (rv.status != "ok") {
      console.log("rv.status", rv.status)

      break;
    }

    if (rv.exportFolderPath) {
      params.exportFolderPath = rv.exportFolderPath;
    }
  }
}

function localizeMenuTitle(id) {
  return browser.i18n.getMessage(id);
}

async function invalidSelection() {
  console.log("IETNG: Invalid folder selection")
}

// update for multiple folder selection - some invalid
// update menus based on folder type
// update for attachment menu based on eml type
// update for store type, attachments, page type
async function menusUpdate(info, tab) {

  //console.log(info)

  // toggle copyToClipboard visibility
  // toggle msgCtx visibility - #459
  if (info.contexts.includes("page")) {
    await messenger.menus.update(msgDisplayCtxMenu_Top_Id, { visible: (tab.type == "mail" || tab.type == "messageDisplay") });
    await messenger.menus.update(msgCtxMenu_TopId, { visible: (tab.type == "mail" || tab.type == "messageDisplay") });
    await messenger.menus.refresh();
    return;
  } else {
    await messenger.menus.update(msgDisplayCtxMenu_Top_Id, { visible: false });
    await messenger.menus.update(msgCtxMenu_TopId, { visible: true });
    await messenger.menus.refresh();
  }

  // check if we have attachment menu open
  // we only make our menu visible for eml rfc822 atts
  if (info.contexts.includes("message_attachments")) {
    if (info.attachments[0].contentType == "message/rfc822") {
      await messenger.menus.update("attCtxMenu_Top_Id", { visible: true });
    } else {
      await messenger.menus.update("attCtxMenu_Top_Id", { visible: false });
    }
    await messenger.menus.refresh();
    return;
  }

  // deal with folderCtx for maildir and account entries

  var folderPath;
  var accountId;
  var accountType;

  if (info.selectedAccount) {
    accountId = info.selectedAccount.id;
  } else if (info.selectedFolder) {
    accountId = info.selectedFolder.accountId;
  } else {
    accountId = info.displayedFolder.accountId;
  }

  accountType = (await messenger.accounts.get(accountId)).type;
  let mailStoreType = await miscCmds.getMailStoreFromFolderPath(accountId, folderPath);

  var selectedFolders;
  if (info?.selectedFolders) {
    selectedFolders = info.selectedFolders;
  } else if (info?.selectedFolder) {
    selectedFolders = [info?.selectedFolder];
  } else {
    selectedFolders = [];
  }

  var selectedFoldersLen = selectedFolders?.length;

  if (info.selectedFolder) {
    folderPath = info.selectedFolder.path;
  } else if (info.displayedFolder) {
    folderPath = info.displayedFolder.path;
  }

  // check invalid multiple folder selections
  if (info.selectedAccount && selectedFoldersLen > 1) {
    await setNoMenusUpdate(info);
    return;
  }

  if (selectedFoldersLen > 1 &&
    selectedFolders.find(folder => folder.name == "Root")) {
    await setNoMenusUpdate(info);
    return;
  }

  // default visibility
  await setDefaultMenusUpdate(info);

  // update for an account item
  if (info.selectedAccount) {
    await messenger.menus.update(folderCtxMenu_Exp_Account_Id, { visible: true });

    let newTitle = localizeMenuTitle("folderCtxMenu_Exp_Account_Id.title") + " - " + info.selectedAccount.name;
    await messenger.menus.update(folderCtxMenu_Exp_Account_Id, { title: newTitle });
    await messenger.menus.update(folderCtxMenu_Imp_MaildirFiles_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Exp_FolderMbox_Id, { visible: true });
    await messenger.menus.update(folderCtxMenu_CopyFolderPath_Id, { enabled: true });
    await messenger.menus.update(folderCtxMenu_OpenFolderDir_Id, { enabled: true });

    await messenger.menus.update(folderCtxMenu_Exp_RemoteFolderMbox_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Exp_AllMessages_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Exp_SearchExport_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Imp_EMLFormat_Id, { visible: false });

    if (accountType == "none" && mailStoreType == 0) {
      await messenger.menus.update(folderCtxMenu_Imp_MboxFiles_Id, { visible: true });
      await messenger.menus.update("folderCtxMenu_Sep1", { visible: true });
      await messenger.menus.update("folderCtxMenu_Sep3", { visible: true });
    } else {
      await messenger.menus.update(folderCtxMenu_Imp_MboxFiles_Id, { visible: false });
      await messenger.menus.update("folderCtxMenu_Sep1", { visible: false });
      await messenger.menus.update("folderCtxMenu_Sep3", { visible: false });
    }
    await messenger.menus.update("folderCtxMenu_Sep2", { visible: true });
    await messenger.menus.update("folderCtxMenu_Sep4", { visible: false });
    await messenger.menus.update("folderCtxMenu_Sep5", { visible: true });
    // disable submenus
    await messenger.menus.update(folderCtxMenu_Exp_FolderMboxOnly_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Exp_FolderMboxZipped_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id, { visible: false });
    await messenger.menus.refresh();
    return;
  }

  // disable for importing mbox to imap or nntp
  if (accountType != "none") {
    await messenger.menus.update(folderCtxMenu_Imp_MboxFiles_Id, { visible: false });
    await messenger.menus.refresh();
  }

  // For folder ctx menu show or hide items based on store type, mbox or maildir

  // 0 = mbox
  // 1 = maildir

  if (mailStoreType == 1) {
    await messenger.menus.update(folderCtxMenu_Imp_MaildirFiles_Id, { visible: true });
    await messenger.menus.update(folderCtxMenu_Exp_RemoteFolderMbox_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Imp_MboxFiles_Id, { visible: false });
    await messenger.menus.update("folderCtxMenu_Sep1", { visible: false });
    await messenger.menus.refresh();
  }

  // disable items when multiple folders selected 
  if (selectedFoldersLen > 1) {
    await messenger.menus.update(folderCtxMenu_Exp_SearchExport_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Imp_EMLFormat_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Imp_MboxFiles_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_Imp_MaildirFiles_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_CopyFolderPath_Id, { visible: false });
    await messenger.menus.update(folderCtxMenu_OpenFolderDir_Id, { visible: false });
    await messenger.menus.update("folderCtxMenu_Sep2", { visible: false });
    await messenger.menus.update("folderCtxMenu_Sep3", { visible: false });
    await messenger.menus.update("folderCtxMenu_Sep4", { visible: false });
    await messenger.menus.update("folderCtxMenu_Sep5", { visible: false });
    await messenger.menus.refresh();
  }
}

async function setDefaultMenusUpdate(info) {
  await messenger.menus.update(folderCtxMenu_InvalidSelection_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Exp_Account_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Imp_MaildirFiles_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Exp_FolderMbox_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Exp_RemoteFolderMbox_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Imp_MboxFiles_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Exp_AllMessages_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Exp_SearchExport_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Imp_EMLFormat_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_CopyFolderPath_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_OpenFolderDir_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Options_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Help_Id, { visible: true });

  await messenger.menus.update("folderCtxMenu_Sep1", { visible: true });
  await messenger.menus.update("folderCtxMenu_Sep2", { visible: true });
  await messenger.menus.update("folderCtxMenu_Sep3", { visible: true });
  await messenger.menus.update("folderCtxMenu_Sep4", { visible: true });
  await messenger.menus.update("folderCtxMenu_Sep5", { visible: true });
  await messenger.menus.update("folderCtxMenu_Sep6", { visible: true });

  // enable submenus
  await messenger.menus.update(folderCtxMenu_Exp_FolderMboxOnly_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Exp_FolderMboxZipped_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id, { visible: true });
  await messenger.menus.refresh();
}


async function setNoMenusUpdate(info) {
  await messenger.menus.update(folderCtxMenu_InvalidSelection_Id, { visible: true });
  await messenger.menus.update(folderCtxMenu_Exp_Account_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Imp_MaildirFiles_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Exp_FolderMbox_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Exp_RemoteFolderMbox_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Imp_MboxFiles_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Exp_AllMessages_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Exp_SearchExport_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Imp_EMLFormat_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_CopyFolderPath_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_OpenFolderDir_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Options_Id, { visible: false });
  await messenger.menus.update(folderCtxMenu_Help_Id, { visible: false });
  await messenger.menus.update("folderCtxMenu_Sep1", { visible: false });
  await messenger.menus.update("folderCtxMenu_Sep2", { visible: false });
  await messenger.menus.update("folderCtxMenu_Sep3", { visible: false });
  await messenger.menus.update("folderCtxMenu_Sep4", { visible: false });
  await messenger.menus.update("folderCtxMenu_Sep5", { visible: false });
  await messenger.menus.update("folderCtxMenu_Sep6", { visible: false });
  await messenger.menus.refresh();
}

// listener to change any  menus
messenger.menus.onShown.addListener(menusUpdate);
