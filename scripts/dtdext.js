// extract dtd entries

const fsp = require('node:fs/promises');
const path = require('path');
const prettier = require("prettier");
var parser = require("dtd-file");

// full locale set
let locales = ['en-US', 'de', 'ca', 'cs', 'da', 'el', 'es-ES', 'fr', 'gl', 'hu', 'hy-AM', 'it', 'ja', 'ko',
  'nl', 'pl', 'pt-PT', 'ru', 'sk', 'sl', 'sv-SE', 'zh-CN'];

let locales2 = ['ca', 'ko2']
let localeDir = ".\\localeSrc";

//\ca\chrome\ca\locale\ca\messenger

async function main() {
  let dc = await fsp.readdir(`${localeDir}`);
  console.log(dc)

  for (const dobj of dc) {
    if ((await fsp.stat(`${localeDir}\\${dobj}`)).isDirectory()) {
      console.log(dobj)

      let mpFile = `${localeDir}\\${dobj}\\chrome\\${dobj}\\locale\\${dobj}\\messenger\\mimeheader.properties`
      let fobj = await fsp.readFile(mpFile, {encoding: `utf8`});
      console.log(fobj)
      

      let from = fobj.match(/^FROM\s*=\s*(.*)/m);
      console.log(from[1])

    }
  }
}

(async () => {
  await main();
})();


/*
node ../scripts/dtdext.js

*/
