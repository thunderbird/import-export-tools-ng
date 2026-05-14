/*
 * This file is provided by the addon-developer-support repository at
 * https://github.com/thundernest/addon-developer-support
 *
 * This file is intended to be used in the WebExtension background page,
 * in popup pages, option pages, content pages as well as in legacy chrome
 * windows (together with the WindowListener API).
 * The preferences will be loaded asynchronously from the WebExtension
 * storage and stored in a local pref obj, so all further access can be done
 * synchronously.
 * If preferences are changed elsewhere, the local pref obj will be updated.
 * 
 * Version: 1.2
 * - Bugfix: move to a different saving scheme, as storage.local.get() without
 *   providing a value to get them all, may cause an TransactionInactiveError in
 *   IndexedDB.sys.mjs
 *
 * Version: 1.1
 * - Bugfix: use messenger.storage instead of browser.storage
 *
 * Version: 1.0
 *
 * Author: John Bieling (john@thunderbird.net)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Set the storage area of userPrefs either to "local" or "sync". Setting it to
// "sync" is a hack to keep preferences stored even after the add-on has been
// removed and installed again (storage.local is cleared upon add-on removal).
// Even though Thunderbird does not actually have a sync backend, storage.sync
// is not cleared on add-on removal to mimic syncing stored values.
// Hint: Reloading/Updating an add-on does not clear storage.local.
const userPrefStorageArea = "sync";

export var preferences = {
  
  _userPrefs: {},
  _defaultPrefs: {},
    
  // Get pref value from local pref obj.
  getPref: function(aName, aFallback = null) {
    // Get defaultPref.
    let defaultPref = this._defaultPrefs.hasOwnProperty(aName)
      ? this._defaultPrefs[aName]
      : aFallback;
    
    // Check if userPref type is defaultPref type and return default if no match.
    if (this._userPrefs.hasOwnProperty(aName)) {
      let userPref = this._userPrefs[aName];
      if (typeof defaultPref == typeof userPref) {
        return userPref;
      }      
      console.log("Type of defaultPref <" + defaultPref + ":" + typeof defaultPref + "> does not match type of userPref <" + userPref + ":" + typeof userPref + ">. Fallback to defaultPref.")
    }
    
    // Fallback to default value.
    return defaultPref;
  },

  // Set pref value by updating local pref obj and updating storage.
  setPref: function(aName, aValue) {
    this._userPrefs[aName] = aValue;
    messenger.storage[userPrefStorageArea].set({ userPrefs : this._userPrefs });
  },

  // Remove a preference (calls to getPref will return default value)
  clearPref: function(aName, aValue) {
    delete this._userPrefs[aName];
    messenger.storage[userPrefStorageArea].set({ userPrefs : this._userPrefs });
  },
  
  // Listener for storage changes.
  storageChanged: function (changes, area) {
    let changedItems = Object.keys(changes);
    for (let item of changedItems) {
      if (area == userPrefStorageArea && item == "userPrefs") {
        this._userPrefs = changes.userPrefs.newValue;
      }
      
      if (area == "local" && item == "defaultPrefs") {
        this._defaultPrefs = changes.defaultPrefs.newValue;
      }
    }    
  },

  // Initialize the local pref obj by loading userPrefs and defaultPrefs from
  // WebExtension storage. If a defaults obj is given, the defaults in storage
  // are updated/set.
  init: async function(defaults = null) {
    this._userPrefs = {};
    this._defaultPrefs = {};
    
    // Store user prefs into the local userPrefs obj.
    this._userPrefs = (await messenger.storage[userPrefStorageArea].get("userPrefs")).userPrefs || {};
       
    // If defaults are given, push them into storage.local
    if (defaults) {
      await messenger.storage.local.set({ defaultPrefs : defaults });

      // We need to migration from prefsV1 to prefsV2    
      for(let prefName of Object.keys(defaults)) {
        let prefV1Value = (await browser.storage[userPrefStorageArea].get("pref.value." + prefName))["pref.value." + prefName];
        if (prefV1Value) {
          await browser.storage[userPrefStorageArea].remove("pref.value." + prefName);
          preferences.setPref(prefName, prefV1Value);
        }
      }
    }
    
    this._defaultPrefs = (await messenger.storage.local.get("defaultPrefs")).defaultPrefs || {};

    // Add storage change listener.
    if (!(await messenger.storage.onChanged.hasListener(this.storageChanged))) {
      await messenger.storage.onChanged.addListener(this.storageChanged);
    }
  },

}
