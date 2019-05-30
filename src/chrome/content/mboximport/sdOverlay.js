// NOTE : for some strange reasons, it seems impossibile to get elements by id

// type 0 = EML
// type 1 = HTML
// type 2 = TEXT
// type 3 = TEXT (one file)
// type 4 = MBOX (new)
// type 5 = MBOX (append)

function SDexportMsg() {
	if (typeof gSearchView  == "undefined")
		var view = gDBView;
	else
		var view = gSearchView;
	
	// There is no message, so exit
	// 4294967295 is the unsigned value for -1
	if (view.getKeyAt(0) == 4294967295)
		return;
	var rg = document.getElementsByTagName("radiogroup");
	var ml = document.getElementsByTagName("menulist");
	var type = ml[ml.length-1].selectedIndex;
	if (type == 1 || type == 2) {
		var question = IETformatWarning();
		if (! question) 
			return;
	}
	if (document.getElementById("IETall"))
		var all = (document.getElementById("IETall").selectedIndex == 0);
	else	
		var all = (rg[rg.length-2].selectedIndex == 0);
	var emlsArray = [];
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);	

	if (type == 4 || type == 6)
		var file = getPredefinedFolder(0);
	else if (type == 5) {
		fp.init(window, mboximportbundle.GetStringFromName("filePickerAppend"), nsIFilePicker.modeOpen);
		fp.appendFilters(nsIFilePicker.filterAll);
		if (fp.show) 
			var res = fp.show();	
		else
			var res = IETopenFPsync(fp);
		if (res==nsIFilePicker.returnOK) { 
			var  file = fp.file;
			if (isMbox(file) != 1) {
				var string = ("\"" + file.leafName + "\" " + mboximportbundle.GetStringFromName("nomboxfile"));
				alert(string);
				return;
			}			
		}
		else
			return;
	}
	else
		var file = getPredefinedFolder(2);
		
	if (! file) {
		fp.init(window, mboximportbundle.GetStringFromName("filePickerExport"), nsIFilePicker.modeGetFolder);
		if (fp.show) 
			var res = fp.show();	
		else
			var res = IETopenFPsync(fp);
		if (res==nsIFilePicker.returnOK) 
			file = fp.file;
		else
			return;
	}
	var i =0;
	if (all) {
		while(true) {
			try {
				emlsArray.push(view.getURIForViewIndex(i));
				i++;
			}
			catch(e) {
				break;
			}
		}
	}
	else {
		if (String.trim)
			var emlsArray = view.getURIsForSelection({});
		else {
			var messageArray = {};
			var len = {};
			view.getURIsForSelection(messageArray, len);
			emlsArray = messageArray.value;
		}
	}
	
	var msguri = emlsArray[0];
	IETtotal = emlsArray.length;
	IETexported = 0;
	IETskipped = 0;
	if (type == 1) 
		exportAsHtml(msguri,emlsArray,file,false,false,false,false,null,null,null);
	else if (type == 2)
		exportAsHtml(msguri,emlsArray,file,true,false,false,false,null,null,null);
	else if (type == 3)
		exportAsHtml(msguri,emlsArray,file,true,false,false,true,null,null,null);
	else if (type == 4) {
		var now = new Date;
		var filename = now.getFullYear().toString() + (now.getMonth()+1).toString() + now.getDate().toString() + "_mbox";
		file.append(filename);
		saveMsgAsEML(msguri,file,true,emlsArray,null,null,false,false,null,null);
	}
	else if (type == 5)
		saveMsgAsEML(msguri,file,true,emlsArray,null,null,false,false,null,null);
	else if (type == 6) {
		var hdrArray = [];
		for (var k=0;k<emlsArray.length;k++) {
			var msguri = emlsArray[k];
			var msserv = messenger.messageServiceFromURI(msguri);
			var msg = msserv.messageURIToMsgHdr(msguri);
			var hdrStr = IETstoreHeaders(msg,msguri,file,true);
			hdrArray.push(hdrStr);
		}
		createIndexCSV(7, file, hdrArray, null, true);	
	}
	else
		saveMsgAsEML(msguri,file,false,emlsArray,null,null,false,false,null,null);
}


function SDinit() {
	if (window.arguments && window.arguments[1]) {
		var sb = document.getElementById("status-bar");
		sb.previousSibling.removeAttribute("collapsed");
		sb.previousSibling.previousSibling.childNodes[1].setAttribute("collapsed", "true");	
		window.sizeToContent();
	}
}


window.addEventListener("load", SDinit, false);
