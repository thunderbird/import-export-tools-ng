// textToHtml test

const fs = require('fs-extra');

var source = fs.readFileSync("scripts/t3.txt", { encoding: 'utf8' });
let t = "7567\nyyy\n>yuj\n>ygfd\nheok"
let regexp = /$[^>]([ \S\s]*^)[^>]/gm;

//const array = [...source.matchAll(regexp)];
const array = source.match(regexp);
console.log(array)

let output = source.replaceAll(/^>\r\n/gm, "</pre><div style='padding-left: 40px'>&gt;</div>\r\n<pre>");
output = output.replaceAll(/^>>\r\n/gm, "<div style='padding-left: 80px'>&gt;&gt;</div>\r\n");
output = output.replaceAll(/^>>>\r\n/gm, "<div style='padding-left: 120px'>&gt;&gt;&gt;</div>\r\n");
output = output.replaceAll(/^>>>>\r\n/gm, "<div style='padding-left: 160px'>&gt;&gt;&gt;&gt;</div>\r\n");



output = output.replaceAll(/^>([^>][ \S]*)\r\n/gm, "<div style='padding-left: 40px'>&gt;$1</div>");

output = output.replaceAll(/^>>([^>][ \S]*)\r\n/gm, "<div style='padding-left: 80px'>&gt;&gt;$1</div>");
output = output.replaceAll(/^>>>([^>][ \S]*)\r\n/gm, "<div style='padding-left: 120px'>&gt;&gt;&gt;$1</div>");
output = output.replaceAll(/^>>>>([^>][ \S]*)\r\n/gm, "<div style='padding-left: 150px'>&gt;&gt;&gt;&gt;$1</div>");


output = `<html><body><pre>${output}</pre></body></html>`;

//console.log(output)

fs.writeFileSync("scripts/out.html", output,{ encoding: 'utf8' });

function textToHtml(srcTxt) {
  txtLines = srcTxt.split(/\r?\n/);
  htmlLines = new Array(txtLines.length);
  htm
  for (let lineNum = 0; lineNum < txtLines.length; lineNum++) {
    const line = txtLines[lineNum];
    if (lineNum == 0) {
      htmlLines[0] = "<div wrap><pre>";

    }
  }
}