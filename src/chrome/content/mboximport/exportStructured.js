var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
var { OS } = ChromeUtils.import("resource://gre/modules/osfile.jsm");

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");
Services.scriptloader.loadSubScript(
	ExtensionParent.GlobalManager.getExtension("ImportExportToolsNG@cleidigh.kokkini.net").rootURI.resolve("chrome/content/mboximport/notifyTools.js"),
	window,
	"UTF-8"
);


console.debug('export structured');

async function etest(folder, file) {
	console.debug('export structured function');
	var acctMgr = Cc['@mozilla.org/messenger/account-manager;1'].getService(Components.interfaces.nsIMsgAccountManager);
	var accounts = acctMgr.accounts;
	for (var i = 0; i < accounts.length; i++) {
		var account = accounts[i];
		if(account.incomingServer.key === folder.server.key) {
			break;
		}
		// console.log(accountName.prettiestName);
		//checkSubFolders(accountname);
	}
		console.debug(folder.server.key);
		console.debug(account.key);
		let m = await notifyTools.notifyBackground({ command: "doTest", options: { account: account.key } });
		// Services.console.logStringMessage(m[0].path);
		console.debug(...m);
		console.debug(file.path);
		let ef = m.filter(f => f.path.includes(folder.name));
		console.debug(...ef);
		// console.debug([...ef]);
		var rootPath = file.path.replaceAll('\\', '/');
		var flist = [];
		for (let lf of ef) {
			// lf = OS.Path.join(rootPath, lf);
			lf.OSpath = rootPath + lf.path;

			lf.folder = folder.findSubFolder(lf.name);
			console.debug(lf);
			// await OS.File.makeDir(lf2, {from: rootPath+"/etest"});
			// await OS.File.makeDir(lf2, {from: rootPath+"etest"});
			await OS.File.makeDir(lf.OSpath);
			flist.push(lf);
		};

		console.debug(flist);

		return flist;
	}