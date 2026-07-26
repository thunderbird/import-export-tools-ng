// autoBackup.mjs

import { logging, log } from "./loggingWext.mjs";
import { prefCmds } from "./prefCmds.mjs";


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
    let retainNumBackups = await prefCmds.getPref("autobackup.temp.retainNumBackups");
    let backupDir = await prefCmds.getPref("autobackup.temp.dir");

    log("backup", "Backup Parameters:");
    log("backup", `  Backup Time: ${backupTime}`);
    log("backup", `  Day Frequency: ${dayFrequency}`);
    log("backup", `  Last Backup Time: ${new Date(epochMSLastBackupTime).toLocaleString()}`);
    log("backup", `  Backups To Retain: ${retainNumBackups}`);
    log("backup", `  Backup Directory: ${backupDir}`);


    //console.log(epochMSLastBackupTime);

    //epochMSLastBackupTime = 0

    let zdtLastBackupDate = Temporal.Instant.fromEpochMilliseconds(epochMSLastBackupTime)
      .toZonedDateTimeISO(Temporal.Now.timeZoneId());

    let zdtNow = Temporal.Now.zonedDateTimeISO();

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
        log("backup", `Backup overdue, schedule for today`);
        zdtBackupDate = zdtNow.with({ hour: hour, minute: minute, second: 0 });
      } else {
        zdtBackupDate = zdtBackupDate.with({ hour: hour, minute: minute, second: 0 });
      }
    }

    // if we are past backup time schedule for next day
    if (Temporal.Instant.compare(zdtBackupDate, zdtNow) == -1) {
      //console.log("past bu time today");
      zdtBackupDate = zdtBackupDate.add({ days: 1 });
    }

    // create alarm
    log("backup", `Schedule backup for: ${zdtBackupDate.toLocaleString()}`);

    if (!(await messenger.alarms.onAlarm.hasListener(_backupAlarm))) {
      browser.alarms.onAlarm.addListener(_backupAlarm);
    }
    //let periodInMinutes = 60 * 24 * dayFrequency;
    let periodInMinutes = 2 * dayFrequency;

    browser.alarms.create("backupPeriodicAlarm",
      {
        when: zdtBackupDate.epochMilliseconds,
        periodInMinutes: periodInMinutes
      });



  } catch (ex) {
    console.log(ex);

  }
}
async function _backupAlarm(alarmInfo) {
  let dayFrequency = await prefCmds.getPref("autobackup.temp.dayFrequency");
  log("backup", `Scheduled backup starting - Time: : ${Temporal.Now.zonedDateTimeISO().toLocaleString()} Day Periodicity: ${dayFrequency}`);
  await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Backup", params: "" });
}

async function _backupOptionsObserver(changes, area) {
  let changedItems = Object.keys(changes);
  for (let item of changedItems) {
    if (area == "local" && item == "userPrefs") {
      let oldUserPrefs = changes.userPrefs.oldValue;
      let newUserPrefs = changes.userPrefs.newValue;

      try {
        if (newUserPrefs.autobackup.temp.enabled != oldUserPrefs.autobackup.temp.enabled ||
          newUserPrefs.autobackup.temp.backupTime != oldUserPrefs.autobackup.temp.backupTime ||
          newUserPrefs.autobackup.temp.dayFrequency != oldUserPrefs.autobackup.temp.dayFrequency) {
          log("backup", "Backup options changed - Reinitialize Scheduler");

          initBackupScheduler();

        }
      } catch (ex) { }
    }

  }
}
