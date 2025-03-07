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

// update to use es6 modules for 128+, 136+ required - thx Axel

// var Services = globalThis.Services || ChromeUtils.importESModule(
//   'resource://gre/modules/Services.sys.mjs'
// ).Services;

var { ietngUtils } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/ietngUtils.mjs");

var window = Services.wm.getMostRecentWindow("mail:3pane");
var mboximportbundle = Services.strings.createBundle("chrome://mboximport/locale/mboximport.properties");

// as a module loaded by an ES6 module we bump name version so we avoid cache
console.log("IETNG: importMboxModule.js -v6");

// if these are const or let they produce redeclaration error5
// Common RFC822 header field-names for From_ exception analysis
var rfc822CommonFieldNames = [
  "to", "from", "subject", "cc", "bcc", "reply-to", "date", "date-received", "received",
  "delivered-to", "return-path", "dkim-signature", "deferred-delivery", "envelope-to",
  "message-id", "user-agent", "mime-version", "content-type", "content-transfer-encoding",
  "content-language", "autocrypt",
];

var CommonX_FieldNames = [
  "x-spam…", "x-ham…", "x-mozilla…",
  "x-google…", "x-gm…",
];


// mboxCopyImport reads, processes and writes a single mbox file
// we only do IOUtils and file processing no large data transfers
// across thread boundaries
// We fix From_ escapes

async function mboxCopyImport(options) {

  // console.log("start mboxCopyImport", options)

  var srcPath = options.srcPath;
  let targetMboxPath = options.destPath;
  let folderName = PathUtils.filename(srcPath);

  // console.log("Importing:", folderName)
  // make sure nothing is there, create start
  await IOUtils.remove(targetMboxPath, { ignoreAbsent: true });
  await IOUtils.write(targetMboxPath, new Uint8Array(), { mode: "create" });

  // Boundary testing chunk sizes for 1GBmbox
  // const kREAD_CHUNK = (100 * 1000) + 20; // From in boundary 19486
  // const kREAD_CHUNK = (100 * 1000) + 13; //  1 bndry exc 1 bad msg
  // const kREAD_CHUNK = (100 * 1000) + 13; //  1 bndry exc 19492 msg write bndry exc

  // tail boundary check resolves the one bad message for 1GBmbox
  // const kReadChunk = (50 * 1000) + 15; //  211 ex 19492 msg write bndry exc

  const kReadChunk = (150 * 1000) + 0; //  211 ex 19492 msg write bndry exc
  const kExceptWin = 300;

  // we take the easy AND safe approach for the rare and
  // onerous CR line breaks from OSX 9-
  // we check first 5 line breaks and do a conversion to \n
  // in _ietngTMP@mbox.
  let crLineEndings = await _checkCRLineEndings(srcPath);
  if (crLineEndings) {
    srcPath = await _tmpConvertCRLineEndings(srcPath, kReadChunk);
  }

  let rawBytes = "";
  let offset = 0;
  let startTime = new Date();
  let eof = false;

  // fromRegex used for From_ escaping
  // Requires From_ followed by two headers, including multiline hdrs
  // Remove space after colon requirement #516
  // Fix by using second check for hdrs with no space after :
  const fromRegx = /^(From (?:.*?)\r?\n)(?![\x21-\x7E]+: (?:(.|\r?\n\s))*?(?:\r?\n)[\x21-\x7E]+: )/gm;

  var fromEscapeChar = ">";
  const tbVersion = ietngUtils.getThunderbirdVersion();
  if (tbVersion.major >= 115 && tbVersion.minor >= 9) {
    fromEscapeChar = " ";
  }

  var fromExceptions;
  var cnt = 0;
  var fromExcpCount = 0;
  var writePos = 0;
  var totalWrite = 0;
  var finalChunk;

  // Status messages
  const processingMsg = this.mboximportbundle.GetStringFromName("processingMsg");
  const importedMsg = this.mboximportbundle.GetStringFromName("importedMsg");
  const timeMsg = this.mboximportbundle.GetStringFromName("timeMsg");

  while (!eof) {

    // Read chunk as uint8
    rawBytes = await IOUtils.read(srcPath, { offset: offset, maxBytes: kReadChunk });

    // Determine final write chunk
    if (rawBytes.byteLength < kReadChunk) {
      eof = true;
      finalChunk = rawBytes.byteLength;
    } else {
      finalChunk = kReadChunk;
    }

    offset += rawBytes.byteLength;
    writePos = 0;
    cnt++;

    // convert to string for regex etc
    let strBuffer = bytesToString(rawBytes);

    // match all From_ exceptions for escaping
    fromExceptions = strBuffer.matchAll(fromRegx);
    fromExceptions = [...fromExceptions];

    for (const [index, result] of fromExceptions.entries()) {

      fromExcpCount++;
      totalWrite += ((result.index - 1) - writePos);

      var exceptionPos = result.index;

      // handling last exception in case it straddles buffer boundaries

      if ((index == fromExceptions.length - 1) && (finalChunk - exceptionPos) < kExceptWin) {
        fromExcpCount--;
      } else {
        let exceptionBuf = strBuffer.substring(exceptionPos, exceptionPos + 300);
        if (_exceptionHas2Hdrs(exceptionBuf)) {
          fromExcpCount--;
          continue;
        }

        // write out up to From_ exception, write space then process
        // from Beginning of line.
        let raw = stringToBytes(strBuffer.substring(writePos, result.index));

        await IOUtils.write(targetMboxPath, raw, { mode: "append" });
        await IOUtils.write(targetMboxPath, stringToBytes(fromEscapeChar), { mode: "append" });

        writePos = result.index;
        writeIetngStatusLine(window, `${processingMsg}  ${folderName} :  ` + formatBytes(totalWrite, 2), 14000);
      }
    }

    // tail processing
    let rawBytesNextBuf = await IOUtils.read(srcPath, { offset: offset, maxBytes: kExceptWin });
    // convert to faster String for regex etc
    let boundaryStrBuffer = strBuffer.slice(-kExceptWin) + bytesToString(rawBytesNextBuf);

    let singleFromException = boundaryStrBuffer.matchAll(fromRegx);
    singleFromException = [...singleFromException];
    if (singleFromException.length && !_exceptionHas2Hdrs(boundaryStrBuffer.substring(singleFromException[0].index))) {
      let epos = kReadChunk - kExceptWin + singleFromException[0].index;

      // write normally

      // write out up to From_ exception, write space then process
      // from Beginning of line.
      if ((kReadChunk - epos) > 0) {
        fromExcpCount++;
        epos = fromExceptions[fromExceptions.length - 1].index;

        let raw = stringToBytes(strBuffer.substring(writePos, epos));

        await IOUtils.write(targetMboxPath, raw, { mode: "append" });
        await IOUtils.write(targetMboxPath, stringToBytes(fromEscapeChar), { mode: "append" });

        writePos = epos;
        writeIetngStatusLine(window, `${processingMsg}  ${folderName} :  ` + formatBytes(totalWrite, 2), 14000);
      } else {
        // console.log("no boundary buf Exception ")
      }

    } else {
      // console.log("no boundary buf Exception ")
    }

    // write final part of chunk
    totalWrite += (finalChunk - writePos);

    // convert back to uint8 and write out
    let raw = stringToBytes(strBuffer.substring(writePos, finalChunk + 1));
    await IOUtils.write(targetMboxPath, raw, { mode: "append" });

    writeIetngStatusLine(window, `${processingMsg}  ${folderName} :  ` + formatBytes(totalWrite, 2), 14000);
  }
  // completion
  let totalTime = new Date() - startTime;

  writeIetngStatusLine(window, `${importedMsg}  ${folderName}  :  ` + formatBytes(totalWrite, 2) + "  " + timeMsg + ":  " + totalTime / 1000 + "s", 14000);

  // if we did a CR conversion, remove tmp mbox file
  if (crLineEndings && srcPath.endsWith("_ietngTMP@mbox")) {
    await IOUtils.remove(srcPath, { ignoreAbsent: true });
  }
  // tbd use status codes
  return "Done";
}

