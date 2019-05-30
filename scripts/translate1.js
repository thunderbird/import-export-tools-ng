const translate = require('@vitalets/google-translate-api');

// translate('Mail Header Editor', {from: 'en', to: 'zh-CH'}).then(res => {
	translate('email header editor.', {from: 'en', to: 'de'}).then(res => {
	console.log(res.text);
	console.log(res);
    //=> I speak English
    console.log(res.from.language.iso);
    //=> nl
}).catch(err => {
    console.error(err);
});

// <!ENTITY ColumnsWizard.CustColEditorTab.Editing.label "Mail Header Editor">