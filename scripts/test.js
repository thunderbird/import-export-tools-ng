
function normalizeModifiers(modifiers) {
	let r = /\s+/g
	let m = modifiers.replace(r, ',');
	r = /,+/g
	m = m.replace(r, ',');
	console.debug(m);
	let m1 = m.split(/,/);
	console.debug(m1);
}

var modifiers = " shift ,   control";
normalizeModifiers(modifiers);
