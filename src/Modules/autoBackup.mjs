// autoBackup.mjs

import { logging, log } from "./loggingWext.mjs";
import { prefCmds } from "./prefCmds.mjs";

logging.init({ logTypes: prefCmds.getPref("debug.logTypes") || "backup" });

export async function initBackup() {
  // if backup not enabled, nothing to do
  if (!await prefCmds.getPref("temp.autobackup.temp.enabled")) {
    //return;
  }
  log("backup", "Initialize Backup (Enabled)");

  // setup backup scheduler
  await initBackupScheduler();

}

async function initBackupScheduler() {
  try {
    log("backup", "Initialize Backup scheduler");

    // get backup parameters
    let backupTime = await prefCmds.getPref("autobackup.temp.backupTime");
    let dayFrequency = await prefCmds.getPref("autobackup.temp.frequency");
    let lastBackupTime = (await prefCmds.getPref("autobackup.temp.last"));

    lastBackupTime = lastBackupTime * 1000;
    console.log(lastBackupTime)
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

    let d = new Date(lastBackupTime)
    console.log(d)
    let lastBackupDate = Temporal.Instant.fromEpochMilliseconds(lastBackupTime);
    const zonedDateTime = lastBackupDate.toZonedDateTimeISO(Temporal.Now.timeZoneId());

// 3. Remove the time zone to get the PlainDateTime
const plainDateTime = zonedDateTime.toPlainDateTime();

    console.log(plainDateTime)
    let now = Temporal.Now.zonedDateTimeISO();
    console.log(now)

    let daysSinceLastBackup = (plainDateTime.since(now));
    console.log(daysSinceLastBackup.days)
    console.log(daysSinceLastBackup.hours)


    let scheduleTime = now;
    let timeComponents = backupTime.split(":");
    let hour = Number(timeComponents[0]);
    let minute = Number(timeComponents[1]);
    scheduleTime = scheduleTime.with({ hour: hour, minute: minute });
    console.log(scheduleTime)
    console.log(Temporal.Instant.compare(scheduleTime, now))


  } catch (ex) {
    console.log(ex)

  }
}