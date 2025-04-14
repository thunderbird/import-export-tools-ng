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

export async function getBoolPref(boolPref) {
  let params = {};
  params.targetWinId = (await messenger.windows.getCurrent()).id;
  params.boolPref = boolPref;
  let bp = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_getBoolPref", params: params });
  return bp;
}
