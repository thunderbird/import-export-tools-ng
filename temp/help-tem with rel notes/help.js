
	
	document.getElementById("extVersion").innerText = "v" + browser.runtime.getManifest().version;
	var tb_locale = messenger.i18n.getUILanguage();

	document.getElementById("locale1").textContent = tb_locale;
	if (tb_locale === 'en-US' || tb_locale.split('-')[0] === 'en') {
		document.getElementById("localized-token-table").classList.add('hide-ltoken-table');
	}

document.addEventListener('DOMContentLoaded', () => {
  i18n.updateDocument();
}, { once: true });

