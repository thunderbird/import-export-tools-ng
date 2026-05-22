// IETPrefs.mjs

const addonRootPref = "extensions.importexporttoolsng.";
var win = Services.wm.getMostRecentWindow("mail:3pane").top;


export async function getBoolPref(prefName) {
  return win.ietngAddon.notifyTools.notifyBackground({ command: "Pref_CMD", subcommand: "getPref", prefName: prefName });

}

export async function getIntPref(prefName) {
  return win.ietngAddon.notifyTools.notifyBackground({ command: "Pref_CMD", subcommand: "getPref", prefName: prefName });
}

export var IETPrefs2 = {
  getComplexPref: async function (prefName) {
    let shortPrefName = prefName.split(addonRootPref)[1];
    return win.ietngAddon.notifyTools.notifyBackground({ command: "Pref_CMD", subcommand: "getPref", prefName: shortPrefName });
  },
};


export async function setBoolPref(prefName, prefValue) {

}

export async function setIntPref(prefName, prefValue) {

}

export async function setComplexPref(prefName, prefValue) {

}
