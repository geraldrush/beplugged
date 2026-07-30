(function () {
  "use strict";

  // The service worker is kept for offline support and caching. The install
  // prompt was removed: an install banner on a services site interrupts the
  // visitor before they have read anything.
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch(function (error) {
        console.error("Service worker registration failed:", error);
      });
  });
})();
