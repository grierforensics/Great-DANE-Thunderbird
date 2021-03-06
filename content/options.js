// (C) Copyright 2017 Grier Forensics. All rights reserved.
const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

Cu.import("resource://greatdane/greatdane.js");

var console = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);

/* Preferences observer. Responsible for updating and testing the connection
 * to the "extensions.greatdane.engine_url" preference, which is not directly
 * accessible to the user. Its value depends on whether the user chooses
 * to use the Grier Forensics instance, a local instance, or other remote
 * instance of the Great DANE Engine.
 */
var GreatDANEOptions = {
    _prefService: null,

    startup: function () {
      this._prefService = Cc["@mozilla.org/preferences-service;1"]
          .getService(Ci.nsIPrefService)
          .getBranch("extensions.greatdane."),
      this._prefService.addObserver("", this, false);

      // Prevent options from opening automatically in the future
      this._prefService.setBoolPref("first_run", false);

      this.updateEngineUrl();
    },

    shutdown: function () {
      this._prefService.removeObserver("", this);
    },

    observe: function (subject, topic, data) {
      if (topic != "nsPref:changed") {
        return;
      }

      // Clear testing results if any options change
      document.getElementById("testConnResults").value = "";

      this.updateEngineUrl();
    },

    updateEngineUrl: function () {
      let engineType = this._prefService.getCharPref("engine_type");
      let engineUrl = "";
      switch (engineType) {
      case "grier":
        engineUrl = GreatDANE.GRIER_URL;
        break;
      case "remote":
        engineUrl = this._prefService.getCharPref("remote_url");
        // Ensure engineUrl ends with "/"
        if (engineUrl.indexOf("/", engineUrl.length - 1) == -1) {
          engineUrl += "/";
        }
        break;
      case "local":
      default:
        engineUrl = GreatDANE.LOCAL_URL;
        break;
      }
      this._prefService.setCharPref("engine_url", engineUrl);
    },

    testConnection: function () {
      //console.logStringMessage("testing connection to " + this._prefService.getCharPref("engine_url"));
      document.getElementById("testConnResults").value = "Testing...";

      GreatDANE.testConnection(
        // onSuccess
        function () {
            document.getElementById("testConnResults").value = "Success!";
        },
        // onFailure
        function () {
            document.getElementById("testConnResults").value = "Error!";
        }
      );
    }
}

window.addEventListener("load", function (e) { GreatDANEOptions.startup(); }, false);
window.addEventListener("unload", function (e) { GreatDANEOptions.shutdown(); }, false);
