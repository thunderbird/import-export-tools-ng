// IETPrefs.mjs

const addonRootPref = "extensions.importexporttoolsng.";
var win = Services.wm.getMostRecentWindow("mail:3pane").top;

export var IETPrefs = {

  getBoolPref: async function (prefName) {
    return win.ietngAddon.notifyTools.notifyBackground({ command: "Pref_CMD", subcommand: "getPref", prefName: prefName });
  },

  getIntPref: async function (prefName) {
    return win.ietngAddon.notifyTools.notifyBackground({ command: "Pref_CMD", subcommand: "getPref", prefName: prefName });
  },

  getComplexPref: async function (prefName) {
    let shortPrefName = prefName.split(addonRootPref)[1];
    return win.ietngAddon.notifyTools.notifyBackground({ command: "Pref_CMD", subcommand: "getPref", prefName: shortPrefName });
  },

  setBoolPref: async function (prefName, prefValue) {

  },

  setIntPref: async function (prefName, prefValue) {

  },

  setComplexPref: async function (prefName, prefValue) {

  },
};

