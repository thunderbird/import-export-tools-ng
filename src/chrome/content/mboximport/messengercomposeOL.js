// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment
// Menus - Folder, messages, Tools


var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/utils.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/hotKeyUtils.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/composeOverlay.js", window, "UTF-8");

function onLoad() {
	// console.debug('Load messengercompose OL');

	WL.injectElements(`
<overlay id="composeOverlay"
xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">

<keyset id="IETNGKeys">
<key id="hot-key1" modifiers="" oncommand=""/>
<key id="hot-key2" modifiers="" oncommand=""/>
<key id="hot-key3" modifiers="" oncommand=""/>
<key id="hot-key4" modifiers="" oncommand=""/>
<key id="hot-key5" modifiers="" oncommand=""/>
<key id="hot-key6" modifiers="" oncommand=""/>
<key id="hot-key7" modifiers="" oncommand=""/>
<key id="hot-key8" modifiers="" oncommand=""/>
<key id="hot-key9" modifiers="" oncommand=""/>
<key id="hot-key10" modifiers="" oncommand=""/>

</keyset>
</overlay>
`);

window.setupHotKeys('compose');
}

