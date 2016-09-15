// https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Dialogs_and_Prompts#Passing_arguments_and_displaying_a_dialog

//var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

function onLoad() {
    document.getElementById("certs-output").value = window.arguments[0].certificates;
}

function onOK() {
    return true;
}
