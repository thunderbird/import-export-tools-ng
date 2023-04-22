// wextMenus
// Installs wext context and main menus
// Interface via notifytools to expMenus


// Message context menu
const msgCtxMenu_TopId = "msgCtxMenu_TopId";
await messenger.menus.create(
	{
		id: msgCtxMenu_TopId,
		contexts: ["message_list"],
		title: "IETNG: Save Messages As",
	}
);

const msgCtxMenu_EML_FormatId = "msgCtxMenu_EML_FormatId";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_TopId,
		id: msgCtxMenu_EML_FormatId,
		contexts: ["message_list"],
		title: "EML Message Format",
		onclick: wextMsgCtx_ExportAs
	}
);

const msgCtxMenu_HTML_FormatId = "msgCtxMenu_HTML_FormatId";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_TopId,
		id: msgCtxMenu_HTML_FormatId,
		contexts: ["message_list"],
		title: "HTML Format",
		onclick: wextMsgCtx_ExportAs
	}
);

const msgCtxMenu_PDF_FormatId = "msgCtxMenu_PDF_FormatId";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_TopId,
		id: msgCtxMenu_PDF_FormatId,
		contexts: ["message_list"],
		title: "PDF Format",
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
	switch (msgCtxEvent.menuItemId) {
		case msgCtxMenu_EML_FormatId:
			messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_EML_Format"});
			break;
		case msgCtxMenu_PDF_FormatId:
			messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_PDF_Format"});
			break;
		default:
			break;
	}

}

async function wextMenu_folderTest(e) {
	console.log(e)
}