/*
  ImportExportTools NG is a extension for Thunderbird mail client
  providing import and export tools for messages and folders.
  The extension authors:
    Copyright (C) 2026 : Christopher Leidigh

  ImportExportTools NG is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// expStatus.js

const currentFolderProgress = document.getElementById("msg-progress");
const currentFolder = document.getElementById("current-folder");
const totalFolderMsgCount = document.getElementById("total-folder-msg-count");
const totalFolderCount = document.getElementById("total-folder-count");
const totalMsgCount = document.getElementById("total-msg-count");
const totalErrCount = document.getElementById("total-errors");
const totalMsgProgress = document.getElementById("total-msg-progress");
const statusMsg = document.getElementById("statusMsg");

const okButton = document.getElementById("okButton");
const cancelButton = document.getElementById("cancelButton");
var cancelHandled = false;

// button listeners
async function okButtonListener(event) {
  let window = await messenger.windows.getCurrent();
  messenger.windows.remove(window.id);
}

async function cancelButtonListener(event) {
  await cancel();
}

async function cancel() {
  messenger.runtime
    .sendMessage({
      command: "UI_EVENT",
      source: "expStatusWin",
      srcEvent: "cancelClick",
    })
    .then(async () => {
      let window = await messenger.windows.getCurrent();
      messenger.windows.remove(window.id);
      cancelHandled = true;
    });
}

browser.runtime.onMessage.addListener(msg => {
  if (msg.target != "expStatusWin") {
    return;
  }
  switch (msg.command) {
    case "UI_UPDATE":
      //console.log(msg);
      currentFolder.innerText = msg.currentFolderName;
      totalFolderMsgCount.innerText = msg.totalFolderMsgCount;
      currentFolderProgress.max = msg.totalFolderMsgCount;
      currentFolderProgress.value = msg.folderExportedMsgCount;
      totalFolderCount.innerText = (msg.currentFolderIndex + 1) + " \\ " + msg.totalFolderCount;
      totalMsgCount.innerText = msg.totalMsgCount;
      totalMsgProgress.value = msg.totalMsgsExported;
      totalMsgProgress.max = msg.totalMsgCount;
      totalErrCount.innerText = msg.totalErrCount;
      statusMsg.innerText = msg.statusMsg;

      if (msg?.winType == "multipleFolders") {
        document.documentElement.style.setProperty('--multiple-folders-display', 'block');
        document.documentElement.style.setProperty('--multiple-folders-display-row', 'table-row');

      }
      break;
    case "UI_CMD":
      switch (msg.subCommand) {
        case "closeWin":
          cancel();
          break;
        case "finished":
          okButton.removeAttribute("disabled");
          cancelButton.setAttribute("disabled", "");
          break;
      }
  }
});

//console.log("IETNG: UI started, listener running");

document.addEventListener('DOMContentLoaded', async () => {
  // we resize the window to be pseudo reactive
  // first we use the initial size (an approximation)
  // to determine if we are a single or multi folder
  // window. we use this to first set the css display 
  // vars and then we can calculate the proper win size

  i18n.updateDocument();
  let statusWin = await browser.windows.getCurrent();
  // use initial height to determine winType, set display vars
  if (statusWin.height == 340) {
    // these control the visibility of the multi folder ui
    document.documentElement.style.setProperty('--multiple-folders-display', 'block');
    document.documentElement.style.setProperty('--multiple-folders-display-row', 'table-row');
    // give little time for relayout to finish
    await new Promise(r => setTimeout(r, 10));
  }
  await document.fonts.ready;
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  // now we can resize win from content
  let outerDivHeight = document.getElementById("outer-container").offsetHeight;
  const contentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  const marginHeight = 20;
  
  let extraWinSizePadding = 6;
  if (statusWin.height == 340) {
    extraWinSizePadding = 10;
  }
  console.log(outerDivHeight)
  console.log(contentHeight)


  let chromeHeight = window.outerHeight - window.innerHeight;
  // 26 == (2 * 10) + 6 = 6margins plus 6 to avoid srrollbar - not reliable
  let calcWinHeight = outerDivHeight + chromeHeight + marginHeight + extraWinSizePadding;
  //let calcWinHeight = contentHeight + chromeHeight + 26;

  await browser.windows.update(statusWin.id, { height: calcWinHeight });

  messenger.runtime
    .sendMessage({
      command: "UI_EVENT",
      source: "expStatusWin",
      srcEvent: "expStatusWinOpen",
    });

  //console.log("IETNG: UI Sent expStatusWinOpen event");

  okButton.addEventListener("click", okButtonListener);
  cancelButton.addEventListener("click", cancelButtonListener);
}, { once: true });

window.addEventListener("beforeunload", (event) => {
  if (!cancelHandled) {
    cancel();
  }
  console.log("close");
});

