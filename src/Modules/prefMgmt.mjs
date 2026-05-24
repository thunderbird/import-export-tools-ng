// prefMgmt.mjs

import { prefCmds } from "./prefCmds.mjs";

const addonRootPref = "extensions.importexporttoolsng";

let defaultPrefs = {
  general: {
    version: 1.0,
  },
  help: {
    showOnInstallAndUpdate: true,
    openInWindow: false,
  },
  ui: {
    exportStatus: {
      folders: {
        useNotificationsNoWindow: false,
      },
      selectedMsgs: {
        useNotificationsNoWindow: false,
      },
    },
  },
  shortCuts: {

  },
  export: {
    general: {
      setMsgDateOnFilesAndDirs: true,
      useDefaultFolderExportDir: false,
      useDefaultSelectedMsgsExportDir: false,
      useDefaultMboxExportDir: false,
      defaultFolderExportDir: "",
      defaultSelectedMsgsExportDir: "",
      defaultMboxExportDir: "",
      msgAndAttachmentsStructure: "perMsgDir",
    },
    eml: {
      messageContainer: false,
    },
    html: {
      messageContainer: true,
    },
    pdf: {
      messageContainer: true,
    },
    plaintext: {
      messageContainer: true,
      text_plain_charset: "UTF-8",
      charset_list: "ARMSCII-8,GEOSTD8,ISO-8859-1,ISO-8859-2,ISO-8859-3,ISO-8859-4,ISO-8859-5,ISO-8859-6,ISO-8859-7,ISO-8859-8,ISO-8859-9,ISO-8859-10,ISO-8859-11,ISO-8859-12,ISO-8859-13,ISO-8859-14,ISO-8859-15,ISO-8859-16,KOI8-R,KOI8-U,UTF-8,UTF-8 (BOM),WINDOWS-1250,WINDOWS-1251,WINDOWS-1252,WINDOWS-1253,WINDOWS-1254,WINDOWS-1255,WINDOWS-1256,WINDOWS-1257,WINDOWS-1258",
    },
    csv: {
      messageContainer: true,
      separator: ",",
    },
    mbox: {
      overwrite: false,
      useMboxExtension: false,
    },
    names: {
      defaults: {
        msgNameFormatType: "simple",
        msgNameSimpleFormat: "%s-%d-%k",
        msgNameCustomFormat: "${subject}-${date_custom}-${index}",
        attachmentDirsFormat: "${subject}",
        attachmentNameFormat: "",
        inlineAttachmentDirsFormat: "${subject}",
        inlineAttachmentNameFormat: "",
        components: {
          dateFormat: {
            custom: "%Y%m%d%H%M%S",
          },
          pathMaxLen: 248,
          subjectMaxLen: 50,
          recipientMaxLen: 50,
          authorMaxLen: 50,
        },
        filters: {
          alphaNumericOnly: false,
          alphaNumericOnlySubChar: "_",
          asciiOnly: false,
          characterFilter: "",
        },
        transforms: {
          latinize: false,
        },
      },
    },
  },
  import: {

  },
  index: {
    dateFormat: "%n/%d/%Y %M:%S",
  },
  autobackup: {
    temp: {
      last: 0,
      type: 0,
      frequency: 0,
      dir: "",
      dir_name_type: 0,
      save_mode: 2,
      dir_custom_name: "customName",
      retainNumBackups: 0,
      use_modal_dialog: true,
    },
  },
  debug: {
    logTypes: "",
  },
  temp: {
    export_all_warning1: false,
    export_all_warning2: false,
    export_format_warning: false,
    export_import_warning: false,
    hot_keys: "",
    export_use_container_folder: true,
    use_delivery_date: false,
    use_converter: false,
    export_HTML_as_displayed: false,
    export_skip_existing_msg: false,
    export_cut_filename: true,
    clipboard_always_just_text: false,
  },
};


