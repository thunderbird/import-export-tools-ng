// prefMigration.mjs

// This is where we will do migration to local storage
// for now just deal with changes to legacy prefs

import * as prefs from "./prefCmds.mjs";

export async function legacyPrefMigration() {
  // mode 0 not supported, move to 2 == dropdown mode
  let nameFormat = await prefs.getPref("exportEML.filename_format");
  if (nameFormat != 1 && nameFormat != 3) {
    await prefs.setPref("exportEML.filename_format", 2);
  }
}
