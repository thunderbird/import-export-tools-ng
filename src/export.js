// export prototype

async function exportfolder(ctxEvent, tab) {

  // for now only deal with a single folder for prototype
  if (ctxEvent.selectedFolders && ctxEvent.selectedFolders.length > 1) {
    let rv = await browser.AsyncPrompts.asyncAlert(browser.i18n.getMessage("multipleFolders.title"), browser.i18n.getMessage("multipleFolders.AlertMsg"));
    if (!rv) {
      return;
    }
  }

  // we will use parametes in folder menu structure
}