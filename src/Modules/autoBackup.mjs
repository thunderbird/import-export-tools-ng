// autoBackup.mjs

import { logging, log } from "./loggingWext.mjs";
import { prefCmds } from "./prefCmds.mjs";

console.log("loading autoBackup")


export async function initBackupScheduler() {
  try {

    logging.init({ logTypes: prefCmds.getPref("debug.logTypes") });

    // we always clear the alarm on init or change 
    browser.alarms.clear("backupPeriodicAlarm");

    if (!await prefCmds.getPref("autobackup.temp.enabled")) {
      log("backup", "Initialize Backup (Disabled)");

      return;
    }

    log("backup", "Initialize Backup Scheduler (Enabled)");

    // Add storage change listener.
    if (!(await messenger.storage.onChanged.hasListener(_backupOptionsObserver))) {
      await messenger.storage.onChanged.addListener(_backupOptionsObserver);
    }

    // get backup parameters
    let backupTime = await prefCmds.getPref("autobackup.temp.backupTime");
    let dayFrequency = await prefCmds.getPref("autobackup.temp.dayFrequency");
    let epochMSLastBackupTime = (await prefCmds.getPref("autobackup.temp.last")) * 1000;

    //console.log(epochMSLastBackupTime);

    epochMSLastBackupTime = 0

    let zdtLastBackupDate = Temporal.Instant.fromEpochMilliseconds(epochMSLastBackupTime)
      .toZonedDateTimeISO(Temporal.Now.timeZoneId());

    console.log("last bu", zdtLastBackupDate.toLocaleString());
    //console.log("last bu ems", zdtLastBackupDate.epochMilliseconds);


    let zdtNow = Temporal.Now.zonedDateTimeISO();
    console.log("now", zdtNow);

    //dayFrequency = 11;
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

    } else {
      zdtBackupDate = zdtLastBackupDate.add({ days: dayFrequency });
      if (Temporal.Instant.compare(zdtBackupDate, zdtNow) == -1) {
        console.log("overdue bu time");
        zdtBackupDate = zdtNow.with({ hour: hour, minute: minute, second: 0 });

      } else {
        zdtBackupDate = zdtBackupDate.with({ hour: hour, minute: minute, second: 0 });

      }
    }

    // if we are past backup time schedule for next day
    if (Temporal.Instant.compare(zdtBackupDate, zdtNow) == -1) {
      console.log("past bu time today");
      zdtBackupDate = zdtBackupDate.add({ days: 1 });
    }

    // create alarm
    console.log("setup backup alarm for:", zdtBackupDate.toLocaleString());

    if (!(await messenger.alarms.onAlarm.hasListener(_backupAlarm))) {
      browser.alarms.onAlarm.addListener(_backupAlarm);
    }
    //let periodInMinutes = 60 * 24 * dayFrequency;
    let periodInMinutes = 4 * dayFrequency;

    browser.alarms.create("backupAlarm",
      {
        when: zdtBackupDate.epochMilliseconds,
        periodInMinutes: periodInMinutes
      });



  } catch (ex) {
    console.log(ex);

  }
}
async function _backupAlarm(alarmInfo) {
  console.log(alarmInfo);
  console.log(Temporal.Now.zonedDateTimeISO().toLocaleString());
  await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Backup", params: "" });

}

async function _backupOptionsObserver(changes, area) {
  //console.log("obsv gBT", window.gBt)
  //console.log("changes", changes)

  let changedItems = Object.keys(changes);
  for (let item of changedItems) {
    if (area == "local" && item == "userPrefs") {
      let oldUserPrefs = changes.userPrefs.oldValue;
      let newUserPrefs = changes.userPrefs.newValue;

      try {
        if (newUserPrefs.autobackup.temp.enabled != oldUserPrefs.autobackup.temp.enabled ||
          newUserPrefs.autobackup.temp.backupTime != oldUserPrefs.autobackup.temp.backupTime ||
          newUserPrefs.autobackup.temp.dayFrequency != oldUserPrefs.autobackup.temp.dayFrequency) {
          //window.gBt = changes.userPrefs.newValue.autobackup.temp.backupTime;
          console.log("bu options changed - init Schedule ");

          initBackupScheduler();

        }
      } catch (ex) { }
    }

  }
}
