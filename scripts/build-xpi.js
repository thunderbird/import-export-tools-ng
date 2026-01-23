// cleidigh - build Thunderbird add-on - Use package configuration for XUL or hybrid with manifest
// v2.0 - only use manifest for version, remove rdf stuff

/* global process */

const fs = require('fs-extra');
const _7z = require('7zip-min');

// Configuration args

let targetName = '';

const sourceDir = process.env.npm_package_config_source_dir;
const targetDir = process.env.npm_package_config_target_dir;

const targetVersion = fs.readJsonSync(`${sourceDir}/manifest.json`).version;

const targetBaseName = process.env.npm_package_name;
const targetSuffix = process.env.npm_package_config_target_suffix || '';
const targetExtension = process.env.npm_package_config_target_extension || '';
const includeManifest = (process.env.npm_package_config_target_include_manifest === 'true') ? true : false;


// Validate configuration properties

try {
	if (typeof targetBaseName !== 'string') {
		throw 'No targetBasedName';
	}
	if (typeof targetVersion !== 'string') {
		throw 'No targetVersion';
	}
	if (typeof sourceDir !== 'string') {
		throw 'No Source Directory';
	}
	if (typeof targetDir !== 'string') {
		throw 'No targetDir';
	}

	targetName = `${targetBaseName}-${targetVersion}${targetSuffix}${targetExtension}`;
} catch (error) {
	console.error('Build Error: ' + error);
	return 1;
}

console.log('Building Target::\n');
console.log('TargetName:\t\t' + targetName );

// 7z adds to existing archive - must delete old first
if (fs.existsSync(`${targetDir}/${targetName}`)) {
	console.log('Target Exists:\t\tRemoving old target');
	fs.unlinkSync(`${targetDir}/${targetName}`);
}


// const extraFiles = ['LICENSE', 'CHANGELOG.md'];
// const extraFiles = ['LICENSE'];
const extraFiles = [];

console.log('\nVersioning:\n  Target:\t\t' + targetVersion);

let _7zCommand = ['a', `${targetDir}/${targetName}`, `${sourceDir}/*`, `-x@./src/.tb-hybrid-ignore`];

function _7CmdSync(_7zCommand) {
	return new Promise((resolve, reject) => {

		console.error(_7zCommand);
		_7z.cmd(_7zCommand, err => {
			if (err) reject(err);
			else resolve();
		});

	});
}

// Create xpi archive using exclude file

async function buildArchive() {

	console.log(`\nCreating XPI archive: ${targetName}\n`);

	try {
		await _7CmdSync(_7zCommand);

		console.log(`Add Extra Files:`);
		for (const file of extraFiles) {
			console.log(`  ${file}`);

			_7zCommand = ['a', `${targetDir}/${targetName}`, `${file}`];
			await _7CmdSync(_7zCommand);
		}

		console.log('\nArchive Complete: ' + targetName + ` [ manifest: ${includeManifest} ]`);

	} catch (error) {
		console.error('Archive Error:\n ' + error);
	}
}

buildArchive();
