// messengerOL - overlay loader for messenger.xul - Source: mboximport.xul

// Load all scripts from original overlay file - creates common scope
// onLoad() installs each overlay xul fragment
// Menus - Folder, messages, Tools

var { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/mboximport.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/exportTools.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/menufunctions.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/utils.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/hotKeyUtils.js", window, "UTF-8");
Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/messengerOverlay.js", window, "UTF-8");
// Services.scriptloader.loadSubScript("chrome://mboximport/content/mboximport/autobackup2.js", window, "UTF-8");


function onLoad() {
	// console.debug('messenger OL');

	// FolderPane Menu
	WL.injectElements(`
	<popup id="folderPaneContext">
	<menuseparator id="IETsep" />
	<menu label="&labelmenuMItools;" id="IETmenu">
		<menupopup id="mbxpopup" onpopupshowing="IETsetMBmenu();">
			<menuitem id="mboxexport" label="" oncommand="exportfolder(false,false,true,false);" />
			<menuitem id="mboxexportZIP" label="&exportZIP;" oncommand="exportfolder(false,false,true,true);" />
			<menuitem id="mboxexportallstruct" label="&exportAllStruct;" oncommand="exportfolder(true,true,true,false);" collapsed="true" />
			<menuitem id="mboxexportstruct" label="&exportStruct;" disabled="true" oncommand="exportfolder(true,true,true,false);" />
			<menuitem id="mboxexportsub" label="&exportWithSub;" disabled="true" oncommand="exportfolder(true,false,true,false);" />
			<menuitem id="mboxexportRemote" label="&exportRemoteFolder;" oncommand="exportfolder(false,false,false,false);" />
			<menuseparator />
			<menu label="&allMsgsFolder;" id="exportALLMSG">
				<menupopup>
					<menuitem id="allAsEML" label="&asEML;" oncommand="exportAllMsgs(0, this)" />
					<menuitem id="allAsHTML" label="&asHTML;" oncommand="exportAllMsgs(1)" />
					<menuitem id="allAsHTMLatt" label="&asHTML; &withattach;" oncommand="exportAllMsgs(8)" />
					<menuitem id="allAsTXT" label="&asTXT;" oncommand="exportAllMsgs(2)" />
					<menuitem id="allAsTXTatt" label="&asTXT; &withattach;" oncommand="exportAllMsgs(9)" />
					<menuitem id="allAsOneTXT" label="&oneFile;" oncommand="exportAllMsgs(4)" />
					<menuitem id="allAsOneTXTatt" label="&oneFile; &withattach;" oncommand="exportAllMsgs(7)" />
					<menuitem id="allCSV" label="&asCSV;" oncommand="exportAllMsgs(6)" />
					<menuitem id="allAsPdf" label="&asPDF;" oncommand="IETprintPDFmain.print(true)" />
					<menuseparator />
					<menuitem id="justIndex" label="&justIndex; &iHTML;" oncommand="exportAllMsgs(3)" />
					<menuitem id="justIndexCSV" label="&justIndex; &iCSV;" oncommand="exportAllMsgs(5)" />
				</menupopup>
			</menu>
			<menuseparator />
			<menuitem id="searchAndexport" label="&searchAndExport;" oncommand="searchANDsave();" />
			<menuseparator />
			<menuitem id="mboximport" label="&importMbox;" oncommand="openMboxDialog()" />
			<menuitem id="mboximportMD" label="&importMAILDIR;" oncommand="trytocopyMAILDIR()" />
			<menuitem id="mboximportEML" label="&importEML;" oncommand="importEMLs();" />
			<menu id="mboximportALLEML" label="&importALLEML;">
				<menupopup>
					<menuitem id="mboximportALLEML1" label="&importALLEML1;" oncommand="importALLasEML(false)" />
					<menuitem id="mboximportALLEML2" label="&importALLEML2;" oncommand="importALLasEML(true)" />
				</menupopup>
			</menu>
			<menuseparator />
			<menuitem id="copyFolderPath" label="&copyFolderPath;" oncommand="IETcopyFolderPath();" />
			<menuitem id="openFolderPath" label="&openFolderPath;" oncommand="IETopenFolderPath();" />
			<menuseparator />
			<menuitem id="openIEToptions" label="&options;" oncommand="openIEToptions()" />
			<menuitem id="openIEThelp1" label="&helpMenuWin.label;" oncommand="openIEThelp(true)" />
		</menupopup>
	</menu>
	</popup>


	

	`, ["chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);

	// FileMenu

	WL.injectElements(`
<menupopup id="menu_FilePopup">
<menu label="&saveSelected;" id="multipleSave" insertafter="menu_close">
	<observes element="printMenuItem" attribute="disabled" />
	<menupopup>
		<menuitem id="selAsEML" label="&asEML;" oncommand="exportSelectedMsgs(0)" />
		<menuitem id="selAsHTML" label="&asHTML;" oncommand="exportSelectedMsgs(1)" />
		<menuitem id="selAsHTMLatt" label="&asHTML; &withattach;" oncommand="exportSelectedMsgs(8)" />
		<menuitem id="selAsTXT" label="&asTXT;" oncommand="exportSelectedMsgs(2)" />
		<menuitem id="selAsTXTatt" label="&asTXT; &withattach;" oncommand="exportSelectedMsgs(9)" />
		<menuitem id="selAsCSV" label="&asCSV;" oncommand="exportSelectedMsgs(7)" />
		<menuitem id="selAsMbox1" label="&asMBOX;" oncommand="exportSelectedMsgs(3)" />
		<menuitem id="selAsMbox2" label="&asMBOX2;" oncommand="exportSelectedMsgs(4)" />
		<menuitem id="selAsPdf" label="&asPDF;" oncommand="IETprintPDFmain.print(false)" />
		<menuseparator />
		<menu id="selWithIndex" label="&withIndexLabel;">
		<menuseparator />
		<menuitem id="openIEToptions" label="&options;" oncommand="openIEToptions()" />
			<menupopup>
				<menuitem label="&asEML;" oncommand="exportSelectedMsgs(100)" />
				<menuitem label="&asHTML;" oncommand="exportSelectedMsgs(101)" />
				<menuitem label="&asHTML; &withattach;" oncommand="exportSelectedMsgs(108)" />
				<menuitem label="&asTXT;" oncommand="exportSelectedMsgs(102)" />
				<menuitem label="&asTXT; &withattach;" oncommand="exportSelectedMsgs(109)" />
			</menupopup>
		</menu>
		<menuseparator />
		<menuitem id="selAsIndex1" label="&justIndex; &iHTML;" oncommand="exportSelectedMsgs(5)" />
		<menuitem id="selAsIndex2" label="&justIndex; &iCSV;" oncommand="exportSelectedMsgs(6)" />
	</menupopup>
		<menuseparator />
		<menuitem id="openIEToptions" label="&options;" oncommand="openIEToptions()" />
		<menuitem id="openIEThelp2" label="&helpMenuWin.label;" oncommand="openIEThelp(true)" />

</menu>
<menuseparator insertafter="menu_close" />
</menupopup>
`, ["chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);

	// MessagePopUp - clipboard actions
	WL.injectElements(`
<menupopup id="messageMenuPopup">
<menu label="&toClipMenu;" id="copyToClip" accesskey="&clipMenuAccesskey;">
	<observes element="cmd_reply" attribute="disabled" />
	<menupopup>
		<menuitem label="&copyClipMessage;" oncommand="copyMSGtoClip()" />
		<menuitem label="&copyClipHeaders;" oncommand="copyHeaders.start()" />
	</menupopup>
</menu>
</menupopup>
`, ["chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);

	WL.injectElements(`
<menupopup id="taskPopup">
<menu label="&labelmenuMItools;" insertbefore="javaScriptConsole" accesskey="&taskMenuAccesskey;">
	<menupopup id="mboxpopup2" onpopupshowing="IETsetMBmenu2(this);" mboxIndex="2">
		<menuitem id="mboxexportnofolder2" label="&noFolderSelectedMenuTop;" hidden="true" oncommand="noFoldersSelectedAlert();"/>
		<menuitem id="mboxexport2" label="" oncommand="exportfolder(false,false,true,false);" />
		<menuitem id="mboxexportZIP2" label="&exportZIP;" oncommand="exportfolder(false,false,true,true);" />
		<menuitem id="mboxexportallstruct2" label="&exportAllStruct;" oncommand="exportfolder(true,true,true,false);" collapsed="true" />
		<menuitem id="mboxexportstruct2" label="&exportStruct;" oncommand="exportfolder(true,true,true,false);" />
		<menuitem id="mboxexportsub2" label="&exportWithSub;" disabled="true" oncommand="exportfolder(true,false,true,false);" />
		<menuitem id="mboxexportRemote2" label="&exportRemoteFolder;" oncommand="exportfolder(false,false,false,false);" />
		<menuseparator />
		<menu label="&allMsgsFolder;" id="exportALLMSG2">
			<menupopup>
				<menuitem id="allAsEML2" label="&asEML;" oncommand="exportAllMsgs(0, this)" />
				<menuitem id="allAsHTML2" label="&asHTML;" oncommand="exportAllMsgs(1)" />
				<menuitem id="allAsHTML2att" label="&asHTML; &withattach;" oncommand="exportAllMsgs(8)" />
				<menuitem id="allAsTXT2" label="&asTXT;" oncommand="exportAllMsgs(2)" />
				<menuitem id="allAsTXT2att" label="&asTXT; &withattach;" oncommand="exportAllMsgs(9)" />
				<menuitem id="allAsOneTXT2" label="&oneFile;" oncommand="exportAllMsgs(4)" />
				<menuitem id="allAsOneTXT2att" label="&oneFile; &withattach;" oncommand="exportAllMsgs(7)" />
				<menuitem id="allAsCSV2" label="&asCSV;" oncommand="exportAllMsgs(6)" />
				<menuitem id="allAsPdf2" label="&asPDF;" oncommand="IETprintPDFmain.print(true)" />
				<menuseparator />
				<menu id="selWithIndex2" label="&withIndexLabel;">
					<menupopup>
						<menuitem label="&asEML;" oncommand="exportSelectedMsgs(100)" />
						<menuitem label="&asHTML;" oncommand="exportSelectedMsgs(101)" />
						<menuitem label="&asHTML; &withattach;" oncommand="exportSelectedMsgs(108)" />
						<menuitem label="&asTXT;" oncommand="exportSelectedMsgs(102)" />
						<menuitem label="&asTXT; &withattach;" oncommand="exportSelectedMsgs(109)" />
					</menupopup>
				</menu>
				<menuseparator />
				<menuitem id="justIndex2" label="&justIndex;" oncommand="exportAllMsgs(3)" />
				<menuitem id="justIndexCSV2" label="&justIndex; &iCSV;" oncommand="exportAllMsgs(5)" />
			</menupopup>
		</menu>
		<menuseparator />
		<menuitem id="mboximportsearch2" label="&searchAndExport;" oncommand="searchANDsave();" />
		<menuseparator />
		<menuitem id="mboximport2" label="&importMbox;" oncommand="openMboxDialog();" />
		<menuitem id="mboximportMD2" label="&importMAILDIR;" oncommand="trytocopyMAILDIR()" />
		<menuitem id="mboximportEML2" label="&importEML;" oncommand="importEMLs();" />
		<menu id="mboximportALLEMLt2" label="&importALLEML;">
			<menupopup>
				<menuitem label="&importALLEML1;" oncommand="importALLasEML(false)" />
				<menuitem label="&importALLEML2;" oncommand="importALLasEML(true)" />
			</menupopup>
		</menu>
		<menuseparator />
		<menuitem id="saveProfileMail" label="&saveProfileMail;" oncommand="IETexport_all(true)" />
		<menuitem id="saveProfile" label="&saveProfile;" oncommand="IETexport_all(false)" />
		<menuitem id="IETimportProfile" label="&importProfile;" oncommand="openProfileImportWizard()" />
		<menuitem id="IETBackupProfile2" label="Backup" oncommand="autoBackup.btest()" />
		<menuseparator />
		<menuitem id="openIEToptions" label="&options;" oncommand="openIEToptions()" />
		<menuitem id="openIEThelp3" label="&helpMenuWin.label;" oncommand="openIEThelp(true)" />
	</menupopup>
</menu>
</menupopup>
`, ["chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);

WL.injectElements(`
<popup id="mailContext">
<menu label="&toClipMenu;" id="copyToClipContext">
	<menupopup>
		<menuitem label="&copyClipMessage;" oncommand="copyMSGtoClip()" />
		<menuitem label="&copyClipHeaders;" oncommand="copyHeaders.start()" />
	</menupopup>
</menu>
<menuseparator id="multipleSelSep" />
<menu label="&saveSelected;" id="multipleSaveContext" insertbefore="threadPaneContext-sep-afterMarkMenu">
	<menupopup>
		<menuitem id="selAsEMLContext" label="&asEML;" oncommand="exportSelectedMsgs(0)" />
		<menuitem id="selAsHTMLContext" label="&asHTML;" oncommand="exportSelectedMsgs(1)" />
		<menuitem id="selAsHTMLContextAtt" label="&asHTML; &withattach;" oncommand="exportSelectedMsgs(8)" />
		<menuitem id="selAsTXTContext" label="&asTXT;" oncommand="exportSelectedMsgs(2)" />
		<menuitem id="selAsTXTContextAtt" label="&asTXT; &withattach;" oncommand="exportSelectedMsgs(9)" />
		<menuitem id="selAsCSVContext" label="&asCSV;" oncommand="exportSelectedMsgs(7)" />
		<menuitem id="selAsMbox1Context" label="&asMBOX;" oncommand="exportSelectedMsgs(3)" />
		<menuitem id="selAsMbox2Context" label="&asMBOX2;" oncommand="exportSelectedMsgs(4)" />
		<menuitem id="selAsPdf2Context" label="&asPDF;" oncommand="IETprintPDFmain.print(false)" />
		<menuseparator />
		<menu id="selWithIndexContext" label="&withIndexLabel;">
			<menupopup>
				<menuitem label="&asEML;" oncommand="exportSelectedMsgs(100)" />
				<menuitem label="&asHTML;" oncommand="exportSelectedMsgs(101)" />
				<menuitem label="&asHTML; &withattach;" oncommand="exportSelectedMsgs(108)" />
				<menuitem label="&asTXT;" oncommand="exportSelectedMsgs(102)" />
				<menuitem label="&asTXT; &withattach;" oncommand="exportSelectedMsgs(109)" />
			</menupopup>
		</menu>
		<menuseparator />
		<menuitem id="selAsIndex1Context" label="&justIndex; &iHTML;" oncommand="exportSelectedMsgs(5)" />
		<menuitem id="selAsIndex2Context" label="&justIndex; &iCSV;" oncommand="exportSelectedMsgs(6)" />
		<menuseparator />
		<menuitem id="openIEToptions" label="&options;" oncommand="openIEToptions()" />
		<menuitem id="openIEThelp4" label="&helpMenuWin.label;" oncommand="openIEThelp(true)" />

	</menupopup>
</menu>
</popup>
`, ["chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);


	WL.injectElements(`
<popup id="attachmentListContext">
<menuitem id="importEMLatt" label="&importAttachedEML;" oncommand="importEmlToFolder()" collapsed="true" />
</popup>
`, ["chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);

	WL.injectElements(`
<hbox id="status-bar" >
<toolbarbutton id="IETabortIcon" image="chrome://mboximport/content/mboximport/stop.gif" oncommand="IETabortExport()" collapsed="true" tooltiptext="&abortExport;" insertbefore="statusText"/>
</hbox>
`, ["chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);


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
`, ["chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);

// <key id="hot-key1" key="P" modifiers="shift control" oncommand="goDoCommand('cmd_printpreview')" contexts="all"/>
//   <key id="hot-key2" key="T" modifiers="shift control" oncommand="alert('k2')" contexts="all"/>
//   <key id="hot-key3" key="D" modifiers="shift control" oncommand="exportSelectedMsgs(5)" contexts="all"/>
  

window.ver = WL.extension.addonData.version;
window.extension = WL.extension;
window.IETinit();
window.setupHotKeys('messenger');
}

function onUnload() {
	Services.console.logStringMessage("onUnload messenger");
	window.IETmessOverlayInit();
	// window.autoBackup.btest();
}