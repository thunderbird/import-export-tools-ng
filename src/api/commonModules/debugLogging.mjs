// debugLogging.mjs

export function test(logType, msg) {
    console.log("777")
  logging.log(logType, msg)
}

export var logging = {
  logTypes: "",

  init: function (debugOptions) {
    console.log(this)
    this.logTypes = debugOptions.logTypes;
    console.log(this.logTypes)
    return;
  },

  log: function (logType, logMsg, logOptions) {
    console.log(this)

    console.log(this.logTypes)
    if (this.logTypes.includes(logType)) {
      console.log("IETNG: " + logMsg);
    }
  },

};


