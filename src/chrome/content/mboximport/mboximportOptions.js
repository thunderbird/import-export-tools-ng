/*
    ImportExportTools NG is a extension for Thunderbird mail client
    providing import and export tools for messages and folders.
    The extension authors:
        Copyright (C) 2023 : Christopher Leidigh, The Thunderbird Team

    ImportExportTools NG is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* global IETprefs, IETgetComplexPref, IETsetComplexPref, browser */

var messengerWindow = Services.wm.getMostRecentWindow("mail:3pane");

var { ExtensionParent } = ChromeUtils.importESModule(
	"resource://gre/modules/ExtensionParent.sys.mjs"
);

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
	"ImportExportToolsNG@cleidigh.kokkini.net"
);

var { ietngUtils } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/ietngUtils.mjs?"
    + ietngExtension.manifest.version + messengerWindow.ietngAddon.dateForDebugging);
  
function IETsetCharsetPopup(charsetPref) {
    var charsetPopup = document.getElementById("charset-list-popup");
    var charsetList = IETprefs.getCharPref("extensions.importexporttoolsng.export.charset_list");
    var charsetItems = charsetList.split(",");
    var menuitem;

    for (var i = 0; i < charsetItems.length; i++) {
        menuitem = document.createXULElement("menuitem");
        menuitem.setAttribute("label", charsetItems[i]);
        menuitem.setAttribute("value", charsetItems[i]);
        charsetPopup.appendChild(menuitem);
        if (charsetItems[i] === charsetPref)
            document.getElementById("charset-list").selectedItem = menuitem;
    }
}

