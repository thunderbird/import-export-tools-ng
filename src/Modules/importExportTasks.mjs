// importExportTasks.mjs

import * as prefs from "./prefCmds.mjs";

export class ExportTask {
  constructor(type) {

    return new Promise(async (resolve, reject) => {
      try {
        this.value = await prefs.getPref("help.openInWindow");
      } catch (ex) {
        return reject(ex);
      }
      resolve(this);
    });
  }

}

export async function createExpTask() {
console.log("imp exp")
let expTask = await new ExportTask("eml")
console.log("val", expTask.value)
}
