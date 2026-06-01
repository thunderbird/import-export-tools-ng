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

// prefCmds.mjs

var addonRootPref = "extensions.importexporttoolsng.";

export async function getPref(prefName, fallback = null, root = addonRootPref) {
  prefName = root + prefName;
  return browser.LegacyPrefs.getPref(prefName, fallback);
}

export async function getUserPref(prefName, root = addonRootPref) {
  prefName = root + prefName;
  return browser.LegacyPrefs.getUserPref(prefName);
}

export function clearUserPref(prefName, root = addonRootPref) {
  prefName = root + prefName;
  return browser.LegacyPrefs.clearUserPref(prefName);
}

export async function setPref(prefName, value, root = addonRootPref) {
  prefName = root + prefName;
  return browser.LegacyPrefs.setPref(prefName, value);
}

export async function createPref(prefName, value, root = addonRootPref) {
  prefName = root + prefName;
  return browser.LegacyPrefs.createPref(prefName, value);
}

export async function getBoolPref(boolPref) {
  let params = {};
  params.targetWinId = (await messenger.windows.getCurrent()).id;
  params.boolPref = boolPref;
  let bp = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_getBoolPref", params: params });
  return bp;
}
