/*
 * This file is provided by the addon-developer-support repository at
 * https://github.com/thundernest/addon-developer-support
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

var NotifyTools = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    var self = this;

    this.onNotifyBackgroundObserver = {
      observe: async function (aSubject, aTopic, aData) {
        if (
          Object.keys(self.observerTracker).length > 0 &&
          aData == self.extension.id
        ) {
          let payload = aSubject.wrappedJSObject;
          // This is called from the BL observer.js and therefore it should have a resolve
          // payload, but better check.
          if (payload.resolve) {
            let observerTrackerPromises = [];
            // Push listener into promise array, so they can run in parallel
            for (let listener of Object.values(self.observerTracker)) {
              observerTrackerPromises.push(listener(payload.data));
            }
            // We still have to await all of them but wait time is just the time needed
            // for the slowest one.
            let results = [];
            for (let observerTrackerPromise of observerTrackerPromises) {
              let rv = await observerTrackerPromise;
              if (rv != null) results.push(rv);
            }
            if (results.length == 0) {
              payload.resolve();
            } else {
              if (results.length > 1) {
                console.warn(
                  "Received multiple results from onNotifyBackground listeners. Using the first one, which can lead to inconsistent behavior.",
                  results
                );
              }
              payload.resolve(results[0]);
            }
          } else {
            // Just call the listener.
            for (let listener of Object.values(self.observerTracker)) {
              listener(payload.data);
            }
          }
        }
      },
    };

    this.observerTracker = {};
    this.observerTrackerNext = 1;
    // Add observer for notifyTools.js
    Services.obs.addObserver(
      this.onNotifyBackgroundObserver,
      "NotifyBackgroundObserver",
      false
    );
    
    return {
      NotifyTools: {

        notifyExperiment(data) {
          return new Promise(resolve => {
            Services.obs.notifyObservers(
              { data, resolve },
              "NotifyExperimentObserver",
              self.extension.id
            );
          });
        },

        onNotifyBackground: new ExtensionCommon.EventManager({
          context,
          name: "NotifyTools.onNotifyBackground",
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

  onShutdown(isAppShutdown) {
    // Remove observer for notifyTools.js
    Services.obs.removeObserver(
      this.onNotifyBackgroundObserver,
      "NotifyBackgroundObserver"
    );

    // Flush all caches
    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }
};