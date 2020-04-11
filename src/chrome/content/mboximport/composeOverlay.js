console.debug('compose window');
var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

/* 
function normalizeModifiers(modifiers) {
	let m1 = modifiers.replace(//)
}
 */
// var logStr = document.getElementById("msgcomposeWindow").outerHTML;
var logStr = "";
logStr += "\n";
// throw('compose over start');
let existingKeys = document.getElementsByTagName("key");
logStr += "\n"+existingKeys.length;

for (let i = 0; i < existingKeys.length; i++) {
	const k1 = existingKeys[i];
	// logStr += k1.outerHTML;
	if (k1.getAttribute("key").toLowerCase() === "p" ) {
		logStr += "Has P\n" + k1.getAttribute("modifiers");
	}
	// logStr += "\n";
}

let k = document.getElementById("key_checkspelling");
logStr += k.outerHTML;
k.setAttribute("key", "x");
logStr += k.outerHTML;
throw(logStr);
