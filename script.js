// script.js
import { setupFormHandlers } from "./formHandler.js";
import { displaySavedPreferences } from "./storage.js";

/* Primary initialization wrapped in an IIFE as required */
(() => {
  // Wait for DOM ready, then initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // already ready
    init();
  }

  function init() {
    // Focus first field
    const nameEl = document.querySelector("#customerName");
    if (nameEl) nameEl.focus();

    // Setup form handlers and UI
    setupFormHandlers();

    // Load preferences (both localStorage and saved order cookie)
    displaySavedPreferences();
  }
})();
