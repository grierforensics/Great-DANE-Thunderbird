// (C) Copyright 2015 Grier Forensics.  All rights reserved.

"use strict";

var EXPORTED_SYMBOLS = ['Greatdane']

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("resource:///modules/gloda/index_msg.js");
Cu.import("resource:///modules/gloda/mimemsg.js");

const hostAndPort = 'localhost:7777';
//const hostAndPort = 'dst.grierforensics.com';
const CERT_TRUST = "C,C,C";
var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

var Greatdane = {
  /**
   * Fetches dane certs from configured dst webapp. callback will be passed an array of results
   */
  getCertsForEmailAddress: function (emailAddress, success, failure) {
    ajax('GET', 'http://' + hostAndPort + '/toolset/' + encodeURIComponent(emailAddress) + '/base64', null, function (responseText) {
      //console.logStringMessage("dane lookup. email=" + emailAddress + " result=" + responseText);//debug
      let certs = JSON.parse(responseText);
      success && success(certs, emailAddress);
    }, function (responseText) {
      failure && failure(responseText, emailAddress);
    });
  },

  addCertificate: function (base64cert) {
    var certdb = Components.classes["@mozilla.org/security/x509certdb;1"].getService(Components.interfaces.nsIX509CertDB);
    var certdb2 = certdb;
    try {
      certdb2 = Components.classes["@mozilla.org/security/x509certdb;1"].getService(Components.interfaces.nsIX509CertDB2);
    } catch (e) {
    }
    console.logStringMessage("addCertificate:" + base64cert);
    certdb2.addCertFromBase64(base64cert, CERT_TRUST, "");
  }
};


function ajax(method, url, args, onload, onerror) {
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
      onload(this.response);
    } else {
      // Performs the function "reject" when this.status is different than 2xx
      onerror(this.statusText);
    }
  };
  client.onerror = function () {
    onerror(this.statusText);
  };
}