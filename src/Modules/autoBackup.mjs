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

    //epochMSLastBackupTime = 0

    let d = new Date(epochMSLastBackupTime)
    console.log("last bu date", d)
    let zdtLastBackupDate = Temporal.Instant.fromEpochMilliseconds(epochMSLastBackupTime)
      .toZonedDateTimeISO(Temporal.Now.timeZoneId());

    console.log("last bu", zdtLastBackupDate)
    console.log("last bu ems", zdtLastBackupDate.epochMilliseconds)


    let zdtNow = Temporal.Now.zonedDateTimeISO();
    console.log("now", zdtNow)

    //let daysSinceLastBackup = (plainDateTime.since(zdtNow));
    //console.log(daysSinceLastBackup.days)
    //console.log(daysSinceLastBackup.hours)

    dayFrequency = 11
    // determine next backup date

    // get backup hour, minute
    let backupHrMin = backupTime.split(":");
    let hour = Number(backupHrMin[0]);
    let minute = Number(backupHrMin[1]);
    let zdtBackupDate;

    // if zdtLastBackupDate (ems) is zero we are starting
    // a new backup from now
    if (zdtLastBackupDate.epochMilliseconds == 0) {
      zdtBackupDate = zdtNow.with({ hour: hour, minute: minute, second: 0 });

      // if we are past backup time schedule tomorrow

      if (Temporal.Instant.compare(zdtBackupDate, zdtNow) == -1) {
        console.log("past bu time")
        zdtBackupDate = zdtBackupDate.add({ days: 1 });
      }

      console.log(" bu time", zdtBackupDate)

    } else {
      zdtBackupDate = zdtLastBackupDate.add({ days: dayFrequency });
      if (Temporal.Instant.compare(zdtBackupDate, zdtNow) == -1) {
        console.log("overdue bu time")
        zdtBackupDate = zdtNow.with({ hour: hour, minute: minute, second: 0 });

      } else {
        zdtBackupDate = zdtBackupDate.with({ hour: hour, minute: minute, second: 0 });

      }
    }

    if (Temporal.Instant.compare(zdtBackupDate, zdtNow) == -1) {
      console.log("past bu time today")
      zdtBackupDate = zdtBackupDate.add({ days: 1 });
    }

    console.log(" bu time", zdtBackupDate)



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