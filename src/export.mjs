// export prototype

export async function exportFolders(ctxInfo, params) {

  // for now only deal with a single folder for prototype
  if (ctxInfo.selectedFolders && ctxInfo.selectedFolders.length > 1) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("multipleFolders.title"), browser.i18n.getMessage("multipleFolders.AlertMsg") + params.toString());
    if (!rv) {
      return;
    }
  }
  console.log(ctxInfo, params)


}

export async function test(ctxInfo, params) {
  console.log(ctxInfo, params)
}
