const path = require('path');
const prettier = require("prettier");
const fs = require('fs-extra');
// import {FluentBundle, FluentResource} from "@fluent/bundle";
const ftl = require("@fluent/bundle");


function parseEntry(ftlEntry) {
	var messagesOut = {};
	let id = ftlEntry[0].replace('-', '_');
	let idMain = ftlEntry[1].value;
	let idAttributes = ftlEntry[1].attributes;

	// console.debug(`${id}  ${idMain}`);
	if (idMain) {
		messagesOut[id].message = idMain;
	}

	Object.keys(idAttributes).forEach(attr => {
		let mKey = id + '_' + attr;
		let val = idAttributes[attr];

		messagesOut[mKey] = {};
		messagesOut[mKey].message = val;
		// console.debug(val);
	})
	console.debug(messagesOut);
	console.debug('\nMessage');
	return messagesOut;
}

function JSONstringifyOrder( obj, space )
{
    var allKeys = [];
    JSON.stringify( obj, function( key, value ){ allKeys.push( key ); return value; } )
    allKeys.sort();
    return JSON.stringify( obj, allKeys, space );
}

function genMessagesJSON(ftlArray) {
	var messagesOut = {};

	ftlArray.forEach(ftlEntry => {
		let e = parseEntry(ftlEntry);
		messagesOut = { ...messagesOut, ...e};
	});

	console.debug('final');
	console.debug(messagesOut);
	let j = JSONstringifyOrder(messagesOut, 2);
	// let j = JSON.stringify(messagesOut, Object.keys(messagesOut).sort(), 2);
	// let j = JSON.stringify(messagesOut, null, 2);

	// let o = prettier.format(JSON.stringify(messagesOut), { parser: 'json'});
	console.debug(j);
}

let s = fs.readFileSync(".\\scripts\\wizard2.ftl", { encoding: 'utf8' });
console.debug(s);
let resource = new ftl.FluentResource(s);

// let resource = new ftl.FluentResource(`
// -brand-name = Foo 3000
// welcome = Welcome, {$name}, to {-brand-name}!
// `);

let bundle = new ftl.FluentBundle("en-US");
let errors = bundle.addResource(resource);
if (errors.length) {
    // Syntax errors are per-message and don't break the whole resource
}



// console.debug(bundle);
// console.debug(bundle.keysFromBundle(bundle));
let t = bundle.getMessage("wizard-win-button-back");
// console.debug(t.attributes.label);
// console.debug(bundle._messages.Map['wizard-win-button-back'].id);
let m = [...bundle._messages];
// console.debug(m[0]);
// (console.debug(Object.keys(m[0][1].attributes));)

genMessagesJSON(m);

