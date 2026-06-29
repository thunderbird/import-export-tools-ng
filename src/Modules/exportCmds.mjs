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

// ExportCmds.mjs
// This has all the top level export menu options 
// Export for all message types both folders and 
// selected messages 

// We process as much as possible at the WebExtension
// level and batch the messages in an expTask object
// along with attachments as fileObjs
// The expTask objects are passed to the ExportMessages
// experiment for the batched, parallel, high volume file
// writing. Note that some processing for unique naming,
// attachment tables (dependent on unique naming, and PDF
// handling are also done at the experiment level.
// The results are returned with the finalized filenames 
// and per message errors. These are used for the index
// creation back on the WebExtension level.

// tbd - Add mbox export

import { logging, log } from "./loggingWext.mjs";
import { createExportTask } from "./importExportTasks.mjs";
import { prefCmds } from "./prefCmds.mjs";
import { strftime } from "./strftime.mjs";
import * as ui from "./ui.mjs";
import { Ci } from "/Modules/CiConstants.js";


const os = navigator.platform.toLowerCase();
const osPathSeparator = os.includes("win")
  ? "\\"
  : "/";

var gAbort = false;

export async function exportFolders(ctxEvent, tab, functionParams) {
  gAbort = false;

  try {
    logging.init({ logTypes: await prefCmds.getPref("debug.logTypes") });

    const notificationsForExpFolders = await prefCmds.getPref("ui.exportStatus.folders.useNotificationsNoWindow");

    log("msgs msgs2", "Start Export folders\nFolders:")

    // check for multiple folders selected
    let folderSet = await _getFolderSet(ctxEvent.selectedFolders, functionParams);
    let totalFolderCount = folderSet.length;
    let totalMsgCount = 0;

    folderSet.forEach(folder => {
      totalMsgCount += folder.totalMsgCount;
      log("msgs msgs2", ` Folder: ${folder.exportPath}`)
    });

    //console.log(ctxEvent, functionParams, folderSet);

    // we do all main logic, folder and message iteration
    // and UI interactions in wext side

    // create our base, governing expTask, target modifications later
    var expTask = await createExportTask(functionParams, ctxEvent, folderSet);

    // get export directory, use predefined type or open dir dialog
    let usePredefinedExportDir;
    let exportDir;
    if (functionParams.expMethod == "selectedMsgs") {
      usePredefinedExportDir = await prefCmds.getPref("export.general.useDefaultSelectedMsgsExportDir");
      exportDir = await prefCmds.getPref("export.general.defaultSelectedMsgsExportDir");
    } else {
      usePredefinedExportDir = await prefCmds.getPref("export.general.useDefaultFolderExportDir");
      exportDir = await prefCmds.getPref("export.general.defaultFolderExportDir");
    }
    if (usePredefinedExportDir && exportDir != "") {
      expTask.generalConfig.exportDirectory = exportDir;
    } else {
      let resultObj = await browser.ExportMessages.openFileDialog(Ci.nsIFilePicker.modeGetFolder, "Export Directory", "", Ci.nsIFilePicker.filterAll);
      if (resultObj.result != Ci.nsIFilePicker.returnOK) {
        return;
      }
      expTask.generalConfig.exportDirectory = resultObj.folder;
    }

    log("msgs msgs2", `Export path: ${expTask.generalConfig.exportDirectory}`)

    var runs = 1;
    var total = 0;
    var times = [];

    // UI listener for messages from the statusWin

    browser.runtime.onMessage.addListener(msg => {
      if (msg.command != "UI_EVENT") {
        return null;
      }

      if (msg.source == "expStatusWin") {
        switch (msg.srcEvent) {
          case "cancelClick":
            console.log("cancel")
            // we are aborting current export
            gAbort = true;
            break;
        }
      }
    });

    // export update listener for messages from the ExportMessages
    // experiment for export progress and errors 

    let folderExportedMsgCount = 0;
    let totalMsgsExported = 0;
    let totalErrCount = 0;

    async function _updateListener(folderName, msgCount, errCount) {
      if (gAbort) {
        return;
      }
      folderExportedMsgCount += msgCount;
      totalMsgsExported += msgCount;
      totalErrCount += errCount;

      let statusMsg = "";
      if (totalErrCount) {
        statusMsg = browser.i18n.getMessage("msgErrs.label");
      }

      // bypass UI messages when notifications enabled
      if (!notificationsForExpFolders) {
        browser.runtime.sendMessage({
          command: "UI_UPDATE", target: "expStatusWin",
          currentFolderName: expTask.folders[expTask.currentFolderIndex].exportPath,
          currentFolderIndex: expTask.currentFolderIndex,
          folderExportedMsgCount: folderExportedMsgCount,
          totalFolderMsgCount: expTask.folders[expTask.currentFolderIndex].totalMsgCount,
          totalFolderCount: totalFolderCount,
          totalMsgCount: totalMsgCount,
          totalMsgsExported: totalMsgsExported,
          totalErrCount: totalErrCount,
          statusMsg: statusMsg,
        });
      }
    }

    browser.ExportMessages.onExpUpdate.addListener(_updateListener);

    log("msgs2", `Added UI and exportStatus listeners`)
    log("msgs2", `Starting folder loop`)

    // this outer loop is for performance testing 
    for (let index = 0; index < runs; index++) {

      //await new Promise(r => setTimeout(r, 12000));
      let st = new Date();

      folderExportedMsgCount = 0;

      // this is our folder loop
      for (var folderIndex = 0; folderIndex < expTask.folders.length; folderIndex++) {
        expTask.currentFolderIndex = folderIndex;
        expTask.currentFolderPath = expTask.folders[folderIndex].exportPath;
        folderExportedMsgCount = 0;

        log("msgs msgs2", `Starting: [${folderIndex}] ${expTask.currentFolderPath}`)

        // create export container
        if (!functionParams?.subFolders ||
          (functionParams?.subFolders && folderIndex == 0)) {
          expTask.exportContainer.directory = await browser.ExportMessages.createExportContainer(expTask);
        }

        log("msgs msgs2", `Created export container:\n${expTask.exportContainer.directory}`)

        // create the status window on first folder
        if (folderIndex == 0) {
          var winType = "singleFolder";
          if (totalFolderCount > 1) {
            winType = "multipleFolders";
          }

          if (!notificationsForExpFolders) {

            // wait for the window to load and send expStatusWinOpen

            let w = await new Promise(async (resolve, reject) => {
              let resolved = false;

              async function expStatusWinOpen(msg) {
                if (msg.command == "UI_EVENT" &&
                  msg.source == "expStatusWin" &&
                  msg.srcEvent == "expStatusWinOpen") {
                  browser.runtime.onMessage.removeListener(expStatusWinOpen);
                  log("msgs2", `Received expStatusWinOpen event`)
                  resolved = true;
                  resolve();
                }
              }
              browser.runtime.onMessage.addListener(expStatusWinOpen);
              // create timeout for reject and abort
              setTimeout(() => {
                if (resolved) {
                  return;
                }
                log("err", `Timeout waiting for expStatusWinOpen event`)
                gAbort = true;
                reject("IETNG: Timeout waiting for expStatusWinOpen event");
                return;
              }, 4200);
              await ui.createExportStatusWindow(`${browser.i18n.getMessage("ExportFolders.title")} : ${expTask.exportFormatText} - `, winType);
              log("msgs2", `Created expStatusWin winType: ${winType}`)
            });
          }
        }

        if (!notificationsForExpFolders) {
          // send initial ui status
          browser.runtime.sendMessage({
            command: "UI_UPDATE",
            target: "expStatusWin",
            currentFolderName: expTask.folders[folderIndex].exportPath,
            currentFolderIndex: expTask.currentFolderIndex,
            folderExportedMsgCount: folderExportedMsgCount,
            totalFolderMsgCount: expTask.folders[folderIndex].totalMsgCount,
            totalFolderCount: totalFolderCount,
            totalMsgCount: totalMsgCount,
            totalMsgsExported: totalMsgsExported,
            totalErrCount: totalErrCount,
            statusMsg: "",
            winType: winType
          });

          log("msgs2", `Sent initial UI_UPDATE msg`)
        }

        log("msgs2", `Calling _msgIterateBatch`)

        var exportStatus = await _msgIterateBatch(expTask);
        if (gAbort) {
          break;
        }
        _createIndex(expTask, exportStatus.msgListLog);
      }

      if (!notificationsForExpFolders) {
        // tell expStatus window we are done
        try {
          browser.runtime.sendMessage({ command: "UI_CMD", target: "expStatusWin", subCommand: "finished" })
        } catch (ex) { }
      }

      if (notificationsForExpFolders) {
        let notificationMsg =
          `${browser.i18n.getMessage("totalMessages.label")} : ${totalMsgsExported}`;
        if (totalErrCount) {
          notificationMsg += `\n${browser.i18n.getMessage("totalErrors.label")} : ${totalMsgsExported}`;
        }

        let id = await messenger.notifications.create({
          message: notificationMsg,
          title: `${browser.i18n.getMessage("ExportFolders.title")} : ${expTask.exportFormatText}`,
          type: "basic",
          iconUrl: "/chrome/content/mboximport/icons/import-export-tools-ng-icon-64px.png"
        });
      }
      times[index] = new Date() - st;
      total += times[index];
    }

    // export summary
    let expFolders = folderSet.map(folder => {
      return `  ${folder.exportPath}\n`;
    }).join('');
    let exportMessage = `Exported Folders:\n`;
    exportMessage += expFolders;
    exportMessage += `Messages exported: ${totalMsgsExported}\n`;
    exportMessage += `Error count: ${totalErrCount}\n`;
    exportMessage += `Average time: ${(total / runs) / 1000}s\n`;
    log("msgs msgs2 summary", exportMessage)

    browser.ExportMessages.onExpUpdate.removeListener(_updateListener);

  } catch (ex) {
    console.error(ex)
    if (!ex) {
      var ex = "Unknown"
    }

    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex}\n\n${ex.stack}`);
    console.error(ex.stack);
    try {
      browser.ExportMessages.onExpUpdate.removeListener(_updateListener);
    } catch (ex) {
    }
    return;
  }
}

// export selected messages 
// tbd - consolidate common functions 
export async function exportSelectedMsgs(ctxEvent, tab, functionParams) {
  try {
    gAbort = false;

    logging.init({ logTypes: await prefCmds.getPref("debug.logTypes") });

    log("msgs msgs2", "Start Export selected messages\nFolder:")

    log("test", ctxEvent, "ctxEvent")
    log("test", tab, "tab")
    log("test", ctxEvent?.displayedFolder, "displayedFolder")
    let currentFolder = ctxEvent?.displayedFolder;

    if (currentFolder == undefined) {
      console.error("IETNG: displayedFolder is undefined, trying mailTabs");
      let currentMailtab = await messenger.mailTabs.getCurrent();
      if (currentMailtab && currentMailtab.displayedFolder) {
        console.warn("IETNG: Using mailTabs.displayedFolder - Please Report!");
        currentFolder = currentMailtab.displayedFolder;
        let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `ctxEvent.displayedFolder undefined using mailTabs.displayedFolder `);;

      } else if (!currentMailtab) {
        console.log("currentMailtab is undefined, giving up")
        let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `Both ctxEvent.displayedFolder and\nmailTabs.displayedFolder undefined \nGiving up`);;
        try {
          browser.ExportMessages.onExpUpdate.removeListener(_updateListener);
        } catch (ex) { }
        return;
      }
    }

    const notificationsForExpSelMsgs = await prefCmds.getPref("ui.exportStatus.selectedMsgs.useNotificationsNoWindow");

    // only displayedFolder
    let folderSet = await _getFolderSet([currentFolder], functionParams);
    let totalFolderCount = folderSet.length;

    log("msgs msgs2", ` Folder: ${folderSet[0].exportPath}`)

    // Cruddy way to get selected msg cnt
    // We have to workaround an error with mailTabs.getSelectedMessages()
    // intermittently and not that rarely, it will return 
    // a zero length messages list. This appears only happen when 
    // a single message is selected. We therefore assume a zero length 
    // is an error and use ctxEvent.selectedMessages from the menu operation.
    // Because there will be no iteration over the list, we we can
    // reuse it in _msgIterateBatch

    let selMsgCnt = (await messenger.mailTabs.getSelectedMessages())?.messages.length;
    let selectedMsgs = await messenger.mailTabs.getSelectedMessages()

    console.log("selected msgs", selectedMsgs)
    if (!selMsgCnt) {
      console.log("use ctxEvent.selectedMessages");
      folderSet[0].totalMsgCount = ctxEvent.selectedMessages.messages.length;
      selectedMsgs = ctxEvent.selectedMessages;
    } else {
      console.log("use getSelectedMessages");
      folderSet[0].totalMsgCount = 0;

      let msgListPage;
      do {
        if (!msgListPage) {
          msgListPage = await messenger.mailTabs.getSelectedMessages()
          //msgListPage = ctxEvent.selectedMessages;
          folderSet[0].totalMsgCount = msgListPage.messages.length;
          console.log(msgListPage)
        } else {
          msgListPage = await messenger.messages.continueList(msgListPage.id);
          folderSet[0].totalMsgCount += msgListPage.messages.length;
          //console.log(msgListPage)
        }
      } while (msgListPage.id);
    }

    if (ctxEvent.selectedMessages) {
      selectedMsgs = ctxEvent.selectedMessages;
    }

    selectedMsgs
    let totalMsgCount = 0;

    folderSet.forEach(folder => {
      totalMsgCount += folder.totalMsgCount;
    });

    var expTask = await createExportTask(functionParams, ctxEvent, folderSet);

    // get export directory
    let useSelectedMsgsExportDir = await prefCmds.getPref("export.general.useDefaultSelectedMsgsExportDir");
    let selectedMsgsExportDir = await prefCmds.getPref("export.general.defaultSelectedMsgsExportDir");
    if (useSelectedMsgsExportDir && selectedMsgsExportDir != "") {
      expTask.generalConfig.exportDirectory = selectedMsgsExportDir;
    } else {
      let resultObj = await browser.ExportMessages.openFileDialog(Ci.nsIFilePicker.modeGetFolder, "Export Directory", "", Ci.nsIFilePicker.filterAll);
      if (resultObj.result != Ci.nsIFilePicker.returnOK) {
        return;
      }
      expTask.generalConfig.exportDirectory = resultObj.folder;
    }

    log("msgs msgs2", `Export path: ${expTask.generalConfig.exportDirectory}`)

    var runs = 1;
    var total = 0;
    var times = [];

    // UI listener
    browser.runtime.onMessage.addListener(msg => {
      if (msg.command != "UI_EVENT") {
        return null;
      }

      if (msg.source == "expStatusWin") {
        switch (msg.srcEvent) {
          case "cancelClick":
            // we are aborting current export
            gAbort = true;
            break;
        }
      }
    });

    // export update listener

    let folderExportedMsgCount = 0;
    let totalMsgsExported = 0;
    let totalErrCount = 0;

    async function _updateListener(folderName, msgCount, errCount) {
      if (gAbort) {
        return;
      }
      folderExportedMsgCount += msgCount;
      totalMsgsExported += msgCount;
      totalErrCount += errCount;

      let statusMsg = "";
      if (totalErrCount) {
        statusMsg = browser.i18n.getMessage("msgErrs.label");
      }
      if (!notificationsForExpSelMsgs) {
        browser.runtime.sendMessage({
          command: "UI_UPDATE", target: "expStatusWin",
          currentFolderName: expTask.folders[expTask.currentFolderIndex].exportPath,
          currentFolderIndex: expTask.currentFolderIndex,
          folderExportedMsgCount: folderExportedMsgCount,
          totalFolderMsgCount: expTask.folders[expTask.currentFolderIndex].totalMsgCount,
          totalFolderCount: totalFolderCount,
          totalMsgCount: totalMsgCount,
          totalMsgsExported: totalMsgsExported,
          totalErrCount: totalErrCount,
          statusMsg: statusMsg,
        });
      }
    }

    browser.ExportMessages.onExpUpdate.addListener(_updateListener);

    let st = new Date();

    // this is our folder loop - could remove tbd
    for (var folderIndex = 0; folderIndex < expTask.folders.length; folderIndex++) {

      expTask.currentFolderIndex = folderIndex;
      expTask.currentFolderPath = expTask.folders[folderIndex].exportPath;
      folderExportedMsgCount = 0;

      // create export container if enabled 
      if (functionParams.expMethod != "selectedMsgs") {
        if (!functionParams?.subFolders ||
          (functionParams?.subFolders && folderIndex == 0)) {
          expTask.exportContainer.directory = await browser.ExportMessages.createExportContainer(expTask);
        }
      }

      // create the status window on first folder
      if (folderIndex == 0) {
        var winType = "singleFolder";
        if (totalFolderCount > 1) {
          winType = "multipleFolders";
        }

        if (!notificationsForExpSelMsgs) {

          // wait for the window to load and send expStatusWinOpen

          await new Promise(async (resolve, reject) => {
            let resolved = false;
            async function expStatusWinOpen(msg) {
              if (msg.command == "UI_EVENT" &&
                msg.source == "expStatusWin" &&
                msg.srcEvent == "expStatusWinOpen") {
                browser.runtime.onMessage.removeListener(expStatusWinOpen);
                resolved = true;
                resolve();
              }
            }
            browser.runtime.onMessage.addListener(expStatusWinOpen);
            // create timeout for reject and abort
            setTimeout(() => {
              if (resolved) {
                return;
              }
              log("err", `Timeout waiting for expStatusWinOpen event`)
              gAbort = true;
              reject("IETNG: Timeout waiting for expStatusWinOpen event");
              return;
            }, 4200);
            await ui.createExportStatusWindow(`${browser.i18n.getMessage("ExportSelectedMessages.title")} : ${expTask.exportFormatText} - `, winType);

          });
        }
      }

      if (!notificationsForExpSelMsgs) {

        // send initial ui status
        browser.runtime.sendMessage({
          command: "UI_UPDATE",
          target: "expStatusWin",
          currentFolderName: expTask.folders[folderIndex].exportPath,
          currentFolderIndex: expTask.currentFolderIndex,
          folderExportedMsgCount: folderExportedMsgCount,
          totalFolderMsgCount: expTask.folders[folderIndex].totalMsgCount,
          totalFolderCount: totalFolderCount,
          totalMsgCount: totalMsgCount,
          totalMsgsExported: totalMsgsExported,
          totalErrCount: totalErrCount,
          statusMsg: "",
          winType: winType
        });
      }

      var exportStatus = await _msgIterateBatch(expTask, selectedMsgs);
      if (gAbort) {
        break;
      }

      if (expTask.index.create) {
        _createIndex(expTask, exportStatus.msgListLog);
      }
    }

    if (!notificationsForExpSelMsgs) {
      // tell expStatus window we are done
      try {
        browser.runtime.sendMessage({ command: "UI_CMD", target: "expStatusWin", subCommand: "finished" })
      } catch (ex) { }
    }

    if (notificationsForExpSelMsgs) {
      let notificationMsg =
        `${browser.i18n.getMessage("totalMessages.label")} : ${totalMsgsExported}`;
      if (totalErrCount) {
        notificationMsg += `\n${browser.i18n.getMessage("totalErrors.label")} : ${totalMsgsExported}`;
      }

      let id = await messenger.notifications.create({
        message: notificationMsg,
        title: `${browser.i18n.getMessage("ExportSelectedMessages.title")} : ${expTask.exportFormatText}`,
        type: "basic",
        iconUrl: "/chrome/content/mboximport/icons/import-export-tools-ng-icon-64px.png"
      });
    }

    times[0] = new Date() - st;
    total += times[0];

    let expFolders = folderSet.map(folder => {
      return `  ${folder.exportPath}\n`;
    }).join('');
    let exportMessage = `Exported Selected Messages:\n`;
    exportMessage += expFolders;
    exportMessage += `Messages exported: ${totalMsgsExported}\n`;
    exportMessage += `Error count: ${totalErrCount}\n`;
    exportMessage += `Average time: ${(total / runs) / 1000}s\n`;
    log("msgs msgs2 summary", exportMessage)

    browser.ExportMessages.onExpUpdate.removeListener(_updateListener);
  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
    console.error(ex);
    console.error(ex.stack);
    try {
      browser.ExportMessages.onExpUpdate.removeListener(_updateListener);
    } catch (ex) { }
  }
}

async function _getFolderSet(selectedFolders, functionParams) {
  var fullFolderSet = selectedFolders;

  // if we are doing subfolders we need to prune then get all subfolders 
  if (functionParams.subFolders) {
    // pruning removes overlapping subfolders
    let prunedFolders = selectedFolders;
    selectedFolders.forEach(folder => {
      prunedFolders = prunedFolders.filter(pfolder => pfolder == folder || !pfolder.path.startsWith(folder.path))
    });
    fullFolderSet = prunedFolders;

    // add all subfolders under top folders recurseivly

    async function getSubFolders(folder) {
      let subFolders = await browser.folders.getSubFolders(folder.id);
      fullFolderSet = fullFolderSet.concat(subFolders);
      if (subFolders) {
        for (const subFolder of subFolders) {
          await getSubFolders(subFolder);
        }
      }
    }
    let topFolders = fullFolderSet;
    for (const folder of topFolders) {
      await getSubFolders(folder);
    }
  }

  // get path of shortest parent

  var firstParents = await browser.folders.getParentFolders(fullFolderSet[0].id)
  let basePathLen = firstParents.length

  if (!firstParents.length) {
    firstParents.push({ path: "/" });
  }

  let basePath = firstParents[0].path;

  for (let index = 1; index < fullFolderSet.length; index++) {
    let parentfolders = await browser.folders.getParentFolders(fullFolderSet[index].id);

    if (parentfolders.length < basePathLen) {
      basePathLen = parentfolders.length;
      basePath = parentfolders[0].path;
    }
  }

  // create relative export paths with localization

  for (const [index, folder] of fullFolderSet.entries()) {
    let parentfolders = await browser.folders.getParentFolders(folder.id);

    fullFolderSet[index].exportPath = folder.name.replace(/[\\:<>*\?\"\|]/g, "_");

    for (const [index2, folderParent] of parentfolders.entries()) {
      if (folderParent.path == basePath) {
        break;
      }
      fullFolderSet[index].exportPath =
        `${parentfolders[index2].name.replace(/[\\:<>*\?\"\|]/g, "_")}${osPathSeparator}${fullFolderSet[index].exportPath}`;
    }
  }

  // add folder path and totalMsgCount 
  for (const [index, folder] of fullFolderSet.entries()) {
    fullFolderSet[index].totalMsgCount = (await browser.folders.getFolderInfo(folder.id)).totalMessageCount;
  }
  return fullFolderSet;
}

async function _msgIterateBatch(expTask, selectedMsgs) {
  // 1522 msgs 50MB
  // 20 run avg 1800msms

  // iterate msgs

  log("msgs2", `Starting _msgIterateBatch`)

  var wrtotal = 0;
  var msgListPage = null;
  const targetMaxMsgData = 25 * 1000 * 1000;
  var totalMsgsData = 0;
  var totalMsgs = 0;

  var expResult;
  var writePromises = [];
  var writeMsgs = true;
  var expId = 0;

  try {
    log("msgs2", `Starting msgList collection`)

    do {
      if (gAbort) {
        break;
      }
      if (!msgListPage) {
        // if we are doing a selected messages export, use 
        // the selected since cannot rely on getSelectedMessages()
        // method otherwise for folders
        // we use the massages.list

        if (expTask.expMethod == "selectedMsgs") {
          msgListPage = selectedMsgs
          //msgListPage = await browser.mailTabs.getSelectedMessages()

          log("msgs", `First selected  msgListPage length: ${msgListPage.messages.length}`)
        } else {
          msgListPage = await messenger.messages.list(expTask.folders[expTask.currentFolderIndex].id);
          //log("msgs", `First msgListPage length: ${msgListPage.messages.length}`)
        }
      } else {
        msgListPage = await messenger.messages.continueList(msgListPage.id);
        //log("msgs", `Next msgListPage length: ${msgListPage.messages.length
      }
      //log("msgs", `Processing msgListPage length: ${msgListPage.messages.length} id: ${msgListPage.id}`)

      const messagesLen = msgListPage.messages.length;
      expTask.msgList = [];
      var getBodyPromises = [];

      totalMsgs += messagesLen;

      for (let index = 0; index < messagesLen; index++) {

        if (gAbort) {
          break;
        }

        expTask.msgList.push(msgListPage.messages[index]);
        let msgId = msgListPage.messages[index].id;

        getBodyPromises.push(_getprocessedMsg(expTask, msgId, msgListPage.messages[index]));

        totalMsgsData += msgListPage.messages[index].size;

        if (totalMsgsData >= targetMaxMsgData) {
          if (writeMsgs) {
            let getBodySettledPromises = await Promise.allSettled(getBodyPromises);

            for (let index = 0; index < getBodySettledPromises.length; index++) {
              expTask.msgList[index].msgData = getBodySettledPromises[index].value;
              //console.log(index, expTask.msgList[index].id, expTask.msgList[index])
            }
            expTask.id = expId++;
            log("msgs2", `Starting ExpId: ${expTask.id} numMsgs: ${expTask.msgList.length}`);
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

          for (let index = 0; index < getBodySettledPromises.length; index++) {
            expTask.msgList[index].msgData = getBodySettledPromises[index].value;
          }
          expTask.id = expId++;
          log("msgs2", `Starting ExpId: ${expTask.id} numMsgs: ${expTask.msgList.length}`);
          writePromises.push(browser.ExportMessages.exportMessagesES6(expTask));
          //await browser.ExportMessages.exportMessagesES6(expTask);
        }
      }

      wrtotal += expResult;

    } while (msgListPage.id);

    if (writeMsgs) {
      var msgsStatus = await Promise.allSettled(writePromises);

      //log("msgs", `writePromises all settled status: ${msgsStatus.status} values: ${msgsStatus.value.length}`)

      log("mstatus", msgsStatus, "msgsStatus")

      if (msgsStatus.length == 1 && msgsStatus[0]?.reason) {
        throw new Error(msgsStatus[0].reason + "\n\nSee the Debug Console for more detail.\n(Control-Shift-J)")
      }

      if (msgsStatus.length == 1 && msgsStatus[0].value.error) {
        console.error(msgsStatus[0].value.error)
        throw new Error(msgsStatus[0].value.error)
      }

      let msgListLog = [];
      let msgCount = 0;
      let errCount = 0;

      for (let index = 0; index < msgsStatus.length; index++) {

        for (let vindex = 0; vindex < msgsStatus[index].value.length; vindex++) {
          const fileStatus = msgsStatus[index].value[vindex].fileStatus;
          fileStatus.fileSize = msgsStatus[index].value[vindex].value;
          const error = msgsStatus[index].value[vindex].error;
          if (fileStatus.fileType == "message") {
            msgCount++;
            if (error.error != "none") {
              errCount++;
            }
            msgListLog.push({ fileStatus: fileStatus, error: error });
          }
        }
      }

      return { msgListLog: msgListLog, msgCount: msgCount, errCount: errCount };
    }
  } catch (ex) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), `${ex.message}\n\n${ex.stack}`);
    console.error(ex)
    gAbort = true;
    return;
  }
}

