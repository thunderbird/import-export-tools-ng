Version: 1.62
-------------
- fix bug in fullyLoaded()

Version: 1.61
-------------
- adjusted to Thunderbird Supernova (Services is now in globalThis)

Version: 1.60
-------------
- explicitly set hasAddonManagerEventListeners flag to false on uninstall
  
Version: 1.59
-------------
- store hasAddonManagerEventListeners flag in add-on scope instead on the global
  window again, and clear it upon add-on removal
  
Version: 1.58
-------------
- hard fork WindowListener v1.57 implementation and continue to serve it for
  Thunderbird 111 and older
- WindowListener v1.58 supports injection into nested browsers of the new
  mailTab front end of Thunderbird Supernova and allows "about:message" and 
  "about:3pane" to be valid injection targets. More information can be found here:
  https://developer.thunderbird.net/thunderbird-development/codebase-overview/mail-front-end

Version: 1.57
-------------
- fix race condition which could prevent the AOM tab to be monkey patched correctly

Version: 1.56
-------------
- be precise on which revision the wrench symbol should be displayed, instead of
  the options button

Version: 1.54
-------------
- fix "ownerDoc.getElementById() is undefined" bug

Version: 1.53
-------------
- fix "tab.browser is undefined" bug

Version: 1.52
-------------
- clear cache only if add-on is uninstalled/updated, not on app shutdown

Version: 1.51
-------------
- use wrench button for options for TB78.10

Version: 1.50
-------------
- use built-in CSS rules to fix options button for dark themes (thanks to Thunder)
- fix some occasions where options button was not added

Version: 1.49
-------------
- fixed missing eventListener for Beta + Daily

Version: 1.48
-------------
- moved notifyTools into its own NotifyTools API.

Version: 1.39
-------------
- fix for 68

Version: 1.36
-------------
- fix for beta 87

Version: 1.35
-------------
- add support for options button/menu in add-on manager and fix 68 double menu entry

Version: 1.34
-------------
- fix error in unload

Version: 1.33
-------------
- fix for e10s

Version: 1.30
-------------
- replace setCharPref by setStringPref to cope with UTF-8 encoding

Version: 1.29
-------------
- open options window centered

Version: 1.28
-------------
- do not crash on missing icon

Version: 1.27
-------------
- add openOptionsDialog()

Version: 1.26
-------------
- pass WL object to legacy preference window

Version: 1.25
-------------
- adding waitForMasterPassword

Version: 1.24
-------------
- automatically localize i18n locale strings in injectElements()

Version: 1.22
-------------
- to reduce confusions, only check built-in URLs as add-on URLs cannot
  be resolved if a temp installed add-on has bin zipped

Version: 1.21
-------------
- print debug messages only if add-ons are installed temporarily from
  the add-on debug page
- add checks to registered windows and scripts, if they actually exists

Version: 1.20
-------------
- fix long delay before customize window opens
- fix non working removal of palette items

Version: 1.19
-------------
- add support for ToolbarPalette

Version: 1.18
-------------
- execute shutdown script also during global app shutdown (fixed)

Version: 1.17
-------------
- execute shutdown script also during global app shutdown

Version: 1.16
-------------
- support for persist

Version: 1.15
-------------
- make (undocumented) startup() async

Version: 1.14
-------------
- support resource urls

Version: 1.12
-------------
- no longer allow to enforce custom "namespace"
- no longer call it namespace but uniqueRandomID / scopeName
- expose special objects as the global WL object
- autoremove injected elements after onUnload has ben executed

Version: 1.9
-------------
- automatically remove all entries added by injectElements

Version: 1.8
-------------
- add injectElements

Version: 1.7
-------------
- add injectCSS
- add optional enforced namespace

Version: 1.6
-------------
- added mutation observer to be able to inject into browser elements
- use larger icons as fallback
