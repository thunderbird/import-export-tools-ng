
// io test worker
// ioTests

// This worker does the heavy-duty file or processing methods
// Just mbox(s) import now...

console.log("ioTest worker startup");
var window = Services.wm.getMostRecentWindow("mail:3pane");
// main worker message handler
// We receive and dispatch all commands here
// MessageChannel is used so directed async messages can be used

onmessage = async function (event) {
  console.log(event.data);
  switch (event.data.cmd) {

    case "mboxCopyImport":
      console.log(event.data.cmd_options);
      let status = await mboxCopyImport(event.data.cmd_options);
      event.ports[0].postMessage({ msg: "mboxCopyImport", status: status });

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

  //console.log(options);
  //let targetMboxPath = PathUtils.join(options.destPath, options.finalDestFolderName);
  let targetMboxPath = options.destPath;
  let folderName = PathUtils.filename(options.srcPath);

  console.log("Importing:", folderName)
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
    //postMessage({ msg: "Error: File exceeds 4GB" });
    alert("Cannot import: mbox larger than 4GB")
    return "Error: File exceeds 4GB";

  }

  let rawBytes = "";
  let READ_CHUNK = 600 * 1000;

  // temp loop for performance exps
  for (let i = 0; i < 1; i++) {
    console.log("Start:", new Date());
    //console.log(options.srcPath);
    let offset = 0;
    let s = new Date();
    let eof = false;
    //let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: )/gm;
    let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: .*?(?:\r?\n)[\x21-\x7E]+: )/gm;

    var fromExceptions;
    var cnt = 0;
    var fromEscCount = 0;
    var writePos = 0;
    var totalWrite = 0;
    var finalChunk;

    while (!eof) {
      // Read chunk as uint8
      rawBytes = await IOUtils.read(options.srcPath, { offset: offset, maxBytes: READ_CHUNK });
      //strBuffer = await IOUtils.readUTF8(options.srcPath, { offset: offset, maxBytes: READ_CHUNK });

      offset += rawBytes.byteLength;
      //offset += strBuffer.length;
      writePos = 0;
      cnt++;
      //let strBuffer;
      // convert to faster String for regex etc
      let strBuffer = bytesToString2(rawBytes);
      //let strBuffer = new TextDecoder().decode(rawBytes);
      
      //for (let i = 0; i < rawBytes.length; i++) {
        //strBuffer += String.fromCharCode(parseInt(rawBytes[i], 2));
      //}
    
      // Force unread state, messages wo status default to unread
      //strBuffer = strBuffer.replace(/X-Mozilla-Status: 0001/g, "X-Mozilla-Status: 0000");

      fromExceptions = strBuffer.matchAll(fromRegx);

      for (result of fromExceptions) {
        //console.log(result);

        fromEscCount++;
        totalWrite += ((result.index - 1) - writePos);

        // write out up to From_ exception, write space then process 
        // from Beginning of line. 
        let raw = stringToBytes(strBuffer.substring(writePos, result.index));

        await IOUtils.write(targetMboxPath, raw, { mode: "append" });

        //await IOUtils.writeUTF8(targetMboxPath, strBuffer.substring(writePos, result.index), { mode: "append" });

        await IOUtils.write(targetMboxPath, stringToBytes(">"), { mode: "append" });
        //await IOUtils.writeUTF8(targetMboxPath, ">", { mode: "append" });

        writePos = result.index;

        //console.log(writePos)
        //console.log("totalWrite bytes:", totalWrite)

        // This is for our ui status update
        //postMessage({ msg: "importUpdate", currentFile: options.finalDestFolderName, bytesProcessed: totalWrite });
        writeStatusLine(window, "Processing " + folderName + ": " + formatBytes(totalWrite, 2), 14000);

      }

      // Determine final write chunk
      if (rawBytes.byteLength < READ_CHUNK) {
        eof = true;
        finalChunk = rawBytes.byteLength;
        //console.log("fchunk ", finalChunk);
      } else {
        finalChunk = READ_CHUNK;
      }

      totalWrite += (finalChunk - writePos);
      //console.log(totalWrite)

      /*
      let re = /^Fr/gm;
      var bufferTail = strBuffer.substring(finalChunk - 300, finalChunk + 1);
      var fm = re.exec(bufferTail);
      if (fm) {
        //console.log(fm)
      }
      */
      // convert back to uint8 and write out 
      let raw = stringToBytes(strBuffer.substring(writePos, finalChunk + 1));

      await IOUtils.write(targetMboxPath, raw, { mode: "append" });
      //await IOUtils.writeUTF8(targetMboxPath, strBuffer.substring(writePos, finalChunk + 1), { mode: "append" });

      //postMessage({ msg: "importUpdate", currentFile: options.finalDestFolderName, bytesProcessed: totalWrite });
      //console.log("loop")
      writeStatusLine(window, "Processing " + folderName + ": " + formatBytes(totalWrite, 2), 14000);

    }
    let et = new Date() - s;

    writeStatusLine(window, "Imported " + folderName + ": " + formatBytes(totalWrite, 2) + " Time: " + et / 1000 + "s", 14000);

    console.log("end read/fix/write loop");

    console.log("Escape fixups:", fromEscCount);

    console.log("Elapsed time:", et / 1000, "s");
    console.log(new Date());

    // Breathing time?
    //await new Promise(resolve => setTimeout(resolve, 1500));

    // tbd use status codes
    return "Done";
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

function writeStatusLine(window, text, statusDelay) {
  if (window.document.getElementById("ietngStatusText")) {
    window.document.getElementById("ietngStatusText").setAttribute("label", text);
    window.document.getElementById("ietngStatusText").setAttribute("value", text);
    window.document.getElementById("ietngStatusText").innerText = text;

    var delay = 4000;
    //var delay = this.IETprefs.getIntPref("extensions.importexporttoolsng.delay.clean_statusbar");
    if (statusDelay) {
      delay = statusDelay;
    }
    var _this = this;
    if (delay > 0) {
      window.setTimeout(function () { _this.deleteStatusLine(window, text); }, delay);
    }
    //window.setTimeout(function () { _this.refreshStatusLine(window, text); }, delay - 500);


  }
}

function createStatusLine(window) {
  let s = window.document.getElementById("statusText")
  let s2 = window.document.createElement("label")
  s2.classList.add("statusbarpanel");
  s2.setAttribute("id", "ietngStatusText")
  s2.style.width = "420px";
  s2.style.overflow = "hidden"
  s.before(s2)

}

function deleteStatusLine(window, text) {
  try {
    if (window.document.getElementById("ietngStatusText").getAttribute("label") === text) {
      window.document.getElementById("ietngStatusText").setAttribute("label", "");
      window.document.getElementById("ietngStatusText").setAttribute("value", "");
      window.document.getElementById("ietngStatusText").innerText = "";

      if (text.includes("Err")) {
        delay = 15000;
      }
    }
  } catch (e) { }
}

function formatBytes(bytes, decimals) {
	if (bytes == 0) return '0 Bytes';
	var k = 1024,
		dm = decimals || 2,
		sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
		i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
