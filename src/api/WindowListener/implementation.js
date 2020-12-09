/*
 * This file is provided by the addon-developer-support repository at
 * https://github.com/thundernest/addon-developer-support
 *
 * Version: 1.28
 * - do not crash on missing icon
 *
 * Version: 1.27
 * - add openOptionsDialog()
 *
 * Version: 1.26
 * - pass WL object to legacy preference window
 *
 * Version: 1.25
 * - adding waitForMasterPassword
 *
 * Version: 1.24
 * - automatically localize i18n locale strings in injectElements()
 *
 * Version: 1.22
 * - to reduce confusions, only check built-in URLs as add-on URLs cannot
 *   be resolved if a temp installed add-on has bin zipped
 *
 * Version: 1.21
 * - print debug messages only if add-ons are installed temporarily from
 *   the add-on debug page
 * - add checks to registered windows and scripts, if they actually exists
 *
 * Version: 1.20
 * - fix long delay before customize window opens
 * - fix non working removal of palette items
 *
 * Version: 1.19
 * - add support for ToolbarPalette
 *
 * Version: 1.18
 * - execute shutdown script also during global app shutdown (fixed)
 *
 * Version: 1.17
 * - execute shutdown script also during global app shutdown
 *
 * Version: 1.16
 * - support for persist
 *
 * Version: 1.15
 * - make (undocumented) startup() async
 *
 * Version: 1.14
 * - support resource urls
 *
 * Version: 1.12
 * - no longer allow to enforce custom "namespace"
 * - no longer call it namespace but uniqueRandomID / scopeName
 * - expose special objects as the global WL object
 * - autoremove injected elements after onUnload has ben executed
 *
 * Version: 1.9
 * - automatically remove all entries added by injectElements
 *
 * Version: 1.8
 * - add injectElements
 *
 * Version: 1.7
 * - add injectCSS
 * - add optional enforced namespace
 *
 * Version: 1.6
 * - added mutation observer to be able to inject into browser elements
 * - use larger icons as fallback
 *
 * Author: John Bieling (john@thunderbird.net)
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */


