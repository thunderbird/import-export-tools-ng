
export async function configure() {
  console.log("configure commands")
  console.log(await browser.commands.getAll())
  browser.commands.openShortcutSettings()
}