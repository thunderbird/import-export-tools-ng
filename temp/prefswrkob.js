


const defaultPrefs = {
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
      msgAndAttachmentsStructure: "",
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
        msgNameSimpleFormat: "",
        msgNameCustomFormat: "",
        attachmentDirsFormat: "",
        attachmentNameFormat: "",
        inlineAttachmentDirsFormat: "",
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
  "export.cut_filename": "export.names.defaults.components.pathMaxLen",
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
};

function dotWalk(str, obj) {
    // Splits the string by each dot
    return str.split('.')
        // iterate the string, passing back
        // the property at each path
        .reduce((result, path) => {
            // Trailing dot case
            if (path === '') return result + '.';

            // Return undefined if the path doesn't exist
            return result && result[path];
        }, obj)
        ?? str; // return the original string if no property found
}



const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};


//const flattened = flattenObject(defaultPrefs);
//console.log(Object.keys(flattened)); 
// Output: ["name", "address.city", "address.geo.lat", "address.geo.lng"]

let mapKeys = Object.keys(legacyPrefToStorageMap);
let storageMapKeys = [];
let sk = legacyPrefToStorageMap[mapKeys[4]]
//console.log(sk)
//console.log(dotWalk("export.names.defaults.filters.alphaNumericOnly",defaultPrefs))

mapKeys.forEach(lkey => {

let sk = legacyPrefToStorageMap[lkey]
let sv = dotWalk(sk, defaultPrefs)
if (sv === true) {
  sv = true
} else if (sv === false) {
  sv = false
} else if(sv == sk) {
  sv = "NO KEY"
} else if(sv === "") {

  sv = '""'
}
console.log(lkey, "=", sk, sv)
});

