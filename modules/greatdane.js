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

const emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

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

//var session = {};

var GreatDANE = {

  // Handle to preferences
  prefs: Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService)
        .getBranch("extensions.greatdane."),

  // Fetches DANE certificates and adds them to Thunderbird's certificate store
  getCerts: function (emailAddress) {
    var self = this;

    self.fetchCertsForEmailAddress(emailAddress,
      function (certs, address) {
        certs.forEach(function (cert) {
          console.logStringMessage("Adding cert: " + cert);
          self.addCertificate(cert);
        });
      },
      function (responseText, address) {
        console.logStringMessage("getCerts error: " + responseText);
      }
    );
  },

  // Fetches DANE certs from configured dst webapp. The callback will be passed an array of PEM certs.
  fetchCertsForEmailAddress: function (emailAddress, success, failure) {
    var scrubbed = this.scrubEmailAddress(emailAddress);
    if (!scrubbed) {
      console.logStringMessage("Failed to scrub email address: " + emailAddress);
    }

    // Check if we've already fetched certs for this email address
    // Note: we may want to remove this "caching" altogether allowing us to use
    // DANE SMIMEA for live verification of certs (which some people want).
    /*
    if (scrubbed in session) {
      success && success([], scrubbed);
      return;
    }
    */

    // Retrieve the currently-configured DANE SMIMEA Engine's API URL
    let engineUrl = this.prefs.getCharPref("engine_url");
    console.logStringMessage("retrieving from engineUrl = " + engineUrl);

    let url = engineUrl + "/" + encodeURIComponent(scrubbed) + '/pem';
    ajax('GET', url, null, function (responseText) {
      //console.logStringMessage("dane lookup. email=" + scrubbed + " result=" + responseText);//debug
      //session[scrubbed] = true;
      let certs = JSON.parse(responseText);
      //console.logStringMessage("DANE lookup success. Adding/updating " + certs.length + " certs for email=" + scrubbed);
      success && success(certs, scrubbed);
    }, function (responseText) {
      //session[scrubbed] = false;
      //console.logStringMessage("DANE lookup ERROR. email=" + scrubbed + " result=" + responseText);
      failure && failure(responseText, scrubbed);
    });
  },

  // Adds a certificate in PEM (base64) form to Thunderbird's cert store
  addCertificate: function (base64cert) {
    // https://mike.kaply.com/2015/02/10/installing-certificates-into-firefox/
    let certdb = Cc["@mozilla.org/security/x509certdb;1"].getService(Ci.nsIX509CertDB);
    //console.logStringMessage("addCertificate:" + base64cert);

    let beginCert = "-----BEGIN CERTIFICATE-----";
    let endCert = "-----END CERTIFICATE-----";

    base64cert = base64cert.replace(/[\r\n]/g, "");
    let begin = base64cert.indexOf(beginCert);
    let end = base64cert.indexOf(endCert);
    let cert = base64cert.substring(begin + beginCert.length, end)
    certdb.addCertFromBase64(cert, CERT_TRUST, "");
  },

  // Extracts a valid email address from an "author" string
  scrubEmailAddress: function (emailAddress) {
    if (!emailAddress || emailAddress.length <= 6) {
      return null;
    }

    let result = emailAddress.replace(/.*?</, "").replace(/>.*?/, "").trim();
    return emailRegex.test(result) ? result : null;
  },

  testConnection: function (onSuccess, onFailure) {
    // Retrieve the currently-configured DANE SMIMEA Engine's API URL
    let engineUrl = this.prefs.getCharPref("engine_url");
    console.logStringMessage("testing engineUrl = " + engineUrl);

    let url = engineUrl + '/ping';
    ajax('GET', url, null, function (responseText) {
      onSuccess && onSuccess(responseText);
    }, function (responseText) {
      onFailure && onFailure(responseText);
    },
    2000);
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

/* Perform an asynchronous HTTP request
 *
 * method: HTTP method, e.g. GET
 * url: HTTP URL
 * args: object mapping keys to values
 * onLoad: called if request is successful
 * onError: called if any errors occur
 * timeout (optional): request timeout in milliseconds (default: 2000ms)
 */
function ajax(method, url, args, onLoad, onError, timeout) {
  let client = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);

  // Maybe we can use ES6's default parameters instead of this
  if (typeof timeout !== 'undefined') {
    client.timeout = timeout;
  }

  let uri = url;

  if (args && (method === 'POST' || method === 'PUT')) {
    uri += '?';
    let argcount = 0;
    for (let key in args) {
      if (args.hasOwnProperty(key)) {
        if (argcount++) {
          uri += '&';
        }
        uri += encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
      }
    }
  }

  client.onload = function () {
    if (this.status >= 200 && this.status < 300) {
      onLoad(this.response);
    } else {
      onError(this.statusText);
    }
  };

  client.onerror = function () {
    onError(this.statusText);
  };

  client.ontimeout = function () {
    onError("timed out");
  };

  try {
    client.open(method, uri);
  } catch (err) {
    onError(err.message + " (" + uri + ")");
    return;
  }
  client.send();
}