// Import some things we need.
var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { ExtensionSupport } = ChromeUtils.import("resource:///modules/ExtensionSupport.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

var WindowListener = class extends ExtensionCommon.ExtensionAPI {
  log(msg) {
    if (this.debug) console.log("WindowListener API: " + msg);
  }

  error(msg) {
    if (this.debug) console.error("WindowListener API: " + msg);
  }
  
  // async sleep function using Promise
  async sleep(delay) {
    let timer =  Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
    return new Promise(function(resolve, reject) {
      let event = {
        notify: function(timer) {
          resolve();
        }
      }
      timer.initWithCallback(event, delay, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    });
  }
          
  getAPI(context) {
    // track if this is the background/main context
    this.isBackgroundContext = (context.viewType == "background");

    this.uniqueRandomID = "AddOnNS" + context.extension.instanceId;
    this.menu_addonsManager_id ="addonsManager";
    this.menu_addonsManager_prefs_id = "addonsManager_prefs_revived";
    this.menu_addonPrefs_id = "addonPrefs_revived";

    this.registeredWindows = {};
    this.pathToStartupScript = null;
    this.pathToShutdownScript = null;
    this.pathToOptionsPage = null;
    this.chromeHandle = null;
    this.chromeData = null;
    this.resourceData = null;    
    this.openWindows = [];
    this.debug = context.extension.addonData.temporarilyInstalled;
    
    const aomStartup = Cc["@mozilla.org/addons/addon-manager-startup;1"].getService(Ci.amIAddonManagerStartup);
    const resProto = Cc["@mozilla.org/network/protocol;1?name=resource"].getService(Ci.nsISubstitutingProtocolHandler);

    let self = this;

    return {
      WindowListener: {

        async waitForMasterPassword() {
          // Wait until master password has been entered (if needed)
          while (!Services.logins.isLoggedIn) {
            self.log("Waiting for master password.");
            await self.sleep(1000);
          }          
          self.log("Master password has been entered.");
        },

        aDocumentExistsAt(uriString) {
          self.log("Checking if document at <" + uriString + "> used in registration actually exists.");
          try {
            let uriObject = Services.io.newURI(uriString);
            let content = Cu.readUTF8URI(uriObject);
          } catch (e) {
            Components.utils.reportError(e); 
            return false;
          }
          return true;
        },

        registerOptionsPage(optionsUrl) {
          self.pathToOptionsPage = optionsUrl.startsWith("chrome://")
            ? optionsUrl
            : context.extension.rootURI.resolve(optionsUrl);
        },

        registerDefaultPrefs(defaultUrl) {
          let url = context.extension.rootURI.resolve(defaultUrl);

          let prefsObj = {};
          prefsObj.Services = ChromeUtils.import("resource://gre/modules/Services.jsm").Services;
          prefsObj.pref = function(aName, aDefault) {
            let defaults = Services.prefs.getDefaultBranch("");
            switch (typeof aDefault) {
              case "string":
                  return defaults.setCharPref(aName, aDefault);

              case "number":
                  return defaults.setIntPref(aName, aDefault);

              case "boolean":
                  return defaults.setBoolPref(aName, aDefault);

              default:
                throw new Error("Preference <" + aName + "> has an unsupported type <" + typeof aDefault + ">. Allowed are string, number and boolean.");
            }
          }
          Services.scriptloader.loadSubScript(url, prefsObj, "UTF-8");
        },

        registerChromeUrl(data) {
          if (!self.isBackgroundContext)
            throw new Error("The WindowListener API may only be called from the background page.");

          let chromeData = [];
          let resourceData = [];
          for (let entry of data) {
            if (entry[0] == "resource") resourceData.push(entry);
            else chromeData.push(entry)
          }

          if (chromeData.length > 0) {
            const manifestURI = Services.io.newURI(
              "manifest.json",
              null,
              context.extension.rootURI
            );
            self.chromeHandle = aomStartup.registerChrome(manifestURI, chromeData);
          }

          for (let res of resourceData) {
            // [ "resource", "shortname" , "path" ]
            let uri = Services.io.newURI(
              res[2],
              null,
              context.extension.rootURI
            );
            resProto.setSubstitutionWithFlags(
              res[1],
              uri,
              resProto.ALLOW_CONTENT_ACCESS
            );
          }

          self.chromeData = chromeData;
          self.resourceData = resourceData;
        },

        registerWindow(windowHref, jsFile) {
          if (!self.isBackgroundContext)
            throw new Error("The WindowListener API may only be called from the background page.");

          if (self.debug && !this.aDocumentExistsAt(windowHref)) {
            self.error("Attempt to register an injector script for non-existent window: " + windowHref);
            return;
          }

          if (!self.registeredWindows.hasOwnProperty(windowHref)) {
            // path to JS file can either be chrome:// URL or a relative URL
            let path = jsFile.startsWith("chrome://")
              ? jsFile
              : context.extension.rootURI.resolve(jsFile)

            self.registeredWindows[windowHref] = path;
          } else {
            self.error("Window <" +windowHref + "> has already been registered");
          }
        },

        registerStartupScript(aPath) {
          if (!self.isBackgroundContext)
            throw new Error("The WindowListener API may only be called from the background page.");

          self.pathToStartupScript = aPath.startsWith("chrome://")
            ? aPath
            : context.extension.rootURI.resolve(aPath);
        },

        registerShutdownScript(aPath) {
          if (!self.isBackgroundContext)
            throw new Error("The WindowListener API may only be called from the background page.");

          self.pathToShutdownScript = aPath.startsWith("chrome://")
            ? aPath
            : context.extension.rootURI.resolve(aPath);
        },

        openOptionsDialog(windowId) {
          let window = context.extension.windowManager.get(windowId, context).window
          window.openDialog(self.pathToOptionsPage, "AddonOptions");
        },

        async startListening() {
          if (!self.isBackgroundContext)
            throw new Error("The WindowListener API may only be called from the background page.");

          // load the registered startup script, if one has been registered
          // (mail3:pane may not have been fully loaded yet)
          if (self.pathToStartupScript) {
            let startupJS = {};
            startupJS.WL = {}
            startupJS.WL.extension = self.extension;
            startupJS.WL.messenger = Array.from(self.extension.views).find(
              view => view.viewType === "background").xulBrowser.contentWindow
              .wrappedJSObject.browser;
            try {
              if (self.pathToStartupScript) {
                Services.scriptloader.loadSubScript(self.pathToStartupScript, startupJS, "UTF-8");
                // delay startup until startup has been finished
                self.log("Waiting for async startup() in <" + self.pathToStartupScript + "> to finish.");
                if (startupJS.startup) {
                  await startupJS.startup();
                  self.log("startup() in <" + self.pathToStartupScript + "> finished");
                } else {
                  self.log("No startup() in <" + self.pathToStartupScript + "> found.");
                }
              }
            } catch (e) {
              Components.utils.reportError(e)
            }
          }
                  
          let urls = Object.keys(self.registeredWindows);
          if (urls.length > 0) {
            // Before registering the window listener, check which windows are already open
            self.openWindows = [];
            for (let window of Services.wm.getEnumerator(null)) {
              self.openWindows.push(window);
            }

            // Register window listener for all pre-registered windows
            ExtensionSupport.registerWindowListener("injectListener_" + self.uniqueRandomID, {
              // React on all windows and manually reduce to the registered
              // windows, so we can do special actions when the main
              // messenger window is opened.
              //chromeURLs: Object.keys(self.registeredWindows),
              async onLoadWindow(window) {
                // Create add-on scope
                window[self.uniqueRandomID] = {};

                // Special action #1: If this is the main messenger window
                if (window.location.href == "chrome://messenger/content/messenger.xul" ||
                  window.location.href == "chrome://messenger/content/messenger.xhtml") {

                  if (self.pathToOptionsPage) {
                    try {
                      // add the add-on options menu if needed
	   
					  const versionChecker = Services.vc;
                      const currentVersion = Services.appinfo.platformVersion;

                      // cleidigh - TB78 needs options menu, need to substitute for
                      // 68 until we figure out how to tweak the dynamic submenu
                      // otherwise we get two entries

                      var optionsLabel = "";
                      if (versionChecker.compare(currentVersion, "78") >= 0) {
                        optionsLabel = "&addonPrefs.label;";
                      } else {
                        optionsLabel = "&labelmenuMItools; &options;";
                      }
                      // add the add-on options menu if needed
                      if (!window.document.getElementById(self.menu_addonsManager_prefs_id)) {

                        let addonprefs = window.MozXULElement.parseXULToFragment(`
                          <menu id="${self.menu_addonsManager_prefs_id}" label="${optionsLabel}">
                            <menupopup id="${self.menu_addonPrefs_id}">
                            </menupopup>
                          </menu>
                        `, ["chrome://messenger/locale/messenger.dtd",
                          "chrome://mboximport/locale/mboximport.dtd", "chrome://messenger/locale/baseMenuOverlay.dtd"]);

		
		
					//   if (!window.document.getElementById(self.menu_addonsManager_prefs_id)) {
                    //     let addonprefs = window.MozXULElement.parseXULToFragment(`
                    //       <menu id="${self.menu_addonsManager_prefs_id}" label="&addonPrefs.label;">
                    //         <menupopup id="${self.menu_addonPrefs_id}">
                    //         </menupopup>
                    //       </menu>
                    //     `, ["chrome://messenger/locale/messenger.dtd"]);

                      let element_addonsManager = window.document.getElementById(self.menu_addonsManager_id);
                      element_addonsManager.parentNode.insertBefore(addonprefs, element_addonsManager.nextSibling);
                      }

                      // add the options entry
                      let element_addonPrefs = window.document.getElementById(self.menu_addonPrefs_id);
                      let id = self.menu_addonPrefs_id + "_" + self.uniqueRandomID;

                      // Get the best size of the icon (16px or bigger)
                      let iconSizes = self.extension.manifest.icons 
                        ? Object.keys(self.extension.manifest.icons)
                        : [];
                      iconSizes.sort((a,b)=>a-b);
                      let bestSize = iconSizes.filter(e => parseInt(e) >= 16).shift();
                      let icon = bestSize ? self.extension.manifest.icons[bestSize] : "";

                      let name = self.extension.manifest.name;
                      let entry = icon
                        ? window.MozXULElement.parseXULToFragment(
                            `<menuitem class="menuitem-iconic" id="${id}" image="${icon}" label="${name}" />`)
                        :  window.MozXULElement.parseXULToFragment(
                            `<menuitem id="${id}" label="${name}" />`);
                      
                      element_addonPrefs.appendChild(entry);
                      let WL = {}
                      WL.extension = self.extension;
                      WL.messenger = Array.from(self.extension.views).find(
                        view => view.viewType === "background").xulBrowser.contentWindow
                        .wrappedJSObject.browser;
                      window.document.getElementById(id).addEventListener("command", function() {window.openDialog(self.pathToOptionsPage, "AddonOptions", null, WL)});
                    } catch (e) {
                      Components.utils.reportError(e)
                    }
                  }
                }

                // Special action #2: If this page contains browser elements
                let browserElements = window.document.getElementsByTagName("browser");
                if (browserElements.length > 0) {
                  //register a MutationObserver
                  window[self.uniqueRandomID]._mObserver = new window.MutationObserver(function(mutations) {
                      mutations.forEach(async function(mutation) {
                          if (mutation.attributeName == "src" && self.registeredWindows.hasOwnProperty(mutation.target.getAttribute("src"))) {
                            // When the MutationObserver callsback, the window is still showing "about:black" and it is going
                            // to unload and then load the new page. Any eventListener attached to the window will be removed
                            // so we cannot listen for the load event. We have to poll manually to learn when loading has finished.
                            // On my system it takes 70ms.
                            let loaded = false;
                            for (let i=0; i < 100 && !loaded; i++) {
                              await self.sleep(100);
                              let targetWindow = mutation.target.contentWindow.wrappedJSObject;
                              if (targetWindow && targetWindow.location.href == mutation.target.getAttribute("src") && targetWindow.document.readyState == "complete") {
                                loaded = true;
                                break;
                              }
                            }
                            if (loaded) {
                              let targetWindow = mutation.target.contentWindow.wrappedJSObject;
                              // Create add-on scope
                              targetWindow[self.uniqueRandomID] = {};
                              // Inject with isAddonActivation = false
                              self._loadIntoWindow(targetWindow, false);
                            }
                          }
                      });
                  });

                  for (let element of browserElements) {
                      if (self.registeredWindows.hasOwnProperty(element.getAttribute("src"))) {
                        let targetWindow = element.contentWindow.wrappedJSObject;
                        // Create add-on scope
                        targetWindow[self.uniqueRandomID] = {};
                        // Inject with isAddonActivation = true
                        self._loadIntoWindow(targetWindow, true);
                      } else {
                        // Window/Browser is not yet fully loaded, postpone injection via MutationObserver
                        window[self.uniqueRandomID]._mObserver.observe(element, { attributes: true, childList: false, characterData: false });
                      }
                  }
                }

                // Load JS into window
                self._loadIntoWindow(window, self.openWindows.includes(window));
              },

              onUnloadWindow(window) {
                // Remove JS from window, window is being closed, addon is not shut down
                self._unloadFromWindow(window, false);
              }
            });
          } else {
            self.error("Failed to start listening, no windows registered");
          }
        },

      }
    };
  }

  _loadIntoWindow(window, isAddonActivation) {
      if (window.hasOwnProperty(this.uniqueRandomID) && this.registeredWindows.hasOwnProperty(window.location.href)) {
        try {
          let uniqueRandomID = this.uniqueRandomID;
          let extension = this.extension;
          
          // Add reference to window to add-on scope
          window[this.uniqueRandomID].window = window;
          window[this.uniqueRandomID].document = window.document;

          // Keep track of toolbarpalettes we are injecting into
          window[this.uniqueRandomID]._toolbarpalettes = {};
          
          //Create WLDATA object
          window[this.uniqueRandomID].WL = {};
          window[this.uniqueRandomID].WL.scopeName = this.uniqueRandomID;

          // Add helper function to inject CSS to WLDATA object
          window[this.uniqueRandomID].WL.injectCSS = function (cssFile) {
            let element;
            let v = parseInt(Services.appinfo.version.split(".").shift());
            
            // using createElementNS in TB78 delays the insert process and hides any security violation errors
            if (v > 68) {
              element = window.document.createElement("link");
            } else {
              let ns = window.document.documentElement.lookupNamespaceURI("html");
              element = window.document.createElementNS(ns, "link");
            }
            
            element.setAttribute("wlapi_autoinjected", uniqueRandomID);
            element.setAttribute("rel", "stylesheet");
            element.setAttribute("href", cssFile);
            return window.document.documentElement.appendChild(element);
          }

          // Add helper function to inject XUL to WLDATA object
          window[this.uniqueRandomID].WL.injectElements = function (xulString, dtdFiles = [], debug = false) {
            let toolbarsToResolve = [];

            function checkElements(stringOfIDs) {
              let arrayOfIDs = stringOfIDs.split(",").map(e => e.trim());
              for (let id of arrayOfIDs) {
                let element = window.document.getElementById(id);
                if (element) {
                  return element;
                }
              }
              return null;
            }

            function localize(entity) {
              let msg = entity.slice("__MSG_".length,-2);
              return extension.localeData.localizeMessage(msg)
            }

            function injectChildren(elements, container) {
              if (debug) console.log(elements);

              for (let i = 0; i < elements.length; i++) {
                // take care of persists
                const uri = window.document.documentURI;
                for (const persistentNode of elements[i].querySelectorAll("[persist]")) {
                  for (const persistentAttribute of persistentNode.getAttribute("persist").trim().split(" ")) {
                    if (Services.xulStore.hasValue(uri, persistentNode.id, persistentAttribute)) {
                      persistentNode.setAttribute(
                        persistentAttribute,
                        Services.xulStore.getValue(uri, persistentNode.id, persistentAttribute)
                      );
                    }
                  }
                }
                
                if (elements[i].hasAttribute("insertafter") && checkElements(elements[i].getAttribute("insertafter"))) {
                  let insertAfterElement = checkElements(elements[i].getAttribute("insertafter"));

                  if (debug) console.log(elements[i].tagName + "#" + elements[i].id + ": insertafter " + insertAfterElement.id);
                  if (debug && elements[i].id && window.document.getElementById(elements[i].id)) {
                    console.error("The id <" + elements[i].id + "> of the injected element already exists in the document!");
                  }
                  elements[i].setAttribute("wlapi_autoinjected", uniqueRandomID);
                  insertAfterElement.parentNode.insertBefore(elements[i], insertAfterElement.nextSibling);

                } else if (elements[i].hasAttribute("insertbefore") && checkElements(elements[i].getAttribute("insertbefore"))) {
                  let insertBeforeElement = checkElements(elements[i].getAttribute("insertbefore"));

                  if (debug) console.log(elements[i].tagName + "#" + elements[i].id + ": insertbefore " + insertBeforeElement.id);
                  if (debug && elements[i].id && window.document.getElementById(elements[i].id)) {
                    console.error("The id <" + elements[i].id + "> of the injected element already exists in the document!");
                  }
                  elements[i].setAttribute("wlapi_autoinjected", uniqueRandomID);
                  insertBeforeElement.parentNode.insertBefore(elements[i], insertBeforeElement);

                } else if (elements[i].id && window.document.getElementById(elements[i].id)) {
                  // existing container match, dive into recursivly
                  if (debug) console.log(elements[i].tagName + "#" + elements[i].id + " is an existing container, injecting into " + elements[i].id);
                  injectChildren(Array.from(elements[i].children), window.document.getElementById(elements[i].id));

                } else if (elements[i].localName === "toolbarpalette") {
                  // These vanish from the document but still exist via the palette property
                  if (debug) console.log(elements[i].id + " is a toolbarpalette");
                  let boxes = [...window.document.getElementsByTagName("toolbox")];
                  let box = boxes.find(box => box.palette && box.palette.id === elements[i].id);
                  let palette = box ? box.palette : null;
            
                  if (!palette) {
                    if (debug) console.log(`The palette for ${elements[i].id} could not be found, deferring to later`);
                    continue;
                  }
            
                  if (debug) console.log(`The toolbox for ${elements[i].id} is ${box.id}`);
            
                  toolbarsToResolve.push(...box.querySelectorAll("toolbar"));
                  toolbarsToResolve.push(...window.document.querySelectorAll(`toolbar[toolboxid="${box.id}"]`));
                  for (let child of elements[i].children) {
                    child.setAttribute("wlapi_autoinjected", uniqueRandomID);
                  }
                  window[uniqueRandomID]._toolbarpalettes[palette.id] = palette;
                  injectChildren(Array.from(elements[i].children), palette);
                } else {
                  // append element to the current container
                  if (debug) console.log(elements[i].tagName + "#" + elements[i].id + ": append to " + container.id);
                  elements[i].setAttribute("wlapi_autoinjected", uniqueRandomID);
                  container.appendChild(elements[i]);
                }
              }
            }

            if (debug) console.log ("Injecting into root document:");
            let localicedXulString = xulString.replace(/__MSG_(.*?)__/g, localize);
            injectChildren(Array.from(window.MozXULElement.parseXULToFragment(localicedXulString, dtdFiles).children), window.document.documentElement);

            for (let bar of toolbarsToResolve) {
              let currentset = Services.xulStore.getValue(
                window.location,
                bar.id,
                "currentset"
              );
              if (currentset) {
                bar.currentSet = currentset;
              } else if (bar.getAttribute("defaultset")) {
                bar.currentSet = bar.getAttribute("defaultset");
              }
            }
          }

          // Add extension object to WLDATA object
          window[this.uniqueRandomID].WL.extension = this.extension;
          // Add messenger object to WLDATA object
          window[this.uniqueRandomID].WL.messenger = Array.from(this.extension.views).find(
            view => view.viewType === "background").xulBrowser.contentWindow
            .wrappedJSObject.browser;
          // Load script into add-on scope
          Services.scriptloader.loadSubScript(this.registeredWindows[window.location.href], window[this.uniqueRandomID], "UTF-8");
          window[this.uniqueRandomID].onLoad(isAddonActivation);
        } catch (e) {
          Components.utils.reportError(e)
        }
      }
  }

  _unloadFromWindow(window, isAddonDeactivation) {
    // unload any contained browser elements
      if (window.hasOwnProperty(this.uniqueRandomID) && window[this.uniqueRandomID].hasOwnProperty("_mObserver")) {
        window[this.uniqueRandomID]._mObserver.disconnect();
        let browserElements = window.document.getElementsByTagName("browser");
        for (let element of browserElements) {
          this._unloadFromWindow(element.contentWindow.wrappedJSObject, isAddonDeactivation);
        }
      }

      if (window.hasOwnProperty(this.uniqueRandomID) && this.registeredWindows.hasOwnProperty(window.location.href)) {
        //  Remove this window from the list of open windows
        this.openWindows = this.openWindows.filter(e => (e != window));

        if (window[this.uniqueRandomID].onUnload) {
          try {
            // Call onUnload()
            window[this.uniqueRandomID].onUnload(isAddonDeactivation);
          } catch (e) {
            Components.utils.reportError(e)
          }
        }

        // Remove all auto injected objects
        let elements = Array.from(window.document.querySelectorAll('[wlapi_autoinjected="' + this.uniqueRandomID + '"]'));
        for (let element of elements) {
          element.remove();
        }
        
        // Remove all autoinjected toolbarpalette items
        for (const palette of Object.values(window[this.uniqueRandomID]._toolbarpalettes)) {
          let elements = Array.from(palette.querySelectorAll('[wlapi_autoinjected="' + this.uniqueRandomID + '"]'));
          for (let element of elements) {
            element.remove();
          }
        }
        
      }

      // Remove add-on scope, if it exists
      if (window.hasOwnProperty(this.uniqueRandomID)) {
        delete window[this.uniqueRandomID];
      }
  }

  onShutdown(isAppShutdown) {
    // Unload from all still open windows
    let urls = Object.keys(this.registeredWindows);
    if (urls.length > 0) {
      for (let window of Services.wm.getEnumerator(null)) {

        //remove our entry in the add-on options menu
        if (
          this.pathToOptionsPage &&
          (window.location.href == "chrome://messenger/content/messenger.xul" ||
          window.location.href == "chrome://messenger/content/messenger.xhtml")) {
          let id = this.menu_addonPrefs_id + "_" + this.uniqueRandomID;
          window.document.getElementById(id).remove();

          //do we have to remove the entire add-on options menu?
          let element_addonPrefs = window.document.getElementById(this.menu_addonPrefs_id);
          if (element_addonPrefs.children.length == 0) {
            window.document.getElementById(this.menu_addonsManager_prefs_id).remove();
          }
        }

        // if it is app shutdown, it is not just an add-on deactivation
        this._unloadFromWindow(window, !isAppShutdown);
      }
      // Stop listening for new windows.
      ExtensionSupport.unregisterWindowListener("injectListener_" + this.uniqueRandomID);
    }

    // Load registered shutdown script
    let shutdownJS = {};
    shutdownJS.extension = this.extension;
    try {
      if (this.pathToShutdownScript) Services.scriptloader.loadSubScript(this.pathToShutdownScript, shutdownJS, "UTF-8");
    } catch (e) {
      Components.utils.reportError(e)
    }

    // Extract all registered chrome content urls
    let chromeUrls = [];
    if (this.chromeData) {
        for (let chromeEntry of this.chromeData) {
        if (chromeEntry[0].toLowerCase().trim() == "content") {
          chromeUrls.push("chrome://" + chromeEntry[1] + "/");
        }
      }
    }

    // Unload JSMs of this add-on
    const rootURI = this.extension.rootURI.spec;
    for (let module of Cu.loadedModules) {
      if (module.startsWith(rootURI) || (module.startsWith("chrome://") && chromeUrls.find(s => module.startsWith(s)))) {
        this.log("Unloading: " + module);
        Cu.unload(module);
      }
    }

    // Flush all caches
    Services.obs.notifyObservers(null, "startupcache-invalidate");
    this.registeredWindows = {};

    if (this.resourceData) {
      const resProto = Cc["@mozilla.org/network/protocol;1?name=resource"].getService(Ci.nsISubstitutingProtocolHandler);
      for (let res of this.resourceData) {
        // [ "resource", "shortname" , "path" ]
        resProto.setSubstitution(
          res[1],
          null,
        );
      }
    }

    if (this.chromeHandle) {
      this.chromeHandle.destruct();
      this.chromeHandle = null;
    }
  }
};