// exportCmds.mjs

import { ExportTask } from "/Modules/importExportTasks.mjs";


export async function createExpTask() {
  console.log("imp exp")
  let expTask = await new ExportTask("eml")
  console.log("val", expTask.value)

  let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("warning.msg"), "test");

  }
  
