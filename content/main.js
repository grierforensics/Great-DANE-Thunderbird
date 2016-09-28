// (C) Copyright 2015 Grier Forensics.  All rights reserved.

(function () {
  const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

  Cu.import("resource://gre/modules/Services.jsm");
  Cu.import("resource:///modules/gloda/mimemsg.js");
  Cu.import("resource://greatdane/greatdane.js");

  var console = Services.console;

  function on_load() {
    let prefs = Services.prefs.getBranch("extensions.greatdane.");

    // Open options for configuring if this is the first time
    if (prefs.getBoolPref("first_run")) {
      let options = window.openDialog("chrome://greatdane/content/options.xul",
        "options", "chrome,centerscreen");
      options.focus();
    } else {
      var newMailListener = {
        msgAdded: function (msgHdr) {
          MsgHdrToMimeMessage(msgHdr, null, function (aMsgHdr, aMimeMsg) {
            if (aMimeMsg.has("content-type")) {
              let contentType = aMimeMsg.getAll("content-type");
              // contentType is an array, but the regex will still match
              // Borrowed from: msgHdrViewOverlay.js (ContentTypeIsSMIME)
              let signed = /application\/(x-)?pkcs7-(mime|signature)/.test(contentType);
              if (signed) {
                GreatDANE.getCerts(msgHdr.author);
              }
            } else {
              console.logStringMessage("Message does not contain 'content-type' header!");
            }
          }, true);
        }
      };
      let notificationService = Cc["@mozilla.org/messenger/msgnotificationservice;1"]
        .getService(Ci.nsIMsgFolderNotificationService);
      notificationService.addListener(newMailListener, notificationService.msgAdded);
    }
  };

  // Once the window has loaded, check if this is the first time running the
  // extension. If so, open the options dialog. Otherwise, add a "new message"
  // listener that checks if the new message is signed (S/MIME), and, if so,
  // retrieves certificates for the sender.
  window.addEventListener('load', on_load, false);
})();