function initMboxImportPanel() {

    var IETngVersion = window.opener.ietng.extension.addonData.version;
    document.getElementById("optionsdialog").setAttribute("title", "ImportExportTools NG - v" + IETngVersion);

    var os = navigator.platform.toLowerCase();
    if (!os.includes("win")) {
        document.documentElement.style.setProperty("--groupbox-header-bg", "#f0f0f0");
        document.documentElement.style.setProperty("--question-height", "28px");
    }

    document.getElementById("useMboxExt").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.mbox.use_mboxext");
    document.getElementById("MBoverwrite").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.overwrite");
    document.getElementById("MBasciiname").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_toascii");
    document.getElementById("MBconfrimimport").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.confirm.before_mbox_import");
    document.getElementById("MBhtmlasdisplayed").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.HTML_as_displayed");
    document.getElementById("MBcliptextplain").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.clipboard.always_just_text");
    document.getElementById("MBsubmaxlen").value = IETprefs.getIntPref("extensions.importexporttoolsng.subject.max_length");
    document.getElementById("MBauthmaxlen").value = IETprefs.getIntPref("extensions.importexporttoolsng.author.max_length");
    document.getElementById("MBrecmaxlen").value = IETprefs.getIntPref("extensions.importexporttoolsng.recipients.max_length");
    document.getElementById("setTimestamp").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.set_filetime");
    document.getElementById("addtimeCheckbox").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_addtime");
    document.getElementById("buildMSF").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.import.build_mbox_index");
    document.getElementById("addNumber").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.import.name_add_number");
    document.getElementById("stripEML_CR").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.strip_CR_for_EML_exports");
    document.getElementById("openHelpInWin").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.help.openInWindow");


    if (IETprefs.getIntPref("extensions.importexporttoolsng.exportEML.filename_format") === 2)
        document.getElementById("customizeFilenames").checked = true;
    else
        document.getElementById("customizeFilenames").checked = false;


    if (IETprefs.getIntPref("extensions.importexporttoolsng.exportEML.filename_format") === 3)
        document.getElementById("useExtendedFormat").setAttribute("checked", "true");
    else
        document.getElementById("useExtendedFormat").removeAttribute("checked");

    if (IETprefs.getPrefType("extensions.importexporttoolsng.exportMBOX.dir") > 0)
        document.getElementById("export_mbox_dir").value = IETgetComplexPref("extensions.importexporttoolsng.exportMBOX.dir");
    if (IETprefs.getBoolPref("extensions.importexporttoolsng.exportMBOX.use_dir")) {
        document.getElementById("use_export_mbox_dir").checked = true;
        document.getElementById("export_mbox_dir").removeAttribute("disabled");
        document.getElementById("export_mbox_dir").nextElementSibling.removeAttribute("disabled");
    } else {
        document.getElementById("use_export_mbox_dir").checked = false;
        document.getElementById("export_mbox_dir").setAttribute("disabled", "true");
        document.getElementById("export_mbox_dir").nextElementSibling.setAttribute("disabled", "true");
    }

    if (IETprefs.getPrefType("extensions.importexporttoolsng.exportEML.dir") > 0)
        document.getElementById("export_eml_dir").value = IETgetComplexPref("extensions.importexporttoolsng.exportEML.dir");
    if (IETprefs.getBoolPref("extensions.importexporttoolsng.exportEML.use_dir")) {
        document.getElementById("use_export_eml_dir").checked = true;
        document.getElementById("export_eml_dir").removeAttribute("disabled");
        document.getElementById("export_eml_dir").nextElementSibling.removeAttribute("disabled");
    } else {
        document.getElementById("use_export_eml_dir").checked = false;
        document.getElementById("export_eml_dir").setAttribute("disabled", "true");
        document.getElementById("export_eml_dir").nextElementSibling.setAttribute("disabled", "true");
    }

    if (IETprefs.getPrefType("extensions.importexporttoolsng.exportMSG.dir") > 0)

        document.getElementById("export_msgs_dir").value = IETgetComplexPref("extensions.importexporttoolsng.exportMSG.dir");
    if (IETprefs.getBoolPref("extensions.importexporttoolsng.exportMSG.use_dir")) {
        document.getElementById("use_export_msgs_dir").checked = true;
        document.getElementById("export_msgs_dir").removeAttribute("disabled");
        document.getElementById("export_msgs_dir").nextElementSibling.removeAttribute("disabled");
    } else {
        document.getElementById("use_export_msgs_dir").checked = false;
        document.getElementById("export_msgs_dir").setAttribute("disabled", "true");
        document.getElementById("export_msgs_dir").nextElementSibling.setAttribute("disabled", "true");
    }

    if (IETprefs.getPrefType("extensions.importexporttoolsng.export.filename_pattern") > 0) {
        var pattern = IETprefs.getCharPref("extensions.importexporttoolsng.export.filename_pattern");
        var patternParts = pattern.split("-");

        for (var i = 0; i < 3; i++) {
            var list = document.getElementById(`part${i + 1}`);
            var popup = document.getElementById(`part${i + 1}-popup-list`);

            switch (patternParts[i]) {
                case "%d":
                    list.selectedItem = popup.childNodes[1];
                    break;
                case "%D":
                    list.selectedItem = popup.childNodes[2];
                    break;
                case "%k":
                    list.selectedItem = popup.childNodes[3];
                    break;
                case "%n":
                    list.selectedItem = popup.childNodes[4];
                    break;
                case "%a":
                    list.selectedItem = popup.childNodes[5];
                    break;
                case "%r":

                    list.selectedItem = popup.childNodes[6];
                    break;
                case "%e":
                    list.selectedItem = popup.childNodes[7];
                    break;
                default:
                    list.selectedItem = popup.childNodes[0];
            }
        }
    }
    try {

    document.getElementById("addPrefix").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_add_prefix");
        document.getElementById("prefixText").value = IETgetComplexPref("extensions.importexporttoolsng.export.filename_prefix");
    } catch (e) { }
    try {

    document.getElementById("addSuffix").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_add_suffix");
        document.getElementById("suffixText").value = IETgetComplexPref("extensions.importexporttoolsng.export.filename_suffix");
    } catch (e) { }

    document.getElementById("customDateFormat").value = IETgetComplexPref("extensions.importexporttoolsng.export.filename_date_custom_format");
    document.getElementById("extendedFormat").value = IETgetComplexPref("extensions.importexporttoolsng.export.filename_extended_format");

    document.getElementById("attFolderFormat").value = IETgetComplexPref("extensions.importexporttoolsng.export.attachments.filename_extended_format");
    document.getElementById("inlineAttFolderFormat").value = IETgetComplexPref("extensions.importexporttoolsng.export.embedded_attachments.filename_extended_format");

    document.getElementById("utf16-filter").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_filterUTF16");
    document.getElementById("latinize-transform").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_latinize");
    document.getElementById("character-filter").value = IETgetComplexPref("extensions.importexporttoolsng.export.filename_filter_characters");


    document.getElementById("cutFN").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.cut_filename");
    customNamesCheck(document.getElementById("customizeFilenames"));
    extendedFormatCheck(document.getElementById("useExtendedFormat"));

    document.getElementById("indexDateFormat").value = IETgetComplexPref("extensions.importexporttoolsng.export.index_date_custom_format");

    var charset = "";
    var textCharset = "";
    var csvSep = "";

    try {
        //charset = IETprefs.getCharPref("extensions.importexporttoolsng.export.filename_charset");
        textCharset = IETprefs.getCharPref("extensions.importexporttoolsng.export.text_plain_charset");
        csvSep = IETprefs.getCharPref("extensions.importexporttoolsng.csv_separator");
    } catch (e) {
        //charset = "";
        textCharset = "";
        csvSep = "";
    }


    IETsetCharsetPopup(textCharset);
    //document.getElementById("filenameCharset").value = charset;
    document.getElementById("csvSep").value = csvSep;

    document.getElementById("skipMsg").checked = IETprefs.getBoolPref("extensions.importexporttoolsng.export.skip_existing_msg");
    if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.use_container_folder")) {
        document.getElementById("indexSetting").selectedIndex = 0;
        document.getElementById("skipMsg").disabled = true;
    } else {
        document.getElementById("indexSetting").selectedIndex = 1;
    }

    // Backup section
    var freq = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.frequency");

    switch (freq) {
        case 99:
            document.getElementById("frequencyList").selectedIndex = 5;
            document.getElementById("backupEnable").checked = true;
            break;

        case 1:
            document.getElementById("frequencyList").selectedIndex = 0;
            document.getElementById("backupEnable").checked = true;
            break;
        case 3:
            document.getElementById("frequencyList").selectedIndex = 1;
            document.getElementById("backupEnable").checked = true;
            break;
        case 7:
            document.getElementById("frequencyList").selectedIndex = 2;
            document.getElementById("backupEnable").checked = true;
            break;
        case 15:
            document.getElementById("frequencyList").selectedIndex = 3;
            document.getElementById("backupEnable").checked = true;
            break;
        case 30:
            document.getElementById("frequencyList").selectedIndex = 4;
            document.getElementById("backupEnable").checked = true;
            break;
        default:
            document.getElementById("backupEnable").checked = false;
            document.getElementById("frequencyList").disabled = true;
    }


    try {
        document.getElementById("backupDir").value = IETgetComplexPref("extensions.importexporttoolsng.autobackup.dir");
    } catch (e) { }

    document.getElementById("backupCustomName").value = IETgetComplexPref("extensions.importexporttoolsng.autobackup.dir_custom_name");

    document.getElementById("backupType").selectedIndex = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.type");
    var dir = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.dir_name_type");
    document.getElementById("backupDirName").selectedIndex = dir;
    document.getElementById("backupType").selectedIndex = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.type");
    document.getElementById("saveMode").selectedIndex = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.save_mode");

    var retainNumBackups = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.retainNumBackups");
    document.getElementById("numBackupsList").selectedIndex = retainNumBackups;

    var last = IETprefs.getIntPref("extensions.importexporttoolsng.autobackup.last") * 1000;
    if (last > 0) {
        var time = new Date(last);
        var localTime = time.toLocaleString();
        document.getElementById("backupLast").value = localTime;
    }

}

