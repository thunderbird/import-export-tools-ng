
const fs = require('fs-extra');

const projectId = 'ThunderbirdTranslations';

const key = fs.readJSONSync("/Dev/SecurityMaterial/gapi-key.json").gapiKey;

var url1 = "https://translate.google.com/translate?hl=en&sl=auto&tl=de&u=https%3A%2F%2Fraw.githubusercontent.com%2Fthundernest%2Fimport-export-tools-ng%2Fv4.1.0-update%2Fsrc%2Fchrome%2Fcontent%2Fmboximport%2Fimportexport-help-en-US.html";

var request = require('request');
var url = 'https://translation.googleapis.com/language/translate/v2';
var options1 = {
  tl: 'de',
//   format: 'html',
  hl: 'en',
}

// request.post({url:url, qs:options1}, (err, res, body)=> {
request.post({url:url1}, (err, res, body)=> {
  if(err) {
    console.log('ERR: ', err);
  }
  console.log('RES: ', res.statusCode);
  console.log('Body: ', body);
})
