
// io test worker
// ioTests

//importScripts("resource://gre/modules/Services.jsm");
//var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
//importScripts("resource://gre/modules/XPCOMUtils.jsm");

//XPCOMUtils.defineLazyGlobalGetters(this, ["IOUtils", "PathUtils"]);

//var inFile1 = "C:\\Dev\\Thunderbird\\TestFolder\\ImportTests\\1-5MBmbox";
var inFile1 = "C:\\Dev\\Thunderbird\\TestFolder\\ImportTests\\1GBmbox";
//var outFile1 = "C:\\Dev\\Thunderbird\\TestFolder\\ImportTests\\InboxOut";
var outFile1 = "C:\\Dev\\Thunderbird\\Profiles\\TB91\\Mail\\1-5MBmbox";;


console.log("ioTest worker");
onmessage = async function(m) {
	console.log(m.data);
	switch (m.data.cmd) {
		case "rw1":
			await rwT1();
			break;
		case "gdata":
			console.log(m.data)
			inFile1 = m.data.mdata.filePath1;
			outFile1 = m.data.mdata.destPath1;
			await rwT1();
			m.ports[0].postMessage(m.data.mdata);
			//postMessage("gdata " + m.data.mdata);
			//getData();
			break;
		default:
			break;
	}
}


  function stringToBytes(str) {
    var bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
	return bytes;
}
  

function bytesToString2(bytes) {
    return bytes.reduce(function(str, b) {
      return str + String.fromCharCode(b);
    }, "");
  };

async function rwT1() {

	await IOUtils.remove(outFile1);
	await IOUtils.write(outFile1, new Uint8Array(), {
		mode: "create",
	  });
	
	let b = "";
	let chunk = 900 * 1000;


	for (let i = 0; i < 1; i++) {
		console.log(new Date())
		console.log(inFile1)
		let offset = 0;
		let s = new Date();
		let eof = false;
		let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: )/gm;
		var m;
		var cnt = 0;
		var mcnt = 0;
		var writePos = 0;
		var totalWrite = 0;
		var finalChunk;
		
		while (!eof) {
			b = await IOUtils.read(inFile1, { offset: offset, maxBytes: chunk })
			offset += b.byteLength
			writePos = 0;
			cnt++;
			//console.log(offset)
			//await new Promise(resolve => setTimeout(resolve, 5))
			//console.log(b.byteLength)
			let buf = bytesToString2(b)
			//console.log(buf.slice(0, 400))
			
			
			m = buf.matchAll(fromRegx)
			//mcnt += [...m].length
			//console.log(mcnt)
			//console.log([...m])
			//console.log([...m][0])
			
			for (result of m) {
				console.log(result);
				//console.log(buf.charCodeAt(result.index -1))
				//console.log(buf.charCodeAt(result.index))
				mcnt++;
				totalWrite += ((result.index - 1) - writePos);
				//console.log(buf.slice(result.index - 4 , result.index +  20))
				let raw = stringToBytes(buf.substring(writePos, result.index ));
				await IOUtils.write(outFile1, raw, { mode: "append" });
				await IOUtils.write(outFile1, stringToBytes(" "), { mode: "append" }); 
				writePos = result.index 
				
				//console.log(writePos)
				console.log("totalWrite bytes:", totalWrite)
				postMessage({msg: totalWrite})
				//console.log(buf.slice(result.index , result.index +  200))
				
			}

			if (b.byteLength < chunk) {
				eof = true
				finalChunk = b.byteLength;
				console.log("fchunk ", finalChunk)
			} else {
				finalChunk = chunk;
			}
		

			//console.log("final ", (finalChunk - writePos))
			totalWrite += (finalChunk - writePos);
			//console.log(totalWrite)

			let raw = stringToBytes(buf.substring(writePos, finalChunk + 1));
			//console.log(raw.length)
    		await IOUtils.write(outFile1, raw, { mode: "append" });
    

			//console.log("loop")
			}
		console.log("end read/fix/write loop")

		console.log("Escape fixups:", mcnt)

		let et = new Date() - s
		console.log("Elapsed time:", et)
		console.log(new Date())
		await new Promise(resolve => setTimeout(resolve, 5500))
	}


}
