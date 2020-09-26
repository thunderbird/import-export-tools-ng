// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment
// Menus - Folder, messages, Tools

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

	Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/mboximport.js", window, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/exportTools.js", window, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/menufunctions.js", window, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/utils.js", window, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/hotKeyUtils.js", window, "UTF-8");
	Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/sdOverlay.js", window, "UTF-8");


function onLoad() {
	// Services.console.logStringMessage("SearchDialogue OL");

	WL.injectElements(`
	<overlay id="sdOverlay"
		 xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
		 xmlns:html="http://www.w3.org/1999/xhtml">
		 

<vbox id="IETSearchFrame" insertbefore="status-bar" collapsed="true">
	<hbox>
	<vbox>
		<spacer flex="1" />
		<button label="&sdExportButton;" oncommand="SDexportMsg()"   />
		<spacer flex="1" />
	</vbox>
	<groupbox>
	<radiogroup id="IETall" orient="horizontal">
		<radio label="&sdAll;" selected="true"/>
		<radio label="&sdSelected;"/>
	</radiogroup>
	</groupbox>
	</hbox>
	<hbox>
	<groupbox>
	<hbox align="center">
	<label value="&sdFormat;:" />
	<menulist style="min-width:240px">
		<menupopup>
			<menuitem label="&sdEML;"/>
			<menuitem label="&sdHTML;"/>
			<menuitem label="&sdText;"/>
			<menuitem label="&oneFile;"/>
			<menuitem id="mbox" label="&sdMBOX;" />
			<menuitem id="mbox2" label="&sdMBOX2;" />
			<menuitem id="csv" label="&asCSV;" />
		</menupopup>
	</menulist>
	</hbox>
	</groupbox>
	</hbox>
</vbox>

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

`, ["chrome://mboximport/locale/mboximport.dtd"]);

window.setupHotKeys('search');
window.SDinit();

}
