// export prototype

import { createExportTask } from "./importExportTasks.mjs";
import * as prefs from "./prefCmds.mjs";
import { strftime } from "./strftime.mjs";

console.log(strftime)
import { Ci } from "/Modules/CiConstants.js";

var os = navigator.platform.toLowerCase();
var osPathSeparator = os.includes("win")
  ? "\\"
  : "/";

export async function exportFolders(ctxEvent, tab, functionParams) {

  try {
    // for now only deal with a single folder for prototype
    if (ctxEvent.selectedFolders && ctxEvent.selectedFolders.length > 1) {
      let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("multipleFolders.title"), browser.i18n.getMessage("multipleFolders.AlertMsg") + functionParams.toString());
      if (!rv) {
        return;
      }
    }
    //console.log(ctxInfo, params);

    // we do all main logic, folder and message iteration
    // and UI interactions in wext side

    var expTask = await createExportTask(functionParams, ctxEvent);

    // warnings

    //let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), "Exporting IMAP folders");

    // get export directory

    let useFolderExportDir = await prefs.getPref("exportEML.use_dir");
    let folderExportDir = await prefs.getPref("exportEML.dir");
    if (useFolderExportDir && folderExportDir != "") {
      expTask.generalConfig.exportDirectory = folderExportDir;
    } else {
      let resultObj = await browser.ExportMessages.openFileDialog(Ci.nsIFilePicker.modeGetFolder, "Export Directory", "", Ci.nsIFilePicker.filterAll);
      if (resultObj.result != Ci.nsIFilePicker.returnOK) {
        return;
      }
      expTask.generalConfig.exportDirectory = resultObj.folder;
    }

    var runs = 1;
    var total = 0;
    var times = [];

    for (let index = 0; index < runs; index++) {

      //await new Promise(r => setTimeout(r, 12000));

      let st = new Date();

      console.log(new Date());

      //      let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), src);

      // create export container
      expTask.exportContainer.directory = await browser.ExportMessages.createExportContainer(expTask);
      expTask.selectedFolder = ctxEvent.selectedFolder;

      var exportStatus = await msgIterateBatch(expTask);
      _createIndex(expTask, exportStatus.msgListLog);

      //console.log(new Date());

      times[index] = new Date() - st;
      total += times[index];
      console.log(new Date() - st);

    }

    //console.log("wrt avg", wrtotal / runs)
    console.log("avg", total / runs)
    let exportMessage = `Folder: ${expTask.folders[expTask.currentFolderIndex].name}\n\n`;
    exportMessage += `Messages exported: ${exportStatus.msgCount}\n`;
    exportMessage += `Error count: ${exportStatus.errCount}\n\n`;
    exportMessage += `Average time: ${(total / runs) / 1000}s\n`;

    let rv = await browser.AsyncPrompts.asyncAlert("Folder Export", `${exportMessage}`);

  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
    console.log(ex);

    console.log(ex.stack);
  }
}


