// script for duping files like mbox, eml etc.
// fdup file cnt

/* global process,
*/

const fs = require('fs-extra');

let filename = process.argv[2];
let count = process.argv[3];

count = Number(count);
console.log(`Duping ${filename} ${count} times`);

for (let i = 1; i < (count + 1); i++) {

  fs.copy(filename, `${filename}-${i}`);
}
