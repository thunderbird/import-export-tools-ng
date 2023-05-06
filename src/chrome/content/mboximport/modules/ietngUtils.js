// ietngUtils.js

export async function openFileDialog(window, mode, title, initialDir, filter) {
  console.log(window)
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
  }
  
