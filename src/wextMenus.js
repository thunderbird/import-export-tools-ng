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

const ctxMenu_Exp_HTMLFormatMsgs_Id = "ctxMenu_Exp_HTMLFormatMsgs_Id";


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
    }

  },
  {
    menuDef: {
      id: ctxMenu_Exp_Help_Id,
      title: "Help",
    }

  },
  {
    menuDef: {
      parentId: ctxMenu_Exp_HTMLFormat_Id,
      id: ctxMenu_Exp_HTMLFormatMsgs_Id,
      title: "Messages Only"
    }

  },

];

const toolsCtxMenu_TopId = "toolsCtxMenu_TopId";
const toolsCtxMenu_ExpProfile_Id = "toolsCtxMenu_ExpProfile_Id";
const toolsCtxMenu_ImpProfile_Id = "toolsCtxMenu_ImpProfile_Id";
const toolsCtxMenu_Backup_Id ="toolsCtxMenu_Backup_Id";

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
  }


];

const folderCtxMenu_TopId = "folderCtxMenu_TopId";
const folderCtxMenu_Exp_FolderMbox_Id = "folderCtxMenu_Exp_FolderMbox_Id";
const folderCtxMenu_Exp_FolderMboxOnly_Id = "folderCtxMenu_Exp_FolderMboxOnly_Id";
const folderCtxMenu_Exp_FolderMboxZipped_Id = "folderCtxMenu_Exp_FolderMboxZipped_Id";
const folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id ="folderCtxMenu_Exp_FolderMboxStructuredSubFolders_Id";
const folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id = "folderCtxMenu_Exp_FolderMboxFlattenedSubFolders_Id";
const folderCtxMenu_Exp_RemoteFolderMbox_Id = "folderCtxMenu_Exp_RemoteFolderMbox_Id";
const folderCtxMenu_Exp_AllMessages_Id = "folderCtxMenu_Exp_AllMessages_Id";
const folderCtxMenu_Exp_SearchExport_Id = "folderCtxMenu_Exp_SearchExport_Id";
const folderCtxMenu_Imp_MboxFiles_Id = "folderCtxMenu_Imp_MboxFiles_Id";
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
      id: folderCtxMenu_Exp_FolderMboxOnly_Id,
      title: "Single mbox File"
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
      title: "Options"
    }
  },
  {
    menuDef: {
      id: folderCtxMenu_Help_Id,
      title: "Help"
    }
  },
];

/*



const ctxMenu_Exp_HTMLFormat_Id = "ctxMenu_Exp_HTMLFormat_Id";
await messenger.menus.create(
  {
    parentId: ctxMenu_TopId,
    id: ctxMenu_Exp_HTMLFormat_Id,
    contexts: ["message_list"],
    title: "HTML Format",
    onclick: wextctx_ExportAs
  }
);



const ctxMenu_Exp_HTMLFormatMsgs_Id = "ctxMenu_Exp_HTMLFormatMsgs_Id";
await messenger.menus.create(
  {
    parentId: ctxMenu_Exp_HTMLFormat_Id,
    id: ctxMenu_Exp_HTMLFormatMsgs_Id,
    contexts: ["message_list"],
    title: "Messages Only",
    onclick: wextctx_ExportAs
  }
);

const ctxMenu_Exp_HTMLFormatSaveAtts_Id = "ctxMenu_Exp_HTMLFormatSaveAtts_Id";
await messenger.menus.create(
  {
    parentId: ctxMenu_Exp_HTMLFormat_Id,
    id: ctxMenu_Exp_HTMLFormatSaveAtts_Id,
    contexts: ["message_list"],
    title: "Save Attachments",
    onclick: wextctx_ExportAs
  }
);

const ctxMenu_Exp_HTMLFormatCreateIndex_Id = "ctxMenu_Exp_HTMLFormatCreateIndex_Id";
await messenger.menus.create(
  {
    parentId: ctxMenu_Exp_HTMLFormat_Id,
    id: ctxMenu_Exp_HTMLFormatCreateIndex_Id,
    contexts: ["message_list"],
    title: "Create HTML Index",
    onclick: wextctx_ExportAs
  }
);

const ctxMenu_Exp_HTMLFormatSaveAttsPlusIndex_Id = "ctxMenu_Exp_HTMLFormatSaveAttsPlusIndex_Id";
await messenger.menus.create(
  {
    parentId: ctxMenu_Exp_HTMLFormat_Id,
    id: ctxMenu_Exp_HTMLFormatSaveAttsPlusIndex_Id,
    contexts: ["message_list"],
    title: "Attachments and Index",
    onclick: wextctx_ExportAs
  }
);


await messenger.menus.create(
  {
    parentId: ctxMenu_TopId,
    id: ctxMenu_Exp_PDFFormat_Id,
    contexts: ["message_list"],
    title: "PDF Format",
    type: "normal",
    onclick: wextctx_ExportAs
  }
);

const folderCtxMenu_folderTestId = "folderCtxMenu_folderTestId";
await messenger.menus.create(
  {
    id: folderCtxMenu_folderTestId,
    contexts: ["folder_pane"],
    title: "Folder test",
    onclick: wextMenu_folderTest
  }
);

const folderCtxMenu_ImportEMLSubdTestId = "folderCtxMenu_ImportEMLSubdTestId";
await messenger.menus.create(
  {
    parentId: folderCtxMenu_folderTestId,
    id: folderCtxMenu_ImportEMLSubdTestId,
    contexts: ["folder_pane"],
    title: "Folder test",
    onclick: wextMenu_folderTest
  }
);
*/

/*
const folderCtxMenu_folderTestId = "folderCtxMenu_folderTestId";
await messenger.menus.create(
  {
    id: folderCtxMenu_folderTestId,
    contexts: ["tools_menu"],
    title: "menu test",
    onclick: wextMenu_folderTest
  }
);
*/


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

async function wextMenu_EML_Format(e) {
  console.log("EML Format", e);

  var msgList = [];
  try {
    msgList = await browser.mailTabs.getSelectedMessages();
  } catch {
    msgList = null;
  }

  var params = {
    selectedMsgIds: msgList,
  };

  console.log(params)
  messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_EML_Format", params: params }).then((data) => {
    console.log(data)
  });
}

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
    case ctxMenu_Exp_EMLFormat_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_EML_Format" });
      break;
    case ctxMenu_Exp_HTMLFormatMsgs_Id:
    case ctxMenu_Exp_HTMLFormatSaveAtts_Id:
    case ctxMenu_Exp_HTMLFormatCreateIndex_Id:
    case ctxMenu_Exp_HTMLFormatSaveAttsPlusIndex_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_HTML_Format", params });
      break;
    case ctxMenu_Exp_PDFFormat_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PDF_Format" });
      break;
    default:
      break;
  }

}

async function wextctx_toolsMenu(ctxEvent) {

  switch (ctxEvent.menuItemId) {
    case toolsCtxMenu_ExpProfile_Id:
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Exp_Profile" });
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
  switch (ctxEvent.menuItemId) {
    case folderCtxMenu_Imp_MboxFiles_Id:
      window.folder = ctxEvent.selectedFolder;
      messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImpMbox", params: {selectedFolder: ctxEvent.selectedFolder} });
      break;
  
    default:
      break;
  }
  //messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImportEML" });
}