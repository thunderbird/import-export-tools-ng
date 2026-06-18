/*
  ImportExportTools NG is a extension for Thunderbird mail client
  providing import and export tools for messages and folders.
  The extension authors:
    Copyright (C) 2026 : Christopher Leidigh

  ImportExportTools NG is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// namesModule.mjs

// Generate filenames for messages and directory names 
// for attachments from token based patterns

var { ExtensionParent } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionParent.sys.mjs"
);

var ietngExtension = ExtensionParent.GlobalManager.getExtension(
  "ImportExportToolsNG@cleidigh.kokkini.net"
);

var { strftime } = ChromeUtils.importESModule("resource://ietng/api/commonModules/strftime.mjs");
var { parse5322 } = ChromeUtils.importESModule("chrome://mboximport/content/mboximport/modules/email-addresses.mjs");
var { latinize } = ChromeUtils.importESModule("resource://ietng/api/commonModules/latinize.mjs");

export var names = {

  generateFromPattern: async function (namePatternType, expTask, index, context) {
    // general options

    let asciiOnly = expTask.names.asciiOnly;
    let nameMaxLen = expTask.names.maxLength;
    let extension = expTask.names.extension;

    // components
    let subjectMaxLen = expTask.names.components.subjectMaxLen;
    let authorNameMaxLen = expTask.names.components.authorNameMaxLen;
    let recipientNameMaxLen = expTask.names.components.recipientNameMaxLen;

    // we need the msgHdr for items not in the wext MessageHeader
    let msgHdr = context.extension.messageManager.get(expTask.msgList[index].id);

    // Subject formatting
    let subject = expTask.msgList[index].subject;
    if (!subject || subject == "") {
      subject = "[No Subject]";
    } else if (subject == "...") {
      subject = "[No Decryption]...";
    }

    // add Re_ for responses 
    if (msgHdr.flags & 0x0010) {
      subject = "Re_ " + subject;
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
      // if no author name, check and substitute author email
      if (authorEmail != "[No Author Email]") {
        authorName = authorEmail;
      } else {
        authorName = "[No Author]";
      }
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
      recipientEmail = "[No Recipient Email]";
    }

    // Recipient name

    let recipientName;
    try {
      recipientName = parse5322.parseOneAddress(expTask.msgList[index].recipients[0]).name;
      if (!recipientName || recipientName == "") {
        // if no recipient name, check and substitute recipient email
        if (recipientEmail != "[No Recipient Email]") {
          recipientName = recipientEmail;
        } else {
          recipientName = "[No Recipient]";
        }
      }
    } catch (ex) {
      recipientName = "[No Recipient]";
    }
    recipientName = recipientName.slice(0, recipientNameMaxLen);
    recipientName = recipientName.trimEnd();

    // Simple date - ${date}
    let date = strftime.strftime("%Y%m%d%H%M", expTask.msgList[index].date);

    // custom date format - ${date_custom}
    let customDate = strftime.strftime(expTask.dateFormat.custom, new Date(msgHdr.dateInSeconds * 1000));

    // smart name - ${smart_name}
    // Sent of Drafts folder
    let isSentFolder = msgHdr.folder.flags & 0x0200 || msgHdr.folder.flags & 0x0400;
    let isSentSubFolder = msgHdr.folder.URI.indexOf("/Sent/");
    let smartName;
    let smartEmail;

    // add smartEmail
    if (isSentFolder || isSentSubFolder > -1) {
      smartName = recipientName;
      smartEmail = recipientEmail;
    } else {
      smartName = authorName;
      smartEmail = authorEmail;
    }

    // Key
    var key = msgHdr.messageKey;

    let generatedName = "";

    // basic dropdown filename pattern
    if (namePatternType == "dropdown") {
      let pattern = expTask.names.namePatternDropdown;

      pattern = pattern.replace("%s", subject);
      pattern = pattern.replace("%k", key);
      pattern = pattern.replace("%d", date);
      pattern = pattern.replace("%D", customDate);
      pattern = pattern.replace("%n", smartName);
      pattern = pattern.replace("%a", authorName);
      pattern = pattern.replace("%r", recipientName);
      pattern = pattern.replace(/-%e/g, "");

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

      const smartFmtMap = {
        "${subject}": subject,
        "${sender}": authorName,
        "${sender_email}": authorEmail,
        "${recipient}": recipientName,
        "${recipient_email}": recipientEmail,
        "${smart_name}": smartName,
        "${smart_email}": smartEmail,
        "${index}": index,
        "${date_custom}": customDate,
        "${date}": date,
      };

      generatedName = generatedName.replaceAll(/\${.*?}/g,
        function (m) {
          if (!smartFmtMap[m]) {
            return m;
          }
          return smartFmtMap[m];
        });

      // localized also available for the current locale

      function _localize(msg) {
        return ietngExtension.localeData.localizeMessage(msg);
      }

      const smartFmtMapLocalized = {
        [_localize("subjectFmtToken")]: subject,
        [_localize("senderFmtToken")]: authorName,
        [_localize("senderEmailFmtToken")]: authorEmail,
        [_localize("recipientFmtToken")]: recipientName,
        [_localize("recipientEmailFmtToken")]: recipientEmail,
        [_localize("smartNameFmtToken")]: smartName,
        [_localize("indexFmtToken")]: index,
        [_localize("dateCustomFmtToken")]: expTask.dateFormat.custom,
        [_localize("dateFmtToken")]: date,
      };

      generatedName = generatedName.replaceAll(/\${.*?}/g,
        function (m) {
          if (!smartFmtMapLocalized[m]) {
            return m;
          }
          return smartFmtMapLocalized[m];
        });
    }

    // filters and transforms
    generatedName = generatedName.replace(/[\x00-\x1F]/g, "");

    // latinize characters transform
    if (expTask.names.transforms.latinize) {
      generatedName = latinize.latinizeString(generatedName);
    }

    // alphaNumericOnly filter
    if (expTask.names.filters.alphaNumericOnly)
      generatedName = generatedName.replace(/[^a-zA-Z0-9\-]/g, "_");
    else {
      // Allow ',' and single quote character which is valid
      generatedName = generatedName.replace(/[\/\\:<>*\?\|]/g, "_");
    }

    // non-ASCII character filter
    if (expTask.names.filters.asciiOnly) {
      generatedName = this._filterNonASCIICharacters(generatedName);
    }


    // User defined character filter
    let filterCharacters = expTask.names.filters.characterFilter;

    if (filterCharacters !== "") {
      let filter = new RegExp(`[${filterCharacters}]`, "g");
      generatedName = generatedName.replace(filter, "");
    }

    generatedName = generatedName.replace(/[\/\\:<>*\?\"\|]/g, "_");

    try {
      let testURI = encodeURIComponent(generatedName);
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

  _filterNonASCIICharacters: function (str) {
    str = str.replace(/[\u{0100}-\u{FFFF}]/gu, "");
    str = str.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '');
    return str;
  },

  splitFilenameAndExtension(filename) {
    // Find the index of the last dot in the filename
    const lastDotIndex = filename.lastIndexOf('.');

    // Handle edge cases: no dot found, or filename is just a dot file (e.g., '.gitignore')
    if (lastDotIndex === -1 || (lastDotIndex === 0 && filename.indexOf('/') === -1 && filename.indexOf('\\') === -1)) {
      return {
        name: filename,
        extension: ""
      };
    }

    // Extract the filename part (everything before the last dot)
    const name = filename.substring(0, lastDotIndex);
    // Extract the extension part (everything after the last dot)
    const extension = filename.substring(lastDotIndex + 1);

    return { name, extension };
  },

  truncateFilename(filename, truncationLength) {
    let filenameParts = this.splitFilenameAndExtension(filename);
    return filenameParts.name.
      slice(0, truncationLength - filenameParts.extension.length + 1) +
      "." + filenameParts.extension;
  },

  sanitizeFilename: function (filename) {
    let sanitizedName = filename.replaceAll(':', ';');
    sanitizedName = sanitizedName.replace(/[\/\\<>*\?\|]/g, "_");
    return sanitizedName;
  },

};
