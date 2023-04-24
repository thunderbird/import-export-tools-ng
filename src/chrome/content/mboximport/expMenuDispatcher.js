// expMenuDispatcher
console.log("load")
async function expMenuDispatcher(data) {

	switch (data.command) {
		case "WXMCMD_EML_Format":
			console.log("mdis: ", data)
			await exportSelectedMsgs(0);
			break;
		case "WXMCMD_HTML_Format":
			console.log("mdis: ", data.params)
			if (data.params == {}) {
				await exportSelectedMsgs(1);
			} else if (data.params.saveAtts && !data.params.createIndex) {
				await exportSelectedMsgs(8);
			} else if (data.params.createIndex && !data.params.saveAtts) {
				await exportSelectedMsgs(101);
			} else if (data.params.saveAtts && data.params.createIndex) {
				await exportSelectedMsgs(108);
			}

			break;
		case "WXMCMD_PDF_Format":
			await IETprintPDFmain.print(false);
			break;
		case "WXMCMD_ImportEML":
			importALLasEML(true);
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
