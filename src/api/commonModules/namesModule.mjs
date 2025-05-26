// namesModule.mjs

var { parse5322 } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/email-addresses.mjs");

export var names = {

  generateMsgName: function (expTask, index, context) {
    // general options
    let namePatternType = expTask.names.namePatternType;
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
      subject = "... [No Decryption]";
    }

    // add Re_ for responses 
    if (msgHdr.flags & 0x0010) {
      subject = "Re_" + subject;
    }

    // length contraint
    if (subjectMaxLen > 0) {
      subject = subject.substring(0, subjectMaxLen);
    }

    // Author email
    let authorEmail = parse5322.parseSender(expTask.msgList[index].author).address;

    // Author name
    let authorName = parse5322.parseSender(expTask.msgList[index].author).name;
    authorName = authorName.slice(0, authorNameMaxLen);
    authorName = authorName.trimEnd();

    // Recipient email
    let recipientEmail = parse5322.parseOneAddress(expTask.msgList[index].recipients[0]).address;

    // Recipient name
    console.log("recipientsO", expTask.msgList[index].recipients[0])
    
    let recipientName = parse5322.parseOneAddress(expTask.msgList[index].recipients[0]).name;
    if (!recipientName || recipientName == "") {
      recipientName = "[No Name]";
    }
    recipientName = recipientName.slice(0, recipientNameMaxLen);
    recipientName = recipientName.trimEnd();

    console.log("subject ", subject)
    console.log("authoremail", authorEmail)
    console.log("authname", authorName)
    console.log("recipients", recipientEmail)
    console.log("recipientName", recipientName)


return

    // Recipient name

    // Simple date - ${date}
    msgHdrDate = new Date(expTask.msgList[index].date);

    subject = nametoascii(subject);

    // Date - Key
    var dateInSec = hdr.dateInSeconds;
    var msgDate8601string = dateInSecondsTo8601(dateInSec);
    var key = hdr.messageKey;

    var fname;

    var authEmail = "";
    var recEmail = "";

    if (hdr.mime2DecodedAuthor) {
      authEmail = stripDisplayName(hdr.mime2DecodedAuthor)[0].email;
    }
    if (hdr.mime2DecodedRecipients) {
      recEmail = stripDisplayName(hdr.mime2DecodedRecipients)[0].email;
    }

    // deal with e-mail without 'To:' headerSwitch to insiders
    if (recEmail === "" || !recEmail) {
      recEmail = "(none)";
    }
    // custom filename pattern
    if (emlNameType === 2) {
      var pattern = IETprefs.getCharPref("extensions.importexporttoolsng.export.filename_pattern");
      // Name
      var authName = formatNameForSubject(hdr.mime2DecodedAuthor, false);
      if (authMaxLen > 0) {
        authName = authName.substring(0, authMaxLen);
      }

      var recName = formatNameForSubject(hdr.mime2DecodedRecipients, true);
      if (recMaxLen > 0) {
        recName = recName.substring(0, recMaxLen);
      }

      // Sent of Drafts folder
      var isSentFolder = hdr.folder.flags & 0x0200 || hdr.folder.flags & 0x0400;
      var isSentSubFolder = hdr.folder.URI.indexOf("/Sent/");
      var smartName;

      if (isSentFolder || isSentSubFolder > -1)
        smartName = recName;
      else
        smartName = authName;

      var customDateFormat = IETgetComplexPref("extensions.importexporttoolsng.export.filename_date_custom_format");

      pattern = pattern.replace("%s", subject);
      pattern = pattern.replace("%k", key);
      pattern = pattern.replace("%d", msgDate8601string);
      pattern = pattern.replace("%D", strftime.strftime(customDateFormat, new Date(dateInSec * 1000)));
      pattern = pattern.replace("%n", smartName);
      pattern = pattern.replace("%a", authName);
      pattern = pattern.replace("%r", recName);
      pattern = pattern.replace(/-%e/g, "");

      if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_add_prefix")) {
        var prefix = IETgetComplexPref("extensions.importexporttoolsng.export.filename_prefix");
        pattern = prefix + pattern;
      }

      if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_add_suffix")) {
        var suffix = IETgetComplexPref("extensions.importexporttoolsng.export.filename_suffix");
        pattern = pattern + suffix;
      }


      fname = pattern;

    } else if (emlNameType === 3) {
      // extended filename format
      var extendedFilenameFormat = IETgetComplexPref("extensions.importexporttoolsng.export.filename_extended_format");

      let index = key;

      // Name
      let authName = formatNameForSubject(hdr.mime2DecodedAuthor, false);
      if (authMaxLen > 0) {
        authName = authName.substring(0, authMaxLen);
      }

      let recName = formatNameForSubject(hdr.mime2DecodedRecipients, true);
      if (recMaxLen > 0) {
        recName = recName.substring(0, recMaxLen);
      }

      // Sent of Drafts folder
      let isSentFolder = hdr.folder.flags & 0x0200 || hdr.folder.flags & 0x0400;
      let isSentSubFolder = hdr.folder.URI.indexOf("/Sent/");
      let smartName;

      let prefix = IETgetComplexPref("extensions.importexporttoolsng.export.filename_prefix");
      let suffix = IETgetComplexPref("extensions.importexporttoolsng.export.filename_suffix");

      if (isSentFolder || isSentSubFolder > -1)
        smartName = recName;
      else
        smartName = authName;

      let customDateFormat = IETgetComplexPref("extensions.importexporttoolsng.export.filename_date_custom_format");

      // Allow en-US tokens always
      extendedFilenameFormat = extendedFilenameFormat.replace("${subject}", subject);
      extendedFilenameFormat = extendedFilenameFormat.replace("${sender}", authName);
      extendedFilenameFormat = extendedFilenameFormat.replace("${sender_email}", authEmail);
      extendedFilenameFormat = extendedFilenameFormat.replace("${recipient}", recName);
      extendedFilenameFormat = extendedFilenameFormat.replace("${recipient_email}", recEmail);
      extendedFilenameFormat = extendedFilenameFormat.replace("${smart_name}", smartName);
      extendedFilenameFormat = extendedFilenameFormat.replace("${index}", index);
      extendedFilenameFormat = extendedFilenameFormat.replace("${prefix}", prefix);
      extendedFilenameFormat = extendedFilenameFormat.replace("${suffix}", suffix);
      extendedFilenameFormat = extendedFilenameFormat.replace("${date_custom}", strftime.strftime(customDateFormat, new Date(dateInSec * 1000)));
      extendedFilenameFormat = extendedFilenameFormat.replace("${date}", strftime.strftime("%Y%m%d", new Date(dateInSec * 1000)));


      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("subjectFmtToken"), subject);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("senderFmtToken"), authName);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("senderEmailFmtToken"), authEmail);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("recipientFmtToken"), recName);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("recipientEmailFmtToken"), recEmail);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("smartNameFmtToken"), smartName);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("indexFmtToken"), index);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("prefixFmtToken"), prefix);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("suffixFmtToken"), suffix);
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("dateCustomFmtToken"), strftime.strftime(customDateFormat, new Date(dateInSec * 1000)));
      extendedFilenameFormat = extendedFilenameFormat.replace(mboximportbundle.GetStringFromName("dateFmtToken"), strftime.strftime("%Y%m%d", new Date(dateInSec * 1000)));


      fname = extendedFilenameFormat;
    } else {
      fname = msgDate8601string + "-" + subject + "-" + hdr.messageKey;
    }
    fname = fname.replace(/[\x00-\x1F]/g, "_");
    if (mustcorrectname)
      fname = nametoascii(fname);
    else {
      // Allow ',' and single quote character which is valid
      fname = fname.replace(/[\/\\:<>*\?\"\|]/g, "_");
    }

    if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_latinize")) {
      fname = latinizeString(fname);
    }

    if (IETprefs.getBoolPref("extensions.importexporttoolsng.export.filename_filterUTF16")) {
      fname = filterNonASCIICharacters(fname);
    }

    // User defined character filter
    var filterCharacters = IETprefs.getStringPref("extensions.importexporttoolsng.export.filename_filter_characters");

    if (filterCharacters !== "") {
      let filter = new RegExp(`[${filterCharacters}]`, "g");
      fname = fname.replace(filter, "");
    }

    if (cutFileName) {
      var maxFN = 249 - dirPath.length;
      if (fname.length > maxFN)
        fname = fname.substring(0, maxFN);
    }
    return fname;
  },

  _formatNameForSubject: function (str, recipients) {
	if (recipients)
		str = str.replace(/\s*\,.+/, "");
	if (str.indexOf("<") > -1)
		str = str.replace(/\s*<.+>/, "");
	else
		str = str.replace(/[@\.]/g, "_");
	return str;
}


};