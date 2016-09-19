const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import("resource://greatdane/greatdane.js");

var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

function onOK() {
    var emailAddress = document.getElementById("email-input").value;
    GreatDANE.getCerts(emailAddress);
    return true;
}

function onCancel() {
    return true;
}
