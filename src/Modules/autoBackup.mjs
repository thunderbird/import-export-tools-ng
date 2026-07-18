// autoBackup.mjs

import { logging, log } from "./loggingWext.mjs";
import { prefCmds } from "./prefCmds.mjs";

export async function initBackup() {
  // if backup not enabled, nothing to do
  if (!await prefCmds.getPref("temp.autobackup.temp.enabled")) {
    return;
  }

  // setup backup scheduler
  await initBackupScheduler();

}

async function initBackupScheduler() {
  // get backup parameters
  let backupTime = await prefCmds.getPref("temp.autobackup.temp.backupTime");
  let dayFrequency = await prefCmds.getPref("temp.autobackup.temp.frequency");
  let lastBackupTime = await prefCmds.getPref("temp.autobackup.temp.last");

  let backupPhases = [];
  // no differential backups yet so only primary on phase zero
  for (let phase = 0; phase < dayFrequency; phase++) {
    if (phase == 0) {
      backupPhases[phase] = "primary";
      continue;
    }
    backupPhases[phase] = "none";
  }
  
  // check where we are
  const dayInMs = 0;
  
  let lastBackupDate = new Date(lastBackupTime);
  let now = new Date();
  let daysSinceLastBackup = (now - lastBackupDate);

  let scheduleTime = 
  let timeComponents = backupTime.split(":");
  let hours = Number(timeComponents[0]);
  let minutes = Number(timeComponents[1]);
    runDateTime.setHours(hours, minutes, 0);
  
}