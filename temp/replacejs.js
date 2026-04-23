// replace test

let subject = "Cdl email"
let dirStr = "666 ${subject}"

let final = dirStr.replace(/\${(.*?)}/g, `$1 - ${subject}`)

console.log(final)

function getname(msg) {
  return "${asunto}"
}
let str = "${asunto}-name"
const smartFmtMapLocalized = {
    [getname()]: subject,
  };

  console.log(smartFmtMapLocalized)
  final = str.replace(/\${.*?}/g, function (m) { return smartFmtMapLocalized[m]; });

console.log(final)
