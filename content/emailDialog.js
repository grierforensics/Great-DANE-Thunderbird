const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import("resource://greatdane/greatdane.js");

var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

function onOK() {
    var emailAddress = document.getElementById("email-input").value;

    GreatDANE.getCertsForEmailAddress(emailAddress,
        function (certs, address) {
          /*
            let mainWindow = GreatdaneOverlay.getMail3Pane();
            let dialog = mainWindow.openDialog("chrome://greatdane/content/certs.xul",
                "certs", "chrome,centerscreen", {certificates: certs});
            dialog.focus();
          */

            certs.forEach(function (cert) { GreatDANE.addCertificate(cert); });
            // mainWindow.openDialog("chrome://greatdane/content/certs.xul", "certs", "chrome");
            // let tabmail = mainWindow.document.getElementById("tabmail");
            // tabmail.openTab("chromeTab", {chromePage: "chrome://greatdane/content/index.html"});
        },
        function (responseText, address) {
            console.logStringMessage("getCertsForEmailAddress error: " + responseText);
        });
    return true;
}

function onCancel() {
    return true;
}
