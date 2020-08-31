

messenger.WindowListener.registerDefaultPrefs("defaults/preferences/prefs.js");

messenger.WindowListener.registerChromeUrl([
	["content", "mboximport", "chrome/content/"],
	["resource", "mboximport", "chrome/"],
	["locale", "mboximport", "en-US", "chrome/locale/en-US/mboximport/"],
	["locale", "mboximport", "es", "chrome/locale/es/"],
	["locale", "mboximport", "fr", "chrome/locale/fr/"],
	["locale", "mboximport", "hu-HU", "chrome/locale/hu-HU/"],
]);

messenger.WindowListener.registerOptionsPage("chrome://mboximport/content/mboximport/mboximportOptions.xul");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messenger.xul",
	"chrome://mboximport/content/mboximport/mboximport.js");

// messenger.WindowListener.registerWindow(
// 	"chrome://messenger/content/messenger.xul",
// 	"chrome://mboximport/content/messengerOverlay.js");


// overlay chrome://messenger/content/messengercompose/messengercompose.xul  chrome://mboximport/content/composeOverlay.xul
// overlay	chrome://messenger/content/messenger.xul	chrome://mboximport/content/messengerOverlay.xul
// overlay	chrome://messenger/content/messageWindow.xul	chrome://mboximport/content/messageWindowOverlay.xul
// overlay	chrome://messenger/content/SearchDialog.xul	chrome://mboximport/content/sdOverlay.xul
// overlay	chrome://messenger/content/msgPrintEngine.xul	chrome://mboximport/content/printEngineWindowOverlay.xul

messenger.WindowListener.startListening();




