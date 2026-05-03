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

// ui elements and control
// tbd - move notifications here

export async function createExportStatusWindow(title, winType) {
  if (winType == "singleFolder") {
    await browser.windows.create({ url: "/UI/expStatus.html", titlePreface: title, type: "popup", width: 545, height: 240 });
  } else {
    await browser.windows.create({ url: "/UI/expStatus.html", titlePreface: title, type: "popup", width: 545, height: 340 });
  }

}
