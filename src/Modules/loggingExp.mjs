// loggingExp.mjs
// will be unified with exp side later

export function log(logType, msg, logOptions) {
  if (this.logTypesList == "") {
    return;
  }
  logging._log(logType, msg, logOptions);
}

export var logging = {
    logTypesList: "",

  init: function (debugOptions) {
    this.logTypesList = debugOptions.logTypes.split(" ");
    return;
  },

  _log: function (logType, logMsg, logOptions) {
    if (logType == "" || logType == "err" || this._includesLogType(logType)) {
      if (logType == "err") {
        console.error("IETNG Err: " + logMsg);
      } else {
        console.log("IETNG: " + logMsg);
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


