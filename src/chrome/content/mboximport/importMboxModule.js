/*
  ImportExportTools NG is a extension for Thunderbird mail client
  providing import and export tools for messages and folders.
  The extension authors:
    Copyright (C) 2023 : Christopher Leidigh, The Thunderbird Team

  ImportExportTools NG is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Originally a worker ftom test addon, temporarily
// straight module for now, will convert back to worker for performance


// This worker does the heavy-duty file or processing methods
// Just mbox(s) import now...

var Services = globalThis.Services || ChromeUtils.import(
  'resource://gre/modules/Services.jsm'
).Services;

var window = Services.wm.getMostRecentWindow("mail:3pane");
var mboximportbundle = Services.strings.createBundle("chrome://mboximport/locale/mboximport.properties");

// main worker message handler (when worker)
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
// We fix From_ escapes

async function mboxCopyImport(options) {

  let targetMboxPath = options.destPath;
  let folderName = PathUtils.filename(options.srcPath);

  // console.log("Importing:", folderName)
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


  if (fileInfo.size > 30000000000) {
    let err = "too large";
    // console.log(fileInfo.size);
    // postMessage({ msg: "Error: File exceeds 4GB" });
    //alert("Cannot import: mbox larger than 4GB");
    let prompt = Services.prompt;
    let buttonFlags = (prompt.BUTTON_POS_0) * (prompt.BUTTON_TITLE_IS_STRING) + (prompt.BUTTON_POS_1) * (prompt.BUTTON_TITLE_IS_STRING);
    Services.prompt.confirmEx(window, "Mbox over 4GB",
      "This mbox exceeds the 4GB import size. Do you want to use the copy import? This will not do mbox processing.",
       buttonFlags,
       "Use Copy Import",
       "Skip mbox import",
       "",
       null, {});

    return "Error: File exceeds 4GB";
  }

  let rawBytes = "";
  const kREAD_CHUNK = 2000 * 1000;

  // temp loop for performance exps
  for (let i = 0; i < 1; i++) {
    //console.log("Start:", new Date());
    let offset = 0;
    let s = new Date();
    let eof = false;

    // fromRegex used for From_ escaping
    // Requires From_ followed by two headers, including multiline hdrs
    //let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: .*?(?:\r?\n)[\x21-\x7E]+: )/gm;
    let fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: (?:(.|\r?\n\s))*?(?:\r?\n)[\x21-\x7E]+: )/gm;


    var fromExceptions;
    var cnt = 0;
    var fromEscCount = 0;
    var writePos = 0;
    var totalWrite = 0;
    var finalChunk;

    let processingMsg = this.mboximportbundle.GetStringFromName("processingMsg");
    let importedMsg = this.mboximportbundle.GetStringFromName("importedMsg");
    let timeMsg = this.mboximportbundle.GetStringFromName("timeMsg");


    while (!eof) {
      // Read chunk as uint8
      rawBytes = await IOUtils.read(options.srcPath, { offset: offset, maxBytes: kREAD_CHUNK });

      offset += rawBytes.byteLength;
      writePos = 0;
      cnt++;

      // convert to faster String for regex etc
      let strBuffer = bytesToString(rawBytes);

      // match all From_ exceptions for escaping
      fromExceptions = strBuffer.matchAll(fromRegx);

      for (let result of fromExceptions) {

        fromEscCount++;
        totalWrite += ((result.index - 1) - writePos);

        console.log(result)
        console.log(strBuffer.indexOf(result[1]))
        console.log(strBuffer.substring(strBuffer.indexOf(result[1])))

        // write out up to From_ exception, write space then process
        // from Beginning of line.
        let raw = stringToBytes(strBuffer.substring(writePos, result.index));

        await IOUtils.write(targetMboxPath, raw, { mode: "append" });
        await IOUtils.write(targetMboxPath, stringToBytes(">"), { mode: "append" });

        writePos = result.index;

        // console.log(writePos)
        // console.log("totalWrite bytes:", totalWrite)

        // This is for our ui status update
        // postMessage({ msg: "importUpdate", currentFile: options.finalDestFolderName, bytesProcessed: totalWrite });

        writeIetngStatusLine(window, `${processingMsg}  ${folderName} :  ` + formatBytes(totalWrite, 2), 14000);
      }

      // Determine final write chunk
      if (rawBytes.byteLength < kREAD_CHUNK) {
        eof = true;
        finalChunk = rawBytes.byteLength;
      } else {
        finalChunk = kREAD_CHUNK;
      }

      totalWrite += (finalChunk - writePos);

      // convert back to uint8 and write out
      let raw = stringToBytes(strBuffer.substring(writePos, finalChunk + 1));
      await IOUtils.write(targetMboxPath, raw, { mode: "append" });

      // postMessage({ msg: "importUpdate", currentFile: options.finalDestFolderName, bytesProcessed: totalWrite });
      writeIetngStatusLine(window, `${processingMsg}  ${folderName} :  ` + formatBytes(totalWrite, 2), 14000);
    }

    let et = new Date() - s;

    
    writeIetngStatusLine(window, `${importedMsg}  ${folderName}  :  ` + formatBytes(totalWrite, 2) + "  " + timeMsg + ":  " + et / 1000 + "s", 14000);

    
    console.log("end read/fix/write loop");
    console.log("Escape fixups:", fromEscCount);
    console.log("Elapsed time:", et / 1000, "s");
    console.log(new Date());

  }
  // tbd use status codes
  return "Done";
}

// tbd move utility functions

function stringToBytes(str) {
  var bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

function bytesToString(bytes) {
  return bytes.reduce(function (str, b) {
    return str + String.fromCharCode(b);
  }, "");
}

function writeIetngStatusLine(window, text, statusDelay) {
  if (window.document.getElementById("ietngStatusText")) {
    window.document.getElementById("ietngStatusText").setAttribute("label", text);
    window.document.getElementById("ietngStatusText").setAttribute("value", text);
    window.document.getElementById("ietngStatusText").innerText = text;

    var delay = 4000;
    if (statusDelay) {
      delay = statusDelay;
    }
    var _this = this;
    if (delay > 0) {
      window.setTimeout(function () { _this.deleteStatusLine(window, text); }, delay);
    }
  }
}

// This creates our own, secondary status line to not
// compete with rebuild or other messages
function createIetngStatusLine(window) {
  let s = window.document.getElementById("statusText");
  let s2 = window.document.createElement("label");
  s2.classList.add("statusbarpanel");
  s2.setAttribute("id", "ietngStatusText");
  s2.style.width = "420px";
  s2.style.overflow = "hidden";
  s.before(s2);
  console.log("status 2");
}

function deleteStatusLine(window, text) {
  try {
    if (window.document.getElementById("ietngStatusText").getAttribute("label") === text) {
      window.document.getElementById("ietngStatusText").setAttribute("label", "");
      window.document.getElementById("ietngStatusText").setAttribute("value", "");
      window.document.getElementById("ietngStatusText").innerText = "";

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