async function msgIterateBatch(expTask) {

  // 1522 msgs 50MB
  // 20 run avg 1800msms

  // iterate msgs

  var wrtotal = 0;
  var msgListPage = null;
  var readRawInWext = true;
  const targetMaxMsgData = 25 * 1000 * 1000;
  var totalMsgsData = 0;
  var totalMsgs = 0;

  var expResult;
  var writePromises = [];
  var writeMsgs = true;
  var expId = 0;

  try {
    do {
      if (!msgListPage) {
        msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
      } else {
        msgListPage = await messenger.messages.continueList(msgListPage.id);
      }
      const messagesLen = msgListPage.messages.length;
      expTask.msgList = [];
      var getBodyPromises = [];

      totalMsgs += messagesLen;

      for (let index = 0; index < messagesLen; index++) {

        expTask.msgList.push(msgListPage.messages[index]);
        let msgId = msgListPage.messages[index].id;

        getBodyPromises.push(_getprocessedMsg(expTask, msgId));

        totalMsgsData += msgListPage.messages[index].size;

        if (totalMsgsData >= targetMaxMsgData) {
          if (writeMsgs) {
            let getBodySettledPromises = await Promise.allSettled(getBodyPromises);

            for (let index = 0; index < getBodySettledPromises.length; index++) {
              expTask.msgList[index].msgData = getBodySettledPromises[index].value;
              if (0 && !expTask.msgList[index].msgData) {
                console.log(index, expTask.msgList[index])
                break;
              }
              //console.log(index, expTask.msgList[index].id, expTask.msgList[index].msgData)
            }
            expTask.id = expId++;
            //console.log("ExpId", expTask.id, "numMsgs", expTask.msgList.length)
            writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
            //await browser.ExportMessages.exportMessagesES6(expTask);

          }

          totalMsgsData = 0;
          expTask.msgList = [];
          getBodyPromises = [];
        }
      }
      if (expTask.msgList) {
        if (writeMsgs) {
          let getBodySettledPromises = await Promise.allSettled(getBodyPromises);
          // console.log(new Date());

          for (let index = 0; index < getBodySettledPromises.length; index++) {
            expTask.msgList[index].msgData = getBodySettledPromises[index].value;
            //console.log(index, expTask.msgList[index].id, expTask.msgList[index].subject, expTask.msgList[index])
          }
          expTask.id = expId++;
          //console.log("ExpId", expTask.id, "numMsgs", expTask.msgList.length)
          writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
          //await browser.ExportMessages.exportMessagesES6(expTask);

        }
      }

      wrtotal += expResult;

    } while (msgListPage.id);

    if (writeMsgs) {
      var msgsStatus = await Promise.allSettled(writePromises);
      console.log(msgsStatus)
      console.log(msgsStatus.length)

      let msgListLog = [];
      let msgCount = 0;
      let errCount = 0;

      for (let index = 0; index < msgsStatus.length; index++) {
        //console.log(msgsStatus[index].value);
        //console.log(msgsStatus[index].value.length);

        for (let vindex = 0; vindex < msgsStatus[index].value.length; vindex++) {
          const fileStatus = msgsStatus[index].value[vindex].fileStatus;
          fileStatus.fileSize = msgsStatus[index].value[vindex].value;
          const error = msgsStatus[index].value[vindex].error;
          if (fileStatus.fileType == "message") {
            msgCount++;
            if ( error.error != "none") {
              errCount++;
            }
            msgListLog.push({ fileStatus: fileStatus, error: error });
          }
        }
      }

      //console.log(msgListLog)

      console.log("total msgs:", totalMsgs)
      //console.log("total promises:", tp)

      return { msgListLog: msgListLog, msgCount: msgCount, errCount: errCount};

      //console.log(new Date());
    }
  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);

  }
}

async function _getprocessedMsg(expTask, msgId) {
  return new Promise(async (resolve, reject) => {

    //console.log("id1", msgId)

    try {

      if (expTask.expType == "eml") {
        let rawMsg = await browser.messages.getRaw(msgId);
        if (rawMsg.decryptionStatus == "fail") {
          resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [] });
          return;
        }
        resolve({ rawMsg: rawMsg, msgBodyType: "text/raw", inlineParts: [], attachmentParts: [] });
        return;
      }

      // for PDF we only do getFull if we are saving attachments
      if (expTask.expType == "pdf") {
        if (expTask.attachments.save == "none") {
          resolve({ msgBody: null, msgBodyType: "pdf/none", inlineParts: [], attachmentParts: [] });
          return;
        }

      }

      let fm = await browser.messages.getFull(msgId, { decrypt: true });
      //console.log(fm)
      if (fm.decryptionStatus == "fail") {
        resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [] });
        return;
      }
      let parts = fm.parts;

      var textParts = [];
      var htmlParts = [];
      var inlineParts = [];
      var attachmentParts = [];

      async function getParts(parts) {
        //console.log("getParts", parts)

        for (const part of parts) {
          //console.log(part)
          // we could have multiple sub parts
          let contentType = part.contentType;
          let size = part.size;
          let body = part?.body;

          //console.log("body:", body)
          if (expTask.expType != "pdf" && contentType == "text/html" && body) {
            htmlParts.push({ ct: part.contentType, b: part.body });
          }
          if (expTask.expType != "pdf" && part.contentType == "text/plain" && body) {
            textParts.push({ ct: part.contentType, b: body });
          }

          if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("inline")) {
            //console.log(msgId, part)
            //console.log(msgId, part.headers["content-disposition"])
            let cd = part.headers["content-disposition"][0];
            //console.log(part.headers)
            if (cd.startsWith("inline;") && !cd.includes('filename="Deleted:')) {
              //console.log("inline", part.headers)
              //console.log("inline", part.headers["content-id"])
              try {
                let contentId = part.headers["content-id"][0];
                let inlineBody = await browser.messages.getAttachmentFile(msgId, part.partName);
                inlineParts.push({ ct: part.contentType, inlinePartBody: inlineBody, name: part.name, contentId: contentId });

              } catch {
                let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
                attachmentParts.push({ ct: part.contentType, attachmentBody: attachmentBody, name: part.name });
                //console.log("push inline att", attachmentParts)
              }
            }
          }

          if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("attachment")) {
            try {
                let contentId = part.headers["content-id"][0];
                let inlineBody = await browser.messages.getAttachmentFile(msgId, part.partName);
                inlineParts.push({ ct: part.contentType, inlinePartBody: inlineBody, name: part.name, contentId: contentId });

              } catch {
                let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
                attachmentParts.push({ ct: part.contentType, attachmentBody: attachmentBody, name: part.name });
                //console.log("push inline att", attachmentParts)
              }
            //let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
            //attachmentParts.push({ ct: part.contentType, attachmentBody: attachmentBody, name: part.name });
            //console.log("push att", attachmentParts)

          }

          if (part.parts) {
            await getParts(part.parts)
          }
        }
      }

      await getParts(parts)

      //console.log(htmlParts, textParts)
      if (htmlParts.length) {
        resolve({ msgBody: htmlParts[0].b, msgBodyType: "text/html", inlineParts: inlineParts, attachmentParts: attachmentParts });
      } else if (textParts.length) {
        resolve({ msgBody: textParts[0].b, msgBodyType: "text/plain", inlineParts: inlineParts, attachmentParts });
      } else {
        resolve({ msgBody: null, msgBodyType: "none", inlineParts: inlineParts, attachmentParts: attachmentParts });
      }

    } catch (ex) {
      let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
      reject(ex);
    }
  });


}

