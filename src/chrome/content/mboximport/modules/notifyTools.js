// Set this to the ID of your add-on, or call notifyTools.setAddonID().
var ADDON_ID = "ImportExportToolsNG@cleidigh.kokkini.net";

/*
 * This file is provided by the addon-developer-support repository at
 * https://github.com/thundernest/addon-developer-support
 *
 * For usage descriptions, please check:
 * https://github.com/thundernest/addon-developer-support/tree/master/scripts/notifyTools
 *
 * Version: 1.5
 * - deprecate enable(), disable() and registerListener()
 * - add setAddOnId()
 *
 * Version: 1.4
 * - auto enable/disable
 *
 * Version: 1.3
 * - registered listeners for notifyExperiment can return a value
 * - remove WindowListener from name of observer
 *
 * Author: John Bieling (john@thunderbird.net)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var Services = globalThis.Services || ChromeUtils.import(
  'resource://gre/modules/Services.jsm'
).Services;

var notifyTools = {
  registeredCallbacks: {},
  registeredCallbacksNextId: 1,
  addOnId: ADDON_ID,

  setAddOnId: function (addOnId) {
    this.addOnId = addOnId;
  },

  onNotifyExperimentObserver: {
    observe: async function (aSubject, aTopic, aData) {
      if (notifyTools.addOnId == "") {
        throw new Error("notifyTools: ADDON_ID is empty!");
      }
      if (aData != notifyTools.addOnId) {
        return;
      }
      let payload = aSubject.wrappedJSObject;

      // Make sure payload has a resolve function, which we use to resolve the
      // observer notification.
      if (payload.resolve) {
        let observerTrackerPromises = [];
        // Push listener into promise array, so they can run in parallel
        for (let registeredCallback of Object.values(
          notifyTools.registeredCallbacks
        )) {
          observerTrackerPromises.push(registeredCallback(payload.data));
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
              "Received multiple results from onNotifyExperiment listeners. Using the first one, which can lead to inconsistent behavior.",
              results
            );
          }
          payload.resolve(results[0]);
        }
      } else {
        // Older version of NotifyTools, which is not sending a resolve function, deprecated.
        console.log("Please update the notifyTools API to at least v1.5");
        for (let registeredCallback of Object.values(
          notifyTools.registeredCallbacks
        )) {
          registeredCallback(payload.data);
        }
      }
    },
  },

  addListener: function (listener) {
    if (Object.values(this.registeredCallbacks).length == 0) {
      Services.obs.addObserver(
        this.onNotifyExperimentObserver,
        "NotifyExperimentObserver",
        false
      );
    }

    let id = this.registeredCallbacksNextId++;
    this.registeredCallbacks[id] = listener;
    return id;
  },

  removeListener: function (id) {
    delete this.registeredCallbacks[id];
    if (Object.values(this.registeredCallbacks).length == 0) {
      Services.obs.removeObserver(
        this.onNotifyExperimentObserver,
        "NotifyExperimentObserver"
      );
    }
  },

  removeAllListeners: function () {
    if (Object.values(this.registeredCallbacks).length != 0) {
      Services.obs.removeObserver(
        this.onNotifyExperimentObserver,
        "NotifyExperimentObserver"
      );
    }
    this.registeredCallbacks = {};
  },

  notifyBackground: function (data) {
    if (this.addOnId == "") {
      throw new Error("notifyTools: ADDON_ID is empty!");
    }
    return new Promise((resolve) => {
      Services.obs.notifyObservers(
        { data, resolve },
        "NotifyBackgroundObserver",
        this.addOnId
      );
    });
  },


  // Deprecated.

  enable: function () {
    console.log("Manually calling notifyTools.enable() is no longer needed.");
  },

  disable: function () {
    console.log("notifyTools.disable() has been deprecated, use notifyTools.removeAllListeners() instead.");
    this.removeAllListeners();
  },

  registerListener: function (listener) {
    console.log("notifyTools.registerListener() has been deprecated, use notifyTools.addListener() instead.");
    this.addListener(listener);
  },

};

if (typeof window != "undefined" && window) {
  window.addEventListener(
    "unload",
    function (event) {
      notifyTools.removeAllListeners();
    },
    false
  );
}