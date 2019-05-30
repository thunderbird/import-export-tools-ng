function IETinit() {
	IETprefs.setBoolPref("extensions.importexporttools.printPDF", false);
	if (IETprefs.getBoolPref("extensions.importexporttools.migrate_prefs"))
		IETmigratePrefs();
	var node1 = document.getElementById("multipleSaveContext");
	var node3 = document.getElementById("copyToClipContext");
	var node5 = document.getElementById("copyToClip");
	var node8 = document.getElementById("importEMLatt");
	var node7 = document.getElementById("context-saveAttachment");
	var node2 = document.getElementById("threadPaneContext-printpreview");
	if (node2) 
		var node4 =  document.getElementById("threadPaneContext-saveAs");
	else {
		node2 = document.getElementById("mailContext-printpreview");
		var node4 =  document.getElementById("mailContext-saveAs");
	}
	if (node2 && node1)
		node2.parentNode.insertBefore(node1,node2);
	if (node3 && node4)
		node3.parentNode.insertBefore(node3,node4);
	// document.getElementById("messageMenuPopup").appendChild(node5);
	try {
		var attList = document.getElementById("attachmentItemContext") ? document.getElementById("attachmentItemContext") : document.getElementById("attachmentListContext");
		attList.insertBefore(node8,node7);
		attList.addEventListener("popupshowing", rfc822test, false);
	}
	catch(e) {}
	// document.getElementById("messageMenu").addEventListener("popupshowing", toggleCopyMenu, false);

	// This is not strictly necessary on TB 2 or lower, but it's needed to have the same position on TB 3
	var popup = document.getElementById("folderPaneContext");
	var mymenu = document.getElementById("IETmenu");
	var mysep = document.getElementById("IETsep");
	popup.insertBefore(mysep,popup.firstChild);
	popup.insertBefore(mymenu,popup.firstChild);

	if (navigator.userAgent.toLowerCase().indexOf("seamonkey") > -1) {
		if (document.getElementById("IETimportProfile"))
			document.getElementById("IETimportProfile").setAttribute("hidden", "true");
		if (document.getElementById("IETimportProfile3"))
			document.getElementById("IETimportProfile3").setAttribute("hidden", "true");
	}
}

function IETmigratePrefs() {
	var branch = IETprefs.getBranch("extensions.importexporttools.");
	var oldPrefs = IETprefs.getChildList("mboximport.", {});
	for (var i in oldPrefs) {
		var type = IETprefs.getPrefType(oldPrefs[i]);
		if (type == 32)
			branch.setCharPref(oldPrefs[i].replace("mboximport.",""), IETprefs.getCharPref(oldPrefs[i]));
		else if (type == 64)
			branch.setIntPref(oldPrefs[i].replace("mboximport.",""), IETprefs.getIntPref(oldPrefs[i]));
		else
			branch.setBoolPref(oldPrefs[i].replace("mboximport.",""), IETprefs.getBoolPref(oldPrefs[i]));
		IETprefs.deleteBranch(oldPrefs[i]);
	}
}


function rfc822test() {
	var item = document.getElementById("attachmentList").selectedItem;
	var attachment = item.attachment;
	if (attachment.contentType == "message/rfc822")
		document.getElementById("importEMLatt").collapsed = false;
	else
		document.getElementById("importEMLatt").collapsed = true;
}
		

function IETsetMBmenu() {
	document.getElementById("mboxexport").removeAttribute("disabled");
	var msgFolder = GetSelectedMsgFolders()[0];
	var isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
	var storeFormat = IETstoreFormat();

	// the folder is the account pseudo-folder? we must set the right label and
	if (msgFolder.isServer) {
		document.getElementById("mboxexportallstruct").collapsed = false;
		document.getElementById("mboxexport").label = mboximportbundle.GetStringFromName("exportAccount");
		document.getElementById("mboxexportZIP").collapsed = true;
		document.getElementById("mboxexportsub").collapsed = true;
		document.getElementById("mboxexportstruct").collapsed = true;
		document.getElementById("exportALLMSG").setAttribute("disabled","true");
		document.getElementById("mboximportALLEML").setAttribute("disabled","true");
		document.getElementById("mboximportEML").setAttribute("disabled","true");
		document.getElementById("importSMS").setAttribute("disabled","true");
		document.getElementById("mboxexportRemote").collapsed = true;
	}
	else {
		document.getElementById("mboxexport").label = mboximportbundle.GetStringFromName("exportFolder");
		document.getElementById("mboxexportallstruct").collapsed = true;
		document.getElementById("exportALLMSG").removeAttribute("disabled");
		document.getElementById("mboxexportsub").collapsed = false;
		document.getElementById("mboxexportstruct").collapsed = false;
		document.getElementById("mboxexportZIP").collapsed = false;
		if (! isVirtFol) {
			document.getElementById("importSMS").removeAttribute("disabled");
			document.getElementById("mboximportEML").removeAttribute("disabled");
			document.getElementById("mboximportALLEML").removeAttribute("disabled");
		}
		if (msgFolder.server.type == "imap" || msgFolder.server.type == "nntp") 
			document.getElementById("mboxexportRemote").collapsed = false; 
		else 
			document.getElementById("mboxexportRemote").collapsed = true; 
	}		
		
	// the folder has subfolders?
	if (msgFolder.hasSubFolders) {
	 	document.getElementById("mboxexportsub").removeAttribute("disabled");
		document.getElementById("mboxexportstruct").removeAttribute("disabled");
	}
	else {
	 	document.getElementById("mboxexportsub").setAttribute("disabled","true");
		document.getElementById("mboxexportstruct").setAttribute("disabled","true");
	}
	
	if (isVirtFol) {
		document.getElementById("mboximport").setAttribute("disabled","true");
		document.getElementById("mboximportMD").setAttribute("disabled","true");
		document.getElementById("mboximportEML").setAttribute("disabled","true");
		document.getElementById("mboximportALLEML").setAttribute("disabled","true");
		document.getElementById("importSMS").setAttribute("disabled","true");
	}
	else  {
		document.getElementById("mboximport").removeAttribute("disabled");
		document.getElementById("mboximportMD").removeAttribute("disabled");
	}

	if (storeFormat == 1) {
		document.getElementById("mboximportMD").removeAttribute("collapsed");
		document.getElementById("mboximport").setAttribute("collapsed","true");
	}
	else {
		document.getElementById("mboximport").removeAttribute("collapsed");
		document.getElementById("mboximportMD").setAttribute("collapsed","true");
	}
}

