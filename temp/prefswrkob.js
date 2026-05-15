


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
        msgNamePatternType: "simple",
        msgNameSimplePattern: "",
        msgNameCustomPattern: "",
        attachmentDirsPattern: "",
        attachmentNamePattern: "",
        inlineAttachmentDirsPattern: "",
        inlineAttachmentNamePattern: "",
        components: {
          dateFormat: {
            custom: "%Y%m%d%H%M%S",
          },
          maxPathLen: 248,
          maxSubjectLen: 50,
          maxRecipientLen: 50,
          maxAuthorLen: 50,
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
      dir_custom_nam: "customName",
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

  },

};