function saveMboxImportPrefs() {
    try {
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.mbox.use_mboxext", document.getElementById("useMboxExt").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.overwrite", document.getElementById("MBoverwrite").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.filenames_toascii", document.getElementById("MBasciiname").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.confirm.before_mbox_import", document.getElementById("MBconfrimimport").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.HTML_as_displayed", document.getElementById("MBhtmlasdisplayed").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.clipboard.always_just_text", document.getElementById("MBcliptextplain").checked);
    IETprefs.setIntPref("extensions.importexporttoolsng.subject.max_length", document.getElementById("MBsubmaxlen").value);
    IETprefs.setIntPref("extensions.importexporttoolsng.author.max_length", document.getElementById("MBauthmaxlen").value);
    IETprefs.setIntPref("extensions.importexporttoolsng.recipients.max_length", document.getElementById("MBrecmaxlen").value);
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.set_filetime", document.getElementById("setTimestamp").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.filenames_addtime", document.getElementById("addtimeCheckbox").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.import.build_mbox_index", document.getElementById("buildMSF").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.import.name_add_number", document.getElementById("addNumber").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.strip_CR_for_EML_exports", document.getElementById("stripEML_CR").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.help.openInWindow", document.getElementById("openHelpInWin").checked);


    if (document.getElementById("customizeFilenames").checked)
        IETprefs.setIntPref("extensions.importexporttoolsng.exportEML.filename_format", 2);
    else if (document.getElementById("useExtendedFormat").checked) {
        IETprefs.setIntPref("extensions.importexporttoolsng.exportEML.filename_format", 3);
    } else
        IETprefs.setIntPref("extensions.importexporttoolsng.exportEML.filename_format", 0);



    IETprefs.setBoolPref("extensions.importexporttoolsng.exportMBOX.use_dir", document.getElementById("use_export_mbox_dir").checked);
    if (document.getElementById("export_mbox_dir").value !== "")
        IETsetComplexPref("extensions.importexporttoolsng.exportMBOX.dir", document.getElementById("export_mbox_dir").value);
    else
        IETprefs.deleteBranch("extensions.importexporttoolsng.exportMBOX.dir");

    IETprefs.setBoolPref("extensions.importexporttoolsng.exportEML.use_dir", document.getElementById("use_export_eml_dir").checked);
    if (document.getElementById("export_eml_dir").value !== "")
        IETsetComplexPref("extensions.importexporttoolsng.exportEML.dir", document.getElementById("export_eml_dir").value);
    else
        IETprefs.deleteBranch("extensions.importexporttoolsng.exportEML.dir");

    IETprefs.setBoolPref("extensions.importexporttoolsng.exportMSG.use_dir", document.getElementById("use_export_msgs_dir").checked);
    if (document.getElementById("export_msgs_dir").value !== "")
        IETsetComplexPref("extensions.importexporttoolsng.exportMSG.dir", document.getElementById("export_msgs_dir").value);
    else
        IETprefs.deleteBranch("extensions.importexporttoolsng.exportMSG.dir");

    var pattern = "";
    for (let u = 1; u < 4; u++) {
        var val = document.getElementById("part" + u.toString()).selectedItem.value;
        if (u > 1 && val)
            val = "-" + val;
        pattern += val;
    }
    IETprefs.setCharPref("extensions.importexporttoolsng.export.filename_pattern", pattern);
