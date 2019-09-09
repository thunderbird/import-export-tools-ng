let s = '<FIELDSET CLASS="mimeAttachmentHeader">	<LEGEND CLASS="mimeAttachmentHeaderName">import-export-tools-ng-icon-64px.png</LEGEND></FIELDSET>	<DIV CLASS="moz-attached-image-container"><IMG CLASS="moz-attached-image" shrinktofit="yes"		SRC="EmbeddedImages-1/0.jpg"></DIV><br> <div>hello</div>';
let s2 = '<FIELDSET CLASS="mimeAttachmentHeader">	<LEGEND CLASS="mimeAttachmentHeaderName">import-export-tools-ng-icon-32px.png</LEGEND></FIELDSET>	<DIV CLASS="moz-attached-image-container"><IMG CLASS="moz-attached-image" shrinktofit="yes"		SRC="EmbeddedImages-2/0.jpg"></DIV><br> <div>hello</div>';


console.debug('fields test');

// let regex = /(<\/fieldset>)[^<]+(<div[.*?]<\/div>)/gi;
// let regex = /(<\/fieldset>)([-.?]+\/div)/gi;
// let regex = /<div class="moz-attached-image-container"(.*?)*?<\/div><br>/gi;
// let regex = /(<\/fieldset[^>]*>)([\S\s.?]+<\/(div>){1})/i;

/* let regex = /(<\/fieldset[^>]*>)([\S\s.?]+?<\/div>)/i;

let rs = regex.exec(s);
console.debug(rs);
let reorder = rs[2] + rs[1];
console.debug(s.replace(regex, reorder));
 */
var data = s + s2;

// let regex = /(<\/fieldset[^>]*>)([\S\s.?]+?<\/div>)/ig;
// let regex = /(<\/fieldset[^>]*>)([\S\s.?]+?<\/div>)/ig;
/* 
while ( (rs = regex.exec(data)) !== null) {
	console.debug(rs);
	let reorder = rs[2] + rs[1];
	data = data.replace(regex, reorder);

}
 */
let rs;
let regex = /<div class="moz-attached-image-container"(.*?)*?<\/div><br>/gi;
rs = data.match(regex);
console.debug(rs);

data = data.replace(/<\/fieldset>/ig, "");
for (let index = 0; index < rs.length; index++) {
	const element = rs[index];
	console.debug(element);
	data = data.replace(element, element.substr(0, rs[index].length - 4) + "\n</fieldset>\n");
}

console.debug(data);