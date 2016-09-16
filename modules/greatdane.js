// (C) Copyright 2015 Grier Forensics.  All rights reserved.

"use strict";

var EXPORTED_SYMBOLS = ['GreatDANE']

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("resource:///modules/gloda/index_msg.js");
Cu.import("resource:///modules/gloda/mimemsg.js");

//const hostAndPort = 'dst.grierforensics.com';
//const hostAndPort = 'localhost:7777';
const apiEndpoint = "http://localhost:47036/"

// The only docs I've found on this "trust string" is the source code itself (addCertFromBase64):
// https://dxr.mozilla.org/comm-central/source/mozilla/security/manager/ssl/nsIX509CertDB.idl#418
//
// The string must consist of 3 comma-separated character flags, corresponding to:
// 1. SSL Trust
// 2. Email Trust
// 3. Object Signing Trust
//
// The character flags can be identified here (CERT_DecodeTrustString):
// https://dxr.mozilla.org/comm-central/source/mozilla/security/nss/lib/certdb/certdb.c#2267
//
// The 'C' flag, for example, means "Trusted CA and Valid CA". This is the only one found in online examples.
//
// We want the 'u' flag, which means "User", and only for Email trust.
const CERT_TRUST = ",Pu,";


var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

var GreatDANE = {
  /**
   * Fetches dane certs from configured dst webapp. callback will be passed an array of results
   */
  getCertsForEmailAddress: function (emailAddress, success, failure) {
    console.logStringMessage("Performing AJAX request!");
    ajax('GET', apiEndpoint + encodeURIComponent(emailAddress) + '/pem', null, function (responseText) {
      console.logStringMessage("dane lookup. email=" + emailAddress + " result=" + responseText);//debug
      let certs = JSON.parse(responseText);
      success && success(certs, emailAddress);
    }, function (responseText) {
      failure && failure(responseText, emailAddress);
    });
  },

  addCertificate: function (base64cert) {
    // https://mike.kaply.com/2015/02/10/installing-certificates-into-firefox/
    var certdb = Cc["@mozilla.org/security/x509certdb;1"].getService(Ci.nsIX509CertDB);
    var certdb2 = certdb;
    try {
      certdb2 = Cc["@mozilla.org/security/x509certdb;1"].getService(Ci.nsIX509CertDB2);
    } catch (e) {
    }
    console.logStringMessage("addCertificate:" + base64cert);

    var beginCert = "-----BEGIN CERTIFICATE-----";
    var endCert = "-----END CERTIFICATE-----";

    base64cert = base64cert.replace(/[\r\n]/g, "");
    var begin = base64cert.indexOf(beginCert);
    var end = base64cert.indexOf(endCert);
    var cert = base64cert.substring(begin + beginCert.length, end)
    certdb2.addCertFromBase64(cert, CERT_TRUST, "");
  }
};

/*
function hexToAscii(hexIn) {
  let hex = hexIn.toString();
  var str = "";
  for (c = 0; c < hex.length; c += 2) {
    str += String.fromCharCode(parseInt(hex.substr(c, 2), 16));
  }
  return str;
}
*/

function ajax(method, url, args, onload, onerror) {
  // Instantiates the XMLHttpRequest
  var client = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);

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
