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



