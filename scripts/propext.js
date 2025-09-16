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
let localeDst = ".\\localeDst";

//\ca\chrome\ca\locale\ca\messenger

async function main() {
  let dc = await fsp.readdir(`${localeDir}`);
  console.log("locales", dc)

  for (const dobj of dc) {
    if ((await fsp.stat(`${localeDir}\\${dobj}`)).isDirectory()) {
      console.log("Locale:", dobj, "\n")

      let mpFile = `${localeDir}\\${dobj}\\chrome\\${dobj}\\locale\\${dobj}\\messenger\\mimeheader.properties`
      let fobj = await fsp.readFile(mpFile, {encoding: `utf8`});
      //console.log(fobj)
      

      let fromMP = fobj.match(/^FROM\s*=\s*(.*)/m);
      let toMP = fobj.match(/^TO\s*=\s*(.*)/m);
      let dateMP = fobj.match(/^DATE\s*=\s*(.*)/m);
      let subjectMP = fobj.match(/^SUBJECT\s*=\s*(.*)/m);
      let ccMP = fobj.match(/^CC\s*=\s*(.*)/m);
      let bccMP = fobj.match(/^BCC\s*=\s*(.*)/m);
      let replytoMP = fobj.match(/^REPLY-TO\s*=\s*(.*)/m);
      let senderMP = fobj.match(/^SENDER\s*=\s*(.*)/m);
      let msgidMP = fobj.match(/^MESSAGE-ID\s*=\s*(.*)/m);

      console.log(`To:\t\t${toMP[1]}`)
      console.log(`From:\t\t${fromMP[1]}`)
      console.log(`Date:\t\t${dateMP[1]}`)
      console.log(`Subject:\t${subjectMP[1]}`)
      console.log(`Cc:\t\t${ccMP[1]}`)
      console.log(`Bcc:\t\t${bccMP[1]}`)
      console.log(`Reply-To:\t${replytoMP[1]}`)
      console.log(`Message-ID:\t${msgidMP[1]}\n`)

      let dstLocaleFile = `${localeDst}\\${dobj}\\hdrs.properties`;
      await fsp.mkdir(`${localeDst}\\${dobj}`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.Subject=${subjectMP[1]}\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.From=${fromMP[1]}\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.To=${toMP[1]}\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.Date=${dateMP[1]}\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.Cc=Cc\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.CcLocal=${ccMP[1]}\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.Bcc=Bcc\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.BccLocal=${bccMP[1]}\n`)

      await fsp.appendFile(dstLocaleFile, `msgHdr.Sender=${senderMP[1]}\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.MessageID=Message-ID\n`)
      await fsp.appendFile(dstLocaleFile, `msgHdr.ReplyTo=${replytoMP[1]}\n`)




    }
  }
}

(async () => {
  await main();
})();


/*
node ../scripts/propext.js

*/
