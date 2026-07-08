
export async function configure() {
  console.log("configure commands")
  console.log(await browser.commands.getAll())
  await browser.tabs.create({ url: `UI/ms1.html`, index: 1 });

  //browser.commands.openShortcutSettings()
}