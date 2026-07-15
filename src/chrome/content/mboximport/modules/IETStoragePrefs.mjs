// IETStoragePrefs.mjs

const addonRootPref = "extensions.importexporttoolsng.";
var win = Services.wm.getMostRecentWindow("mail:3pane").top;

export var IETStoragePrefs = {

  getBoolPref: async function (prefName) {
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "getPref",
      prefName: prefName
    });
  },

  getIntPref: async function (prefName) {
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "getPref",
      prefName: prefName
    });
  },

  getComplexPref: async function (prefName) {
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "getPref",
      prefName: prefName
    });
  },

  setBoolPref: async function (prefName, prefValue) {
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "setPref",
      prefName: prefName,
      prefValue: prefValue
    });
  },

  setIntPref: async function (prefName, prefValue) {
    let prefValueNum = Number(prefValue);
    if (isNaN(prefValueNum)) {
      prefValueNum = 0;
    }
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "setPref",
      prefName: prefName,
      prefValue: prefValueNum
    });
  },

  setComplexPref: async function (prefName, prefValue) {
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "setPref",
      prefName: prefName,
      prefValue: prefValue
    });
  },
};

