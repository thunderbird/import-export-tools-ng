/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
// Copyright Christopher Leidigh (2020)

/* global
IETprefs,
IETlogger,
IETgetComplexPref,

*/

// basic hot key support - no UI configuration

// Up to 10 hotkeys can be defined in:
// extensions.importexporttoolsng.experimental.hot_keys

// example hot key entry (array of JSON objects)
// id		- the key index (1-10)
// either key or keycode may be included , but not both
//   key			- the key ( single character)
//   keycode		- the 'VK_*' defind keycode
// modifiers	- the key modifiers, space separated list ('control', 'shift', 'alt', 'accel')
// oncommand	- a direct command string
// contexts 		- the window context where the key is active
//    'all' - all windows under messenger
//    'messenger' - the main messenger window and its descendents (currently equivalent to al
//    'compose' - the message compose window


// [{"id": "1", "key": "K", "modifiers": "control shift", "oncommand": "updateHotKeys()", "contexts": "all"}, {"id": "2", "key": "D", "modifiers": "control shift", "oncommand": "alert('testD')", "contexts": "all"}]
// [{"id": "1", "key": "P", "modifiers": "control shift", "oncommand": "goDoCommand('cmd_printpreview')"}, {"id": "2", "key": "D", "modifiers": "control shift", "oncommand": "exportSelectedMsgs(5)"}]
// [{"id": "1", "key": "P", "modifiers": "control shift", "oncommand": "goDoCommand('cmd_printpreview')", "contexts": "messenger"}, {"id": "2", "key": "D", "modifiers": "control shift", "oncommand": "exportSelectedMsgs(5)", "contexts": "messenger"},  {"id": "3", "key": "Y", "modifiers": "control shift", "oncommand": "alert('hk3 all')", "contexts": "all"}, {"id": "4", "key": "P", "modifiers": "control shift", "oncommand": "goDoCommand('cmd_printPreview')", "contexts": "compose" }]

function normalizeModifiers(modifiers) {
	// make everything lowercase
	modifiers = modifiers.toLowerCase();
	var accelKey = "control";// key			- the key ( single character)
	if (navigator.platform.toLowerCase().indexOf("mac") > -1) {
		accelKey = "command";
	}
	modifiers = modifiers.replace("accel", accelKey);
	// strip extraneous whitespace, split on spaces or comma
	return modifiers.split(/[ ,]+/).filter(Boolean);
}

function compareModifiers(modifiers1, modifiers2) {
	// normalize into a array
	let m1Array = normalizeModifiers(modifiers1);
	let m2Array = normalizeModifiers(modifiers2);
	// console.debug(`Modifiers: ${m1Array} : ${m2Array}`);

	// We do not care about order
	// modifiers are equal if equal length and
	// each modifier is included
	if (m1Array.length !== m2Array.length) {
		return false;
	}
	for (let i = 0; i < m1Array.length; i++) {
		if (!m2Array.includes(m1Array[i])) {
			return false;
		}
	}
	return true;
}

