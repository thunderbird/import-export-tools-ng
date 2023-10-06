/*
 * This file is provided by the addon-developer-support repository at
 * https://github.com/thundernest/addon-developer-support
 *
 * Version 1.4
 *  - updated implementation to not assign this anymore
 * 
 * Version 1.3
 *  - moved registering the observer into startup
 *
 * Version 1.1
 *  - added startup event, to make sure API is ready as soon as the add-on is starting
 *    NOTE: This requires to add the startup event to the manifest, see:
 *    https://github.com/thundernest/addon-developer-support/tree/master/auxiliary-apis/NotifyTools#usage
 *
 * Author: John Bieling (john@thunderbird.net)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";

(function (exports) {

  // Get various parts of the WebExtension framework that we need.
  var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
  var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

  var observerTracker = new Set();

  class NotifyTools extends ExtensionCommon.ExtensionAPI {
    getAPI(context) {
      return {
        NotifyTools: {

          notifyExperiment(data) {
            return new Promise(resolve => {
              Services.obs.notifyObservers(
                { data, resolve },
                "NotifyExperimentObserver",
                context.extension.id
              );
            });
          },

          onNotifyBackground: new ExtensionCommon.EventManager({
            context,
            name: "NotifyTools.onNotifyBackground",
            register: (fire) => {
              observerTracker.add(fire.sync);
              return () => {
                observerTracker.delete(fire.sync);
              };
            },
          }).api(),

        }
      };
    }

    // Force API to run at startup, otherwise event listeners might not be added at the requested time. Also needs
    // "events": ["startup"] in the experiment manifest
    onStartup() {
      this.onNotifyBackgroundObserver = async (aSubject, aTopic, aData) => {
        if (
          observerTracker.size > 0 &&
          aData == this.extension.id
        ) {
          let payload = aSubject.wrappedJSObject;

          // Make sure payload has a resolve function, which we use to resolve the
          // observer notification.
          if (payload.resolve) {
            let observerTrackerPromises = [];
            // Push listener into promise array, so they can run in parallel
            for (let listener of observerTracker.values()) {
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
            // Older version of NotifyTools, which is not sending a resolve function, deprecated.
            console.log("Please update the notifyTools API and the notifyTools script to at least v1.5");
            for (let listener of observerTracker.values()) {
              listener(payload.data);
            }
          }
        }
      };

      // Add observer for notifyTools.js
      Services.obs.addObserver(
        this.onNotifyBackgroundObserver,
        "NotifyBackgroundObserver",
        false
      );
    }

    onShutdown(isAppShutdown) {
      if (isAppShutdown) {
        return; // the application gets unloaded anyway
      }

      // Remove observer for notifyTools.js
      Services.obs.removeObserver(
        this.onNotifyBackgroundObserver,
        "NotifyBackgroundObserver"
      );

      // Flush all caches
      Services.obs.notifyObservers(null, "startupcache-invalidate");
    }
  };

  exports.NotifyTools = NotifyTools;

})(this)