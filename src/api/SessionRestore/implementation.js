/*
 * This file is provided by the addon-developer-support repository at
 * https://github.com/thundernest/addon-developer-support
 *
 * Version 1.0
 *
 * Author: John Bieling (john@thunderbird.net)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Get various parts of the WebExtension framework that we need.
var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var SessionRestore = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    let self = this;

    this.context = context;

    return {
      SessionRestore: {

        onStartupSessionRestore: new ExtensionCommon.EventManager({
          context,
          name: "SessionRestore.onNotifyBackground",
          register: (fire) => {
            let trackerId = self.observerTrackerNext++;
            self.observerTracker[trackerId] = fire.sync;
            return () => {
              delete self.observerTracker[trackerId];
            };
          },
        }).api(),

      }
    };
  }

  onStartup() {
    let self = this;

    this.observerTracker = {};
    this.observerTrackerNext = 1;

    this.onStartupSessionRestoreObserver = {
      observe: async function (aSubject, aTopic, aData) {
        if (Object.keys(self.observerTracker).length > 0) {
          for (let listener of Object.values(self.observerTracker)) {
            let windowId = self.context.extension.windowManager.convert(aSubject);
            listener(windowId);
          }
        }
      },
    };

    Services.obs.addObserver(
      this.onStartupSessionRestoreObserver,
      "mail-tabs-session-restored", 
      false
    );
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) {
      return; // the application gets unloaded anyway
    }

    Services.obs.removeObserver(
      this.onStartupSessionRestoreObserver,
      "mail-tabs-session-restored"
    );

    // Flush all caches
    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }
};
