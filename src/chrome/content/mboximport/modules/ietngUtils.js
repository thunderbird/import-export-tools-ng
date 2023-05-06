// ietngUtils.js

export var ietngUtils = {

  openFileDialog: async function (window, mode, title, initialDir, filter) {

    let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    let resultObj = {};
    fp.init(window, title, mode);
    fp.appendFilters(filter);
    if (initialDir) {
      fp.displayDirectory = nsiFileFromPath(initialDir);
    }
    let res = await new Promise(resolve => {
      fp.open(resolve);
    });
    if (res !== Ci.nsIFilePicker.returnOK) {
      resultObj.result = -1;
      return resultObj;
    }

    // no fp.files on Linux if not modeOpenMultiple
    if (mode == Ci.nsIFilePicker.modeOpenMultiple) {
      var files = fp.files;
      var paths = [];
      while (files.hasMoreElements()) {
        var arg = files.getNext().QueryInterface(Ci.nsIFile);
        paths.push(arg.path);
      }
      resultObj.filesArray = paths;
    } else {
      resultObj.file = fp.file;
    }

    resultObj.result = 0;

    if (mode === Ci.nsIFilePicker.modeGetFolder) {
      resultObj.folder = fp.file.path;
    }
    return resultObj;
  },

  stringToBytes: function (str) {
    var bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes;
  },
  
  bytesToString2: function (bytes) {
    return bytes.reduce(function (str, b) {
      return str + String.fromCharCode(b);
    }, "");
  },
}
  
