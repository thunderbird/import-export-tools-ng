/*
  ImportExportTools NG is a extension for Thunderbird mail client
  providing import and export tools for messages and folders.
  The extension authors:
    Copyright (C) 2026 : Christopher Leidigh

  ImportExportTools NG is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// prefMigration.mjs

// This is where we will do migration to local storage
// for now just deal with changes to legacy prefs

import * as prefs from "./prefCmds.mjs";

export async function legacyPrefMigration() {
  // mode 0 not supported, move to 2 == dropdown mode and set default pattern
  let nameFormat = await prefs.getPref("exportEML.filename_format");
  if (nameFormat != 1 && nameFormat != 3) {
    await prefs.setPref("exportEML.filename_format", 2);
    try {
      let pattern = await prefs.getPref("export.filename_pattern");
      if (pattern == undefined) {
        console.log("IETNG: Migrate filename_format to Dropdown format");
        await prefs.createPref("export.filename_pattern", "%d-%s-%k");
        console.log("IETNG: Set undefined filename_pattern to: %d-%s-%k");
      }
    } catch (ex) {
      console.error(ex);
    }
  }
}
