// IETPrefs.mjs

var win = Services.wm.getMostRecentWindow("mail:3pane").top;


export async function getBoolPref(prefName) {
  return win.ietngAddon.notifyTools.notifyBackground({command: "Pref_CMD", subcommand: "getPref", prefName: prefName});
  
}

export async function getIntPref(prefName) {
  return win.ietngAddon.notifyTools.notifyBackground({command:"Pref_CMD", subcommand, prefName: prefName});
}

export async function getComplexPref(prefName) {
  return win.ietngAddon.notifyTools.notifyBackground({command:"Pref_CMD", subcommand, prefName: prefName});
}


export async function setBoolPref(prefName, prefValue) {
  
}

export async function setIntPref(prefName, prefValue) {
  
}

export async function setComplexPref(prefName, prefValue) {
  
}
