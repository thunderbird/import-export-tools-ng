  const imapService = Components.classes["@mozilla.org/messenger/imapservice;1"]
    .getService(Components.interfaces.nsIImapService)

  const rootFolder = account.incomingServer.rootFolder
  imapService.discoverAllFolders(rootFolder, account.incomingServer, null)
  console.log("[MyApp] Triggered IMAP folder discovery")

  // Refresh mail tab to enable compose button
  const mainWindow = Services.wm.getMostRecentWindow("mail:3pane")
  if (mainWindow) {
    const msgWindow = mainWindow.msgWindow
    account.incomingServer.performExpand(msgWindow)
    console.log("[MyApp] Triggered IMAP folder expansion")

    const tabmail = mainWindow.document.getElementById("tabmail")
    const mailTab = tabmail?.tabInfo?.find(tab => tab.mode?.name === "mail3PaneTab")
    mailTab?.chromeBrowser?.contentWindow?.location?.reload()
  }

  mailTab?.chromeBrowser?.contentWindow?.folderPane.updateWidgets()

