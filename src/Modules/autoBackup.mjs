// autoBackup.mjs

import { logging, log } from "./loggingWext.mjs";
import { prefCmds } from "./prefCmds.mjs";

logging.init({ logTypes: prefCmds.getPref("debug.logTypes") || "backup" });

export async function initBackup() {
  // if backup not enabled, nothing to do
  if (!await prefCmds.getPref("temp.autobackup.temp.enabled")) {
    return;    
  }
    log("backup","Initialize Backup (Enabled)");

  // setup backup scheduler
  await initBackupScheduler();

}

async function initBackupScheduler() {
  try {
    log("backup","Initialize Backup scheduler");
    
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
  
  let lastBackupDate = Temporal.Instant.fromEpochMilliseconds(lastBackupTime);
  console.log(lastBackupDate)
  let now = Temporal.Now.plainDateTimeISO();
  console.log(now)

  let daysSinceLastBackup = (lastBackupDate.since(now));
  console.log(daysSinceLastBackup)


  let scheduleTime = now;
  let timeComponents = backupTime.split(":");
  let hour = Number(timeComponents[0]);
  let minute = Number(timeComponents[1]);
  scheduleTime.with({hour: hour, minute: minute});
  console.log(scheduleTime)


} catch (ex) {
  console.log(ex)

}
}