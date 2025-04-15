// exportCmds.mjs

import { ExportTask } from "/Modules/importExportTasks.mjs";
import * as exportTestCmds from "/Modules/exportTestCmds.mjs";

export async function createExpTask() {
  console.log("imp exp")
  let expTask = await new ExportTask("eml")
  console.log("val", expTask.value)

  let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), "test");

  }

export async function exportFolderTest(ctxEvent, tab, functionParams) {
  console.log("exportFolderTest")
  console.log(functionParams)
  //console.log("imp exp")
  await exportTestCmds.exportFolders(ctxEvent, tab, functionParams)
  
}
  
