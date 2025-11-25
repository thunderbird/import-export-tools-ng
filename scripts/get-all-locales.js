// download Thunderbird locale xpis

async function main() {
  console.log("Download Locale XPIs");

  const { exec } = require('child_process');
  //import exec  from 'child_process';

  const srcFTProot = 'https://archive.mozilla.org/pub/thunderbird/releases/';
  const release = process.argv[2];
  console.log(release)
  const srcBase = `${srcFTProot}${release}/linux-x86_64/xpi/`;
  console.log(srcBase)

  const outputBase = './scratch/localeT/';
  const options = {
    // see options below
  };

  // full locale set
  let locales = ['en-US', 'de', 'ca', 'cs', 'da', 'el', 'es-ES', 'fr', 'gl', 'hu', 'hy-AM', 'it', 'ja', 'ko',
    'nl', 'pl', 'pt-PT', 'ru', 'sk', 'sl', 'sv-SE', 'zh-CN'];

  let locales2 = ['ca', 'ko2']

  var lcnt = 0;
  var ecnt = 0;

  for (const localeNameFull of locales) {
    let src = `${srcBase}${localeNameFull}.xpi`;
    console.log("Downloading: ", src);
    let output = `.\\localeSrc\\${localeNameFull}.xpi`;
    try {
      let wg = `wget -nv -O ${output} ${src}`;
      let res = exec(wg, (error, stdout, stderr) => {
        ecnt++;
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        lcnt++;

        //console.log(`stdout: ${stdout}`);
        //console.error(`stderr: ${stderr}`);
      });

    } catch (ex) {
      console.log(ex)
    }
  }

  while (ecnt < locales.length - 1) {
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('Finished Downloading: ', lcnt);

}

(async () => {
  await main();
})();



/*
node ./scripts/get-all-locales.js
node ../scripts/get-all-locales.js
node ../scripts/get-all-locales.js 140.0.1

*/
