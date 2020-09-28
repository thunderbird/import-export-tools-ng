// background.js - this kicks off the WindowListener framework


// console.debug('background Start');

messenger.WindowListener.registerDefaultPrefs("defaults/preferences/prefs.js");

// Register all necessary content, Resources, and locales

messenger.WindowListener.registerChromeUrl([
	["content", "mboximport", "chrome/content/mboximport"],
	["resource", "mboximport", "chrome/", "contentaccessible=yes"],
	["locale", "mboximport", "en-US", "chrome/locale/en-US/mboximport/"],

	["locale", "mboximport", "ca", "chrome/locale/ca/mboximport/"],
	["locale", "mboximport", "da", "chrome/locale/da/mboximport/"],
	["locale", "mboximport", "de", "chrome/locale/de/mboximport/"],
	["locale", "mboximport", "es-ES", "chrome/locale/es-ES/mboximport/"],
	["locale", "mboximport", "fr", "chrome/locale/fr/mboximport/"],
	["locale", "mboximport", "gl-ES", "chrome/locale/gl-ES/mboximport/"],
	["locale", "mboximport", "hu-HU", "chrome/locale/hu-HU/mboximport/"],
	["locale", "mboximport", "hu-HG", "chrome/locale/hu-HG/mboximport/"],
	["locale", "mboximport", "hy-AM", "chrome/locale/hy-AM/mboximport/"],
	["locale", "mboximport", "it", "chrome/locale/it/mboximport/"],
	["locale", "mboximport", "ja", "chrome/locale/ja/mboximport/"],
	["locale", "mboximport", "ko-KR", "chrome/locale/ko-KR/mboximport/"],
	["locale", "mboximport", "nl", "chrome/locale/nl/mboximport/"],
	["locale", "mboximport", "pl", "chrome/locale/pl/mboximport/"],
	["locale", "mboximport", "pt-PT", "chrome/locale/pt-PT/mboximport/"],
	["locale", "mboximport", "ru", "chrome/locale/ru/mboximport/"],
	["locale", "mboximport", "sk-SK", "chrome/locale/sk-SK/mboximport/"],
	["locale", "mboximport", "sl-SI", "chrome/locale/sl-SI/mboximport/"],
	["locale", "mboximport", "sv-SE", "chrome/locale/sv-SE/mboximport/"],
	["locale", "mboximport", "zh-CN", "chrome/locale/zh-CN/mboximport/"],
	["locale", "mboximport", "el", "chrome/locale/el/mboximport/"],

]);

messenger.WindowListener.registerOptionsPage("chrome://mboximport/content/mboximport/mboximportOptions.xhtml");

// Register each overlay script Which controls subsequent fragment loading

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messenger.xul",
	"chrome://mboximport/content/mboximport/messengerOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messenger.xhtml",
	"chrome://mboximport/content/mboximport/messengerOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/SearchDialog.xul",
	"chrome://mboximport/content/mboximport/SearchDialogOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/SearchDialog.xhtml",
	"chrome://mboximport/content/mboximport/SearchDialogOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messengercompose/messengercompose.xul",
	"chrome://mboximport/content/mboximport/messengercomposeOL.js");

messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messengercompose/messengercompose.xhtml",
	"chrome://mboximport/content/mboximport/messengercomposeOL.js");


messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messageWindow.xul",
	"chrome://mboximport/content/mboximport/messageWindowOL.js");


messenger.WindowListener.registerWindow(
	"chrome://messenger/content/messageWindow.xhtml",
	"chrome://mboximport/content/mboximport/messageWindowOL.js");

// messenger.WindowListener.registerWindow(
// 	"chrome://mboximport/content/mboximport/pest.xhtml",
// 	"chrome://mboximport/content/mboximport/ptest.js");
	
messenger.WindowListener.registerWindow(
	"chrome://messenger/content/msgPrintEngine.xul",
	"chrome://mboximport/content/mboximport/msgPrintEngineOL.js");


messenger.WindowListener.registerWindow(
	"chrome://messenger/content/msgPrintEngine.xhtml",
	"chrome://mboximport/content/mboximport/msgPrintEngineOL.js");


messenger.WindowListener.startListening();