/*
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.filename_add_prefix", document.getElementById("addPrefix").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.filename_add_suffix", document.getElementById("addSuffix").checked);
    // if (document.getElementById("prefixText").value != "")
    IETsetComplexPref("extensions.importexporttoolsng.export.filename_prefix", document.getElementById("prefixText").value);
    IETsetComplexPref("extensions.importexporttoolsng.export.filename_suffix", document.getElementById("suffixText").value);
*/

    IETsetComplexPref("extensions.importexporttoolsng.export.filename_date_custom_format", document.getElementById("customDateFormat").value);
    IETsetComplexPref("extensions.importexporttoolsng.export.index_date_custom_format", document.getElementById("indexDateFormat").value);

    IETsetComplexPref("extensions.importexporttoolsng.export.filename_extended_format", document.getElementById("extendedFormat").value);

    IETsetComplexPref("extensions.importexporttoolsng.export.attachments.filename_extended_format", document.getElementById("attFolderFormat").value);
    IETsetComplexPref("extensions.importexporttoolsng.export.embedded_attachments.filename_extended_format", document.getElementById("inlineAttFolderFormat").value);

    IETprefs.setBoolPref("extensions.importexporttoolsng.export.filename_filterUTF16", document.getElementById("utf16-filter").checked);
    IETprefs.setBoolPref("extensions.importexporttoolsng.export.filename_latinize", document.getElementById("latinize-transform").checked);
    IETsetComplexPref("extensions.importexporttoolsng.export.filename_filter_characters", document.getElementById("character-filter").value);

    IETprefs.setBoolPref("extensions.importexporttoolsng.export.cut_filename", document.getElementById("cutFN").checked);
    IETprefs.setCharPref("extensions.importexporttoolsng.export.text_plain_charset", document.getElementById("charset-list").selectedItem.value);
    IETprefs.setCharPref("extensions.importexporttoolsng.csv_separator", document.getElementById("csvSep").value);

    if (document.getElementById("indexSetting").selectedIndex === 0)
        IETprefs.setBoolPref("extensions.importexporttoolsng.export.use_container_folder", true);
    else
        IETprefs.setBoolPref("extensions.importexporttoolsng.export.use_container_folder", false);

    // Backup section
    if (!document.getElementById("backupEnable").checked)
        IETprefs.setIntPref("extensions.importexporttoolsng.autobackup.frequency", 0);
    else
        IETprefs.setIntPref("extensions.importexporttoolsng.autobackup.frequency", document.getElementById("frequencyList").selectedItem.value);
    if (document.getElementById("backupDir").value)
        IETsetComplexPref("extensions.importexporttoolsng.autobackup.dir", document.getElementById("backupDir").value);
    else
        IETprefs.deleteBranch("extensions.importexporttoolsng.autobackup.dir");
    IETprefs.setIntPref("extensions.importexporttoolsng.autobackup.dir_name_type", document.getElementById("backupDirName").selectedIndex);
    if (document.getElementById("backupCustomName").value != "") {
        IETsetComplexPref("extensions.importexporttoolsng.autobackup.dir_custom_name", document.getElementById("backupCustomName").value);
    } else {
        IETsetComplexPref("extensions.importexporttoolsng.autobackup.dir_custom_name", "customName");
    }


    IETprefs.setBoolPref("extensions.importexporttoolsng.export.skip_existing_msg", document.getElementById("skipMsg").checked);
    IETprefs.setIntPref("extensions.importexporttoolsng.autobackup.type", document.getElementById("backupType").selectedIndex);
    IETprefs.setIntPref("extensions.importexporttoolsng.autobackup.save_mode", document.getElementById("saveMode").selectedIndex);
    IETprefs.setIntPref("extensions.importexporttoolsng.autobackup.retainNumBackups", document.getElementById("numBackupsList").selectedIndex);
} catch (ex) {
    Services.prompt.alert(window, "Error", ex.message + "\n\n" + ex.stack);
}
}

