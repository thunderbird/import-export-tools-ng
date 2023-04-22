// expMenuDispatcher
console.log("load")
async function expMenuDispatcher(data) {

	switch (data.command) {
		case "WXMCMD_EML_Format":
			console.log("mdis: ", data)
			await exportSelectedMsgs(0);
			break;
		case "WXMCMD_PDF_Format":
			await IETprintPDFmain.print(false);
			break;
		default:
			break;
	}
	
	return true;
}

function onUnload() {
	console.log("unload")
}
// exp listener
var listener_id = window.ietngAddon.notifyTools.addListener(expMenuDispatcher);
