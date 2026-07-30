/*
 * WhatsApp enquiry widget.
 *
 * There is no way to send a WhatsApp message on someone's behalf, so the form
 * captures their details first and then hands them to WhatsApp with the
 * message already written. An enquiry that never gets sent is therefore still
 * recorded rather than lost.
 */
(function () {
  "use strict";

  var CSS =
    '.wa-launch{position:fixed;right:18px;bottom:18px;z-index:9998;display:flex;align-items:center;gap:9px;' +
    'background:#25D366;color:#fff;border:0;border-radius:999px;padding:12px 18px 12px 15px;cursor:pointer;' +
    'font:600 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
    'box-shadow:0 6px 20px rgba(16,18,40,.22);transition:transform .15s,box-shadow .15s;}' +
    '.wa-launch:hover{transform:translateY(-1px);box-shadow:0 9px 26px rgba(16,18,40,.28);}' +
    '.wa-launch svg{width:20px;height:20px;flex:none;}' +
    '.wa-panel{position:fixed;right:18px;bottom:18px;z-index:9999;width:330px;max-width:calc(100vw - 36px);' +
    'background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 18px 46px rgba(16,18,40,.26);' +
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;display:none;}' +
    '.wa-panel.open{display:block;}' +
    '.wa-head{background:#25D366;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;}' +
    '.wa-head strong{font-size:15px;display:block;line-height:1.3;}' +
    '.wa-head span{font-size:12px;opacity:.9;}' +
    '.wa-head button{margin-left:auto;background:none;border:0;color:#fff;font-size:20px;line-height:1;cursor:pointer;padding:0 2px;}' +
    '.wa-body{padding:15px 16px 17px;}' +
    '.wa-body label{display:block;font-size:12px;font-weight:600;color:#555;margin:0 0 4px;}' +
    '.wa-body input,.wa-body textarea{width:100%;border:1px solid #e0e0e5;border-radius:7px;padding:9px 11px;' +
    'font:inherit;font-size:14px;color:#222;margin:0 0 11px;background:#fff;}' +
    '.wa-body textarea{min-height:74px;resize:vertical;}' +
    '.wa-body input:focus,.wa-body textarea:focus{outline:none;border-color:#25D366;box-shadow:0 0 0 3px rgba(37,211,102,.14);}' +
    '.wa-send{width:100%;background:#25D366;color:#fff;border:0;border-radius:7px;padding:11px;' +
    'font:600 14px/1 inherit;cursor:pointer;}' +
    '.wa-send:hover:not(:disabled){background:#1da851;}' +
    '.wa-send:disabled{opacity:.6;cursor:default;}' +
    '.wa-note{font-size:11px;color:#888;margin:9px 0 0;line-height:1.55;}' +
    '.wa-status{font-size:13px;font-weight:600;margin:9px 0 0;}' +
    '.wa-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;}' +
    '@media (max-width:420px){.wa-launch span{display:none;}.wa-launch{padding:14px;}}';

  var ICON =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z"/><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.24 8.21z"/></svg>';

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  function build() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var launch = el("button", { type: "button", class: "wa-launch", "aria-label": "Chat on WhatsApp" },
      ICON + "<span>Chat with us</span>");

    var panel = el("div", { class: "wa-panel", role: "dialog", "aria-label": "WhatsApp enquiry" },
      '<div class="wa-head">' + ICON +
        '<div><strong>Chat with us</strong><span>We usually reply within a business day</span></div>' +
        '<button type="button" aria-label="Close" data-wa-close>&times;</button>' +
      '</div>' +
      '<div class="wa-body">' +
        '<label for="wa-name">Your name</label>' +
        '<input id="wa-name" type="text" autocomplete="name">' +
        '<label for="wa-email">Email</label>' +
        '<input id="wa-email" type="email" autocomplete="email">' +
        '<label for="wa-message">How can we help?</label>' +
        '<textarea id="wa-message" placeholder="A sentence or two is plenty."></textarea>' +
        '<div class="wa-hp" aria-hidden="true"><input type="text" id="wa-website" tabindex="-1" autocomplete="off"></div>' +
        '<button type="button" class="wa-send" id="wa-send">Continue to WhatsApp</button>' +
        '<div class="wa-status" id="wa-status" role="status" aria-live="polite"></div>' +
        '<p class="wa-note">We will open WhatsApp with your message ready to send. Your details reach us either way.</p>' +
      '</div>');

    document.body.appendChild(launch);
    document.body.appendChild(panel);

    function open(state) {
      panel.classList.toggle("open", state);
      launch.style.display = state ? "none" : "flex";
      if (state) document.getElementById("wa-name").focus();
    }

    launch.addEventListener("click", function () { open(true); });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("[data-wa-close]")) open(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) open(false);
    });

    document.getElementById("wa-send").addEventListener("click", function () {
      var btn = document.getElementById("wa-send");
      var status = document.getElementById("wa-status");
      var name = document.getElementById("wa-name").value.trim();
      var email = document.getElementById("wa-email").value.trim();
      var message = document.getElementById("wa-message").value.trim();

      status.style.color = "#c0392b";
      if (!name) { status.textContent = "Please add your name."; return; }
      if (!email || email.indexOf("@") < 1) { status.textContent = "Please add a valid email."; return; }
      if (!message) { status.textContent = "Please tell us how we can help."; return; }

      status.style.color = "#555";
      status.textContent = "One moment…";
      btn.disabled = true;

      // Opened up front: a window opened later, from a network callback, is
      // treated as a popup and blocked on most browsers.
      var win = window.open("", "_blank");

      fetch("/api/whatsapp-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
          website: document.getElementById("wa-website").value,
        }),
      })
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, b: b }; }); })
        .then(function (res) {
          if (!res.ok || !res.b.success) throw new Error(res.b.error || "Could not send");
          if (win) { win.location = res.b.url; } else { window.location = res.b.url; }
          status.style.color = "#1da851";
          status.textContent = "Opening WhatsApp…";
          setTimeout(function () { open(false); status.textContent = ""; btn.disabled = false; }, 1800);
        })
        .catch(function (err) {
          if (win) win.close();
          status.style.color = "#c0392b";
          status.textContent = err.message;
          btn.disabled = false;
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
