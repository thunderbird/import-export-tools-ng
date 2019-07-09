// cleidigh - reformat
/* global IETprefs */

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');


function IETmessOverlayInit() {
	var last = IETprefs.getIntPref("extensions.importexporttools.autobackup.last");
	var frequency = IETprefs.getIntPref("extensions.importexporttools.autobackup.frequency");
	if (frequency === 0)
		return;
	var now = new Date;
	var time = now.getTime();
	time = time / 1000;
	var days = 24 * 60 * 60 * frequency;

	// cleidigh forced dialogue for testing
	// if ((time - last) < days)
		// return;

		var WM = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);
	var os = navigator.platform.toLowerCase();
	var wins;
	if (os.includes("mac"))
		wins = WM.getEnumerator(null);
	else
		wins = WM.getEnumerator("mail:3pane");
	if (!wins.hasMoreElements()) {
		if (IETprefs.getBoolPref("extensions.importexporttools.autobackup.use_modal_dialog"))
			window.openDialog("chrome://mboximport/content/autobackup.xul", "", "chrome,centerscreen,modal", last, time, now);
		else
			window.openDialog("chrome://mboximport/content/autobackup.xul", "", "chrome,centerscreen", last, time, now);
	}
}

window.addEventListener("unload", IETmessOverlayInit, false);