function customNamesCheck(el) {
    if (!el.checked) {
        document.getElementById("addtimeCheckbox").setAttribute("disabled", "true");
        document.getElementById("part1").setAttribute("disabled", "true");
        document.getElementById("part2").setAttribute("disabled", "true");
        document.getElementById("part3").setAttribute("disabled", "true");
        /*
        document.getElementById("addPrefix").setAttribute("disabled", "true");
        document.getElementById("prefixText").setAttribute("disabled", "true");
        document.getElementById("addSuffix").setAttribute("disabled", "true");
        document.getElementById("suffixText").setAttribute("disabled", "true");
*/
    } else {
        document.getElementById("addtimeCheckbox").removeAttribute("disabled");
        document.getElementById("part1").removeAttribute("disabled");
        document.getElementById("part2").removeAttribute("disabled");
        document.getElementById("part3").removeAttribute("disabled");
        /*
        document.getElementById("addPrefix").removeAttribute("disabled");
        document.getElementById("prefixText").removeAttribute("disabled");
        document.getElementById("addSuffix").removeAttribute("disabled");
        document.getElementById("suffixText").removeAttribute("disabled");
        */
        document.getElementById("customDateFormat").removeAttribute("disabled");
        document.getElementById("customDateLabel").removeAttribute("disabled");
        document.getElementById("extendedFormat").setAttribute("disabled", "true");
        document.getElementById("useExtendedFormat").removeAttribute("checked");
        document.getElementById("extendedFormatLabel").setAttribute("disabled", "true");

    }
    
}


