// (C) Copyright 2016 Grier Forensics.  All rights reserved.
const Ci = Components.interfaces;
const Cc = Components.classes;

var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

var GreatDANEOptions = {
    _prefService: null,

    startup: function () {

    this._prefService = Cc["@mozilla.org/preferences-service;1"]
        .getService(Ci.nsIPrefService)
        .getBranch("extensions.greatdane."),
    this._prefService.addObserver("", this, false);

    },

    shutdown: function () {
      this._prefService.removeObserver("", this);
    },

    observe: function (subject, topic, data) {
      if (topic != "nsPref:changed") {
        return;
      }

      switch (data) {
      case "engine_url":
        // ensure engineUrl ends with "/"
        engineUrl = subject.getCharPref("engine_url");
        if (engineUrl.indexOf("/", engineUrl.length - 1) == -1) {
          engineUrl += "/";
        }
        subject.setCharPref("engine_url", engineUrl);
        break;
      }
    }
}

window.addEventListener("load", function (e) { GreatDANEOptions.startup(); }, false);
window.addEventListener("unload", function (e) { GreatDANEOptions.shutdown(); }, false);
