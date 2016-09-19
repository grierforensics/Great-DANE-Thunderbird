// (C) Copyright 2015 Grier Forensics.  All rights reserved.

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import("resource:///modules/gloda/index_msg.js");
Cu.import("resource:///modules/gloda/mimemsg.js");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://greatdane/greatdane.js");

var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);


var GreatdaneOverlay = {

  click: function () {
    console.logStringMessage("GreatDANE button clicked!");
    if (document.readyState === "complete") {

      let dialog = window.openDialog("chrome://greatdane/content/email.xul", "email", "chrome,centerscreen");
      dialog.focus();
    }
  },

  getEmailsForCurrentMessage: function () {
    // First we get msgHdr, a nsIMsgDbHdr
    let mainWindow = this.getMail3Pane();
    let tabmail = mainWindow.document.getElementById("tabmail");
    // We might not always have a selected message, so check first
    let msgHdr = mainWindow.gFolderDisplay.selectedMessage;

    return [msgHdr.author]; //todo: return other fields
  },

  getMail3Pane: function () {
    return Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow("mail:3pane");
  },

  openTab: function (page) {
    // Borrowed from https://github.com/protz/LatexIt/blob/master/content/firstrun.js
    var tabmail = document.getElementById("tabmail");
    if (tabmail && 'openTab' in tabmail) {
      Cc['@mozilla.org/appshell/window-mediator;1'].
        getService(Ci.nsIWindowMediator).
        getMostRecentWindow("mail:3pane").
        document.getElementById("tabmail").
        //openTab("contentTab", {contentPage: page});
        openTab("chromeTab", {chromePage: page});
    } else {
      //openDialog(page, "", "width=640,height=480");
      console.logStringMessage("Can't open new tab from here");
    }
  }
}

/*
 * Commented by JN 2016-09-15 due to Thunderbird console error:
 *  Error: TypeError: document.getElementById(...) is null
 */
/*
window.addEventListener("load", function _overlay_eventListener() {
// Fixup.
  document.getElementById("dummychromebrowser").setAttribute("tooltip", "aHTMLTooltip");
}, false);
*/


// Once the window has loaded, add a "new message" listener that checks
// if the new message is signed (S/MIME), and, if so, retrieves certificates
// for the sender.
window.addEventListener('load', function _setup_greatdate_eventlisteners() {
  var newMailListener = {
    msgAdded: function (msgHdr) {
      MsgHdrToMimeMessage(msgHdr, null, function (aMsgHdr, aMimeMsg) {
        //console.logStringMessage("headers: " + JSON.stringify(aMimeMsg.headers), null, 2);
        if (aMimeMsg.has("content-type")) {
          let contentType = aMimeMsg.getAll("content-type");
          // contentType is an array, but the regex will still match
          // borrowed from: msgHdrViewOverlay.js (ContentTypeIsSMIME)
          let signed = /application\/(x-)?pkcs7-(mime|signature)/.test(contentType);
          if (signed) {
            console.logStringMessage("Message from " + msgHdr.author + " is signed!");
            GreatDANE.getCerts(msgHdr.author);
          }
        } else {
          console.logStringMessage("Message does not contain 'content-type' header!");
        }
      }, true);
    }
  };

  var notificationService = Cc["@mozilla.org/messenger/msgnotificationservice;1"].getService(Ci.nsIMsgFolderNotificationService);
  notificationService.addListener(newMailListener, notificationService.msgAdded);
}, false);