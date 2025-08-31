// download Thunderbird locale xpis

console.log("start")
const wget = require('node-wget-promise');
const { exec } = require('child_process');
const srcBase = 'https://archive.mozilla.org/pub/thunderbird/releases/140.0.1esr/linux-x86_64/xpi/';
const outputBase = './scratch/localeT/';
const options = {
  // see options below
};

// full locale set
localeFolders = ['en-US', 'de', 'ca', 'cs', 'da', 'el', 'es-ES', 'fr', 'gl', 'hu', 'hy-AM', 'it', 'ja', 'ko',
  'nl', 'pl', 'pt-PT', 'ru', 'sk', 'sl', 'sv-SE', 'zh-CN'];

localeFolders3 = ['en-US', 'de', 'ca', 'cs', 'da', 'el', 'es-ES', 'fr', 'gl', 'hu', 'hy-AM', 'it', 'ja', 'ko']

localeFolders2 = ['ca', 'ko']

async function dload() {
  for (localeNameFull of localeFolders) {
    let src = `${srcBase}${localeNameFull}.xpi`;
    console.log(src)
    let output = `${localeNameFull}.xpi`
    try {
      let wg = `wget  -O ${output} ${src}`
    console.log(wg)

      exec(wg)
    } catch (ex) {
      console.log(ex)

    console.log(src)


    }
  }
}

(async () => {
  await dload();

  console.log('Done');
  return
})();

  console.log('end');

/*
let download = wget.download(src, output, options);
download.on('error', function (err) {
  console.log(err);
});
download.on('start', function (fileSize) {
  console.log(fileSize);
});
download.on('end', function (output) {
  console.log(output);
});
*/




console.log("tdone")
return


/*
node ./scripts/get-all-locales.js
node ../../scripts/get-all-locales.js

npm uninstall wget-improved
npm i -g node-wget-promise
*/
