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



var msgCtxMenuSet = [
	{
		menuId: 1,
		menuDef: {
			id: ctxMenu_TopId,
			title: "Save or Export Messages As…"
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



];

/*

await messenger.menus.create(
	{
		id: ctxMenu_TopId,
		contexts: ["message_list"],
		title: "Save or Export Messages As…",
	}
);

const ctxMenu_Exp_EMLFormat_Id = "ctxMenu_Exp_EMLFormat_Id";
await messenger.menus.create(
	{
		parentId: ctxMenu_TopId,
		id: ctxMenu_Exp_EMLFormat_Id,
		contexts: ["message_list"],
		title: "EML Message Format",
		onclick: wextctx_ExportAs
	}
);

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

createMenus("", msgCtxMenuSet, {defaultContexts: ["message_list"], defaultOnclick: wextctx_ExportAs});


async function createMenus(menuType, menuArray, options) {
	var defaultParentId = menuArray[0].menuDef.id;
	for (let index = 0; index < menuArray.length; index++) {
		let menuObj = menuArray[index];
		if (index > 0) {
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

async function wextMenu_folderTest(e) {
	console.log(e)
	messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImportEML" });
}