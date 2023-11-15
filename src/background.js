/*
	ImportExportTools NG is a extension for Thunderbird mail client
	providing import and export tools for messages and folders.
	The extension authors:
		Copyright (C) 2023 : Christopher Leidigh, The Thunderbird Team

	ImportExportTools NG is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */


// background.js - this kicks off the WindowListener framework

// need this for wextMenus
window.wextOpenHelp = wextOpenHelp;

// Have to wrap top level asyncs in anon func to pass ATN

await((async () => {
	var tbVersionParts = await getThunderbirdVersion();

	// must delay startup for #284 using SessionRestore for 91, bypass for 102
	// does this by default 
	var startupDelay;
	if (tbVersionParts.major < 92) {
		startupDelay = await new Promise(async (resolve) => {
			const restoreListener = (window, state = true) => {
				browser.SessionRestore.onStartupSessionRestore.removeListener(restoreListener);
				resolve(state);
			};
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

// open help on install / update 
browser.runtime.onInstalled.addListener(async (info) => {
	if (info.reason != "install" && info.reason != "update") {
		return;
	}

	// let messengerOL start
	await new Promise(resolve => window.setTimeout(resolve, 100));

	// add option to not show help - #458
	if (await window.getBoolPref("extensions.importexporttoolsng.help.showOnInstallAndUpdate")) {
		await window.wextOpenHelp({ opentype: "tab" });
	}
});


async function getThunderbirdVersion() {
	let browserInfo = await messenger.runtime.getBrowserInfo();
	let parts = browserInfo.version.split(".");
	return {
		major: parseInt(parts[0]),
		minor: parseInt(parts[1]),
		revision: parts.length > 2 ? parseInt(parts[2]) : 0,
	};
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

var helpLocales = ['en-US', 'de', 'ca', 'da', 'el', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hy-AM', 'it', 'ja', 'ko-KR',
	'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];

async function wextOpenHelp(info) {
	if (!info.opentype) {
		let openInWindow = await window.getBoolPref("extensions.importexporttoolsng.help.openInWindow");
		info.opentype = openInWindow ? "window" : "tab";
	}

	var locale = messenger.i18n.getUILanguage();

	if (!helpLocales.includes(locale)) {
		var baseLocale = locale.split("-")[0];

		locale = helpLocales.find(l => l.split("-")[0] == baseLocale);
		if (!locale) {
			locale = "en-US";
		}
	}
	var bm = "";
	if (info.bmark) {
		bm = info.bmark;
	}
	try {
		if (info.opentype == "tab") {
			await browser.tabs.create({ url: `chrome/content/mboximport/help/locale/${locale}/importexport-help.html${bm}`, index: 1 });
		} else {
			await browser.windows.create({ url: `chrome/content/mboximport/help/locale/${locale}/importexport-help.html${bm}`, type: "panel", width: 1000, height: 520 });
		}
	} catch (ex) {
			if (info.opentype == "tab") {
				await browser.tabs.create({ url: `chrome/content/mboximport/help/locale/en-US/importexport-help.html${bm}`, index: 1 });
			} else {
				await browser.windows.create({ url: `chrome/content/mboximport/help/locale/en-US/importexport-help.html${bm}`, type: "panel", width: 1000, height: 520 });
			}
		}
}

