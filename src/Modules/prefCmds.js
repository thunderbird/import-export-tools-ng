// prefCmds.js



export async function getBoolPref(boolPref) {
  let params = {};
  params.targetWinId = (await messenger.windows.getCurrent()).id;
  params.boolPref = boolPref;
  let bp = await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_getBoolPref", params: params });
  return bp;
}