function getCurrentKeys() {
	// console.debug('current K');
	let keySets = document.getElementsByTagName("keyset");
	// console.debug(keySets.outerHTML);
	IETlogger.write('ksets ' + keySets.length);
	for (let i = 0; i < keySets.length; i++) {
		const keyset = keySets[i];
		IETlogger.write('keySet: ' + keyset.id);
		var keyElements = keyset.childNodes;
		for (let [index, keyElement] of keyElements.entries()) {
			// console.debug(keyElement);
			IETlogger.write(`  key[${index}]: ` + keyElement.outerHTML.replace(/xmlns="[^"]+"/, ''));
		}
		IETlogger.write('\n');
	}

	let existingKeys = document.getElementsByTagName("key");
	var filteredKeys = [];
	for (let i = 0; i < existingKeys.length; i++) {
		const element = existingKeys[i];
		// IETlogger.write('check key ' + element.id + ' : ' + element.id.split("hot-key")[0]);
		if (element.id.indexOf("hot-key") === 0) {
			// IETlogger.write('skip');
			continue;
		} else {
			filteredKeys.push(element);
		}
	}
	return filteredKeys;
}

function compareKeyDefinition(hotKey, keyElement) {
	let keyElementKey = keyElement.getAttribute("key").toLowerCase() || null;
	let keyElementKeycode = keyElement.getAttribute("keycode").toLowerCase() || null;

	if (!!hotKey.key && hotKey.key.toLowerCase() !== keyElementKey) {
		return false;
	} else if (!!hotKey.keycode && hotKey.keycode.toLowerCase() !== keyElementKeycode) {
		return false;
	}



	let keyElementModifiers = keyElement.getAttribute("modifiers") || "";
	if (keyElementKey) {
		IETlogger.write('compare key/Modifiers: ' + hotKey.key + ' =? ' + keyElement.getAttribute("key"));

	} else {
		IETlogger.write('compare keycode/Modifiers: ' + hotKey.keycode + ' =? ' + keyElement.getAttribute("keycode"));
	}
	return compareModifiers(hotKey.modifiers, keyElementModifiers);
}

function setupHotKeys(contexts) {
	// console.debug('setupHotKs ' + contexts);
	var hotKeysStr = IETgetComplexPref("extensions.importexporttoolsng.experimental.hot_keys");

	IETlogger.write('Setup hot-keys: ' + contexts);
	var existingKeys = getCurrentKeys();

	IETlogger.write(hotKeysStr);

	// console.debug('HotK ' + hotKeysStr);

	if (hotKeysStr !== "") {
		try {
			var hotKeysArray = JSON.parse(hotKeysStr);
			// console.debug(hotKeysArray);
			for (let index = 0; (index < hotKeysArray.length && index < 10); index++) {
				var hotKey = hotKeysArray[index];
				if (hotKey) {
					// console.debug(hotKey);
					// check that we have either 'key' or 'keycode' not both
					if (!!hotKey.key && !!hotKey.keycode) {
						console.debug('HotKey with both key and keycode');
					}

					// check context (window)
					if (hotKey.contexts.includes('all') || hotKey.contexts.includes(contexts)) {

						let id = hotKey.id || "";
						if (id === "" || id < 1 || id > 10) {
							console.debug('bad ID');
							continue;
						}

						let hkeyElement = document.getElementById(`hot-key${id}`);
						// console.debug(`hot-key${id} ${hkeyElement.outerHTML}`);

						let key = hotKey.key || null;
						let keycode = hotKey.keycode || null;

						if (key !== null && key.length !== 1) {
							console.debug('Bad hotkey: invalid key');
						}

						if (keycode !== null && keycode.indexOf("VK_") !== 0) {
							console.debug('Bad hotkey: invalid keycode');
						}

						let modifiers = hotKey.modifiers || "";
						let oncommand = hotKey.oncommand || "";

						if (key) {
							hkeyElement.setAttribute("key", key);
							hkeyElement.removeAttribute("keycode");
						} else {
							hkeyElement.setAttribute("keycode", keycode);
							hkeyElement.removeAttribute("key");
						}
						hkeyElement.setAttribute("modifiers", modifiers);
						hkeyElement.setAttribute("oncommand", oncommand);
						// console.debug(hkeyElement.outerHTML);
						IETlogger.write('Add key: ');
						IETlogger.write(hotKey);
						for (let i = 0; i < existingKeys.length; i++) {
							// IETlogger.write('compare ' + hotKey.key);
							// IETlogger.write(existingKeys[i].outerHTML);
							let kc = compareKeyDefinition(hotKey, existingKeys[i]);
							if (kc) {
								existingKeys[i].setAttribute("disabled", "true");
								IETlogger.write('Disable existing key: ' + existingKeys[i].outerHTML);
								console.debug('disable existing G '  + existingKeys[i].outerHTML);
							}
						}
					}
				} else {
					continue;
				}

			}
			
			let keyset = document.getElementById("tasksKeys");
			keyset.parentNode.appendChild(keyset);
			// console.debug(keyset.outerHTML);
			// console.debug('updated messenger  ');

			keyset = document.getElementById("editorKeys");
			if (keyset) {
				keyset.parentNode.appendChild(keyset);
				// console.debug('updated editor ');
			}

			keyset = document.getElementById("mailKeys");
			if (keyset) {
				keyset.parentNode.appendChild(keyset);
				// console.debug('updated mail keys ');
			}

			keyset = document.getElementById("IETNGKeys");
			if (keyset) {
				keyset.parentNode.appendChild(keyset);
				console.debug('updated iet keys ');
			}

		} catch (error) {
			console.debug('Bad hot key format:\n' + error);
		}
	}
}


function updateHotKeys() {
	setupHotKeys();
	let keyset = document.getElementById("tasksKeys");
	// console.debug('UpdateKeys');
	keyset.parentNode.appendChild(keyset);
	// console.debug('messenger keys');
	keyset = document.getElementById("editorKeys");
	if (keyset) {
		keyset.parentNode.appendChild(keyset);
		// console.debug('updated editor ');
	}
	keyset = document.getElementById("mailKeys");
	if (keyset) {
		keyset.parentNode.appendChild(keyset);
		// console.debug('updated mail keys ');
	}

}

var hkObserver = {
	observe: function (aSubject, aTopic, aData) {
		console.debug('IET: Hot key change');
		updateHotKeys();
	},
};

function setupHotKeysObserver() {
	// console.debug('observers configuration');
	IETprefs.addObserver("extensions.importexporttoolsng.experimental.hot_keys", hkObserver, false);
}