const legacyPrefToStorageMap = {
  "debug.logTypes": "debug.logTypes",
  "export.filenames_toascii": "export.names.defaults.filters.alphaNumericOnly",
  "export.overwrite": "export.mbox.overwrite",
  "exportEML.filename_format": "export.names.defaults.msgNameFormatType",
  "subject.max_length": "export.names.defaults.components.subjectMaxLen",
  "author.max_length": "export.names.defaults.components.authorMaxLen",
  "recipients.max_length": "export.names.defaults.components.recipientMaxLen",
  "export.set_filetime": "export.general.setMsgDateOnFilesAndDirs",
  "exportEML.use_dir": "export.general.useDefaultFolderExportDir",
  "exportMBOX.use_dir": "export.general.useDefaultMboxExportDir",
  "exportMSG.use_dir": "export.general.useDefaultSelectedMsgsExportDir",
  "exportEML.dir": "export.general.defaultFolderExportDir",
  "exportMSG.dir": "export.general.defaultSelectedMsgsExportDir",
  "exportMBOX.dir": "export.general.defaultMboxExportDir",
  "export_all.warning1": "temp.export_all_warning1",
  "export_all.warning2": "temp.export_all_warning2",
  "export.format_warning": "temp.export_format_warning",
  "export.cut_filename": "temp.export_cut_filename",
  "export.mbox.use_mboxext": "export.mbox.useMboxExtension",
  "export.filename_date_custom_format": "export.names.defaults.components.dateFormat.custom",
  "export.index_date_custom_format": "index.dateFormat",
  "export.filename_pattern": "export.names.defaults.msgNameSimpleFormat",
  "export.filename_extended_format": "export.names.defaults.msgNameCustomFormat",
  "export.attachments.filename_extended_format": "export.names.defaults.attachmentDirsFormat",
  "export.filename_filterUTF16": "export.names.defaults.filters.asciiOnly",
  "export.filename_filter_characters": "export.names.defaults.filters.characterFilter",
  "export.filename_latinize": "export.names.defaults.transforms.latinize",
  "export.embedded_attachments.filename_extended_format": "export.names.defaults.inlineAttachmentDirsFormat",
  "export.use_container_folder": "temp.export_use_container_folder",
  "autobackup.last": "autobackup.temp.last",
  "autobackup.type": "autobackup.temp.type",
  "autobackup.frequency": "autobackup.temp.frequency",
  "autobackup.dir_name_type": "autobackup.temp.dir_name_type",
  "autobackup.dir": "autobackup.temp.dir",
  "autobackup.save_mode": "autobackup.temp.save_mode",
  "autobackup.dir_custom_name": "autobackup.temp.dir_custom_name",
  "autobackup.retainNumBackups": "autobackup.temp.retainNumBackups",
  "autobackup.use_modal_dialog": "autobackup.temp.use_modal_dialog",
  "export.use_converter": "temp.use_converter",
  "export.text_plain_charset": "export.plaintext.text_plain_charset",
  "csv_separator": "export.csv.separator",
  "export.import_warning": "temp.export_import_warning",
  "export.charset_list": "export.plaintext.charset_list",
  "experimental.use_delivery_date": "temp.use_delivery_date",
  "experimental.hot_keys": "temp.hot_keys",
  "help.showOnInstallAndUpdate": "help.showOnInstallAndUpdate",
  "help.openInWindow": "help.openInWindow",
  "ui.notificationsForExpFolders": "ui.exportStatus.folders.useNotificationsNoWindow",
  "ui.notificationsForExpSelMsgs": "ui.exportStatus.selectedMsgs.useNotificationsNoWindow",
  "export.attachments.containerStructure": "export.general.msgAndAttachmentsStructure",
  "export.HTML_as_displayed": "temp.export_HTML_as_displayed",
  "export.skip_existing_msg": "temp.export_skip_existing_msg",
  "clipboard.always_just_text": "temp.clipboard_always_just_text",

};


export async function initializePrefs() {
  await prefCmds.init(defaultPrefs);
  await _migrateLegacyPrefs();
}



async function _migrateLegacyPrefs() {

  // first we do some transforms on legacy prefs
  // in case any types have changed

  // transforms
  // we need to convert some legacy pref vals to updated vals

  let msgFilenameFormatType = await messenger.LegacyPrefs.getUserPref(`${addonRootPref}.exportEML.filename_format`);
  console.log(msgFilenameFormatType)

  // next set all userPrefs from legacy map
  // were also cleaning up names and structure

  let legacyKeys = Object.keys(legacyPrefToStorageMap);

  for (let legacyKey of legacyKeys) {
    let storageKey = legacyPrefToStorageMap[legacyKey];
    // depracated legacy prefs will have a null for the storage key
    // we just delete these
    if (storageKey != null) {
      let legacyVal = await messenger.LegacyPrefs.getPref(`${addonRootPref}.${legacyKey}`);
      console.log("init from", legacyKey, legacyVal)
      // set the storage pref with createNewProperty = true
      // since the storage keys don't exist
      await prefCmds.setPref(storageKey, legacyVal, true);
    }
    // clear the legacy pref regardless
    //messenger.LegacyPrefs.clearUserPref(`${addonRootPref}.${legacyKey}`);
  }

  if (msgFilenameFormatType == 3) {
    await prefCmds.setPref(`export.names.defaults.msgNameFormatType`, "custom");
  } else {
    await prefCmds.setPref(`export.names.defaults.msgNameFormatType`, "simple");
  }

  msgFilenameFormatType = await messenger.LegacyPrefs.getUserPref(`${addonRootPref}.exportEML.filename_format`);
  console.log(msgFilenameFormatType)


}

// our legacy code side now needs Notify tools to access storage prefs
// Note: this will be eliminated once all legacy code updated
messenger.NotifyTools.onNotifyBackground.addListener(async (info) => {
  if (info.command != "Pref_CMD") {
    return null;
  }

  console.log("getStoragePref", info.prefName)

  let storageKey = legacyPrefToStorageMap[info.prefName];

  if (storageKey == undefined) {
    console.error("unkown pref map:", info.prefName);
    return undefined;
  }
  switch (info.subcommand) {
    case "getPref":
      return prefCmds.getPref(storageKey);
    case "setPref":
      return prefCmds.setPref(storageKey, info.prefValue);
  }
  return null;
});
