// background.js - this kicks off the WindowListener framework

window.folder = "t1"

// Have to wrap top level asyncs in anon func to pass ATN

await ((async () => {
	var tbVersionParts = await getThunderbirdVersion();

	// must delay startup for #284 using SessionRestore for 91, bypass for 102
	// does this by default 
	var startupDelay;
	if (tbVersionParts.major < 92) {
		startupDelay = await new Promise(async (resolve) => {
			const restoreListener = (window, state = true) => {
				browser.SessionRestore.onStartupSessionRestore.removeListener(restoreListener);
				resolve(state);
			}
			browser.SessionRestore.onStartupSessionRestore.addListener(restoreListener);

			let isRestored = await browser.SessionRestore.isRestored();
			if (isRestored) {
				restoreListener(null, false);
			}
		});
	}


})());



// now start
main();

var currentLocale = messenger.i18n.getUILanguage();

browser.runtime.onInstalled.addListener(async (info) => {
	console.log("install event")
	await openHelp({opentype: "tab"});
});


async function getThunderbirdVersion() {
	let browserInfo = await messenger.runtime.getBrowserInfo();
	let parts = browserInfo.version.split(".");
	return {
		major: parseInt(parts[0]),
		minor: parseInt(parts[1]),
		revision: parts.length > 2 ? parseInt(parts[2]) : 0,
	}
}

function main() {
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
		"chrome://messenger/content/messenger.xhtml",
		"chrome://mboximport/content/mboximport/messengerOL.js");

	messenger.WindowListener.registerWindow(
		"chrome://messenger/content/SearchDialog.xhtml",
		"chrome://mboximport/content/mboximport/SearchDialogOL.js");

	messenger.WindowListener.registerWindow(
		"chrome://messenger/content/messengercompose/messengercompose.xhtml",
		"chrome://mboximport/content/mboximport/messengercomposeOL.js");


	messenger.WindowListener.registerWindow(
		"chrome://messenger/content/messageWindow.xhtml",
		"chrome://mboximport/content/mboximport/messageWindowOL.js");

	messenger.WindowListener.startListening();

	

}

async function openHelp(info) {
	var locale = currentLocale;
	console.log("open help")
	var bm = "";
	if (info.bmark) {
		bm = info.bmark;
	}
	try {
		if (info.opentype == "tab") {
			// use fetch to see if help file exists, throws if not, fix #212
			await fetch(`chrome/content/mboximport/help/locale/${locale}/importexport-help.html`);
			await browser.tabs.create({ url: `chrome/content/mboximport/help/locale/${locale}/importexport-help.html${bm}`, index: 1 })
		} else {
			await fetch(`chrome/content/help/locale/${locale}/importexport-help.html`);
			await browser.windows.create({ url: `chrome/content/help/locale/${locale}/importexport-help.html${bm}`, type: "panel", width: 1180, height: 520 })
		}
	} catch {
		try {
			locale = locale.Split('-')[0];
			if (info.opentype == "tab") {
				await fetch(`chrome/content/help/locale/${locale}/importexport-help.html`);
				await browser.tabs.create({ url: `chrome/content/help/locale/${locale}/importexport-help.html${bm}`, index: 1 })
			} else {
				await fetch(`chrome/content/help/locale/${locale}/importexport-help.html`);
				await browser.windows.create({ url: `chrome/content/help/locale/${locale}/importexport-help.html${bm}`, type: "panel", width: 1180, height: 520 })
			}
		} catch {
			if (info.opentype == "tab") {
				await browser.tabs.create({ url: `chrome/content/help/locale/en-US/importexport-help.html${bm}`, index: 1 })
			} else {
				await browser.windows.create({ url: `chrome/content/help/locale/en-US/importexport-help.html${bm}`, type: "panel", width: 1180, height: 520 })
			}
		}
	}
	return "help";
}
