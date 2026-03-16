(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/service-worker.js").catch(function (error) {
      console.error("Service worker registration failed:", error);
    });
  });

  var deferredPrompt;

  function showInstallBanner() {
    if (document.getElementById("pwa-install-banner")) {
      return;
    }

    var banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.setAttribute(
      "style",
      "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;background:#1a76d1;color:#fff;padding:12px 14px;border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 8px 20px rgba(0,0,0,0.25);font-family:Arial,sans-serif;"
    );

    var text = document.createElement("span");
    text.textContent = "Install BePlugged App for faster access.";

    var actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";

    var installBtn = document.createElement("button");
    installBtn.type = "button";
    installBtn.textContent = "Install";
    installBtn.setAttribute(
      "style",
      "border:none;background:#fff;color:#1a76d1;padding:8px 12px;border-radius:8px;font-weight:700;cursor:pointer;"
    );

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Later";
    closeBtn.setAttribute(
      "style",
      "border:1px solid rgba(255,255,255,0.7);background:transparent;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer;"
    );

    installBtn.addEventListener("click", function () {
      if (!deferredPrompt) {
        return;
      }

      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        banner.remove();
      });
    });

    closeBtn.addEventListener("click", function () {
      banner.remove();
    });

    actions.appendChild(installBtn);
    actions.appendChild(closeBtn);
    banner.appendChild(text);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    showInstallBanner();
  });
})();
