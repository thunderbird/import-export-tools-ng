var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

function importwrapper() {
	// Services.console.logStringMessage("mboximport dialogue wrapper");
	window.arguments[0].openProfDir = document.getElementById("openProfDir").checked;
	var params = { scandir: false, keepstructure: false, openProfDir: false, recursiveMode: false };
	if (document.getElementById("mboxgroup").selectedIndex === 1)
		window.arguments[0].keepstructure = true;
	else if (document.getElementById("mboxgroup").selectedIndex === 2)
		window.arguments[0].scandir = true;
	else if (document.getElementById("mboxgroup").selectedIndex === 3) {
		window.arguments[0].scandir = true;
		window.arguments[0].recursiveMode = true;
	}
}


document.addEventListener("dialogaccept", function(event) {
	// Services.console.logStringMessage("test dialogue accept");
	importwrapper();
  });
