# Objective

The SessionRestore API is a proof of concept of an upcoming sessions API for Thunderbird. Currently it only supports an event to listen for the `onStartupSessionRestore` event, which is fired after the session of a MailTab window has been restored.

This API is under active development and is subject to change.

# Usage

Add the [SessionRestore API](https://github.com/thundernest/addon-developer-support/tree/master/auxiliary-apis/SessionRestore) to your add-on. Your `manifest.json` needs an entry like this:

```
  "experiment_apis": {
    "SessionRestore": {
      "schema": "api/SessionRestore/schema.json",
      "parent": {
        "scopes": ["addon_parent"],
        "paths": [["SessionRestore"]],
        "script": "api/SessionRestore/implementation.js",
        "events": ["startup"]
      }
    }
  },
```

Add a listener for the `onStartupSessionRestore` event in your WebExtension's background page:

```
browser.SessionRestore.onStartupSessionRestore.addListener(async window => {
  // Get the MailTabs in this window (does not need to be active).
  let mailTabs = await browser.mailTabs.query({
    windowId: window.id
  });

  // Select the inbox of the default account in each MailTab.
  for (let mailTab of mailTabs) {
    let account = await messenger.accounts.getDefault();
    let inbox = account.folders.find(folder => folder.type == "inbox");

    if (inbox) {
      messenger.mailTabs.update(mailTab.id, {
        displayedFolder: inbox
      });
    }
  }
});
```
