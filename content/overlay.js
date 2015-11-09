// (C) Copyright 2015 Grier Forensics.  All rights reserved.
Components.utils.import("resource:///modules/gloda/index_msg.js");
Components.utils.import("resource:///modules/gloda/mimemsg.js");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/NetUtil.jsm");
//Components.utils.import("resource://gre/modules/devtools/Console.jsm");
var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);


Components.utils.import("resource://greatdane/greatdane.js");


var GreatdaneOverlay = {
  click: function(){
    if (document.readyState === "complete") {
      //document.getElementById("tabmail").openTab("chromeTab", {chromePage: "chrome://greatdane/content/index.html" });

      this.test();
    }
  },

  test: function(){
    var obj = Greatdane.getEmailsForCurrentMessage();
    console.logStringMessage("getEmailsForCurrentMessage:"+JSON.stringify(obj));

    Greatdane.getCertsForEmailAddresses(['danetest@had-pilot.biz'], function (certs) {
      console.logStringMessage("getCertsForEmailAddresses:"+JSON.stringify(obj));
      for each(var cert in certs){
        Greatdane.addCertificate(cert, 'C,c,c');
      }
    });
  }
};

window.addEventListener("load", function _overlay_eventListener () {
  // Fixup.
  document.getElementById("dummychromebrowser").setAttribute("tooltip", "aHTMLTooltip");
}, false);

