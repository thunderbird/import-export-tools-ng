// expStatus.js

const currentFolderProgress = document.getElementById("msg-progress");
const currentFolder = document.getElementById("current-folder");
const totalFolderMsgCount = document.getElementById("total-folder-msg-count")
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
      console.log(msg)
      currentFolder.innerText = msg.folderName;
      totalFolderMsgCount.innerText = msg.maxMsgCount;
      currentFolderProgress.max = msg.maxMsgCount;
      currentFolderProgress.value = msg.msgCount;
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

console.log("listener set")

document.addEventListener('DOMContentLoaded', () => {
  i18n.updateDocument();
  okButton.addEventListener("click", okButtonListener);
  cancelButton.addEventListener("click", cancelButtonListener);


}, { once: true });

window.addEventListener("beforeunload", (event) => {
  if (!cancelHandled) {
    cancel();
  }
  console.log("close")
});

