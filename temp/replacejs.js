// replace test

let subject = "Cdl email"
let dirStr = "666 ${subject}"

let final = dirStr.replace(/\${(.*?)}/g, `$1 - ${subject}`)

console.log(final)