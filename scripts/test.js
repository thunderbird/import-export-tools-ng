
function normalizeModifiers(modifiers) {
	// make everything lowercase
	modifiers = modifiers.toLowerCase();
	// strip extraneous whitespace, split on spaces or comma
	return modifiers.split(/[ ,]+/).filter(Boolean);
}

function compareModifiers(modifiers1, modifiers2) {
	// normalize into a array
	let m1Array = normalizeModifiers(modifiers1);
	let m2Array = normalizeModifiers(modifiers2);
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

var modifiers = ",,alt shift ,   control  os, accel";
var modifiers2 = ",, shift ,   control  accel os,alt   ";

console.debug(compareModifiers(modifiers, modifiers2));

var id = "hot-key1";
var id2 = "hot-ke2";
console.debug(id.indexOf('hot-key'));
console.debug(id2.indexOf('hot-key'));