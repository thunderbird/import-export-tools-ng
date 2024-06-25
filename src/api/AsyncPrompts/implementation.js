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
        cancelButton: null,

        async asyncAlert(title, text) {
          //Services.wm.getMostRecentWindow("mail:3pane").alert("Title " + title + "!");
          //let top = Services.wm.getMostRecentWindow("mail:3pane").top;

          self._createOverlay();

          self._createPrompt(title, text);
          let bv = await new Promise((resolve, reject) => {
            AsyncPrompts.button.onclick = () => { resolve(1); };
            AsyncPrompts.cancelButton.onclick = () => { resolve(0); };
            
          });
          console.log("after click ", bv);
          //await new Promise(resolve => top.setTimeout(resolve, 6000));
          let promptDiv = top.document.getElementById("ietng-prompt-div");
          promptDiv.remove();
          let overlayDiv = top.document.getElementById("ietng-overlay-div");
          overlayDiv.remove();
          console.log("after remove  ");
          return bv;
        },

      }
    };


  }

  _createOverlay() {
    var css1 = '.ietng-divOverlay { background: rgba(0, 0, 0, 0.35); height: 100%; width:100%; opacity: 0.2; z-index: 1000; position: fixed; top: 0px; left: 0px;}\n';
    var css2 = '.ietng-divPrompt {  background: #e0e0e0; height: 160px; width:360px; z-index: 1010; position: absolute; display: flex; flex-direction: column; box-shadow: 0.6px 0.6px 0.6px; border-top: 0.4px solid black; border-left: 0.4px solid black;}\n';

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
    //var attIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADFUlEQVR4nO2aTagOURjHH+KGuMXCZ0m3aycLKcqGEsICG2VhYXG7xYIsRSzIRjZ0EYnkY+EjG4qV8rWyQG5ZKPmIheQj3x/Pv5k3c+d9zpw5M2dm3nM9v/p33/vOOU/Pf94z55x5ZogURVEURVEURVEUpZPoYi1irWf1sdax5rNGNplUHcxlnWd9YP0R9JY1wJrZVIJVMYZ1jPWLZONpfWXtZI1oIlnfTGHdo3zG07pM0ckLlsmsh1TMfEuna8/aE/jlH1O2uR+sd6zflnabas69NDbz91krKFoNwHjWBtZTQ/sXrLH1pV8Om/mTrNGGvt2sW4Z+QYwCm/njZF/rMW+8F/peqiZlf/gw3+Kg0P+N53y94tM8WCvEwB7CdOk0im/zYJkhVreflP3hYh67ukOs5TnibhFiffaZuA9czQ/E3z8j+1C+K8R74Df9criaP5I6viQjdp8h5l7fJoqCZaqMeajfEBuT33ehPSbAOf6tuIOd220qZx7aKMQ2mYfOVOKmANLk5Goe+/6eVNws869Y06sy5MojkpM8QfnMQxdSMbPMf2EtrMyNIxNJTvIs5Tf/hDUpEdNmPs+SWSmY7WfEn3tJTnRBfNxmfpA1LRE7CPMY8kvj/00j4CJFw/SU4XiQ5jFMW9f7tsT3pjkgSxj2SfNrqMPNj2LdoH9JXU8cy1oFhoV5sIOGJoZNSG98DPuAOzSMzWPoS8WIq4k22AlmbYYgnKSpiT5BmAdbSU7yHA2t0eNmZjO1V3wxR+Ay6Uq0DcY8uEntSaIgOS6jD1aHnvhvmqDMA2n47y4YKzjzKDtLya4qECs482ACyQm7Jtvxm5wsPlF70tsd+gdtHkgPMTHT5ylqBm8e7CLZwB5LP7zgELx5MIv1jWQjh6l9qcPEiZP209AnKPMtULo27fAwR1xjHWVdoejJrqltkOYBVoMid31J4Q2P1XUn7pPZrNdUzPxHCvSXT4NCJJ7ju5h/zprXRLJVgZsePKh4SfZffT914LM7X6BIspi1j6IaPQomqO4eYK2kgN7eUBRFURRF+S/4CwPqfEibwrHFAAAAAElFTkSuQmCC"
    //let imgt = this._addElementChild("html:img", "ietng-img", div, [], {src: `${attIcon}`, height: "40px", width: "40px", all: "unset"});
    //let imgt = this._addElementChild("html:img", "ietng-img", div, [], {src: ``, height: "40px", width: "40px"});
    //imgt.classList.add("message-attachment-icon")
    //imgt.style.display = "inline-block"
    //imgt.style.zIndex = "1060"

    //return

    let phdr = this._addElementChild("html:div", "ietng-prompt-divheader", div, [], { style: `width: calc(100% - 6px); height: 26.5px; background: var(--color-blue-40); padding-top: 4px; padding-left: 6px; font-size: 12.8px; cursor: "move"` });
    let mc = this._addElementChild("html:div", "ietng-maindiv", div, [], { style: `width: 100%; height: 90px; overfow: hidden; background: #202020; display: flex; flex-direction: row; ` });
    let imgdiv = this._addElementChild("html:div", "ietng-imgdiv", mc, [], { style: `width: 80px; height: 90px;  z-index: 1040; background: #f0f0f0; align-items: center;` });
    let textdiv = this._addElementChild("html:div", "ietng-textdiv", mc, [], { style: `width: 80px; height: 90px;  background: #e0e0e0; flex-grow: 1; align-items: center; font-size: 12.5px; padding-top: 25px; padding-left: 10px;` });
    let buttonsDiv = this._addElementChild("html:div", "ietng-buttonsdiv", div, [], { style: `height: 40px; padding: 4px; margin-left: auto; background: #e0e0e0; ` });
    phdr.innerText = title;
    textdiv.innerText = text;
    var attIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAADFUlEQVR4nO2aTagOURjHH+KGuMXCZ0m3aycLKcqGEsICG2VhYXG7xYIsRSzIRjZ0EYnkY+EjG4qV8rWyQG5ZKPmIheQj3x/Pv5k3c+d9zpw5M2dm3nM9v/p33/vOOU/Pf94z55x5ZogURVEURVEURVEUpZPoYi1irWf1sdax5rNGNplUHcxlnWd9YP0R9JY1wJrZVIJVMYZ1jPWLZONpfWXtZI1oIlnfTGHdo3zG07pM0ckLlsmsh1TMfEuna8/aE/jlH1O2uR+sd6zflnabas69NDbz91krKFoNwHjWBtZTQ/sXrLH1pV8Om/mTrNGGvt2sW4Z+QYwCm/njZF/rMW+8F/peqiZlf/gw3+Kg0P+N53y94tM8WCvEwB7CdOk0im/zYJkhVreflP3hYh67ukOs5TnibhFiffaZuA9czQ/E3z8j+1C+K8R74Df9criaP5I6viQjdp8h5l7fJoqCZaqMeajfEBuT33ehPSbAOf6tuIOd220qZx7aKMQ2mYfOVOKmANLk5Goe+/6eVNws869Y06sy5MojkpM8QfnMQxdSMbPMf2EtrMyNIxNJTvIs5Tf/hDUpEdNmPs+SWSmY7WfEn3tJTnRBfNxmfpA1LRE7CPMY8kvj/00j4CJFw/SU4XiQ5jFMW9f7tsT3pjkgSxj2SfNrqMPNj2LdoH9JXU8cy1oFhoV5sIOGJoZNSG98DPuAOzSMzWPoS8WIq4k22AlmbYYgnKSpiT5BmAdbSU7yHA2t0eNmZjO1V3wxR+Ay6Uq0DcY8uEntSaIgOS6jD1aHnvhvmqDMA2n47y4YKzjzKDtLya4qECs482ACyQm7Jtvxm5wsPlF70tsd+gdtHkgPMTHT5ylqBm8e7CLZwB5LP7zgELx5MIv1jWQjh6l9qcPEiZP209AnKPMtULo27fAwR1xjHWVdoejJrqltkOYBVoMid31J4Q2P1XUn7pPZrNdUzPxHCvSXT4NCJJ7ju5h/zprXRLJVgZsePKh4SfZffT914LM7X6BIspi1j6IaPQomqO4eYK2kgN7eUBRFURRF+S/4CwPqfEibwrHFAAAAAElFTkSuQmCC"
    let img = this._addElementChild("html:img", "ietng-img", imgdiv, [], {src: `${attIcon}`, height: "40px", width: "40px"});
    img.style.height = "40px";
    img.style.width = "40px";

    let okButton = top.document.createElement('button');
    okButton.setAttribute("is", "highlightable-button");
    okButton.textContent = " OK";
    AsyncPrompts.button = okButton;
    buttonsDiv.appendChild(okButton);

    let cancelButton = top.document.createElement('button');
    cancelButton.setAttribute("is", "highlightable-button");
    cancelButton.textContent = " Cancel";
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
      console.log(`${key}: ${value}`);
      key.replace("_", "-");
      element.setAttribute(key, value);
    }

    parent.appendChild(element);
    console.log(element)
    console.log(element.style)
    console.log(parent.outerHtml)


    return element;
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
