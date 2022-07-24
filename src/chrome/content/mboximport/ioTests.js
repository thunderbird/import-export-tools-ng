// ioTests

var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { XPCOMUtils } = ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGlobalGetters(this, ["IOUtils", "PathUtils"]);

var inFile1 = "C:\\Dev\\Thunderbird\\TestFolder\\ImportTests\\Inbox";
var outFile1 = "";

var workerActive;
var ioWorker;

// menu items

async function ioTest1() {
	console.log("ioTest1");
	//await rwT1();

	if(!window.ioWorker) {
		console.log("wrkr");
		ioWorker = new ChromeWorker('chrome://mboximport/content/mboximport/ioWorker.js');
	}

	//ioWorker.postMessage({cmd: "rw1"});
}

async function getData(filePath, destPath) {
	console.log("gd")
	return new Promise((resolve) => {
	  const channel = new MessageChannel();
	  // this will fire when iframe will answer
	  channel.port1.onmessage = e => { 
		console.log("msg rcvd ", new Date())
		resolve(e.data);
	  }
//	  ioWorker.onmessage = e => resolve(e.data);


	  // let iframe know we're expecting an answer
	  // send it its own port
	  ioWorker.postMessage({cmd: "gdata", mdata: {filePath1: filePath, destPath1: destPath}}, [channel.port2]);  
	  //ioWorker.postMessage({cmd: "gdata", mdata: "testing"});  
	});
  }

function t2() {
	console.log("t1")
}

async function rwT1() {

	let b = "";
	let chunk = 250 * 1000;


	for (let i = 0; i < 5; i++) {

		console.log(inFile1)
		let offset = 0;
		let s = new Date();
		let eof = false;
		let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: )/gm;
		var m;
		var cnt = 0;
		var mcnt = 0;
		while (!eof) {
			b = await IOUtils.read(inFile1, { offset: offset, maxBytes: chunk })
			offset += b.byteLength
			cnt++;
			//console.log(offset)
			//await new Promise(resolve => setTimeout(resolve, 5))
			//console.log(b.byteLength)
			let buf = bytesToString2(b)
			//console.log(buf.slice(0, 1100))
			m = buf.matchAll(fromRegx)
			//mcnt += [...m].length
			//console.log(mcnt)
			//console.log([...m])
			//console.log([...m][0])
			for (result of m) {
				//console.log(result);
				mcnt++;
			}


			//console.log("loop")
			if (b.byteLength < chunk || cnt == 2000) {
				eof = true
			}
		}
		console.log("end loop")

		console.log(mcnt)

		let et = new Date() - s
		console.error(et)
		await new Promise(resolve => setTimeout(resolve, 5500))
	}


}
