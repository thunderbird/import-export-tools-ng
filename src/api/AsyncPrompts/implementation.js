var AsyncPrompts = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      AsyncPrompts: {
        async asyncAlert(title) {
          Services.wm.getMostRecentWindow("mail:3pane").alert("Title " + title + "!");
        },
      }
    }
  }
};
