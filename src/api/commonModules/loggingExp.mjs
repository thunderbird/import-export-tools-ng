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

// loggingWext.mjs
// will be unified with exp side later

export function log(logType, msg, msgPrefix, logOptions) {
  if (logging.logTypesList == "") {
    return;
  }
  logging._log(logType, msg, msgPrefix, logOptions);
}

export var logging = {
  logTypesList: "",

  init: function (debugOptions) {
    this.logTypesList = debugOptions.logTypes.split(" ");
    return;
  },

  _log: function (logType, logMsg, msgPrefix = "", logOptions) {
    if (logType == "" || logType == "err" || this._includesLogType(logType)) {
      if (logType == "err") {
        console.error("IETNG Err: " + msgPrefix, logMsg);
      } else if (typeof logMsg == "object") {
        console.log("IETNG:", msgPrefix);
         console.dir(logMsg, { depth: null });
      } else {
        console.log("IETNG:" + msgPrefix, logMsg);
      }
    }
  },
  _includesLogType: function (logType) {
    // logType may actually be OR'd types
    let includesLT = false;
    logType.split(" ").forEach(logType => {
      if (this.logTypesList.includes(logType)) {
        includesLT = true;
      }
    });
    return includesLT;
  },
};



