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
var emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
var session = {};


var GreatdaneOverlay = {

  click: function () {
    console.logStringMessage("GreatDANE button clicked!");
    if (document.readyState === "complete") {

        let dialog = window.openDialog("chrome://greatdane/content/email.xul", "email", "chrome,centerscreen");
        dialog.focus();
      // console.logStringMessage("Getting emails for current message");
      // var emailAddresses = this.getEmailsForCurrentMessage();
      // for each(var emailAddress in emailAddresses) {
      //   this.processEmailAddress(emailAddress);
      // }
      // this.openTab("chrome://greatdane/content/index.html"); //index shows cert output
    }
  },

  processEmailAddress: function (emailAddress) {
    var scrubbed = this.scrubEmailAddress(emailAddress);
    if (!scrubbed || scrubbed in session) {
      return;//bad email or already tried
    }

    GreatDANE.getCertsForEmailAddress(scrubbed, function (certs) {
      session[scrubbed] = true;
      console.logStringMessage("DANE lookup success. Adding/updating " + certs.length + " certs for email=" + scrubbed);
      for each(var cert in certs) {
        GreatDANE.addCertificate(cert);
      }
    }, function (responseText) {
      session[scrubbed] = false;
      console.logStringMessage("DANE lookup ERROR. email=" + scrubbed + " result=" + responseText);//debug
    });
  },

  processPartialEmailAddress: function (emailAddresses) {
    var scrubbed = this.scrubEmailAddress(emailAddress);
    if (!scrubbed || scrubbed in session) {
      return;//bad email or already tried
    }

    GreatDANE.getCertsForEmailAddress(scrubbed, function (certs) {
      session[scrubbed] = true;
      console.logStringMessage("DANE lookup success. Adding/updating " + certs.length + " certs for email=" + emailAddress);
      for each(var cert in certs) {
        GreatDANE.addCertificate(cert);
      }
    }, function (responseText) {
      session[scrubbed] = false;
      /*remove this*/
      console.logStringMessage("partial DANE lookup ERROR. email=" + emailAddress + " result=" + responseText);//debug
    });
  },

  processPartialTextbox: function (element) {
    var value = element.inputField.value;
    if (!value)
      return;

    for each(var partial in value.split(',')) {
      this.processPartialEmailAddress(partial);
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

  scrubEmailAddress: function (emailAddress) {
    if (!emailAddress || emailAddress.length <= 6)
      return null;

    var result = emailAddress.replace(/.*?</, "").replace(/>.*?/, "").trim();
    return emailRegex.test(result) ? result : null;
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

/*
 * Temporarily disabled while working on interactive certificate retrieval
 */
/*
window.addEventListener('load', function _setup_greatdate_eventlisteners() {
  var newMailListener = {
    msgAdded: function (msgHdr) {
      if (!msgHdr.isRead) {
        //GreatdaneOverlay.processEmailAddress(msgHdr.author);
      }

        let enumerator = msgHdr.propertyEnumerator;
        let properties = "";
        while (enumerator.hasMore()) {
            let property = enumerator.getNext();
            properties += property + ": " + msgHdr.getProperty(property);
        }

        console.logStringMessage("properties: " + properties);
    }
  };

  var notificationService = Cc["@mozilla.org/messenger/msgnotificationservice;1"].getService(Ci.nsIMsgFolderNotificationService);
  notificationService.addListener(newMailListener, notificationService.msgAdded);
}, false);
*/
