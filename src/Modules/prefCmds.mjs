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
const userPrefStorageArea = "local";

export var prefCmds = {

  _userPrefs: {},
  _defaultPrefs: {},

  // Get pref value from local pref obj.
  getPref: function (aName, aFallback = null) {
    // Get defaultPref.
        console.log("getPref", aName, "userPref:")

    //let defaultPref = (this.dotWalk(aName, this._defaultPrefs) || this.dotWalk(aName, this._defaultPrefs) === "")
    let defaultPref = this.dotHasOwnProperty(aName, this._defaultPrefs)
      ? this.dotGet(aName, this._defaultPrefs)
      : aFallback;

    //console.log("def", defaultPref)
    // Check if userPref type is defaultPref type and return default if no match.
    if (this.dotHasOwnProperty(aName, this._userPrefs)) {
      let userPref = this.dotGet(aName, this._userPrefs);
      if (typeof defaultPref == typeof userPref) {
        console.log("getPref", aName, "userPref:", this.dotGet(aName, this._userPrefs))

        return userPref;
      }
      console.log("Type of defaultPref <" + defaultPref + ":" + typeof defaultPref + "> does not match type of userPref <" + userPref + ":" + typeof userPref + ">. Fallback to defaultPref.")
    }

    // Fallback to default value.
    console.log("getPref:", aName, "defaultPref:", this.dotGet(aName, this._defaultPrefs))
    return defaultPref;
  },

  // Set pref value by updating local pref obj and updating storage.
  setPref: function (aName, aValue, createNewProperty = false) {
    this.dotSet(aName, aValue, this._userPrefs, createNewProperty);
    messenger.storage[userPrefStorageArea].set({ userPrefs: this._userPrefs });
    console.log("setPref:", aName, "userPref:", this.dotGet(aName, this._userPrefs))

  },

  // Remove a preference (calls to getPref will return default value)
  clearPref: function (aName, aValue) {
    delete this._userPrefs[aName];
    messenger.storage[userPrefStorageArea].set({ userPrefs: this._userPrefs });
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
  init: async function (defaults = null) {
    this._userPrefs = {};
    this._defaultPrefs = {};

    // Store user prefs into the local userPrefs obj.
    this._userPrefs = (await messenger.storage[userPrefStorageArea].get("userPrefs")).userPrefs || {};

    // If defaults are given, push them into storage.local
    if (defaults) {
      await messenger.storage.local.set({ defaultPrefs: defaults });
    }

    this._defaultPrefs = (await messenger.storage.local.get("defaultPrefs")).defaultPrefs || {};

    // Add storage change listener.
    if (!(await messenger.storage.onChanged.hasListener(this.storageChanged))) {
      //await messenger.storage.onChanged.addListener(this.storageChanged);
    }
  },

  dotGet: function (str, obj) {
    console.log("dotget")
    let dotSplit = str.split('.');

    // Splits the string by each dot
    return str.split('.')
      // iterate the string, passing back
      // the property at each path
      .reduce((result, path) => {
        // Return undefined if the path doesn't exist
        return result && result[path];
      }, obj)
      ?? null; // return null if no property found
  },

  dotSet: function (str, val, obj, createNewProperty = false) {
    let dotSplit = str.split('.');
  let dotSplitLen = dotSplit.length;

  // Splits the string by each dot
  return dotSplit
    // iterate the string, passing back[]
    // the property at each path
    .reduce((result, path) => {
      // We might need to construct new object branch
      if (--dotSplitLen) {
        if (result[path] == undefined && createNewProperty) {
          result[path] = {};
        }
        // Return undefined if the path doesn't exist
        return result && result[path];
      }
      if ((result[path] != undefined) || createNewProperty) {
        result[path] = val;
        return result[path];
      }
      return undefined;
    }, obj)
    ?? null; // return null if no property found
},

  dotHasOwnProperty: function (str, obj) {
    let dotValue = this.dotGet(str, obj);
    if (dotValue != null && dotValue != undefined) {
      return true;
    }
    return false;
  }

}
