// (C) Copyright 2015 Grier Forensics.  All rights reserved.

"use strict";

var EXPORTED_SYMBOLS = ['Greatdane']

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;
const Cr = Components.results;

const hostAndPort = 'localhost:7777';
//const hostAndPort = 'dst.grierforensics.com';

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/devtools/Console.jsm");
Cu.import("resource:///modules/gloda/index_msg.js");
Cu.import("resource:///modules/gloda/mimemsg.js");

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
    var certdb = Components.classes["@mozilla.org/security/x509certdb;1"].getService(Components.interfaces.nsIX509CertDB);
    var certdb2 = certdb;
    try {
      certdb2 = Components.classes["@mozilla.org/security/x509certdb;1"].getService(Components.interfaces.nsIX509CertDB2);
    } catch (e) {}

    console.logStringMessage("addCertificate:" + base64cert);
    //*hack*/base64cert = "MIIFbTCCA1UCAQEwDQYJKoZIhvcNAQEFBQAwgYgxCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJVVDEXMBUGA1UEBxMOU2FsdCBMYWtlIENpdHkxGTAXBgNVBAoTEFBvd2VydXAgU29mdHdhcmUxFjAUBgNVBAMTDURhdGhhbiBHdWlsZXkxIDAeBgkqhkiG9w0BCQEWEWRhdGhhbkBwb3dlcnVwLmNjMB4XDTE1MTEwOTE3MzYyNVoXDTE2MTEwODE3MzYyNVowcDELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAlVUMRcwFQYDVQQHEw5TYWx0IExha2UgQ2l0eTEZMBcGA1UEChMQUG93ZXJ1cCBTb2Z0d2FyZTEgMB4GCSqGSIb3DQEJARYRZGF0aGFuQHBvd2VydXAuY2MwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDBiyhx9SPnV3Zl5qPgJzAvCQ3bNW+tl612KrPfCB3/psUkG7dzhTmyjS1fa5qGlJWoQiw3n7KpdF5dpjPIfSJXzJ6xhbcnE4T8fdKgB6O+QSCDyXMCsAu8xhNKC+bXA5iqL+9nyK/xOIr9jHQKoGlwgScrH44rcf/KVro0ipI5pWH7HKEjAIsN1amQ27K/AtxfAgg6VcmkVIrdRBHJfdwGnEC/hpFP75/AoxuOp6D5M5IHTjnBrG/wRBdp0fgJiF+Uwk+YokTxT2H4zYMEUDtnFPB90zugvkC6GU7/dCZJfReEauuwyaqW3YTxWGBMSQ8ZEpHbKW7+kSJst6XzTIxrFRZCOwWadmEb/8rJGSqjoq8paOG15UKNXfKoMXk2ENknoFmTSjjXDBKRvlkpl1aHo3Z1WxacmFiPZzENQSTNl4ot7IBtdcxEHJ82DqCkFKN/7eyifnc7e1z1Xg6A+uSToAQRgM7qkXLtXNtudURbJV6reFImUbHlKkEoaNH/wUxm7ksq1eQt3OND48XrAA6eW6FBhiOHtEIJ6+GH4naLrePlKmp+rHI+kDaEQIW7RPG8cEgEMihkc/9vLeW9FDXiLnCgLBkd87W1U/TEzQvrs+SpC5ju9UzE9v9lJaKRJdsAwEJjVnv58YZ75yOnjLcLTvtgmfl5OOUGRZ1Axr1frQIDAQABMA0GCSqGSIb3DQEBBQUAA4ICAQBn2eoNUDE17p6Y4hz4qA6QTMTNbQwjvt3T/LkUMte+hzQP52Iu6de74qf+cZmFWP9JjQzQ4uhn34EfSeOEAfsEaUlZn+vn/xdZBa6h4CJhghNzKhJ1aFgBEz7MuCCmIr+BgTkqSyzLkoOe23vscs6DD9/4xCmQzfb6ypPXNWXWH7AxWsk6O9Sm7ZzzswMEWzRf3p9z40Erz2VQ3DmgDx4d3YfIzwkrU1IHj3leUFGl/w/TgtVHpTiT3RXK+juV4BH1xdGP/xID7qfA6LzoFFg6DYHJuLidHsIIrsrmGHw8xL+KygrfDlk78VfKjAwx0ZJtXwRIbOqq40ZYyLoczvr5/2bVtKjadloT3EbEDaLN+gNR6M4CLe5Htc/36H0Rmjp9rDb76RnVMvcy73XVt4I0FJvoN8h0shL1lJhN4DpDHgGJI8puzIISkn7slIbesEaDk7Uerw2s23JcLQ0Dovslxjy0xNRwkDg5mDflnRkMQGey8E+4wowmVoxZb0yro130Ou/8ZK5u0ilvGcTvICUuz4SvXa+1Ttta2RYDwpHvGhbk4q4VzllB5fwG9UwNckjrtWntOVW/B7VRH8nI1mlkZzIzJlZJ3LyEYn8ab9/ngVWejvVyjE2rRE/9eGyZ68nEcFmwPu4YiLrZ5U3j5QlyVmKQCLcNxuTSwnS4aBhpYDBGMAoGCCsGAQUFBwMEoBQGCCsGAQUFBwMCBggrBgEFBQcDAQwiRGF0aGFuIEd1aWxleSdzIEUtTWFpbCBDZXJ0aWZpY2F0ZQ==";
    /*hack*/base64cert = "MIIDZTCCAk2gAwIBAgIJAILKP+FqRZ8JMA0GCSqGSIb3DQEBBQUAMEkxHDAaBgNVBAMME0RBTkUgU01JTUVBIFRvb2xzZXQxKTAnBgkqhkiG9w0BCQEWGmRzdEBkc3QtZ3JpZXJmb3JlbnNpY3MuY29tMB4XDTE1MDcwNjAwMzIzOFoXDTI1MDcxMzAwMzIzOFowSTEcMBoGA1UEAwwTREFORSBTTUlNRUEgVG9vbHNldDEpMCcGCSqGSIb3DQEJARYaZHN0QGRzdC1ncmllcmZvcmVuc2ljcy5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDF0ge/WIBUthzJ1wGdyX0LNJmMuLRyny5RpAaLQnG2BlnU4uDEXEYg7qkrRmq3FUeekerwrLGjVkw4jmPCm1ja2oAQEDPLgHtunimHobSfz4KaFpAv7kK4BRYGK/peFHF/XMHGzylKWjMBnzLUbZ5SrR9IWeBAFNpKby70WE/taNinH0jCs5vn14irkV+/aoUHmAE2My4sXfniWqrDuWaudJYnVwVPEsA9rxj5xQpl5MzhDCVPc3IRC0hLHeVsu2mhkXPjLafdSSS/7N2BlWwOqPNVhwPE9VdQez1+nZTctHrzAdc3ocXMu1aU5RwYWVyX5f1qwh/Jm9oPO7opzNOfAgMBAAGjUDBOMB0GA1UdDgQWBBR1o5XBnCm0vHGQUUcX2KIFbi3YlzAfBgNVHSMEGDAWgBR1o5XBnCm0vHGQUUcX2KIFbi3YlzAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBBQUAA4IBAQBn4kATp4mTB13u9+0a8c99NgcUnfaX98LtU+Zgzzvf5Pt6JJuSmNsy63+8YgrtWl7U4N42YEx/jTP81EF73jhi8CLttgHvUEyZd6TQmLKsMbstoCGBGPsyfvDHC+PKiLCB6euhzueUG9Og6Xm0Dpg0qKvLX0dQs3hKfnOR5KCDrLulIPIbIh8IJFDqUec31bDJdUzXiG3FjZeGw7q58hCFXnaFN+ZiQbljdLYiL+4NM2gytCqnLJDknGWfEe9JMunYHKJrN6M4kAkii+j7Ul5QfuGt2FVirnjVZw2r4m08uM7H/FHdSFMQZGtEBaxGzvs9QSypgfSE30hflOm13jn8";
    certdb2.addCertFromBase64(base64cert, "C,C,C", "");
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