// ioTests

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGlobalGetters(this, ["IOUtils", "PathUtils"]);

//var inFile1 = "C:\\Dev\\Thunderbird\\TestFolder\\ImportTests\\Inbox";

var s;
var d;
var workerActive;
var ioWorker;

// menu items

function formatBytes(bytes, decimals) {
	if (bytes == 0) return '0 Bytes';
	var k = 1024,
		dm = decimals || 2,
		sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function ioTest1() {
	console.log("ioTest1");
	//await rwT1();

	if(!window.ioWorker) {
		console.log("wrkr");
		ioWorker = new ChromeWorker('chrome://mboximport/content/mboximport/ioWorker.js');
		ioWorker.onmessage = event => {
			//console.log(event.data)
			IETwritestatus("Importing " + event.data.currentFile + " Processed: " + formatBytes(event.data.bytesProcessed, 4), 15000)
		  }
		  ioWorker.onerror = event => {
			console.log(event)
			let errMsg = event.message
			console.log(errMsg.split(":")[0])
			alert(errMsg)
		  }
		  
	}

	ioWorker.postMessage({cmd: "rw1"});
}

async function mboxCopyImport(filePath, destPath, finalDestFolderName) {
	console.log("Start: mboxCopyImport")
	s = filePath;
	d = destPath;

	console.log(filePath)
	console.log(destPath)
	console.log(finalDestFolderName)

	return new Promise((resolve) => {
	  const channel = new MessageChannel();
	  console.log(channel)
	  // this will fire when iframe will answer
	  channel.port1.onmessage = e => { 
		console.log("msg rcvd ", new Date())
		resolve(e.data);
	  }
//	  ioWorker.onmessage = e => resolve(e.data);


	  // let iframe know we're expecting an answer
	  // send it its own port
	  
	  ioWorker.postMessage({cmd: "test"});  
	  ioWorker.postMessage({cmd: "mboxCopyImport", cmd_options: {srcPath: filePath, destPath: destPath, finalDestFolderName: finalDestFolderName, importOptions: {}}}, [channel.port2]);
	  //ioWorker.postMessage({cmd: "mboxCopyImport", cmd_options: {srcPath: filePath, destPath: destPath, importOptions: {}}}, [channel.port2]);
	  //ioWorker.postMessage({cmd: "gdata", mdata: "testing"});  
	});
  }

function t2() {
	console.log("t1")
}

