// background.js - this kicks off the WindowListener framework

console.debug('iet_tests Start');


var bPage;

var m = 0;
var s = "hello";
async function traverseFolders(rootFolderPath) {

	console.debug('traverse ' + bPage.t);
	bPage.t = 0;
	m = 0;
	let accountID = "account1";
	let account = await messenger.accounts.get(accountID);
	var folders = account.folders;
	var fArray = [];
	console.log(JSON.stringify(folders, null, 2));

	// console.debug(`count ${await getMsgCount(folders[2])}`);
	let fa = walkFolders(folders, getMsgCount);
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
	count += page.messages.length;
	while (page.id) {
		page = await messenger.messages.continueList(page.id);
		// console.debug(page.messages.length);
		count += page.messages.length;
	}
	console.debug('total ' + count + ' ' + m);
	m = m + count;
	bPage.t += count;
	console.debug('gm ' + bPage.t);
	return count;
}


async function walkFolders2(folders, cb) {
	console.debug('walk F');
	console.log(JSON.stringify(folders, null, 2));
	console.debug('after');

	var folderPromises = [];

	folders.forEach(async folder => {
		let mc = 3;
		folderPromises.push({ path: folder.path, msgCount: mc });
		console.debug(`FP ${folder.path} ${folder.subFolders}`);

		if (folder.subFolders.length) {
			var fp2 = [];
			folder.subFolders.forEach(async folder => {
				console.debug('recursive call ');
				let mc = 4;
				console.debug(`S FP ${folder.path} ${folder.subFolders}`);
				console.log(JSON.stringify(folder.subFolders, null, 2));
				// console.debug(folder.path);
				let fp = walkFolders(folder.subFolders, cb);
				console.log(JSON.stringify(fp, null, 2));
				fp2 = fp2.concat(fp);
				// console.debug('fp2');
				// console.debug(fp2);
				// console.debug(fp2[0]);
				console.log(JSON.stringify(fp2, null, 2));
				// console.debug(fp2[0].result);
			});

			let rfp2 = await Promise.all(fp2);
			console.debug('rf2');
			console.log(JSON.stringify(rfp2, null, 2));
			return rfp2;
			// console.debug(rfp2);
			console.debug('before fo ');
			console.debug(folderPromises);
			folderPromises = folderPromises.concat(rfp2);
			console.debug('after fo ');
			console.debug(folderPromises);

			return folderPromises;
		}
	});
	console.log(JSON.stringify(folderPromises, null, 2));
	return folderPromises;
}


function walkFolders(folders, cb) {
	console.debug('walk F');
	// console.log(JSON.stringify(folders, null, 2));
	// console.debug('after');

	var fs = [];

	folders.forEach(folder => {
		let mc = 3;
		fs.push({ path: folder.path, msgCount: mc });
		console.debug(`FP ${folder.path} ${folder.subFolders}`);

		if (folder.subFolders.length) {

			var fs2 = [];
			folder.subFolders.forEach(folder => {
				fs.push({ path: folder.path, msgCount: mc });
				console.debug(`FP ${folder.path} ${folder.subFolders}`);

				console.debug('Wf recursive call ');
				console.debug(`S FP ${folder.path} ${folder.subFolders}`);
				console.log(JSON.stringify(folder.subFolders, null, 2));
				fs2 = fs2.concat(walkFolders(folder.subFolders, cb));
				console.log(JSON.stringify(fs, null, 2));
			});
			fs = fs.concat(fs2);
		}
	});
	console.log(JSON.stringify(fs, null, 2));
	// return fs.concat(fp2);
	return fs;
}


window.addEventListener("load", async function (event) {
	bPage = await browser.runtime.getBackgroundPage();
	bPage.t = 2;
	// await getMsgCount(folder);
	console.debug(`load ${bPage.t}`);

	await traverseFolders();
	console.debug(`load finish ${bPage.t}`);
});
