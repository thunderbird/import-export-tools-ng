// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment
// Menus - Folder, messages, Tools


Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/mboximport.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/exportTools.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/utils.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/hotKeyUtils.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/sdOverlay.js", window, "UTF-8");


function onLoad() {

	// vbox collapsed property needs to be removed, not set to false
	WL.injectElements(`

<vbox id="IETSearchFrame" insertbefore="status-bar" style="padding-left: 6px">
	<hbox>
	<vbox>
		<spacer flex="1" />
		<button label="__MSG_sdExportButton__" oncommand="SDexportMsg()"   />
		<spacer flex="1" />
	</vbox>
	
	<radiogroup id="IETall" orient="horizontal">
		<radio label="__MSG_sdAll__" selected="true"/>
		<radio label="__MSG_sdSelected__"/>
	</radiogroup>
	
	<groupbox style="padding-left: 30px">
	<hbox align="center">
	<label value="__MSG_sdFormat__:" />
	<menulist style="min-width:120px">
		<menupopup>
			<menuitem label="__MSG_sdEML__"/>
			<menuitem label="__MSG_sdHTML__"/>
			<menuitem label="__MSG_sdText__"/>
			<menuitem label="__MSG_sdSingleFile__"/>
			<menuitem id="mbox" label="__MSG_sdMBOX__" />
			<menuitem id="mbox2" label="__MSG_sdMBOX2__" />
			<menuitem id="csv" label="__MSG_asCSV__" />
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

`, []);

	window.setupHotKeys('search');
	window.SDinit();
}
