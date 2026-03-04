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
    if (this.logTypes.includes(logType)) {
      console.log("IETNG: " + logMsg);
    }
  },

};