async function _createIndex(expTask, msgListLog) {

  // we create as text/html since we are saving as an html document

  try {
    const attIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADFUlEQVR4nO2aTagOURjHH+KGuMXCZ0m3aycLKcqGEsICG2VhYXG7xYIsRSzIRjZ0EYnkY+EjG4qV8rWyQG5ZKPmIheQj3x/Pv5k3c+d9zpw5M2dm3nM9v/p33/vOOU/Pf94z55x5ZogURVEURVEURVEUpZPoYi1irWf1sdax5rNGNplUHcxlnWd9YP0R9JY1wJrZVIJVMYZ1jPWLZONpfWXtZI1oIlnfTGHdo3zG07pM0ckLlsmsh1TMfEuna8/aE/jlH1O2uR+sd6zflnabas69NDbz91krKFoNwHjWBtZTQ/sXrLH1pV8Om/mTrNGGvt2sW4Z+QYwCm/njZF/rMW+8F/peqiZlf/gw3+Kg0P+N53y94tM8WCvEwB7CdOk0im/zYJkhVreflP3hYh67ukOs5TnibhFiffaZuA9czQ/E3z8j+1C+K8R74Df9criaP5I6viQjdp8h5l7fJoqCZaqMeajfEBuT33ehPSbAOf6tuIOd220qZx7aKMQ2mYfOVOKmANLk5Goe+/6eVNws869Y06sy5MojkpM8QfnMQxdSMbPMf2EtrMyNIxNJTvIs5Tf/hDUpEdNmPs+SWSmY7WfEn3tJTnRBfNxmfpA1LRE7CPMY8kvj/00j4CJFw/SU4XiQ5jFMW9f7tsT3pjkgSxj2SfNrqMPNj2LdoH9JXU8cy1oFhoV5sIOGJoZNSG98DPuAOzSMzWPoS8WIq4k22AlmbYYgnKSpiT5BmAdbSU7yHA2t0eNmZjO1V3wxR+Ay6Uq0DcY8uEntSaIgOS6jD1aHnvhvmqDMA2n47y4YKzjzKDtLya4qECs482ACyQm7Jtvxm5wsPlF70tsd+gdtHkgPMTHT5ylqBm8e7CLZwB5LP7zgELx5MIv1jWQjh6l9qcPEiZP209AnKPMtULo27fAwR1xjHWVdoejJrqltkOYBVoMid31J4Q2P1XUn7pPZrNdUzPxHCvSXT4NCJJ7ju5h/zprXRLJVgZsePKh4SfZffT914LM7X6BIspi1j6IaPQomqO4eYK2kgN7eUBRFURRF+S/4CwPqfEibwrHFAAAAAElFTkSuQmCC"
    const downArrowIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADsQAAA7EB9YPtSQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHPSURBVHic7dzBVtpAAIXh+zLFfV3QZ4bnqnZT9Q3swuaoYCSBwGRmvu+c7FwMuT+BjSQAAAAAAAAAAAAAAAAAAAAAAAAAQOvukuyTPPy/9kk2RU9Ul6rv312SpySvB9dzkm3Bc9Vim7d7dXj/nlJJBPscH364XiKC72zzdo/G7t+u3NGme8z4Cxgi+FXsdOt1n6+fnB+vP8VON8NDvn8RIjg2ZfzXJL9LHXCOXU6/EB8H70499qv7CNjk6y8xIjg2Z/znVPIlMEl+Jvmb6RH0+HEw9bFf7RtFBOOaH38ggmPdjD8Qwbvuxh+IoOPxBz1H0P34gx4jMP6BniIw/ogeIjD+CS1HYPyJWozA+DO1FIHxz9RCBMa/UM0RGH8hNUZg/IXVFIHxr6SGCIx/ZWuOwPg3ssYIjH9ja4rA+IWsIQLjF1YyAuOvRIkIjL8yt4zA+Ct1iwiMv3LXjMD4lbhGBMavzJIRGL9SS0Rg/MpdEoHxG3FOBMZvzJz/uX+Z+bfGr8ScJ4HxG7VUBMav2KURGL8B50Zg/IbMjcD4DZoagfEbdioC43dg7MeY/Zh1Rzb5/HPsuyQ/ip4IAAAAAAAAAAAAAAAAAAAAAAAAAOjeP1TCsZ3QSll0AAAAAElFTkSuQmCC";
    const upArrowIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAOwAAADsAEnxA+tAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAgVJREFUeJzt3UFOFEEYhuHPsDExeiJPIZGjuAKXuhXv4Q2UuDAewXtwAIOL4Y8JDJnpoWeqq/p5kl4QWFTq/TLNChIAAAAAAAAAAAAAAAAAAAAAFu1F6wM0cpbkPMnb+69/JfmW5G+zE3Eyr5PcJLl78Nzcf4+BvUryM4/j1/M7yZtWh+O4dsU3goHtG98IBjQ1vhEM5ND4RjCA58Y3go7NFd8IOjR3fCPoyNT4H5N8mPDzRrBgh8QvRtC558QvRtCpOeIXI+jMnPGLEXTiGPGLESzcMeMXI1ioU8QvRrAwp4xfjGAhWsQvRtBYy/jFCBpZQvxiBCe2pPjFCE5kifGLERzZkuMXIziSHuIXI5hZT/GLEcykx/jFCJ6p5/jFCA40QvxiBBONFL8YwZ5GjF+MYIeR4xcjeMIa4hcjeGBN8YsR3Ftj/LL6Eaw5flntCMT/b3UjEP+x1YxA/KcNPwLxdxt2BOLvb7gRiD/dMCMQ/3Ddj+As2//86lPPVZtjLtpV9r+/m2zufDEuIv4cpozgotEZt/oaH/tz2fd1cN3qgNtcR/w57TOCL81Ot8WuV4CP/el2vQ7etzvaY2dJfmT7QS8bnqt3l9l+p9+zsF8Ck+Rlks9J/iS5zea/cLxreqIxnGdzl7fZ3O2nbO4aAAAAAAAAAAAAAAAAAAAAAAAAAAAAGMA/0nbvD8X+7HoAAAAASUVORK5CYII=";
    
    let indexData = "";
    let titleDate = strftime.strftime("%n/%d/%Y", new Date());

    let styles = '<style>\r\n';
    styles += 'table { border-collapse: collapse; }\r\n';
    //styles += `table.sortable th:not(.sorttable_sorted):not(.sorttable_sorted_reverse):not(.sorttable_nosort):after { content: " \\2304\\2303"}`;
    styles += `table.sortable th::after, th.sorttable_sorted::after, th.sorttable_sorted_reverse::after { content: " ";  display: inline-block; width: 20px;  height: 16px;}`;
    styles += `th.sorttable_sorted::after { background: no-repeat url(${downArrowIcon}); background-size: 78%; float: right; padding-bottom: -8px}`;
    styles += `th.sorttable_sorted_reverse::after { background: no-repeat url(${upArrowIcon}); background-size: 78%; float: right}`;
    styles += `#sorttable_sortfwdind, #sorttable_sortrevind { display: none; }`;

    styles += 'th { background-color: #e6ffff; }\r\n';
    styles += 'th, td { padding: 4px; text-align: left; vertical-align: center; }\r\n';
    styles += 'tr:nth-child(even) { background-color: #f0f0f0; }\r\n';
    styles += 'tr:nth-child(odd) { background-color: #fff; }\r\n';
    styles += 'tr>:nth-child(5) { text-align: center; }\r\n';
    styles += 'tr>:nth-child(6) { text-align: right; }\r\n';
    styles += '.msgError { background-color: red !important; color: white;}\r\n';
    styles += 'a:link { text-decoration: none;}\n';
    styles += '.msgError a:link { color:rgb(198, 198, 229);}\n';

    styles += '</style>\r\n';

    indexData = '<html>\r\n<head>\r\n';

    indexData += styles;
    indexData += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n';
    indexData += `<title>Folder: ${expTask.folders[expTask.currentFolderIndex].name}</title>\n</head>\n<body>\n`;
    indexData += `<h2>Folder: ${expTask.folders[expTask.currentFolderIndex].name}&nbsp;&nbsp;&nbsp;&nbsp;Date: ${titleDate}</h2>\n`;

    indexData += '<table width="99%" border="1" class="sortable">\n';

    indexData += "<tr><th><b>" + "Subject" + "</b></th>"; // Subject
    indexData += "<th><b>" + "From" + "</b></th>"; // From
    indexData += "<th><b>" + "To" + "</b></th>"; // To
    indexData += "<th id='dateHdr'><b>" + "Date" + "</b></th>"; // Date

    indexData += "<th style='padding-left: 14px;' class='sorttable_nosort' ><b>" + "<img src='" + attIcon + "' height='20px' width='20px'></b></th>"; // Attachment

    //const sizeStr = window.ietng.extension.localeData.localizeMessage("Size");
    let sizeStr = "Size";
    indexData += "<th><b>" + sizeStr + "</b></th>"; // Attachment

    indexData += "</tr>";

    console.log(msgListLog)
    for (let index = 0; index < msgListLog.length; index++) {
      const msgItem = msgListLog[index].fileStatus;
      const errItem = msgListLog[index].error;
      let errClass = "";
      if (errItem.error != "none" ) {
        console.log("err", errItem)
        errClass = " class='msgError' ";
      }

      let recipient = msgItem.headers.recipients[0]
      if (recipient) {
        recipient = recipient.slice(0, 50)
        recipient = recipient.replace('"','');
      }
      let fpParts = msgItem.filePath.split(osPathSeparator);
      var filename = fpParts[fpParts.length - 1];
      let messageContainerName = "";
      if (expTask.messages.messageContainer) {
        messageContainerName = encodeURIComponent(expTask.messages.messageContainerName) + "/";
      }
      let relUrl = "./" + messageContainerName + encodeURIComponent(`${filename}`);
      let aHref = `<a href='${relUrl}'>${_encodeSpecialTextToHTML(msgItem.headers.subject).slice(0, 50)}</a>`;
      let attachments = "";
      if (msgItem.hasAttachments) {
        attachments = msgItem.hasAttachments;
      }
      indexData += `\r\n<tr ${errClass}><td style=''>${aHref}</td>`;
      indexData += "\r\n<td>" + _encodeSpecialTextToHTML(msgItem.headers.author.slice(0, 50).replace('"','')) + "</td>";
      indexData += "\r\n<td>" + _encodeSpecialTextToHTML(recipient) + "</td>";
      indexData += "\r\n<td nowrap>" + strftime.strftime("%n/%d/%Y", msgItem.headers.date) + "</td>";
      indexData += "\r\n<td>" + attachments + "</td>";
      indexData += "\r\n<td nowrap>" + _formatBytes(msgItem.headers.size, 2) + "</td>";
      indexData += "</tr>";
    }

    indexData += "</table>\n<script>\nsorttable.js\n</script>\n</body></html>\n";
    let rv = await browser.ExportMessages.writeIndex(expTask, indexData);
  } catch (ex) {
    console.log(ex, filename);
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${filename}\n${ex.message}\n\n${ex.stack}`);
  }

}

function _formatBytes(bytes, decimals) {
  if (bytes == 0) return '0 Bytes';
  var k = 1024,
    dm = decimals || 2,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function fileToUint8Array(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const uint8Array = new Uint8Array(arrayBuffer);
      resolve(uint8Array);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}


// body and index processing functions to be consolidated

function _encodeSpecialTextToHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  if (!str) {
    return "";
  }
  return str.replace(/[&<>"]/g, function (m) { return map[m]; });
}