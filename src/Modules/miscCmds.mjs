// miscCmds.js

import * as prefs from "./prefCmds.mjs";


export async function getThunderbirdVersion() {
  let browserInfo = await messenger.runtime.getBrowserInfo();
  let parts = browserInfo.version.split(".");
  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
    revision: parts.length > 2 ? parseInt(parts[2]) : 0,
  };
}

var helpLocales = ['en-US', 'de', 'ca', 'cs', 'da', 'el', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hy-AM', 'it', 'ja', 'ko-KR',
  'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];

export async function openHelp(info) {
  if (!info.opentype) {
    let openInWindow = await prefs.getPref("help.openInWindow");
    info.opentype = openInWindow ? "window" : "tab";
  }

  var locale = messenger.i18n.getUILanguage();

  if (!helpLocales.includes(locale)) {
    var baseLocale = locale.split("-")[0];

    locale = helpLocales.find(l => l.split("-")[0] == baseLocale);
    if (!locale) {
      locale = "en-US";
    }
  }
  var bm = "";
  if (info.bmark) {
    bm = info.bmark;
  }
  try {
    if (info.opentype == "tab") {
      await browser.tabs.create({ url: `chrome/content/mboximport/help/locale/${locale}/importexport-help.html${bm}`, index: 1 });
    } else {
      await browser.windows.create({ url: `chrome/content/mboximport/help/locale/${locale}/importexport-help.html${bm}`, type: "panel", width: 1000, height: 520 });
    }
  } catch (ex) {
    if (info.opentype == "tab") {
      await browser.tabs.create({ url: `chrome/content/mboximport/help/locale/en-US/importexport-help.html${bm}`, index: 1 });
    } else {
      await browser.windows.create({ url: `chrome/content/mboximport/help/locale/en-US/importexport-help.html${bm}`, type: "panel", width: 1000, height: 520 });
    }
  }
}

export async function openOptions(event, tab) {
  let params = {};
  params.targetWinId = (await messenger.windows.getCurrent()).id;
  params.tabType = tab.type;

  let rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_OpenOptions", params: params });
}

// import eml/rfv822 msg attachment as new msg in current folder
export async function importEmlAttToFolder(attCtx) {

  let windows = await messenger.windows.getAll({ populate: true });
  let currentWin = windows.find(fw => fw.focused);
  let currentTab = currentWin.tabs.find(t => t.active);

  let msgDisplayed = await messenger.messageDisplay.getDisplayedMessage(currentTab.id);

  // get attachment as File blob
  let attachmentFile = await messenger.messages.getAttachmentFile(msgDisplayed.id, attCtx.attachments[0].partName);

  // we cannot import directly to an imap folder
  // get the first local folder account and import to first folder as tmp msg
  // move to current folder

  let allAccounts = await messenger.accounts.list(true);

  // we cannot know name so just grab first "none" type account
  let localFolder = allAccounts.find(acc => acc.type == "none");

  let msgHdr = await messenger.messages.import(attachmentFile, localFolder.folders[0]);
  await messenger.messages.move([msgHdr.id], msgDisplayed.folder);
}

export async function getMailStoreFromFolderPath(accountId, folderPath) {
  let params = {};
  params.targetWinId = (await messenger.windows.getCurrent()).id;

  params.accountId = accountId;
  params.folderPath = folderPath;

  let storeType = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_getMailStoreFromFolderPath", params: params });
  return storeType;
}

export async function copyToClipboard(ctxEvent, tab, functionParams) {
  let params = {};
  params.targetWinId = tab.windowId;
  params.tabType = tab.type;

  if (ctxEvent.pageUrl == undefined && functionParams?.ctx == "msgCtx") {
    params.selectedMsgs = ctxEvent.selectedMessages.messages;

  } else {
    let msg = (await messenger.messageDisplay.getDisplayedMessage(tab.id));
    params.selectedMsgs = [msg];
  }
  params.clipboardType = functionParams.clipboardType;
  return messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_CopyToClipboard", params: params });
}

export async function importMaildirFiles(ctxEvent) {
  let params = {};
  params.targetWinId = (await messenger.windows.getCurrent()).id;

  params.selectedFolder = ctxEvent.selectedFolder;
  params.selectedAccount = ctxEvent.selectedAccount;
  let rv = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_ImpMaildirFiles", params: params });
}
