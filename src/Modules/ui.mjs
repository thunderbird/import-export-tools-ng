// ui elements and control

import { strftime } from "./strftime.mjs";

export async function createExportStatusWindow(title) {
  //await browser.windows.create({url: "/UI/expStatus.html", type: "popup", top: 200, left: 200, width: 230, height: 180});
  await browser.windows.create({url: "/UI/expStatus.html", type: "popup", width: 380, height: 240});

  //await browser.windows.create({url: "/UI/expStatus.html", type: "popup", top: 200, left: 200});

}
