// expMenuDispatcher
console.log("load")

/* Export types:
	0 = EML
	1 = HTML
	2 = Plain Text
	3 = MBOX
	4 = MBOX (append mode)
	5 = index (HTML)
	6 = index (CSV)
	7 = CSV (with body)
	8 = HTML with attachments
	9 = Plain Text with attachments
	*/
	
async function expMenuDispatcher(data) {

	switch (data.command) {
		case "WXMCMD_EML_Format":
			console.log("mdis: ", data)
			await exportSelectedMsgs(0);
			break;
		case "WXMCMD_HTML_Format":
			console.log("mdis: ", data.params)
			if (Object.keys(data.params).length == 0) {
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
		case "WXMCMD_Exp_Profile":
			IETexport_all(true);
			break;
		case "WXMCMD_Backup":
			window.ietng.OpenBackupDialog('manual');
			break;
		case "WXMCMD_ImpMbox":
			//var f = await window.ietngAddon.notifyTools.notifyBackground({ command: "getSelectedFolder" });
			console.log(data.params)
			openMboxDialog(params);
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
