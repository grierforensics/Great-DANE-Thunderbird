// (C) Copyright 2017 Grier Forensics.  All rights reserved.

"use strict";

var EXPORTED_SYMBOLS = ['GreatDANE']

const { classes: Cc, interfaces: Ci, utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");

const EMAIL_REGEX = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

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

var console = Services.console;

var GreatDANE = {
  // "Constants"
  GRIER_URL: "http://dst.grierforensics.com/toolset/",
  LOCAL_URL: "http://127.0.0.1:25353/",

  /** Handle to preferences */
  prefs: Services.prefs.getBranch("extensions.greatdane."),

  /** Fetches DANE certificates and adds them to Thunderbird's certificate store. */
  getCerts: function (emailAddress) {
    var self = this;

    self.fetchCertsForEmailAddress(emailAddress,
      function (certs, address) {
        certs.forEach(function (cert) {
          self.addCertificate(cert);
        });
      },
      function (responseText, address) {
        console.logStringMessage("getCerts error: " + responseText);
      }
    );
  },

  /** Fetches DANE certs from configured dst webapp.
   * The callback will be passed an array of PEM certs. */
  fetchCertsForEmailAddress: function (emailAddress, success, failure) {
    var scrubbed = this.scrubEmailAddress(emailAddress);
    if (!scrubbed) {
      console.logStringMessage("Failed to scrub email address: " + emailAddress);
    }

    // Retrieve the currently-configured DANE SMIMEA Engine's API URL
    let engineUrl = this.prefs.getCharPref("engine_url");
    //console.logStringMessage("retrieving from engineUrl = " + engineUrl);

    let url = engineUrl + "/" + encodeURIComponent(scrubbed) + '/pem';
    ajax('GET', url, null, function (responseText) {
      let certs = JSON.parse(responseText);
      success && success(certs, scrubbed);
    }, function (responseText) {
      failure && failure(responseText, scrubbed);
    });
  },

  /** Adds a certificate in PEM (base64) form to Thunderbird's cert store */
  addCertificate: function (base64cert) {
    // See: https://mike.kaply.com/2015/02/10/installing-certificates-into-firefox/
    let certdb = Cc["@mozilla.org/security/x509certdb;1"].getService(Ci.nsIX509CertDB);

    let beginCert = "-----BEGIN CERTIFICATE-----";
    let endCert = "-----END CERTIFICATE-----";
    base64cert = base64cert.replace(/[\r\n]/g, "");
    let begin = base64cert.indexOf(beginCert);
    let end = base64cert.indexOf(endCert);
    let cert = base64cert.substring(begin + beginCert.length, end)
    certdb.addCertFromBase64(cert, CERT_TRUST, "");
  },

  /** Extracts a valid email address from an "author" string */
  scrubEmailAddress: function (emailAddress) {
    if (!emailAddress || emailAddress.length <= 6) {
      return null;
    }

    let result = emailAddress.replace(/.*?</, "").replace(/>.*?/, "").trim();
    return EMAIL_REGEX.test(result) ? result : null;
  },

  /** Test connection to Great DANE Engine */
  testConnection: function (onSuccess, onFailure) {
    // Retrieve the currently-configured DANE SMIMEA Engine's API URL
    let engineUrl = this.prefs.getCharPref("engine_url");
    let url = engineUrl + '/ping';
    ajax('GET', url, null, function (responseText) {
      onSuccess && onSuccess(responseText);
    }, function (responseText) {
      onFailure && onFailure(responseText);
    },
    2000);
  }
};

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
