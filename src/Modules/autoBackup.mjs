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
    let epochMSLastBackupTime = (await prefCmds.getPref("autobackup.temp.last")) * 1000;

    console.log(epochMSLastBackupTime)
    

    // check where we are
    const dayInMs = 0;

    let d = new Date(epochMSLastBackupTime)
    console.log("last bu date", d)
    let zdtLastBackupDate = Temporal.Instant.fromEpochMilliseconds(epochMSLastBackupTime)
                              .toZonedDateTimeISO(Temporal.Now.timeZoneId());

    // 3. Remove the time zone to get the PlainDateTime
    //const plainDateTime = zonedDateTime.toPlainDateTime();

    console.log("last bu", zdtLastBackupDate)
    console.log("last bu ems", zdtLastBackupDate.epochMilliseconds)


    let zdtNow = Temporal.Now.zonedDateTimeISO();
    console.log("now", zdtNow)

    //let daysSinceLastBackup = (plainDateTime.since(zdtNow));
    //console.log(daysSinceLastBackup.days)
    //console.log(daysSinceLastBackup.hours)


    let scheduleTime = zdtNow;
    let timeComponents = backupTime.split(":");
    let hour = Number(timeComponents[0]);
    let minute = Number(timeComponents[1]);
    scheduleTime = scheduleTime.with({ hour: hour, minute: minute });
    console.log(scheduleTime)
    console.log(Temporal.Instant.compare(scheduleTime, zdtNow))

    
    // alarm test
    console.log("alarm test")
    browser.alarms.onAlarm.addListener(_backupAlarm)

    let at = zdtNow.add({ minutes: 5 })
    console.log("alarm time", at)
    //browser.alarms.create("test", { when: at.epochMilliseconds })



  } catch (ex) {
    console.log(ex)

  }
}
async function _backupAlarm(alarmInfo) {
  console.log(alarmInfo)
  console.log(Temporal.Now.zonedDateTimeISO())
}