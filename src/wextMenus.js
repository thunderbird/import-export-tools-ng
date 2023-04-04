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
		onclick: wextMenu_EML_Format
	}
);

const msgCtxMenu_HTML_FormatId = "msgCtxMenu_HTML_FormatId";
await messenger.menus.create(
	{
		parentId: msgCtxMenu_TopId,
		id: msgCtxMenu_HTML_FormatId,
		contexts: ["message_list"],
		title: "HTML Format",
	}
);


// Message Context Menu Handlers

async function wextMenu_EML_Format(e) {
	console.log("EML Format");

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