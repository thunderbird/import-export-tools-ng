// background.js - this kicks off the WindowListener framework
console.debug('background Start');


var bPage;

var m = 0;
var s = "hello";
async function traverseFolders (rootFolderPath) {

	console.debug('traverse ' + bPage.t);
	bPage.t = 0;
	m = 0;
	let accountID = "account1";
	let account = await messenger.accounts.get(accountID);
	var folders = account.folders;
	var fArray = [];

	// console.debug(`count ${await getMsgCount(folders[2])}`);
	let fa = await walkFolders(folders, getMsgCount);
	console.debug(fa);
	console.debug(`m ${m}`);
}

async function getMsgCount(folder) {
	let accountID = "account1";
	// let account = await messenger.accounts.get(accountID);
	// var folders = account.folders;
	var count = 0;
	let page = await messenger.messages.list(folder);
	// console.debug(page);
	// console.debug(page.messages.length);
	count+= page.messages.length;
	while (page.id) {
		page = await messenger.messages.continueList(page.id);
		// console.debug(page.messages.length);
		count+= page.messages.length;
	}
	console.debug('total ' + count +' ' + m);
	m = m + count;
	bPage.t += count;
	console.debug('gm ' + bPage.t);
	return count;
}

async function walkFolders2(folders, cb) {
	console.debug(folders);
	
	var folderPromises = [];
	folders.forEach(async folder => {
		// folderPromises.push(getMsgCount(folder));
		// let mc = await cb(folder);
		let mc = 3;
		folderPromises.push({path: folder.path, msgCount: mc});
		// folderPromises.push(folder.path);
		console.debug(`FP ${folder.path} ${folder.subFolders.length}`);

		if (folder.subFolders.length) {
			var fp2 = [];
			folder.subFolders.forEach(async folder => {
				// await cb(folder);
				// fp2.push(folder.path);
				let mc = 4; 
				// fp2.push({path: folder.path, msgCount: mc});
				console.debug(folder.path);
				console.debug('recursive call');
				// let fp3 = await walkFolders(folder.subFolders, cb);
				// fp2.push(walkFolders(folder.subFolders, cb));
				// console.debug(fp2);
				// folderPromises.push(fp3);
				// folderPromises = folderPromises.concat(fp3);
				// folderPromises = folderPromises.concat(await walkFolders(folder.subFolders, cb));
				fp2 = fp2.concat(walkFolders(folder.subFolders, cb));
			console.debug('fp2');
			console.debug(fp2);
			// console.debug(folderPromises);
			});
			
			let rfp2 = await Promise.all(fp2);
			console.debug('rf2');
			console.debug(rfp2);
			console.debug('before fo ');
			console.debug(folderPromises);
			folderPromises = folderPromises.concat(fp2);
			console.debug('after fo ');
			console.debug(folderPromises);

			return folderPromises;
		}
	});

	return folderPromises;
}


// traverseFolders();

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

messenger.NotifyTools.onNotifyBackground.addListener(async (info) => {
	switch (info.command) {
	  case "doTest":
		//   Services.console.logStringMessage("mboximport_tests background");
		console.debug('check state');
		await traverseFolders();
		console.debug(bPage.t);
		// bPage.t += 2;
		return bPage.t;
	  break;
	}
  });
  

//   window.addEventListener("load", async function (event) {
// 	bPage = await browser.runtime.getBackgroundPage();
// 	bPage.t = 2;
// // await getMsgCount(folder);
// 	console.debug(`load ${bPage.t}`);

// 	await traverseFolders();
// 	console.debug(`load finish ${bPage.t}`);
// });
