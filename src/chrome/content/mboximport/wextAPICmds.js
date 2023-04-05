// wextAPICmd.js

async function getSelectedMsgs() {

	let msgIdList = await window.ietngAddon.notifyTools.notifyBackground({ command: "getSelectedMessages" });
	console.log(msgIdList)
	var msgURIS = [];
	msgIdList.messages.forEach(msg => {
		let realMessage = window.ietngAddon.extension
		.messageManager.get(msg.id);
		
		let uri = realMessage.folder.getUriForMsg(realMessage);
		console.log(uri)
		msgURIS.push(uri);
	});
	return msgURIS;
}
