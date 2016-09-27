// (C) Copyright 2016 Grier Forensics. All rights reserved.
const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import("resource://greatdane/greatdane.js");

var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

// Close the "Retrieving Certificates" dialog
function onCancel() {
    return true;
}

// This will be executed as soon as our "compose-send-message" handler
// spawns the "Retrieving Certificates" dialog. It will attempt to
// retrieve and store certs for each recipient address passed to the
// dialog box window.
// TODO: set a timeout before closing this window so it's guaranteed to auto-close
(function () {
    let recipients = window.arguments[0].recipients;

    for (let idx = 0; idx < recipients.length; idx++) {
        let rcpt = recipients[idx];
        // We need to close the dialog box automatically after we've fetched
        // certs for the last recipient so we'll track which recipient is last
        let lastAddress = idx === recipients.length - 1;
        (function (last) {
            // This doesn't use GreatDANE.getCerts directly because it must also
            // close the dialog after the last certificate is retrieved
            GreatDANE.fetchCertsForEmailAddress(rcpt,
                function (certs, address) {
                    certs.forEach(function (cert) { GreatDANE.addCertificate(cert); });
                    if (last) {
                        window.close();
                    }
                },
                function (responseText, address) {
                    console.logStringMessage("fetchCertsForEmailAddress error: " + responseText);
                    if (last) {
                        window.close();
                    }
                }
            );
        })(lastAddress);
    }
})();
