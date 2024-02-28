// messengerOL - overlay loader for messenger.xul - Source: mboximport.xul

// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment
// Menus - Folder, messages, Tools

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');
window.ietngAddon = {};
window.ietngAddon.window = window;

Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/mboximport.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/exportTools.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/utils.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/hotKeyUtils.js", window, "UTF-8");


// Setup for notifyTools
var ADDON_ID = "ImportExportToolsNG@cleidigh.kokkini.net";

var { ExtensionParent } = ChromeUtils.import("resource://gre/modules/ExtensionParent.jsm");

// Get our extension object.
let extension = ExtensionParent.GlobalManager.getExtension(ADDON_ID);

// Load notifyTools into a custom namespace, to prevent clashes with other add-ons.

Services.scriptloader.loadSubScript(extension.rootURI.resolve("chrome/content/mboximport/modules/notifyTools.js"), window.ietngAddon, "UTF-8");
window.ietngAddon.extension = WL.extension;

Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/expMenuDispatcher.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/wextAPICmds.js", window, "UTF-8");

function onLoad() {
	//console.debug('messenger OL');

	WL.injectElements(`
<hbox id="status-bar" >
<toolbarbutton id="IETabortIcon" image="chrome://mboximport/content/mboximport/icons/stop.gif" oncommand="IETabortExport()" collapsed="true" tooltiptext="__MSG_abortExport__" insertbefore="statusText"/>
</hbox>
`, []);


	// HotKeys overlay fragment

	WL.injectElements(`
<overlay id="messengerOverlay"
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
`, []);


	// inject extension object into private context
	window.ietng = {};
	window.ietng.extension = WL.extension;

	window.ietng.OpenBackupDialog = function (mode = "auto") {
		Services.console.logStringMessage("Start backup check");
		let last = Services.prefs.getIntPref("extensions.importexporttoolsng.autobackup.last");
		let now = new Date();
	
		// Abort in automode, if not yet due.
		if (mode == "auto") {
			let frequency = Services.prefs.getIntPref("extensions.importexporttoolsng.autobackup.frequency");
			if (frequency === 0)
				return;
			
			if (frequency === 99)
				frequency = 0.001;
		
			let time = now.getTime() / 1000;
			let days = 24 * 60 * 60 * frequency;
			// let days = 0.005;
			console.debug('OverlayBackup');
			console.debug(time-last);
			console.debug(days);
		
			if ((time - last) < (days - (60 * 5)))
				return;
		}
	
		if (Services.prefs.getBoolPref("extensions.importexporttoolsng.autobackup.use_modal_dialog")) {
			window.openDialog("chrome://mboximport/content/mboximport/autobackup.xhtml", "", "chrome,centerscreen,modal", last, now, mode);
		} else {
			window.openDialog("chrome://mboximport/content/mboximport/autobackup.xhtml", "", "chrome,centerscreen", last, now, mode);
		}
	}
	

	let ctxMenu =
		`<menupopup>
			<menu  label="__MSG_buttonMenu_Exp_Profile_Id.title__" >
			<menupopup>
			<menuitem  label="__MSG_buttonMenu_Exp_ProfileFull_Id.title__" oncommand="IETexport_all({profileExportType: 'full'})" />
			<menuitem  label="__MSG_buttonMenu_Exp_ProfileMailOnly_Id.title__" oncommand="IETexport_all({profileExportType: 'mailOnly'})" />
			</menupopup>
			</menu>
			<menuitem  label="__MSG_buttonMenu_Imp_Profile_Id.title__" oncommand="openProfileImportWizard()" />
			<menuitem  label="__MSG_buttonMenu_Backup_Id.title__" oncommand="window.ietng.OpenBackupDialog('manual')" />
			<menuseparator />
			<menuitem  label="__MSG_buttonMenu_Options.title__" oncommand="openIEToptions()"/>
			<menuitem  label="__MSG_buttonMenu_Help.title__" oncommand="openHelp(null)"/>
		</menupopup>`;

	let dtdFiles = [];

	addTBbuttonMainFuncOrCtxMenu(ADDON_ID, "unified-toolbar-button", null, ctxMenu, [dtdFiles]);

	
function addTBbuttonMainFuncOrCtxMenu(addOnId, toolbarClass, mainButtFunc, buttCtxMenu, ctxMenuDTDs) {
	// width of ucarret dropdown area in px
	const dropdownTargetWidth = 21;
	// we need tabmail for its tabMonitor
	var tabmail = document.getElementById("tabmail");

	if (!mainButtFunc && !buttCtxMenu) {
		// can't operate on ziltch
		return false;
	}

	// The toolbar buttons are added in a lazy fashion. They do not get
	// placed in the toolbar DOM at install or startup, instead they 
	// get added the fist time either the 3Pane or a messageDisplay tab
	// is focused. We therefore use a tabmonitor to listen when we have
	// our button we can add the listener. We then remove the tabmonitor.

	var tabMonitor = {
		monitorName: "tbButtonListenerMonitor",

		onTabTitleChanged() { },
		onTabOpened() { },
		onTabPersist() { },
		onTabRestored() { },
		onTabClosing() { },

		async onTabSwitched(newTabInfo, oldTabInfo) {
			// console.log(newTabInfo.mode?.name)
			if (newTabInfo.mode?.name == "mail3PaneTab" || newTabInfo.mode?.name == "mailMessageTab") {
				await setup();
			}
		}
	}

	// register tabmonitor for setting up listener
	tabmail.registerTabMonitor(tabMonitor);
	return true;

	// Setup parent div listener according to parameters.
	// Wait until button is installed to add listener.

	async function setup() {
		var tbExtButton;
		for (var index = 0; index < 100; index++) {
			tbExtButton = document.querySelector(`button.${toolbarClass}[extension="${addOnId}"]`);
			if (tbExtButton) {
				break;
			}
			await new Promise(resolve => window.setTimeout(resolve, 1));
		}

		if (!tbExtButton) {
			console("Exception: Extension button not found on toolbar")
			return;
		}
		// get parent div for listener
		let listenerTarget = tbExtButton.parentElement;
		let listenerTargetId = `tbButtonParentListenerDiv_${addOnId}`;
		listenerTarget.setAttribute("id", listenerTargetId);

		// setup for context menu if requested
		if (buttCtxMenu) {
			let ctxMenuXML = `<div id="${listenerTargetId}"> ${buttCtxMenu} </div>`;
			try {
				WL.injectElements(ctxMenuXML, ctxMenuDTDs);
			} catch (e) {
				console.log("Exception adding context menu:", e);
				return;
			}
		}

		// we setup our listener on the button container parent div
		// key is to use the capture phase mode, this follows the propagation from the
		// top of the DOM down and proceeds the bubbling phase where our listener would 
		// be blocked by the normal button listener 
		listenerTarget.addEventListener('click', listenerFunc, true);
		tabmail.unregisterTabMonitor(tabMonitor);
	}

	// Listener function called when on mail type tabs, however we need
	// to poll for button. Not ideal, but given it's not instant no
	// beter way. Setup according to call params. Kill unnecessary tabmonitor.

	function listenerFunc(e) {
		e.stopImmediatePropagation();
		e.stopPropagation();

		if (e.target.nodeName == "menuitem") {
			return;
		}
		if (mainButtFunc && !buttCtxMenu) {
			// only a main click action
			mainButtFunc();
			return;
		}

		let tbExtButton = document.querySelector(`button.${toolbarClass}[extension="${addOnId}"]`);
		// get click location and determine if in dropdown window if split button
		let targetDivBRect = tbExtButton.getBoundingClientRect();
		let inTargetWindow = e.clientX > (targetDivBRect.x + targetDivBRect.width - dropdownTargetWidth);
		// open context menu if configure
		if ((buttCtxMenu && !mainButtFunc) || (buttCtxMenu && inTargetWindow)) {
			tbExtButton.nextElementSibling.openPopup(tbExtButton, "after_start", 0, 0, false, false);
		} else {
			mainButtFunc();
		}
	};
}


	window.setupHotKeys('messenger');
	window.addHotKeysObserver();
}

function onUnload() {
	window.removeHotKeysObserver();
	window.ietng.OpenBackupDialog();
	window.ietngAddon.notifyTools.removeAllListeners();
}