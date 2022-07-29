
// io test worker
// ioTests

//var inFile1 = "C:\\Dev\\Thunderbird\\TestFolder\\ImportTests\\1GBmbox";
//var outFile1 = "C:\\Dev\\Thunderbird\\Profiles\\TB91\\Mail\\1-5MBmbox";;


console.log("ioTest worker");

// main worker message handler

onmessage = async function(event) {
	console.log(event.data);
	switch (event.data.cmd) {
		
		case "mboxCopyImport":
			console.log(event.data.cmd_options)
			postMessage({msg: "starting"})
			await mboxCopyImport(event.data.cmd_options);
			event.ports[0].postMessage(event.data.mdata);
			
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

async function mboxCopyImport(options) {
	// make sure nothing is there, create start 
	await IOUtils.remove(options.destPath, {ignoreAbsent: true});
	await IOUtils.write(options.destPath, new Uint8Array(), {
		mode: "create",
	});

	let fileInfo;

	try {
		fileInfo = await IOUtils.stat(options.srcPath);
	} catch(err) {
		console.log(err)
		setTimeout(function() { throw err; });

		

	}

	if(fileInfo.size > 10000000) {
		let err = "too large"
		console.log(err)
		postMessage({msg: "eee"})

		return;
		//setTimeout(function() { throw err; });
	}
	let b = "";
	let chunk = 900 * 1000;


	for (let i = 0; i < 1; i++) {
		console.log(new Date())
		console.log(options.srcPath)
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
			b = await IOUtils.read(options.srcPath, { offset: offset, maxBytes: chunk })
			offset += b.byteLength
			writePos = 0;
			cnt++;


			//console.log(offset)
			//await new Promise(resolve => setTimeout(resolve, 5))
			//console.log(b.byteLength)
			let buf = bytesToString2(b)
			//console.log(buf.slice(0, 400))
			
			buf = buf.replace(/X-Mozilla-Status: 0001/g, "X-Mozilla-Status: 0000")

			//res = buf.matchAll(/X-Mozilla-Status: 0001/g)
			//for (result of res) {
			//	console.log(result);
			//}

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
				await IOUtils.write(options.destPath, raw, { mode: "append" });
				await IOUtils.write(options.destPath, stringToBytes(" "), { mode: "append" }); 
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
    		await IOUtils.write(options.destPath, raw, { mode: "append" });
    
			postMessage({msg: totalWrite})
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
