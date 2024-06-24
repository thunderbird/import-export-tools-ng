var AsyncPrompts = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      AsyncPrompts: {
        button:null,
        async asyncAlert(title) {
          //Services.wm.getMostRecentWindow("mail:3pane").alert("Title " + title + "!");
          let top = Services.wm.getMostRecentWindow("mail:3pane").top;
          
          this._createOverlay();
          this._createPrompt(title);
          await new Promise((resolve, reject) => { 
            this.button.onclick = () => { resolve(); };
          });
          
          //await new Promise(resolve => top.setTimeout(resolve, 6000));
          let promptDiv = top.document.getElementById("ietng-prompt-div");
          promptDiv.remove();
          let overlayDiv = top.document.getElementById("ietng-overlay-div");
          overlayDiv.remove();

        },
        _createOverlay() {
          var css1 = '.ietng-divOverlay { background: rgba(0, 0, 0, 0.35); height: 100%; width:100%; opacity: 0.2; z-index: 1000; position: fixed; top: 0px; left: 0px;}\n';
          var css2 = '.ietng-divPrompt { background: rgb(255, 255, 255); height: 180px; width:220px; z-index: 1010; position: fixed; top: 400px; left: 700px;}\n';

          let top = Services.wm.getMostRecentWindow("mail:3pane").top;

          let head = top.document.head || top.document.getElementsByTagName('head')[0];
          let style = top.document.createElement('style');

          head.appendChild(style);

          style.type = 'text/css';
          if (style.styleSheet) {
            // This is required for IE8 and below.
            style.styleSheet.cssText = css1 + css2;
          } else {
            style.appendChild(top.document.createTextNode(css1 + css2));
          }

          var div = top.document.createElement('html:div');
          div.classList.add("ietng-divOverlay");
          div.setAttribute("id", "ietng-overlay-div");
          top.document.body.appendChild(div);

        },
        _createPrompt(title, text) {
          let top = Services.wm.getMostRecentWindow("mail:3pane").top;
          
          var div = top.document.createElement('html:div');
          div.classList.add("ietng-divPrompt");
          div.setAttribute("id", "ietng-prompt-div");

          let okButton = top.document.createElement('button');
          okButton.setAttribute("is","highlightable-button");
          okButton.setAttribute("label","Ok yeah ");

          okButton.textContent = " OK";
this.button = okButton
          div.appendChild(okButton);
          top.document.body.appendChild(div);
        },
      }
    }
  }
};
