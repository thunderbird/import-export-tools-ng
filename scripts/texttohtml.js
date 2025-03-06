// textToHtml test

const fs = require('fs-extra');

var source = fs.readFileSync("scripts/test2.html", { encoding: 'utf8' });
let t = "7567\nyyy\n>yuj\n>ygfd\nheok"
let regexp = /(>[\s\S]*)\r\n^[^>]/m;

//const array = [...source.matchAll(regexp)];
//const array = source.match(regexp);

let output = source.replaceAll(/>\r\n$/gm, "<div style='padding-left: 40px'>&gt;</div>");

output = output.replaceAll(/^>([^>][ \S]*)\r\n$/gm, "<div style='padding-left: 40px'>&gt;$1</div>");

output = output.replaceAll(/^>>([^>][ \S]*)\r\n/gm, "<div style='padding-left: 80px'>&gt;&gt;$1</div>");
output = output.replaceAll(/^>>>([^>][ \S]*)\r\n/gm, "<div style='padding-left: 120px'>&gt;&gt;&gt;$1</div>");
output = output.replaceAll(/^>>>>([^>][ \S]*)\r\n/gm, "<div style='padding-left: 150px'>&gt;&gt;&gt;&gt;$1</div>");
output = `<html><body><pre>${output}</pre></body></html>`;

console.log(output)

fs.writeFileSync("scripts/out.html", output,{ encoding: 'utf8' });