async function _getprocessedMsg(expTask, msgId, msg) {

  return new Promise(async (resolve, reject) => {

    try {
      // we can't use getHeaders() until TB v147 so just wait until v140 depreciated
      let extraHeaders = await browser.ExportMessages.getMsgHdrs(msgId, ["fullSubject"]);
      if (expTask.expType == "eml") {
        let rawMsg = await browser.messages.getRaw(msgId);
        if (rawMsg.decryptionStatus == "fail") {
          resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [], extraHeaders: extraHeaders });
          return;
        }
        let utf8Msg = _decodeBinaryString(rawMsg);
        resolve({ utf8RawMsg: utf8Msg, msgBodyType: "text/utf-8", inlineParts: [], attachmentParts: [], extraHeaders: extraHeaders });
        return;
      }

      // for PDF we only do getFull if we are saving attachments
      if (expTask.expType == "pdf") {
        if (expTask.attachments.save == "none") {
          resolve({ msgBody: null, msgBodyType: "pdf/none", inlineParts: [], attachmentParts: [], extraHeaders: extraHeaders });
          return;
        }
      }

      // we use getFull() because listAttachments() misses some edge conditions
      // we can fixup
      let fullMsg = await browser.messages.getFull(msgId, { decrypt: true });
      log("msgparts", fullMsg, `Msg: ${extraHeaders.fullSubject}\nFullMsg parts:`)

      // add reply-to to extraHeaders if exists
      if (fullMsg?.headers["reply-to"]) {
        extraHeaders["reply-to"] = fullMsg?.headers["reply-to"]
      }

      if (fullMsg.decryptionStatus == "fail") {
        resolve({ msgBody: "decryption failed", msgBodyType: "text/plain", inlineParts: [], attachmentParts: [], extraHeaders: extraHeaders });
        return;
      }
      let parts = fullMsg.parts;

      var textParts = [];
      var htmlParts = [];
      var inlineParts = [];
      var attachmentParts = [];

      async function getParts(parts) {

        for (const part of parts) {
          log("msgparts", part, `Msg: ${extraHeaders.fullSubject}\nMsg part:`)

          // we could have multiple sub parts
          let contentType = part.contentType;

          if (expTask.expType != "pdf" && contentType == "text/html" && part?.body) {
            let charsetMatch = part.body.match(/charset=([^;"]*)/i);
            if (charsetMatch && charsetMatch.length == 2) {
              part.body = part.body.replace(charsetMatch[1], "UTF-8")
            }
            htmlParts.push({ contentType: part.contentType, body: part?.body });
          }
          if (expTask.expType != "pdf" && part.contentType == "text/plain" && part?.body) {
            textParts.push({ contentType: part.contentType, body: part?.body });
          }

          if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("inline")) {
            let cd = part.headers["content-disposition"][0];
            if (cd.startsWith("inline;") && !cd.includes('filename="Deleted:')) {
              try {
                let contentId = part.headers["content-id"][0];
                let inlineBody = await browser.messages.getAttachmentFile(msgId, part.partName);
                inlineParts.push({ partType: "inline", contentType: part.contentType, partBody: inlineBody, name: part.name, contentId: contentId });
              } catch {
                let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
                attachmentParts.push({ partType: "attachment", contentType: part.contentType, partBody: attachmentBody, name: part.name });
              }
            }
          }

          if (part.headers["content-disposition"] && part.headers["content-disposition"][0].includes("attachment")) {

            let attachmentBody = await browser.messages.getAttachmentFile(msgId, part.partName);
            attachmentParts.push({ partType: "attachment", contentType: part.contentType, partBody: attachmentBody, name: part.name });
          }

          if (part.parts) {
            await getParts(part.parts)
          }
        }
      }

      await getParts(parts)

      // we have collected the body parts
      // we preprocess according to the export type
      // and the body parts we have
      // at this level we do text to html conversion 
      // or html to text conversion if necessary 
      // then a header table added

      switch (expTask.expType) {
        case "eml":
          break;
        case "html":
          if (htmlParts.length) {
            htmlParts[0].body = await _preprocessBody(expTask, msg, htmlParts[0].body, "text/html", extraHeaders);
            resolve({ msgBody: htmlParts[0].body, msgBodyType: "text/html", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          } else if (textParts.length) {
            htmlParts.push(textParts[0]);
            htmlParts[0].body = await _preprocessBody(expTask, msg, textParts[0].body, "text/plain", extraHeaders);
            htmlParts[0].extraHeaders = textParts[0].extraHeaders;
            textParts = [];
            resolve({ msgBody: htmlParts[0].body, msgBodyType: "text/html", inlineParts: inlineParts, attachmentParts, extraHeaders: extraHeaders });
          } else {
            resolve({ msgBody: null, msgBodyType: "none", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          }
          break;
        case "pdf":
          resolve({ msgBody: null, msgBodyType: "none", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          break;
        case "plaintext":

          if (textParts.length) {

            textParts[0].body = await _preprocessBody(expTask, msg, textParts[0].body, "text/plain", extraHeaders);
            resolve({ msgBody: textParts[0].body, msgBodyType: "text/plain", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          } else if (htmlParts.length) {
            textParts.push(htmlParts[0]);
            textParts[0].body = await _preprocessBody(expTask, msg, textParts[0].body, "text/html", extraHeaders);
            htmlParts = [];
            resolve({ msgBody: textParts[0].body, msgBodyType: "text/plain", inlineParts: inlineParts, attachmentParts, extraHeaders: extraHeaders });
          } else {
            resolve({ msgBody: null, msgBodyType: "none", inlineParts: inlineParts, attachmentParts: attachmentParts, extraHeaders: extraHeaders });
          }
          break;
      }
    } catch (ex) {
      console.error(ex, msg);
      reject(ex);
    }
  });
}

async function _preprocessBody(expTask, msg, body, msgBodyType, extraHeaders) {
  // so we need to do different processing 
  // depending upon both expType and our body type
  // critical to break things up and not have 
  // spaghetti conditionals

  let processedMsgBody;

  switch (expTask.expType) {
    case "eml":
      //processedMsgBody = await _processBodyForEML(expTask, index);
      break;
    case "html":
      processedMsgBody = await _processBodyForHTML(expTask, msg, body, msgBodyType, extraHeaders);
      break;
    case "pdf":
      //processedMsgBody = await _processBodyForPDF(expTask, index);
      break;
    case "plaintext":
      processedMsgBody = await _processBodyForPlaintext(expTask, msg, body, msgBodyType, extraHeaders);
      break;
  }
  return processedMsgBody;
}

async function _processBodyForEML(expTask, index) {
  return expTask.msgList[index].msgData.utf8RawMsg;
}

async function _processBodyForHTML(expTask, msg, msgBody, msgBodyType, extraHeaders) {
  // we process depending upon body content type

  if (msgBodyType == "text/html") {
    // first check if this is headless html where 
    // there is no html or body tags
    if (!/<HTML[^>]*>/i.test(msgBody)) {
      // wrap body with <html><body>
      msgBody = `<html>\n<head><title>${extraHeaders.fullSubject}</title></head>\n<body>\n${msgBody}\n</body>\n</html>`;
    }
    
    // add title if missing 
    if (!/<TITLE[^>]*>/i.test(msgBody)) {
      // check if we have a head block
      if (!/<HEAD[^>]*>/i.test(msgBody)) {
        // add head and title
        msgBody = msgBody.replace(/(<HTML[^>]*?>)/i,`$1<head><title>${extraHeaders.fullSubject}</title></head>\n`);        
      } else {
        // head, but no title
        msgBody = msgBody.replace(/(<HEAD[^>]*?>)/i,`$1\n<title>${extraHeaders.fullSubject}</title>\n`);
      }
    }
    
    return _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders);
  }
  // we have text/plain
  msgBody = _convertTextToHTML(msgBody);
  msgBody = await _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders);
  return msgBody;
}

async function _processBodyForPlaintext(expTask, msg, msgBody, msgBodyType, extraHeaders) {
  // we process depending upon body content type

  if (msgBodyType == "text/html") {
    // first check if this is headless html where 
    // there is no html or body tags
    if (!/<HTML[^>]*>/i.test(msgBody)) {
      // wrap body with <html><body>
      msgBody = `<html>\n<body>\n${msgBody}\n</body>\n</html>`;
    }
    msgBody = await browser.messengerUtilities.convertToPlainText(msgBody, { flowed: true });
    return _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders);
  }
  // we have text/plain
  msgBody = await _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders);
  return msgBody;
}

async function _insertHdrTable(expTask, msg, msgBody, msgBodyType, extraHeaders) {

  let author = msg.author.replaceAll('"',"");
  let date = strftime.strftime(expTask.hdrDateFormat, new Date(msg.date));
  let recipients;
  if (msg.recipients == []) {
    recipients = "(none)";
  } else {
    recipients = msg.recipients.join(", ").replaceAll('"', '');
  }

  let ccList;
  if (msg.ccList == []) {
    ccList = "";
  } else {
    ccList = msg.ccList.join(", ").replaceAll('"', '');
  }
  let bccList;
  if (msg.bccList == []) {
    bccList = "";
  } else {
    bccList = msg.bccList.join(", ").replaceAll('"', '');
  }

  let replyTo;
  if (extraHeaders["reply-to"] && extraHeaders["reply-to"][0]) {
   replyTo = extraHeaders["reply-to"][0].replaceAll('"', '');
  }

  // header localization 
  let hdrSubject = browser.i18n.getMessage("msgHdr.Subject");
  let hdrFrom = browser.i18n.getMessage("msgHdr.From");
  let hdrTo = browser.i18n.getMessage("msgHdr.To");
  let hdrDate = browser.i18n.getMessage("msgHdr.Date");
  let hdrReplyTo = browser.i18n.getMessage("msgHdr.ReplyTo");

  // for most locales Cc and Bcc are used as is
  // we will have an option to use localized versions later
  // for now some Asian locales warrant localized versions 

  let hdrCc = browser.i18n.getMessage("msgHdr.Cc");
  let hdrBcc = browser.i18n.getMessage("msgHdr.Bcc");

  if (["zh-CN",].includes(browser.i18n.getUILanguage())) {
    hdrCc = browser.i18n.getMessage("msgHdr.CcLocal");
    hdrBcc = browser.i18n.getMessage("msgHdr.BccLocal");
  }


  if (expTask.expType == "html") {
    let subjectHTML = _encodeSpecialTextToHTML(extraHeaders.fullSubject);
    let dateHTML = _encodeSpecialTextToHTML(date);
    let authorHTML = _encodeSpecialTextToHTML(author);
    let recipientsHTML = _encodeSpecialTextToHTML(recipients);
    let ccListHTML = _encodeSpecialTextToHTML(ccList);
    let bccListHTML = _encodeSpecialTextToHTML(bccList);

    let replyToHTML;
    if (replyTo) {
      replyToHTML = _encodeSpecialTextToHTML(replyTo);
    }

    let hdrRows = "";
    hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrSubject}:</b></td><td>${subjectHTML}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrFrom}:</b></td><td>${authorHTML}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrTo}:</b></td><td>${recipientsHTML}</td></tr>`;
    hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrDate}:</b></td><td>${dateHTML}</td></tr>`;

    if (ccList != "") {
      hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrCc}:</b></td><td>${ccListHTML}</td></tr>`;
    }

    if (bccList != "") {
      hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrBcc}:</b></td><td>${bccListHTML}</td></tr>`;
    }

    if (replyTo) {
      hdrRows += `<tr><td style='padding-right: 10px'><b>${hdrReplyTo}:</b></td><td>${replyToHTML}</td></tr>`;
    }

    let hdrTable = `\n<table border-collapse="true" border=0>${hdrRows}</table><br>\n`;

    //let rpl = "$1 " + tbl1.replace(/\$/, "$$$$");

    if (msgBodyType == "text/plain") {
      let tp = `<html>\n<head>\n<title>${subjectHTML}</title></head>\n<body>\n${hdrTable}\n${msgBody}</body>\n</html>\n`;
      return tp;
    }
    msgBody = msgBody.replace(/(<BODY[^>]*>)/i, "$1" + hdrTable);
    return msgBody;
  }

  // plaintext export

  let hdr = "";
  hdr += `${hdrSubject}:  ${extraHeaders.fullSubject}\r\n`;
  hdr += `${hdrFrom}:  ${author}\r\n`;
  hdr += `${hdrTo}:  ${recipients}\r\n`;
  hdr += `${hdrDate}:  ${date}\r\n`;

  if (ccList != "") {
    hdr += `${hdrCc}:  ${ccList}\r\n`;
  }
  if (bccList != "") {
    hdr += `${hdrBcc}:  ${bccList}\r\n`;
  }
  if (replyTo) {
    hdr += `${hdrReplyTo}:  ${replyTo}\r\n`;
  }

  return `${hdr}\r\n${msgBody}`;
}