function IETsetMBmenu2(popup) {
	var i = popup.getAttribute("mboxIndex");
	
	if (GetSelectedMsgFolders()[0] == null) {
		document.getElementById("mboxexport"+i).setAttribute("disabled","true");
		document.getElementById("mboxexportZIP"+i).setAttribute("disabled","true");
		document.getElementById("mboximport"+i).setAttribute("disabled","true");
		document.getElementById("mboximportMD"+i).setAttribute("disabled","true");
		document.getElementById("mboximportEML"+i).setAttribute("disabled","true");
		document.getElementById("importSMS"+i).setAttribute("disabled","true");
		document.getElementById("mboxexportsub"+i).setAttribute("disabled","true");
		document.getElementById("mboxexportallstruct"+i).setAttribute("disabled","true");
		document.getElementById("mboxexportstruct"+i).setAttribute("disabled","true");
		document.getElementById("mboxexport"+i).label = mboximportbundle.GetStringFromName("exportFolder");
		document.getElementById("exportALLMSG"+i).setAttribute("disabled","true");
		document.getElementById("mboximportALLEML"+i).setAttribute("disabled","true");
		return;
		}
	else {
		document.getElementById("mboxexport"+i).removeAttribute("disabled");
	}

	var msgFolder = GetSelectedMsgFolders()[0];
	var isVirtFol = msgFolder ? msgFolder.flags & 0x0020 : false;
	
	// the folder is the account pseudo-folder? we must set the right label
	if (msgFolder.isServer) {
		document.getElementById("mboximportEML"+i).setAttribute("disabled","true");
		document.getElementById("importSMS"+i).setAttribute("disabled","true");
		document.getElementById("mboxexportsub"+i).collapsed = true;
		document.getElementById("mboxexportstruct"+i).collapsed = true;
		document.getElementById("mboxexport"+i).label = mboximportbundle.GetStringFromName("exportAccount");
		document.getElementById("mboxexportZIP"+i).collapsed = true;
		document.getElementById("mboxexportallstruct"+i).collapsed = false;
		document.getElementById("exportALLMSG"+i).setAttribute("disabled","true");
		document.getElementById("mboximportALLEML"+i).setAttribute("disabled","true");
		document.getElementById("mboxexportRemote"+i).collapsed = true; 
	}
	else {
		document.getElementById("mboxexport"+i).label = mboximportbundle.GetStringFromName("exportFolder");
		document.getElementById("mboxexportallstruct"+i).collapsed = true;
		document.getElementById("exportALLMSG"+i).removeAttribute("disabled");
		document.getElementById("mboxexportsub"+i).collapsed = false;
		document.getElementById("mboxexportstruct"+i).collapsed = false;
		document.getElementById("mboxexportZIP"+i).collapsed = false;
		if (! isVirtFol) {
			document.getElementById("importSMS"+i).removeAttribute("disabled","true");
			document.getElementById("mboximportEML"+i).removeAttribute("disabled");
			document.getElementById("mboximportALLEML"+i).removeAttribute("disabled");
		}
		if (msgFolder.server.type == "imap" || msgFolder.server.type == "nntp") 
			document.getElementById("mboxexportRemote"+i).collapsed = false; 
		else 
			document.getElementById("mboxexportRemote"+i).collapsed = true; 
	}

	// the folder has subfolders?
	if (msgFolder.hasSubFolders) {
	 	document.getElementById("mboxexportsub"+i).removeAttribute("disabled");
		document.getElementById("mboxexportstruct"+i).removeAttribute("disabled");
	}
	else {
	 	document.getElementById("mboxexportsub"+i).setAttribute("disabled","true");
		document.getElementById("mboxexportstruct"+i).setAttribute("disabled","true");
	}
	
	if (isVirtFol) {
		document.getElementById("mboximport"+i).setAttribute("disabled","true");
		document.getElementById("mboximportEML"+i).setAttribute("disabled","true");
		document.getElementById("mboximportALLEML"+i).setAttribute("disabled","true");
		document.getElementById("importSMS"+i).setAttribute("disabled","true");
	}
	else {
		document.getElementById("mboximport"+i).removeAttribute("disabled");
		document.getElementById("mboximportMD"+i).removeAttribute("disabled");
	}		

	var storeFormat = IETstoreFormat();
	if (storeFormat == 1) {
		document.getElementById("mboximportMD"+i).removeAttribute("collapsed");
		document.getElementById("mboximport"+i).setAttribute("collapsed","true");
	}
	else {
		document.getElementById("mboximport"+i).removeAttribute("collapsed");
		document.getElementById("mboximportMD"+i).setAttribute("collapsed","true");
	}
}

window.addEventListener("load", IETinit , false);
