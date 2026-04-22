// replace test

let subject = "Cdl email"
let dirStr = "666 ${subject}"

let final = dirStr.replace(/\${(.*?)}/g, `$1 - ${subject}`)

console.log(final)

let str = "${asunto}-name"
const smartFmtMapLocalized = {
    "${asunto}": subject,
  };

  final = str.replace(/\${.*?}/g, function (m) { return localizedSmartFmtMap[m]; });

console.log(final)
