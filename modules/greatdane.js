// (C) Copyright 2015 Grier Forensics.  All rights reserved.

"use strict";

var EXPORTED_SYMBOLS = ['Greatdane']

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;
const Cr = Components.results;

const hostAndPort = 'localhost:7777';
//const hostAndPort = 'dst.grierforensics.com';

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("resource:///modules/gloda/index_msg.js");
Cu.import("resource:///modules/gloda/mimemsg.js");
//Cu.import("resource://gre/modules/devtools/Console.jsm");

var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

var Greatdane = {
  /**
   * Fetches dane certs from configured dst webapp. callback will be passed an array of results
   */
  getEmailsForCurrentMessage: function () {
    // First we get msgHdr, a nsIMsgDbHdr
    let mainWindow = getMail3Pane();
    let tabmail = mainWindow.document.getElementById("tabmail");
    // We might not always have a selected message, so check first
    let msgHdr = mainWindow.gFolderDisplay.selectedMessage;

    console.logStringMessage(msgHdr);

    // The first way of examining it is through the MimeMessage representation
    MsgHdrToMimeMessage(msgHdr, null, function (aMsgHdr, aMimeMsg) {
      console.logStringMessage(aMsgHdr);
    }, true, {partsOnDemand: true});

    //callback(msgHdr)
  },

  getCertsForEmailAddresses: function (emailAddresses, callback) {
    for each(var emailAddress in emailAddresses){
      ajax('GET', 'http://' + hostAndPort + '/toolset/' + encodeURIComponent(emailAddress) + '/hex', null, function (responseText) {
        console.logStringMessage("loaded:" + responseText);//debug
        let certs = JSON.parse(responseText);
        callback && callback([{email: emailAddress, certs: certs}]);
      });
    }
  },

  addCertificate: function (base64cert, CertTrust) {
    var certDB = Cc["@mozilla.org/security/x509certdb;1"].getService(Ci.nsIX509CertDB2);
    certDB.addCertFromBase64(base64cert, CertTrust, "");
  }
}


function openTab(aUrl) {
  let tabmail = getMail3Pane().document.getElementById("tabmail");
  tabmail.openTab("chromeTab", {chromePage: aUrl});
}

function getMail3Pane() {
  return Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow("mail:3pane");
}

function ajax(method, url, args, callback) {

  // Creating a promise
  //var promise = new Promise(function (resolve, reject) {

  // Instantiates the XMLHttpRequest
  var client = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);

  var uri = url;

  if (args && (method === 'POST' || method === 'PUT')) {
    uri += '?';
    var argcount = 0;
    for (var key in args) {
      if (args.hasOwnProperty(key)) {
        if (argcount++) {
          uri += '&';
        }
        uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
      }
    }
  }

  client.open(method, uri);
  client.send();

  client.onload = function () {
    if (this.status >= 200 && this.status < 300) {
      // Performs the function "resolve" when this.status is equal to 2xx
      //resolve(this.response);
      callback(this.response);
    } else {
      // Performs the function "reject" when this.status is different than 2xx
      //reject(this.statusText);
      callback("ERROR" + this.statusText);
    }
  };
  client.onerror = function () {
    //reject(this.statusText);
    callback("ERROR" + this.statusText);
  };
  //});
  //Return the promise
  //return promise;
}