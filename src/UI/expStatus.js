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

console.log("IETNG: UI started, listener running");

document.addEventListener('DOMContentLoaded', async () => {

  if (await browser.windows.getCurrent().height == 360) {
    document.documentElement.style.setProperty('--multiple-folders-display', 'block');
    document.documentElement.style.setProperty('--multiple-folders-display-row', 'table-row');
  }
  let bodyHeight = document.getElementById("body-id").offsetHeight;
  let outerDivHeight = document.getElementById("outer-container").offsetHeight;

  console.log(bodyHeight)
  console.log(outerDivHeight)

  console.log(window.outerHeight)
  console.log(window.innerHeight)
  console.log(window.outerHeight - window.innerHeight)

  let chromeHeight = window.outerHeight - window.innerHeight;
  let calcWinHeight = outerDivHeight + chromeHeight + 22;
  let win = await browser.windows.getCurrent()
  console.log(calcWinHeight)
  await browser.windows.update(win.id, { height: calcWinHeight })
  i18n.updateDocument();

  messenger.runtime
    .sendMessage({
      command: "UI_EVENT",
      source: "expStatusWin",
      srcEvent: "expStatusWinOpen",
    });

  console.log("IETNG: UI Sent expStatusWinOpen event");

  okButton.addEventListener("click", okButtonListener);
  cancelButton.addEventListener("click", cancelButtonListener);


}, { once: true });

window.addEventListener("beforeunload", (event) => {
  if (!cancelHandled) {
    cancel();
  }
  console.log("close");
});

