// autoBackup.mjs

import { logging, log } from "./loggingWext.mjs";
import { prefCmds } from "./prefCmds.mjs";


export async function initBackupScheduler() {
  try {

    logging.init({ logTypes: prefCmds.getPref("debug.logTypes") });

    // we always clear the alarm on init or change
    browser.alarms.clear("backupPeriodicAlarm");

    // Add storage change listener.
    if (!(await messenger.storage.onChanged.hasListener(_backupOptionsObserver))) {
      await messenger.storage.onChanged.addListener(_backupOptionsObserver);
    }

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

    let periodInMinutes;
    let freqMsg;
    if (dayFrequency > 1000) {
      //epochMSLastBackupTime = 0

      periodInMinutes = dayFrequency - 1000;
      if (periodInMinutes < 60) {
        freqMsg = `  Test Frequency: ${periodInMinutes} Minutes`
      } else {
        freqMsg = `  Test Frequency: ${periodInMinutes / 60} Hour`

      }
    } else {
      periodInMinutes = 60 * 24 * dayFrequency;
      freqMsg = `  Day Frequency: ${dayFrequency}`

    }


    log("backup", "Backup Parameters:");
    log("backup", `  Backup Time: ${backupTime}`);
    //log("backup", `  Day Frequency: ${dayFrequency}`);
    log("backup", freqMsg);

    log("backup", `  Last Backup Time: ${new Date(epochMSLastBackupTime).toLocaleString()}`);
    log("backup", `  Backups To Retain: ${retainNumBackups}`);
    log("backup", `  Backup Directory: ${backupDir}`);

    let zdtLastBackupDate = Temporal.Instant.fromEpochMilliseconds(epochMSLastBackupTime)
      .toZonedDateTimeISO(Temporal.Now.timeZoneId());

    let zdtNow = Temporal.Now.zonedDateTimeISO();

    // determine next backup date

    // get backup hour, minute
    let backupHrMin = backupTime.split(":");
    let hour = Number(backupHrMin[0]);
    let minute = Number(backupHrMin[1]);
    let zdtBackupDate;
    let backupOverdue = false;

    // if zdtLastBackupDate (ems) is zero we are starting
    // a new backup from now
    if (zdtLastBackupDate.epochMilliseconds == 0) {
      zdtBackupDate = zdtNow.with({ hour: hour, minute: minute, second: 0 });

    } else {
      if (dayFrequency > 1000) {
        let minFrequency = dayFrequency - 1000;
        zdtBackupDate = zdtLastBackupDate.add({ minutes: minFrequency });
      } else {
        zdtBackupDate = zdtLastBackupDate.add({ days: dayFrequency });
      }
      if (Temporal.Instant.compare(zdtBackupDate, zdtNow) == -1) {
        // we will inform users and prompt them
        backupOverdue = true;
        log("backup", `Backup overdue, schedule for today`);
        zdtBackupDate = zdtNow.with({ hour: hour, minute: minute, second: 0 });
      } else {
        zdtBackupDate = zdtBackupDate.with({ hour: hour, minute: minute, second: 0 });
      }
    }

    // if we are past backup time schedule for next day
    if (Temporal.Instant.compare(zdtBackupDate, zdtNow) == -1) {
      zdtBackupDate = zdtBackupDate.add({ days: 1 });
    }

    // create alarm
    log("backup", `  Next Scheduled backup: ${zdtBackupDate.toLocaleString()}`);

    if (!(await messenger.alarms.onAlarm.hasListener(_backupAlarm))) {
      browser.alarms.onAlarm.addListener(_backupAlarm);
    }

    // set backupPeriodicAlarm with periodicity

    browser.alarms.create("backupPeriodicAlarm",
      {
        when: zdtBackupDate.epochMilliseconds,
        periodInMinutes: periodInMinutes
      });

    // if initializing from startup and backup overdue,
    if (backupOverdue) {
      setTimeout(async () => {

        // promtt user if they want to backup
        let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), browser.i18n.getMessage("backupOverdue.label") + zdtBackupDate.toLocaleString());

        if (rv) {
          await messenger.NotifyTools.notifyExperiment({ command: "WXMCMD_Backup", params: "" });
        }
      }, 6000);
    }
  } catch (ex) {
    console.log(ex);

  }
}

// alarm listener
async function _backupAlarm(alarmInfo) {
  let dayFrequency = await prefCmds.getPref("autobackup.temp.dayFrequency");
  log("backup", `Scheduled backup starting - Time: ${Temporal.Now.zonedDateTimeISO().toLocaleString()} Day Periodicity: ${dayFrequency}`);
  await new Promise(resolve => setTimeout(resolve, 50));

  let alarmInfo2 = await browser.alarms.get("backupPeriodicAlarm");
  console.log("alarminfo2", alarmInfo2)

  log("backup", `Next backup  - Time:  ${new Date(alarmInfo2.scheduledTime).toLocaleString()}`);
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
