var Services = globalThis.Services ||
  ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");
var { strftime } = ChromeUtils.import("chrome://mboximport/content/mboximport/modules/strftime.js");

function getThunderbirdVersion() {
  let parts = Services.appinfo.version.split(".");
  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
  };
}

var msgWindow = Services.wm.getMostRecentWindow("mail:3pane").top;

var ExportMessages = class extends ExtensionCommon.ExtensionAPI {

  getAPI(context) {
    let self = this;

    return {
      ExportMessages: {

        async exportMessages(title, text) {

        },

        async createExportContainer(expTask) {
          let dateStr = strftime.strftime("%Y", new Date());
          let containerName = `${expTask.folders[0]}-${dateStr}`;
          let uName = await IOUtils.createUniqueDirectory(expTask.generalConfig.exportDirectory, containerName);

          return uName;
        },

        openFileDialog: async function (mode, title, initialDir, filter) {

          let winCtx = msgWindow;
          const tbVersion = getThunderbirdVersion();
          if (tbVersion.major >= 120) {
            winCtx = msgWindow.browsingContext;
          }
          let fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
          let resultObj = {};
          fp.init(winCtx, title, mode);
          fp.appendFilters(filter);
          if (initialDir) {
            fp.displayDirectory = self._getNsIFileFromPath(initialDir);
          }
          let res = await new Promise(resolve => {
            fp.open(resolve);
          });
          if (res !== Ci.nsIFilePicker.returnOK) {
            resultObj.result = res;
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
          } else if (mode == Ci.nsIFilePicker.modeOpen) {
            resultObj.file = fp.file.path;
          }
      
          resultObj.result = 0;
      
          if (mode === Ci.nsIFilePicker.modeGetFolder) {
            resultObj.folder = fp.file.path;
            console.log(resultObj)

          }
          return resultObj;
        },


      },

    };
  }
  // private support functions

  _getNsIFileFromPath(path) {
    const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
    file.initWithPath(path);
    return file;
  }
  
};
