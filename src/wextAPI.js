// wextAPI.js


messenger.NotifyTools.onNotifyBackground.addListener(async (info) => {
	let rv;
	switch (info.command) {
		case "windowsGetAll":
			var w = await browser.windows.getAll(info.options);
			return w;
		case "getCurrentURL":
			// method one: via tabs in focused window
			try {
				var w = await browser.windows.getAll({ populate: true });
			} catch {
				return "unknown";
			}

			let cw = w.find(fw => fw.focused)
			let url1 = cw.tabs.find(t => t.active).url;
			if (!url1) {
				url1 = "undefinedURL";
			}
			return url1;
		case "getSelectedMessages":
			var msgList = [];
			try {
				msgList = await browser.mailTabs.getSelectedMessages();
			} catch {
				msgList = null;
			}
			return msgList;
		case "getFullMessage":

			rv = await getFullMessage(info.messageId);
			return rv;
    }
    return false;
  }
  
);