function extendedFormatCheck(el) {
    if (el.checked) {
        document.getElementById("customizeFilenames").removeAttribute("checked");
        document.getElementById("addtimeCheckbox").setAttribute("disabled", "true");
        document.getElementById("part1").setAttribute("disabled", "true");
        document.getElementById("part2").setAttribute("disabled", "true");
        document.getElementById("part3").setAttribute("disabled", "true");
        //document.getElementById("addPrefix").setAttribute("disabled", "true");
        //document.getElementById("prefixText").setAttribute("disabled", "true");
        //document.getElementById("addSuffix").setAttribute("disabled", "true");
        //document.getElementById("suffixText").setAttribute("disabled", "true");
        document.getElementById("extendedFormat").removeAttribute("disabled");
        document.getElementById("extendedFormatLabel").removeAttribute("disabled");

    } else {
        document.getElementById("extendedFormat").setAttribute("disabled", "true");
        document.getElementById("extendedFormatLabel").setAttribute("disabled", "true");
    }
}


function toggleDirCheck(el) {
    if (!el.checked) {
        el.nextElementSibling.setAttribute("disabled", "true");
        el.nextElementSibling.nextElementSibling.setAttribute("disabled", "true");
    } else {
        el.nextElementSibling.removeAttribute("disabled");
        el.nextElementSibling.nextElementSibling.removeAttribute("disabled");
    }
}

function toggleBackup(el) {
    document.getElementById("frequencyList").disabled = !el.checked;
}

function toggleSkipMsg(el) {
    document.getElementById("skipMsg").disabled = (el.selectedIndex === 0);
}

async function pickFile(target, inputFieldId) {
    var box = target.ownerDocument.getElementById(inputFieldId);
    let winCtx = window;
    const tbVersion = ietngUtils.getThunderbirdVersion();
    if (tbVersion.major >= 120) {
        winCtx = window.browsingContext;
    }
    let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    fp.init(winCtx, "", Ci.nsIFilePicker.modeGetFolder);
    let res = await new Promise(resolve => {
        fp.open(resolve);
    });
    if (res !== Ci.nsIFilePicker.returnOK) {
        return;
    }
    box.value = fp.file.path;
}

async function openHelpBM(bookmark) {
    let win = getMail3Pane();
    await win.ietngAddon.notifyTools.notifyBackground({ command: "openHelp", bmark: bookmark });
}

document.addEventListener("dialogaccept", function (event) {
    saveMboxImportPrefs();
});

window.addEventListener("load", function (event) {
    initMboxImportPanel();
});

document.addEventListener('DOMContentLoaded', () => {
    i18n.updateDocument({ extension: this.window.opener.ietngAddon.extension });
}, { once: true });
