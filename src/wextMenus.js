// wextMenus
// Installs wext context and main menus
// Interface via notifytools to expMenus


// Message context menu
const msgCtxMenu_TopId = "msgCtxMenu_TopId";
await messenger.menus.create(
	{
		id: msgCtxMenu_TopId,
		contexts: ["message_list"],
		title: "Save or Export Messages As…",
	}
);

const msgCtxMenu_Exp_EMLFormat_Id = "msgCtxMenu_Exp_EMLFormat_Id";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_TopId,
		id: msgCtxMenu_Exp_EMLFormat_Id,
		contexts: ["message_list"],
		title: "EML Message Format",
		onclick: wextMsgCtx_ExportAs
	}
);

const msgCtxMenu_Exp_HTMLFormat_Id = "msgCtxMenu_Exp_HTMLFormat_Id";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_TopId,
		id: msgCtxMenu_Exp_HTMLFormat_Id,
		contexts: ["message_list"],
		title: "HTML Format",
		onclick: wextMsgCtx_ExportAs
	}
);



const msgCtxMenu_Exp_HTMLFormatMsgs_Id = "msgCtxMenu_Exp_HTMLFormatMsgs_Id";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_Exp_HTMLFormat_Id,
		id: msgCtxMenu_Exp_HTMLFormatMsgs_Id,
		contexts: ["message_list"],
		title: "Messages Only",
		onclick: wextMsgCtx_ExportAs
	}
);

const msgCtxMenu_Exp_HTMLFormatSaveAtts_Id = "msgCtxMenu_Exp_HTMLFormatSaveAtts_Id";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_Exp_HTMLFormat_Id,
		id: msgCtxMenu_Exp_HTMLFormatSaveAtts_Id,
		contexts: ["message_list"],
		title: "Save Attachments",
		onclick: wextMsgCtx_ExportAs
	}
);

const msgCtxMenu_Exp_HTMLFormatCreateIndex_Id = "msgCtxMenu_Exp_HTMLFormatCreateIndex_Id";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_Exp_HTMLFormat_Id,
		id: msgCtxMenu_Exp_HTMLFormatCreateIndex_Id,
		contexts: ["message_list"],
		title: "Create HTML Index",
		onclick: wextMsgCtx_ExportAs
	}
);

const msgCtxMenu_Exp_HTMLFormatSaveAttsPlusIndex_Id = "msgCtxMenu_Exp_HTMLFormatSaveAttsPlusIndex_Id";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_Exp_HTMLFormat_Id,
		id: msgCtxMenu_Exp_HTMLFormatSaveAttsPlusIndex_Id,
		contexts: ["message_list"],
		title: "Attachments and Index",
		onclick: wextMsgCtx_ExportAs
	}
);

const msgCtxMenu_Exp_PDFFormat_Id = "msgCtxMenu_Exp_PDFFormat_Id";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_TopId,
		id: msgCtxMenu_Exp_PDFFormat_Id,
		contexts: ["message_list"],
		title: "PDF Format",
		type: "normal",
		onclick: wextMsgCtx_ExportAs
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
// Message Context Menu Handlers

async function wextMenu_EML_Format(e) {
	console.log("EML Format",e);

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
	messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_EML_Format", params: params}).then((data) => {
		console.log(data)
	});
}

async function wextMsgCtx_ExportAs(msgCtxEvent) {
	console.log(msgCtxEvent)
	var params = {};
	if (msgCtxEvent.menuItemId.includes("Atts")) {
		params.saveAtts = true;
	}
	if (msgCtxEvent.menuItemId.includes("Index")) {
		params.createIndex = true;
	}
	
	switch (msgCtxEvent.menuItemId) {
		case msgCtxMenu_Exp_EMLFormat_Id:
			messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_EML_Format"});
			break;
		case msgCtxMenu_Exp_HTMLFormatMsgs_Id:
		case msgCtxMenu_Exp_HTMLFormatSaveAtts_Id:
		case msgCtxMenu_Exp_HTMLFormatCreateIndex_Id:
		case msgCtxMenu_Exp_HTMLFormatSaveAttsPlusIndex_Id:
			messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_HTML_Format", params});
			break;
		case msgCtxMenu_Exp_PDFFormat_Id:
			messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PDF_Format"});
			break;
		default:
			break;
	}

}

async function wextMenu_folderTest(e) {
	console.log(e)
	messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImportEML"});
}