function _decodeBinaryString(binaryString, inputEncoding = "utf-8") {
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i) & 0xff;
  }
  const decoder = new TextDecoder(inputEncoding);
  return decoder.decode(buffer);
}


function convertCharsetToUTF8(charset, string) {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder(charset);
    const encoded = encoder.encode(string);
    const decoded = decoder.decode(encoded);

    return decoded;
  } catch (e) {
    console.error("Error converting to utf-8", e);
    return string;
  }
}

function _convertTextToHTML(plaintext) {
  // we can do a lot here, but will start with the basics
  // note we only convert the text, header, styling and html 
  // wrapper is done later

  let htmlConvertedText;
  // first encode special characters
  htmlConvertedText = _encodeSpecialTextToHTML(plaintext);
  htmlConvertedText = htmlConvertedText.replace(/\r?\n/g, "<br>\n");

  return htmlConvertedText;
}


async function _createIndex(expTask, msgListLog) {

  // we create as text/html since we are saving as an html document

  try {
    msgListLog.sort((a, b) => new Date(b.fileStatus.headers.date) - new Date(a.fileStatus.headers.date));

    const attIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADFUlEQVR4nO2aTagOURjHH+KGuMXCZ0m3aycLKcqGEsICG2VhYXG7xYIsRSzIRjZ0EYnkY+EjG4qV8rWyQG5ZKPmIheQj3x/Pv5k3c+d9zpw5M2dm3nM9v/p33/vOOU/Pf94z55x5ZogURVEURVEURVEUpZPoYi1irWf1sdax5rNGNplUHcxlnWd9YP0R9JY1wJrZVIJVMYZ1jPWLZONpfWXtZI1oIlnfTGHdo3zG07pM0ckLlsmsh1TMfEuna8/aE/jlH1O2uR+sd6zflnabas69NDbz91krKFoNwHjWBtZTQ/sXrLH1pV8Om/mTrNGGvt2sW4Z+QYwCm/njZF/rMW+8F/peqiZlf/gw3+Kg0P+N53y94tM8WCvEwB7CdOk0im/zYJkhVreflP3hYh67ukOs5TnibhFiffaZuA9czQ/E3z8j+1C+K8R74Df9criaP5I6viQjdp8h5l7fJoqCZaqMeajfEBuT33ehPSbAOf6tuIOd220qZx7aKMQ2mYfOVOKmANLk5Goe+/6eVNws869Y06sy5MojkpM8QfnMQxdSMbPMf2EtrMyNIxNJTvIs5Tf/hDUpEdNmPs+SWSmY7WfEn3tJTnRBfNxmfpA1LRE7CPMY8kvj/00j4CJFw/SU4XiQ5jFMW9f7tsT3pjkgSxj2SfNrqMPNj2LdoH9JXU8cy1oFhoV5sIOGJoZNSG98DPuAOzSMzWPoS8WIq4k22AlmbYYgnKSpiT5BmAdbSU7yHA2t0eNmZjO1V3wxR+Ay6Uq0DcY8uEntSaIgOS6jD1aHnvhvmqDMA2n47y4YKzjzKDtLya4qECs482ACyQm7Jtvxm5wsPlF70tsd+gdtHkgPMTHT5ylqBm8e7CLZwB5LP7zgELx5MIv1jWQjh6l9qcPEiZP209AnKPMtULo27fAwR1xjHWVdoejJrqltkOYBVoMid31J4Q2P1XUn7pPZrNdUzPxHCvSXT4NCJJ7ju5h/zprXRLJVgZsePKh4SfZffT914LM7X6BIspi1j6IaPQomqO4eYK2kgN7eUBRFURRF+S/4CwPqfEibwrHFAAAAAElFTkSuQmCC"
    const downArrowIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAADsQAAA7EB9YPtSQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAHPSURBVHic7dzBVtpAAIXh+zLFfV3QZ4bnqnZT9Q3swuaoYCSBwGRmvu+c7FwMuT+BjSQAAAAAAAAAAAAAAAAAAAAAAAAAQOvukuyTPPy/9kk2RU9Ul6rv312SpySvB9dzkm3Bc9Vim7d7dXj/nlJJBPscH364XiKC72zzdo/G7t+u3NGme8z4Cxgi+FXsdOt1n6+fnB+vP8VON8NDvn8RIjg2ZfzXJL9LHXCOXU6/EB8H70499qv7CNjk6y8xIjg2Z/znVPIlMEl+Jvmb6RH0+HEw9bFf7RtFBOOaH38ggmPdjD8Qwbvuxh+IoOPxBz1H0P34gx4jMP6BniIw/ogeIjD+CS1HYPyJWozA+DO1FIHxz9RCBMa/UM0RGH8hNUZg/IXVFIHxr6SGCIx/ZWuOwPg3ssYIjH9ja4rA+IWsIQLjF1YyAuOvRIkIjL8yt4zA+Ct1iwiMv3LXjMD4lbhGBMavzJIRGL9SS0Rg/MpdEoHxG3FOBMZvzJz/uX+Z+bfGr8ScJ4HxG7VUBMav2KURGL8B50Zg/IbMjcD4DZoagfEbdioC43dg7MeY/Zh1Rzb5/HPsuyQ/ip4IAAAAAAAAAAAAAAAAAAAAAAAAAOjeP1TCsZ3QSll0AAAAAElFTkSuQmCC";
    const upArrowIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAOwAAADsAEnxA+tAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAgVJREFUeJzt3UFOFEEYhuHPsDExeiJPIZGjuAKXuhXv4Q2UuDAewXtwAIOL4Y8JDJnpoWeqq/p5kl4QWFTq/TLNChIAAAAAAAAAAAAAAAAAAAAAFu1F6wM0cpbkPMnb+69/JfmW5G+zE3Eyr5PcJLl78Nzcf4+BvUryM4/j1/M7yZtWh+O4dsU3goHtG98IBjQ1vhEM5ND4RjCA58Y3go7NFd8IOjR3fCPoyNT4H5N8mPDzRrBgh8QvRtC558QvRtCpOeIXI+jMnPGLEXTiGPGLESzcMeMXI1ioU8QvRrAwp4xfjGAhWsQvRtBYy/jFCBpZQvxiBCe2pPjFCE5kifGLERzZkuMXIziSHuIXI5hZT/GLEcykx/jFCJ6p5/jFCA40QvxiBBONFL8YwZ5GjF+MYIeR4xcjeMIa4hcjeGBN8YsR3Ftj/LL6Eaw5flntCMT/b3UjEP+x1YxA/KcNPwLxdxt2BOLvb7gRiD/dMCMQ/3Ddj+As2//86lPPVZtjLtpV9r+/m2zufDEuIv4cpozgotEZt/oaH/tz2fd1cN3qgNtcR/w57TOCL81Ot8WuV4CP/el2vQ7etzvaY2dJfmT7QS8bnqt3l9l+p9+zsF8Ck+Rlks9J/iS5zea/cLxreqIxnGdzl7fZ3O2nbO4aAAAAAAAAAAAAAAAAAAAAAAAAAAAAGMA/0nbvD8X+7HoAAAAASUVORK5CYII=";

    const subjectHdr = browser.i18n.getMessage("msgHdr.Subject");
    const fromHdr = browser.i18n.getMessage("msgHdr.From");
    const toHdr = browser.i18n.getMessage("msgHdr.To");
    const dateHdr = browser.i18n.getMessage("msgHdr.Date");
    const sizeStr = browser.i18n.getMessage("Size");
    const folderStr = browser.i18n.getMessage("Folder.label");

    let indexData = "";
    let titleDate = strftime.strftime(expTask.index.dateFormat, new Date());

    let styles = '<style>\r\n';
    styles += 'table { border-collapse: collapse; }\r\n';
    styles += `table.sortable th::after, th.sorttable_sorted::after, th.sorttable_sorted_reverse::after { content: " ";  display: inline-block; width: 20px;  height: 16px;}`;
    styles += `th.sorttable_sorted::after { background: no-repeat url(${downArrowIcon}); background-size: 80%; float: right; padding-bottom: -8px}`;
    styles += `th.sorttable_sorted_reverse::after { background: no-repeat url(${upArrowIcon}); background-size: 80%; float: right}`;
    styles += `#sorttable_sortfwdind, #sorttable_sortrevind { display: none; }`;

    styles += 'th { background-color: #e6ffff; }\r\n';
    styles += 'th, td { padding: 4px; text-align: left; vertical-align: center; }\r\n';
    styles += 'tr:nth-child(even) { background-color: #f0f0f0; }\r\n';
    styles += 'tr:nth-child(odd) { background-color: #fff; }\r\n';
    styles += 'tr>:nth-child(5) { text-align: center; }\r\n';
    styles += 'tr>:nth-child(6) { text-align: right; }\r\n';
    styles += '.msgError { background-color: red !important; color: white;}\r\n';
    styles += 'a:link { text-decoration: none;}\n';
    styles += '.msgError a:link { color:rgb(198, 198, 230);}\n';

    styles += '</style>\r\n';

    indexData = '<html>\r\n<head>\r\n';

    indexData += styles;
    indexData += '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\n';
    indexData += `<title>${folderStr} : ${expTask.folders[expTask.currentFolderIndex].name}</title>\n</head>\n<body>\n`;
    indexData += `<h2>${folderStr} : ${expTask.folders[expTask.currentFolderIndex].name}&nbsp;&nbsp;&nbsp;&nbsp;${dateHdr} : ${titleDate}</h2>\n`;

    indexData += '<table width="99%" border="1" class="sortable">\n';

    indexData += "<tr><th><b>" + subjectHdr + "</b></th>"; // Subject
    indexData += "<th><b>" + fromHdr + "</b></th>"; // From
    indexData += "<th><b>" + toHdr + "</b></th>"; // To
    indexData += "<th id='dateHdr'><b>" + dateHdr + "</b></th>"; // Date

    indexData += "<th style='padding-left: 12px;' class='sorttable_nosort' ><b>" + "<img src='" + attIcon + "' height='20px' width='20px'></b></th>"; // Attachment

    indexData += "<th><b>" + sizeStr + "</b></th>"; // Attachment

    indexData += "</tr>";

    log("mstatus", msgListLog, "createIndex msgListLog")

    for (let index = 0; index < msgListLog.length; index++) {
      const msgItem = msgListLog[index].fileStatus;
      const errItem = msgListLog[index].error;
      let errClass = "";
      if (errItem.error != "none") {
        console.log("err", errItem)
        errClass = " class='msgError' ";
      }

      let recipients;
      if (msgItem.headers.recipients == []) {
        recipients = "(none)";
      } else {
        recipients = msgItem.headers.recipients.map(recipient => {
          recipient = recipient.slice(0, 50)
          recipient = recipient.replaceAll('"', '');
          recipient = _encodeSpecialTextToHTML(recipient);
          return recipient;
        });
        recipients = recipients.join(",<br>");
      }

      let fpParts = msgItem.filePath.split(osPathSeparator);
      let filename = fpParts[fpParts.length - 1];
      let fileParent = fpParts[fpParts.length - 2];

      let messageContainerName = "";
      if (expTask.messages.messageContainer) {
        messageContainerName = encodeURIComponent(expTask.messages.messageContainerName) + "/";
      }

      let relUrl;

      // experimental export structure with msgs in attachment directory
      if (expTask.debug.logTypes.includes("withatts")) {
        relUrl = "./" + messageContainerName + encodeURIComponent(`${fileParent}`) + "/" + encodeURIComponent(`${filename}`);
      } else {
        relUrl = "./" + messageContainerName + encodeURIComponent(`${filename}`);
      }

      let fullSubject = msgItem.headers.subject;
      if (fullSubject.startsWith(".")) {
        fullSubject = "[No Decryption]" + fullSubject;
      }
      let aHref = `<a href="${relUrl}">${_encodeSpecialTextToHTML(fullSubject).slice(0, 50)}</a>`;

      let attachments = "";
      if (msgItem.hasAttachments) {
        attachments = msgItem.hasAttachments;
      }
      indexData += `\n<tr ${errClass}><td width="18%" sorttable_customkey="${fullSubject}">${aHref}</td>`;
      indexData += "\n<td>" + _encodeSpecialTextToHTML(msgItem.headers.author.slice(0, 50).replaceAll('"', '')) + "</td>";
      indexData += "\n<td>" + recipients + "</td>";
      indexData += `\n<td style='text-align: right;' sorttable_customkey="${strftime.strftime("%s", msgItem.headers.date)}" nowrap>${strftime.strftime(expTask.index.dateFormat, msgItem.headers.date)}</td>`;
      indexData += "\n<td>" + attachments + "</td>";
      indexData += "\n<td nowrap>" + _formatBytes(msgItem.headers.size, 2) + "</td>";
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