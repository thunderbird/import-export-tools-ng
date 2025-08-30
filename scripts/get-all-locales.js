// download Thunderbird locale xpis

console.log("start")
const wget = require('wget');
const src = 'https://archive.mozilla.org/pub/thunderbird/releases/140.0.1esr/linux-x86_64/xpi/ca.xpi';
const output = './scratch/localeT/ca.xpi';
const options = {
  // see options below
};

// full locale set
localeFolders = ['en-US', 'de', 'ca', 'cs', 'da', 'el', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hy-AM', 'it', 'ja', 'ko-KR',
  'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];

localeFolders.array.forEach(localeNameFull => {
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
});



console.log("done")



/*
node ./scripts/get-all-locales.js
npm uninstall wget-improved
*/
