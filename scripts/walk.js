
var f = [
	{ path: "\\Archives", subFolders: [] },
	{
		path: "\\inbox", subFolders: [
			{ path: "\\S1", subFolders: [] },
			{ path: "\\S2", subFolders: [] },
		]
	},
	{ path: "\\top three", subFolders: [] },
	{ path: "\\top four", subFolders: [] },
]



async function walkFolders(folders, cb) {
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

async function traverseFolders(rootFolderPath) {
	console.debug(await walkFolders(f, "cb"));
}

traverseFolders();