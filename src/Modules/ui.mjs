// ui elements and control

import { strftime } from "./strftime.mjs";

export async function createExportStatusWindow(title, winType) {
  if (winType == "singleFolder") {
    await browser.windows.create({ url: "/UI/expStatus.html", titlePreface: title, type: "popup", width: 545, height: 245 });
  } else {
    await browser.windows.create({ url: "/UI/expStatus.html", titlePreface: title, type: "popup", width: 545, height: 320 });
  }

}
