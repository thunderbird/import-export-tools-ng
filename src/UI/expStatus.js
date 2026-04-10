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
    await new Promise(r => setTimeout(r, 5));
  }
  // now we can resize win from content
  let outerDivHeight = document.getElementById("outer-container").offsetHeight;
  let chromeHeight = window.outerHeight - window.innerHeight;
  // 22 == margins plus 2 to avoid srrollbar
  let calcWinHeight = outerDivHeight + chromeHeight + 26;
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

