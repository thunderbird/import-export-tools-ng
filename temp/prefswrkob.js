"debug.logTypes", ""
"export.filenames_toascii", false
"export.overwrite", false, 
"confirm.before_mbox_import", true
"clipboard.always_just_text", false
"export.HTML_as_displayed", false
"exportEML.filename_format", 2
"delay.clean_statusbar", 5000
"subject.max_length", 50
"author.max_length", 50
"recipients.max_length", 50
"extensions.ImportExportToolsNG@cleidigh.description", "chrome://mboximport/locale/properties"
"export.set_filetime", true
"exportEML.use_dir", false
"exportMBOX.use_dir", false
"exportMSG.use_dir", false
"export.filenames_addtime", false
"export_all.warning1", true
"export_all.warning2", true
"import.build_mbox_index", true
"export.format_warning", true
"export.cut_subject", false
"export.cut_filename", true
"export.mbox.use_mboxext", false
"export.filename_add_prefix", false
"export.filename_prefix", ""
"export.filename_add_suffix", false
"export.filename_suffix", ""
"export.filename_charset", ""
"export.filename_date_custom_format", "%Y%m%d%H%M"
"export.index_date_custom_format", "%n/%d/%Y %M:%S"
"export.filename_use_extended_format", "false"
"export.filename_extended_format", "${subject}-${date_custom}-${index}"
"export.attachments.filename_extended_format", "Attachments"
"export.filename_filterUTF16", false
"export.filename_filter_characters", ""
"export.filename_latinize", false
"export.embedded_attachments.filename_extended_format", "EmbeddedImages"
"export.use_container_folder", true
"sms.add_subject", true
"autobackup.last", 0
"autobackup.type", 0
"autobackup.frequency", 0
"autobackup.dir_name_type", 0
"autobackup.save_mode", 2
"autobackup.dir_custom_name", "customName"
"autobackup.retainNumBackups", 0
"export.remote_warning", true
"export.skip_existing_msg", false
"autobackup.use_modal_dialog", true
"import.name_add_number", false
"export.use_converter", false
"export.text_plain_charset", "UTF-8"
"log.enable", false
"csv_separator", ","
"migrate_prefs", true
"export.import_warning", true
"export.mail_separator", "-------------------------"
"printPDF.fileFormat", 2
"printPDF.start", false
"reset_mozilla_status", false
"export.charset_list", "ARMSCII-8,GEOSTD8,ISO-8859-1,ISO-8859-2,ISO-8859-3,ISO-8859-4,ISO-8859-5,ISO-8859-6,ISO-8859-7,ISO-8859-8,ISO-8859-9,ISO-8859-10,ISO-8859-11,ISO-8859-12,ISO-8859-13,ISO-8859-14,ISO-8859-15,ISO-8859-16,KOI8-R,KOI8-U,UTF-8,UTF-8 (BOM),WINDOWS-1250,WINDOWS-1251,WINDOWS-1252,WINDOWS-1253,WINDOWS-1254,WINDOWS-1255,WINDOWS-1256,WINDOWS-1257,WINDOWS-1258"
"experimental.use_delivery_date", false
"experimental.hot_keys", ""
"experimental.index_short1", false
"experimental.printPDF.use_global_preferences", true
"experimental.csv.account_folder_col", false
"export.strip_CR_for_EML_exports", false
"help.showOnInstallAndUpdate", true
"help.openInWindow", false
"ui.notificationsForExpFolders", false
"ui.notificationsForExpSelMsgs", false
"export.attachments.containerStructure", "perMsgDir"


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
    },
    csv: {
      messageContainer: true,
      separator: ",",
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
            custom: "",
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
      msgNames: {

      },
      attachmentNames: {

      },
      attachmentDirsNames: {
      },
      inlineAttachmentNames: {
      },
      inlineAttachmentDirsNames: {
      },
    },

  },
  import: {

  },
  index: {
    dateFormat: "",
  },
  autobackup: {

  },
  debug: {
    logTypes: "",
  },

}