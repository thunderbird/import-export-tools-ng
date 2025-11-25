// namesModule.mjs

var { strftime } = ChromeUtils.importESModule("resource://ietng/api/commonModules/strftime.mjs");
var { parse5322 } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/email-addresses.mjs");

export var names = {

  generateFromPattern: async function (namePatternType, expTask, index, context) {
    // general options
    //let namePatternType = expTask.names.namePatternType;
    let asciiOnly = expTask.names.asciiOnly;
    let nameMaxLen = expTask.names.maxLength;
    let extension = expTask.names.extension;

    // components
    let subjectMaxLen = expTask.names.components.subjectMaxLen;
    let authorNameMaxLen = expTask.names.components.authorNameMaxLen;
    let recipientNameMaxLen = expTask.names.components.recipientNameMaxLen;


    //var emlNameType = IETprefs.getIntPref("extensions.importexporttoolsng.exportEML.filename_format");
    //var mustcorrectname = IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_toascii");
    //var cutFileName = IETprefs.getBoolPref("extensions.importexporttoolsng.export.cut_filename");
    //var subMaxLen = IETprefs.getIntPref("extensions.importexporttoolsng.subject.max_length");
    //var authMaxLen = IETprefs.getIntPref("extensions.importexporttoolsng.author.max_length");
    //var recMaxLen = IETprefs.getIntPref("extensions.importexporttoolsng.recipients.max_length");

    // we need the msgHdr for items not in the wext MessageHeader
    let msgHdr = context.extension.messageManager.get(expTask.msgList[index].id);

    // Subject formatting
    var subject = expTask.msgList[index].subject;
    if (!subject || subject == "") {
      subject = "[No Subject]";
    } else if (subject == "...") {
      subject = "[No Decryption]...";
    }

    // add Re_ for responses 
    if (msgHdr.flags & 0x0010) {
      subject = "Re; " + subject;
    }

    // length contraint
    if (subjectMaxLen > 0) {
      subject = subject.substring(0, subjectMaxLen);
    }

    // Author email
    let authorEmail = parse5322.parseSender(expTask.msgList[index].author).address;
    if (!authorEmail || authorEmail == "") {
      authorEmail = "[No Author Email]";
    }
    // Author name
    let authorName = parse5322.parseSender(expTask.msgList[index].author).name;
    if (!authorName || authorName == "") {
      authorName = "[No Author]";
    }
    authorName = authorName.slice(0, authorNameMaxLen);
    authorName = authorName.trimEnd();

    // Recipient email
    let recipientEmail;
    try {
      recipientEmail = parse5322.parseOneAddress(expTask.msgList[index].recipients[0]).address;
      if (!recipientEmail || recipientEmail == "") {
        recipientEmail = "[No Recipient Email]";
      }
    } catch (ex) {
      //console.log(ex, expTask.msgList[index])
      //console.log(ex, expTask.msgList[index].recipients)
      recipientEmail = "[No Recipient Email]";

    }
    // Recipient name

    let recipientName;
    try {
      recipientName = parse5322.parseOneAddress(expTask.msgList[index].recipients[0]).name;
      if (!recipientName || recipientName == "") {
        recipientName = "[No Recipient]";
      }
    } catch (ex) {
      recipientName = "[No Recipient]";
    }
    recipientName = recipientName.slice(0, recipientNameMaxLen);
    recipientName = recipientName.trimEnd();

    /*
    console.log("subject ", subject)
    console.log("authoremail", authorEmail)
    console.log("authname", authorName)
    console.log("recipients", recipientEmail)
    console.log("recipientName", recipientName + "\n")
*/

    // Simple date - ${date}
    //var date = strftime.strftime("%Y%m%d%H%M", new Date(dateInSec * 1000));
    var date = strftime.strftime("%Y%m%d%H%M", expTask.msgList[index].date);

    var dateInSec = msgHdr.dateInSeconds;

    // custom date format - ${date_custom}
    var customDateFormat = expTask.dateFormat.custom;

    // smart name - ${smart_name}
    // Sent of Drafts folder
    let isSentFolder = msgHdr.folder.flags & 0x0200 || msgHdr.folder.flags & 0x0400;
    let isSentSubFolder = msgHdr.folder.URI.indexOf("/Sent/");
    let smartName;

    if (isSentFolder || isSentSubFolder > -1)
      smartName = recipientName;
    else
      smartName = authorName;


    //subject = nametoascii(subject);

    // Key
    var key = msgHdr.messageKey;

    let generatedName = "";

    //console.log(expTask.names.namePatternCustom)


    // basic dropdown filename pattern
    if (namePatternType == "dropdown") {
      let pattern = expTask.names.namePatternDropdown;

      pattern = pattern.replace("%s", subject);
      pattern = pattern.replace("%k", key);
      pattern = pattern.replace("%d", date);
      pattern = pattern.replace("%D", strftime.strftime(customDateFormat, new Date(dateInSec * 1000)));
      pattern = pattern.replace("%n", smartName);
      pattern = pattern.replace("%a", authorName);
      pattern = pattern.replace("%r", recipientName);
      pattern = pattern.replace(/-%e/g, "");

      /*
      if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_add_prefix")) {
        var prefix = IETgetComplexPref("extensions.importexporttoolsng.export.filename_prefix");
        pattern = prefix + pattern;
      }

      if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_add_suffix")) {
        var suffix = IETgetComplexPref("extensions.importexporttoolsng.export.filename_suffix");
        pattern = pattern + suffix;
      }
*/

      generatedName = pattern;

    } else if (namePatternType == "custom" || "customAttachments" || "customInline") {
      switch (namePatternType) {
        case "custom":
          generatedName = expTask.names.namePatternCustom;
          break;
        case "customAttachments":
          generatedName = expTask.attachments.namePattern;
          break;
        case "customInline":
          generatedName = expTask.attachments.inlineNamePattern;
          break;
      }

      // extended filename format

      let index = key;

      // Allow en-US tokens always
      generatedName = generatedName.replace("${subject}", subject);
      generatedName = generatedName.replace("${sender}", authorName);
      generatedName = generatedName.replace("${sender_email}", authorEmail);
      generatedName = generatedName.replace("${recipient}", recipientName);
      generatedName = generatedName.replace("${recipient_email}", recipientEmail);
      generatedName = generatedName.replace("${smart_name}", smartName);
      generatedName = generatedName.replace("${index}", index);
      generatedName = generatedName.replace("${prefix}", "");
      generatedName = generatedName.replace("${suffix}", "");
      generatedName = generatedName.replace("${date_custom}", strftime.strftime(customDateFormat, new Date(dateInSec * 1000)));
      generatedName = generatedName.replace("${date}", date);

      /*
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("subjectFmtToken"), subject);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("senderFmtToken"), authName);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("senderEmailFmtToken"), authEmail);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("recipientFmtToken"), recName);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("recipientEmailFmtToken"), recEmail);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("smartNameFmtToken"), smartName);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("indexFmtToken"), index);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("prefixFmtToken"), prefix);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("suffixFmtToken"), suffix);
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("dateCustomFmtToken"), strftime.strftime(customDateFormat, new Date(dateInSec * 1000)));
            generatedName = generatedName.replace(mboximportbundle.GetStringFromName("dateFmtToken"), strftime.strftime("%Y%m%d", new Date(dateInSec * 1000)));
      */

    } else {
      //generatedName = msgDate8601string + "-" + subject + "-" + hdr.messageKey;
    }

    // filters and transforms
    generatedName = generatedName.replace(/[\x00-\x1F]/g, "_");
    if (expTask.names.filters.alphaNumericOnly)
      generatedName = this.nametoascii(generatedName);
    else {
      // Allow ',' and single quote character which is valid
      generatedName = generatedName.replace(/[\/\\:<>*\?\|]/g, "_");
    }

    if (expTask.names.transforms.latinize) {
      //generatedName = latinizeString(generatedName);
    }

    if (expTask.names.filters.asciiOnly) {
      generatedName = this._filterNonASCIICharacters(generatedName);
    }


    // User defined character filter
    var filterCharacters = expTask.names.filters.characterFilter;

    if (filterCharacters !== "") {
      let filter = new RegExp(`[${filterCharacters}]`, "g");
      generatedName = generatedName.replace(filter, "");
    }

    generatedName = generatedName.replace(/[\/\\:<>*\?\"\|]/g, "_");

    try {
      let testURI = encodeURIComponent(generatedName)
    } catch {
      generatedName = this._filterNonASCIICharacters(generatedName);

    }

    /*
    if (cutFileName) {
      var maxFN = 249 - dirPath.length;
      if (generatedName.length > maxFN)
        generatedName = generatedName.substring(0, nameMaxLen);
    }
      */
    return generatedName;
  },

  nametoascii: function (str) {
    if (!IETprefs.getBoolPref("extensions.importexporttoolsng.export.filenames_toascii")) {
      str = str.replace(/[\x00-\x19]/g, "_");
      // Allow ',' and single quote character which is valid
      return str.replace(/[\/\\:<>*\?\"\|]/g, "_");
    }
    if (str)
      str = str.replace(/[^a-zA-Z0-9\-]/g, "_");
    else
      str = "Undefinied_or_empty";
    return str;
  },

  _filterNonASCIICharacters: function (str) {
    str = str.replace(/[\u{0100}-\u{FFFF}]/gu, "");
    str = str.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '');
    return str;
  },

};