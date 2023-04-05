// expMenuDispatcher
console.log("load")
async function expMenuDispatcher(data) {
	console.log("mdis: ", data)
	await exportSelectedMsgs(0);
	return true;
}

function onUnload() {
	console.log("unload")
}
// exp listener
var listener_id = window.ietngAddon.notifyTools.addListener(expMenuDispatcher);
