
// io test worker
// ioTests

// This worker does the heavy-duty file or processing methods
// Just mbox(s) import now...

console.log("ioTest worker startup");

// main worker message handler
// We receive and dispatch all commands here
// MessageChannel is used so directed async messages can be used

onmessage = async function (event) {
  console.log(event.data);
  switch (event.data.cmd) {

    case "mboxCopyImport":
      console.log(event.data.cmd_options);
      let status = await mboxCopyImport(event.data.cmd_options);
      event.ports[0].postMessage({ msg: "mboxCopyImport", status: status});

      break;
    default:
      break;
  }
};


// mboxCopyImport reads, processes and writes a single mbox file
// we only do IOUtils and file processing no large data transfers
// across thread boundaries 
// We fix From_ escapes and mark all unread

async function mboxCopyImport(options) {

  let targetMboxPath = PathUtils.join(options.destPath, options.finalDestFolderName);

  // make sure nothing is there, create start 
  await IOUtils.remove(targetMboxPath, { ignoreAbsent: true });
  await IOUtils.write(targetMboxPath, new Uint8Array(), { mode: "create" });

  //  Double check max 4GB size
  let fileInfo;

  try {
    fileInfo = await IOUtils.stat(options.srcPath);
  } catch (err) {
    console.log(err);
    // trick to throw out of Promise 
    setTimeout(function () { throw err; });
  }


  if (fileInfo.size > 4000000000) {
    let err = "too large";
    console.log(fileInfo.size);
    postMessage({ msg: "Error: File exceeds 4GB" });

    return "Error: File exceeds 4GB" ;
    
  }

  let rawBytes = "";
  let READ_CHUNK = 900 * 1000;

  // temp loop for performance exps
  for (let i = 0; i < 1; i++) {
    console.log(new Date());
    console.log(options.srcPath);
    let offset = 0;
    let s = new Date();
    let eof = false;
    let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: )/gm;
    var fromExceptions;
    var cnt = 0;
    var fromEscCount = 0;
    var writePos = 0;
    var totalWrite = 0;
    var finalChunk;

    while (!eof) {
      // Read chunk as uint8
      rawBytes = await IOUtils.read(options.srcPath, { offset: offset, maxBytes: READ_CHUNK });
      offset += rawBytes.byteLength;
      writePos = 0;
      cnt++;

      // convert to faster String for regex etc
      let strBuffer = bytesToString2(rawBytes);

      // Force unread state, messages wo status default to unread
      strBuffer = strBuffer.replace(/X-Mozilla-Status: 0001/g, "X-Mozilla-Status: 0000");

      fromExceptions = strBuffer.matchAll(fromRegx);

      for (result of fromExceptions) {
        //console.log(result);
        
        fromEscCount++;
        totalWrite += ((result.index - 1) - writePos);
        
        // write out up to From_ exception, write space then process 
        // from Beginning of line. 
        let raw = stringToBytes(strBuffer.substring(writePos, result.index));
        await IOUtils.write(targetMboxPath, raw, { mode: "append" });
        await IOUtils.write(targetMboxPath, stringToBytes(" "), { mode: "append" });
        writePos = result.index;

        //console.log(writePos)
        //console.log("totalWrite bytes:", totalWrite)

        // This is for our ui status update
        postMessage({ msg: "importUpdate", currentFile: options.finalDestFolderName, bytesProcessed: totalWrite });

      }

      // Determine final write chunk
      if (rawBytes.byteLength < READ_CHUNK) {
        eof = true;
        finalChunk = rawBytes.byteLength;
        console.log("fchunk ", finalChunk);
      } else {
        finalChunk = READ_CHUNK;
      }

      totalWrite += (finalChunk - writePos);
      //console.log(totalWrite)

      // convert back to uint8 and write out 
      let raw = stringToBytes(strBuffer.substring(writePos, finalChunk + 1));
      await IOUtils.write(targetMboxPath, raw, { mode: "append" });

      postMessage({ msg: "importUpdate", currentFile: options.finalDestFolderName, bytesProcessed: totalWrite });
      //console.log("loop")
    }
    console.log("end read/fix/write loop");

    console.log("Escape fixups:", fromEscCount);

    let et = new Date() - s;
    console.log("Elapsed time:", et);
    console.log(new Date());
    
    // Breathing time?
    //await new Promise(resolve => setTimeout(resolve, 1500));

    // tbd use status codes
    return "Done"
  }


}

// tbd move utility functions 

function stringToBytes(str) {
  var bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}


function bytesToString2(bytes) {
  return bytes.reduce(function (str, b) {
    return str + String.fromCharCode(b);
  }, "");
}