function _exceptionHas2Hdrs(exceptionBuf) {
  const hdrsExceptionRegex = /^(From (?:.*?)\r?\n)(([\x21-\x7E]+):(?:(.|\r?\n\s))*?(?:\r?\n)([\x21-\x7E]+):)/gm;
  let exceptionHdrs = exceptionBuf.matchAll(hdrsExceptionRegex);
  exceptionHdrs = [...exceptionHdrs];

  if (exceptionHdrs[0] && (exceptionHdrs[0].index == 0) && exceptionHdrs[0][3] && exceptionHdrs[0][5]) {
    let fieldName1 = exceptionHdrs[0][3];
    let fieldName2 = exceptionHdrs[0][5];

    if ((_isRFC822FieldName(fieldName1) || _isCommonX_FieldName(fieldName1)) &&
      (_isRFC822FieldName(fieldName2) || _isCommonX_FieldName(fieldName2))) {
      // no escape, two valid headers after From_
      return true;
    }
  }
  return false;
}

function _isRFC822FieldName(fieldName) {
  if (rfc822CommonFieldNames.includes(fieldName.toLowerCase())) {
    return true;
  }
  return false;
}

function _isCommonX_FieldName(fieldName) {
  if (CommonX_FieldNames.includes(fieldName.toLowerCase())) {
    return true;
  }
  // check for common X- roots
  if (fieldName.toLowerCase().startsWith("x-")) {
    return CommonX_FieldNames.find(xFieldName => {
      return (xFieldName.endsWith("…") && fieldName.toLowerCase().startsWith(xFieldName.slice(0, -1)));
    });
  }
  return false;
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

async function _checkCRLineEndings(srcPath) {
  let readBuf = await IOUtils.read(srcPath, { offset: 0, maxBytes: 2000 });
  let strBuf = bytesToString(readBuf);
  let crlfMatch = strBuf.matchAll(/\r\n/gm);
  crlfMatch = [...crlfMatch];
  if (crlfMatch.length > 5) {
    return false;
  }
  let crMatch = strBuf.matchAll(/\r[^\n]/gm);
  crMatch = [...crMatch];
  if (crMatch.length > 5) {
    return true;
  }
  return false;
}

async function _tmpConvertCRLineEndings(srcPath, readChunk) {
  // console.log("start cr convert")

  let tmpDstPath = srcPath + "_ietngTMP@mbox";
  await IOUtils.write(tmpDstPath, new Uint8Array(), { mode: "overwrite" });
  var eof = false;
  var offset = 0;
  var cnt = 0;

  while (!eof) {
    let readBuf = await IOUtils.read(srcPath, { offset: offset, maxBytes: readChunk });
    let readLen = readBuf.length;
    cnt++;

    offset += readLen;
    let strBuf = bytesToString(readBuf);

    strBuf = strBuf.replaceAll('\r', '\r\n');
    let outBuf = stringToBytes(strBuf);
    await IOUtils.write(tmpDstPath, outBuf, { mode: "append" });
    let CRconversionMsg = window.ietngAddon.extension.localeData.localizeMessage("CRconversion.statusMsg");
    writeIetngStatusLine(window, `${CRconversionMsg} :  ` + formatBytes(offset, 2), 14000);

    if (readLen < readChunk) {
      eof = true;
    }
  }
  return tmpDstPath;
}
