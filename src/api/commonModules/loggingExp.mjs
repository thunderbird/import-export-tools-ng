// debugLogging.mjs

export function log(logType, msg, logOptions) {
  logging.log(logType, msg, logOptions);
}

export var logging = {
  logTypes: "",

  init: function (debugOptions) {
    this.logTypes = debugOptions.logTypes;
    return;
  },

  log: function (logType, logMsg, logOptions) {
    if (logType == "err" || this.logTypes.includes(logType)) {
      if (logType == "err") {
        console.error("IETNG Err: " + logMsg);
      } else {
        console.log("IETNG: " + logMsg);
      }
    }
  },

};


