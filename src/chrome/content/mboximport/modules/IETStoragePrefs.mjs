// IETStoragePrefs.mjs

const addonRootPref = "extensions.importexporttoolsng.";
var win = Services.wm.getMostRecentWindow("mail:3pane").top;

export var IETStoragePrefs = {

  getBoolPref: async function (prefName) {
    let shortPrefName = prefName.split(addonRootPref)[1];
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "getPref",
      prefName: shortPrefName
    });
  },

  getIntPref: async function (prefName) {
    let shortPrefName = prefName.split(addonRootPref)[1];
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "getPref",
      prefName: shortPrefName
    });
  },

  getComplexPref: async function (prefName) {
    let shortPrefName = prefName.split(addonRootPref)[1];
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "getPref",
      prefName: shortPrefName
    });
  },

  setBoolPref: async function (prefName, prefValue) {
    let shortPrefName = prefName.split(addonRootPref)[1];
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "setPref",
      prefName: shortPrefName,
      prefValue: prefValue
    });
  },

  setIntPref: async function (prefName, prefValue) {
    let shortPrefName = prefName.split(addonRootPref)[1];
    let prefValueNum = Number(prefValue);
    if (isNaN(prefValueNum)) {
      prefValueNum = 0;
    }
    return win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "setPref",
      prefName: shortPrefName,
      prefValue: prefValueNum
    });
  },

  setComplexPref: async function (prefName, prefValue) {
    let shortPrefName = prefName.split(addonRootPref)[1];
    return await win.ietngAddon.notifyTools.notifyBackground({
      command: "Pref_CMD",
      subcommand: "setPref",
      prefName: shortPrefName,
      prefValue: prefValue
    });
  },
};

