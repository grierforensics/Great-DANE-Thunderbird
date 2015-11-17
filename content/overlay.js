// (C) Copyright 2015 Grier Forensics.  All rights reserved.
Components.utils.import("resource:///modules/gloda/index_msg.js");
Components.utils.import("resource:///modules/gloda/mimemsg.js");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");

Components.utils.import("resource://greatdane/greatdane.js");


var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

var GreatdaneOverlay = {
  click: function () {
    if (document.readyState === "complete") {
      //this.openTab("chrome://greatdane/content/index.html");

      this.processEmailAddresses(['danetest@had-pilot.biz']);
    }
  },

  processEmailAddresses: function (emailAddresses) {
    //var obj = Greatdane.getEmailsForCurrentMessage();
    //console.logStringMessage("getEmailsForCurrentMessage:"+JSON.stringify(obj));

    Greatdane.getCertsForEmailAddresses(emailAddresses, function (certsForEmails) {
      for each(var entry in certsForEmails) {
        console.logStringMessage("adding " + entry.certs.length + " certs for email:" + entry.email);
        for each(var cert in entry.certs) {
          Greatdane.addCertificate(cert, 'C,c,c');
        }
      }
    });
  },

  openTab: function (page) {
    document.getElementById("tabmail").openTab("chromeTab", {chromePage: page});
  }
};

window.addEventListener("load", function _overlay_eventListener() {
  // Fixup.
  document.getElementById("dummychromebrowser").setAttribute("tooltip", "aHTMLTooltip");
}, false);

window.addEventListener('load', function _setup_greatdate_eventlisteners() {
  var newMailListener = {
    msgAdded: function (msgHdr) {
      if (!msgHdr.isRead) {
        GreatdaneOverlay.processEmailAddresses([msgHdr.author]);
      }
    }
  };
  var notificationService = Components.classes["@mozilla.org/messenger/msgnotificationservice;1"].getService(Components.interfaces.nsIMsgFolderNotificationService);
  notificationService.addListener(newMailListener, notificationService.msgAdded);
}, false);