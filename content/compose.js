// (C) Copyright 2017 Grier Forensics. All rights reserved.
const Ci = Components.interfaces;
const Cc = Components.classes;

var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

// Determines for which of the message recipients we don't have certificates
// and spawns a modal dialog box that appears only as long as it takes to
// perform AJAX requests for the certificates from the DANE engine.
//
// This is *the* place to perform security work prior to the message being sent
// See:
// - https://dxr.mozilla.org/comm-central/source/mail/components/compose/content/MsgComposeCommands.js#2891-2893
// - https://developer.mozilla.org/en-US/docs/User:groovecoder/Compose_New_Message
function greatDaneMsgSendHandler(evt) {
    // TODO: Only retrieve certificates if the message should be encrypted
    // See: https://dxr.mozilla.org/comm-central/source/mail/extensions/smime/content/msgCompSMIMEOverlay.js
    // the following does not work because msgCompSMIMEOverlay.js changes `requireEncryptMessage` to false
    // if the certificates are missing *prior* to this event handler's execution
    /*
    if (!gMsgCompose.compFields.securityInfo.requireEncryptMessage) {
        console.logStringMessage("Message not encrypted. Not checking for certificates.");
        return;
    }
    */

    // See https://dxr.mozilla.org/comm-central/source/mail/extensions/smime/content/msgCompSMIMEOverlay.js
    let missingCount = new Object();
    let emailAddresses = new Object();
    Cc["@mozilla.org/messenger-smime/smimejshelper;1"]
              .createInstance(Ci.nsISMimeJSHelper)
              .getNoCertAddresses(gMsgCompose.compFields,
                                  missingCount,
                                  emailAddresses);

    if (missingCount.value <= 0) {
        // No certificates need to be fetched
        return;
    }

    let args = { recipients: emailAddresses.value };
    let dialog = window.openDialog("chrome://greatdane/content/retrieving.xul",
        "retrieving", "chrome,centerscreen,modal", args);
    dialog.focus();
}

window.addEventListener("compose-send-message", greatDaneMsgSendHandler, true);
