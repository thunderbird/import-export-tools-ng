var Services = globalThis.Services ||
  ChromeUtils.import("resource://gre/modules/Services.jsm").Services;

function getThunderbirdVersion() {
  let parts = Services.appinfo.version.split(".");
  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
  };
}

var top = Services.wm.getMostRecentWindow("mail:3pane").top;

var AsyncPrompts = class extends ExtensionCommon.ExtensionAPI {

  getAPI(context) {
  let self = this;

    return {
      AsyncPrompts: {
        button: null,
        async asyncAlert(title) {
          //Services.wm.getMostRecentWindow("mail:3pane").alert("Title " + title + "!");
          //let top = Services.wm.getMostRecentWindow("mail:3pane").top;

          self._createOverlay();
          self._createPrompt(title);
          await new Promise((resolve, reject) => {
            AsyncPrompts.button.onclick = () => { resolve(); };
          });
          console.log("after click ");
          //await new Promise(resolve => top.setTimeout(resolve, 6000));
          let promptDiv = top.document.getElementById("ietng-prompt-div");
          promptDiv.remove();
          let overlayDiv = top.document.getElementById("ietng-overlay-div");
          overlayDiv.remove();
          console.log("after remove  ");

        },
     
      }
    };
    
    
  }

  _createOverlay() {
    var css1 = '.ietng-divOverlay { background: rgba(0, 0, 0, 0.35); height: 100%; width:100%; opacity: 0.2; z-index: 1000; position: fixed; top: 0px; left: 0px;}\n';
    var css2 = '.ietng-divPrompt { background: rgb(255, 255, 255); height: 140px; width:350px; z-index: 1010; position: absolute; display: flex; flex-direction: column;}\n';

    //let top = Services.wm.getMostRecentWindow("mail:3pane").top;

    let head = top.document.head || top.document.getElementsByTagName('head')[0];
    let style = top.document.createElement('style');

    head.appendChild(style);

    style.type = 'text/css';
    if (style.styleSheet) {
      // This is required for IE8 and below.
      style.styleSheet.cssText = css1 + css2;
      console.log("styleSheet   ");

    } else {
      console.log("app   ");

      style.appendChild(top.document.createTextNode(css1 + css2));
    }

    var div = top.document.createElement('html:div');
    div.classList.add("ietng-divOverlay");
    div.setAttribute("id", "ietng-overlay-div");
    top.document.body.appendChild(div);

  }

  _createPrompt(title, text) {
    //let top = Services.wm.getMostRecentWindow("mail:3pane").top;

    var div = top.document.createElement('html:div');
    div.classList.add("ietng-divPrompt");
    div.setAttribute("id", "ietng-prompt-div");
    top.document.body.appendChild(div);

    this._addElementChild("html:div", "ietng-subdiv1", div, [], {style: `width: 100%; height: 25px; background: blue; `});
    let mc = this._addElementChild("html:div", "ietng-maindiv", div, [], {style: `width: 100%; height: 90px;  background: yellow; display: flex; flex-direction: row; `});
    this._addElementChild("html:div", "ietng-textdiv", mc, [], {style: `width: 80px; height: 90px;  background: green; `});
    this._addElementChild("html:div", "ietng-textdiv", mc, [], {style: `width: 80px; height: 90px;  background: red; flex-grow: 1`});

    let okButton = top.document.createElement('button');
    okButton.setAttribute("is", "highlightable-button");
    okButton.setAttribute("label", "Ok yeah ");

    okButton.textContent = " OK";
    AsyncPrompts.button = okButton;
    div.appendChild(okButton);
    div.style.top = ((top.outerHeight / 2) - 90) + "px";
    div.style.left = ((top.outerWidth / 2) - 100) + "px";
  }

  _addElementChild(tag, id, parent, classList, attributes) {
    var element = top.document.createElement(tag);
    element.setAttribute("id", id);

    for (const [key, value] of Object.entries(attributes)) {
      console.log(`${key}: ${value}`);
      element.setAttribute(key, value);
    }

    parent.appendChild(element);
    console.log(element)
    console.log(element.style)
    console.log(parent.outerHtml)


    return element;
  }

};
