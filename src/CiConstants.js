// Ci constants from core we need for various api calls

export const Ci = {
  nsIFilePicker: {
    modeOpen:         0,
    modeSave:         1,
    modeGetFolder:    2,
    modeOpenMultiple: 3,
    returnOK:         0,
    returnCancel:     1,
    returnReplace:    2,

    filterAll:        0x001,
    filterHTML:       0x002,
    filterText:       0x004,
    filterImages:     0x008,
    filterXML:        0x010,
    filterXUL:        0x020,
    filterApps:       0x040,
    filterAllowURLs:  0x080,
    filterAudio:      0x100,
    filterVideo:      0x200,
    filterPDF:        0x400,

  },

};
