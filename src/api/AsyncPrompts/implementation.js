var Services = globalThis.Services ||
  ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

function getThunderbirdVersion() {
  let parts = Services.appinfo.version.split(".");
  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
  };
}

const kOK = 1;
const kCancel = 0;

var top = Services.wm.getMostRecentWindow("mail:3pane").top;

var AsyncPrompts = class extends ExtensionCommon.ExtensionAPI {

  getAPI(context) {
    let self = this;

    return {
      AsyncPrompts: {
        button: null,
        cancelButton: null,

        async asyncAlert(title, text) {

          try {
            self._addStyleSheet();
            // Create the blocking overlay div
            self._createOverlay();
            // Create the prompt div, absolute positioning to not disturb layout
            self._createPrompt(context, title, text);

            // await buttons or timeout
            let bv = await new Promise((resolve, reject) => {
              AsyncPrompts.button.onclick = () => { resolve(kOK); };
              AsyncPrompts.cancelButton.onclick = () => { resolve(kCancel); };

            });

            // Remove all
            self._removeElementsById(["ietng-stylesheet", "ietng-overlay", "ietng-prompt-div"]);
            return bv;
          } catch (ex) {
            self._removeElementsById(["ietng-stylesheet", "ietng-overlay", "ietng-prompt-div"]);
            Services.prompt.alert(top, "Exception", ex);
            return kCancel;
          }
        },
      },
    };
  }

  _addStyleSheet() {
    let head = top.document.head || top.document.getElementsByTagName('head')[0];
    let style = this._addElementChild("link", "ietng-styles", head, [], { rel: "stylesheet", type: "text/css", href: "chrome://mboximport/content/mboximport/mboxmsg.css" });
    head.appendChild(style);
  }

  _createOverlay() {
    // add absolutely positioned overlay div
    var div = top.document.createElement('html:div');
    div.setAttribute("id", "ietng-overlay");
    top.document.body.appendChild(div);
  }

  _createPrompt(context, title, text) {
    // Create absolutely positioned, dragable div
    var div = top.document.createElement('div');
    div.classList.add("ietng-divPrompt");
    div.setAttribute("id", "ietng-prompt-div");
    top.document.body.appendChild(div);

    // build the flex prompt
    let phdr = this._addElementChild("html:div", "ietng-prompt-divheader", div, [], {});
    let mc = this._addElementChild("html:div", "ietng-maindiv", div, [], {});
    let imgdiv = this._addElementChild("html:div", "ietng-imgdiv", mc, [], {});
    let textdiv = this._addElementChild("html:div", "ietng-textdiv", mc, [], {});
    let buttonsDiv = this._addElementChild("html:div", "ietng-buttonsdiv", div, [], {});
    phdr.innerText = title;
    textdiv.innerText = text;

    // Add ok, cancel buttons
    let okButton = top.document.createElement('button');
    okButton.setAttribute("is", "highlightable-button");
    okButton.textContent = "OK";
    AsyncPrompts.button = okButton;
    buttonsDiv.appendChild(okButton);

    let cancelButton = top.document.createElement('button');
    cancelButton.setAttribute("is", "highlightable-button");
    cancelButton.textContent = context.extension.localeData.localizeMessage("cancel.msg");
    AsyncPrompts.cancelButton = cancelButton;
    buttonsDiv.appendChild(cancelButton);

    div.style.top = ((top.outerHeight / 2) - 90) + "px";
    div.style.left = ((top.outerWidth / 2) - 100) + "px";
    this._dragElement(div);
  }

  _addElementChild(tag, id, parent, classList, attributes) {
    var element = top.document.createElement(tag);
    element.setAttribute("id", id);

    for (const [key, value] of Object.entries(attributes)) {
      key.replace("_", "-");
      element.setAttribute(key, value);
    }

    parent.appendChild(element);
    return element;
  }

  _removeElementsById(elementIds) {
    elementIds.forEach(elementId => {
      let element = top.document.getElementById(elementId);
      if (element) {
        element.remove();
      }
    });
  }

  _dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (top.document.getElementById(elmnt.id + "header")) {
      // if present, the header is where you move the DIV from:
      top.document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
      // otherwise, move the DIV from anywhere inside the DIV:
      elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      top.document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      top.document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      // stop moving when mouse button is released:
      top.document.onmouseup = null;
      top.document.onmousemove = null;
    }
  }
};
