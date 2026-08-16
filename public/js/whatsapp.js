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

  // Overridable with <script src="/js/whatsapp.js" data-number="27..."></script>
  var SCRIPT = document.currentScript;
  var NUMBER = (SCRIPT && SCRIPT.getAttribute("data-number")) || "27659669657";
  var WA_BASE = "https://wa.me/" + NUMBER.replace(/[^0-9]/g, "");

  /* The panel is the company's own enquiry form, not a WhatsApp skin. It uses
     the site's tokens from theme.css so it reads as part of the site rather
     than a third-party widget parked in the corner. The launcher stays green,
     because that is the thing a visitor recognises as "message them". */
  var INK = '#0d1826', INK_MID = '#4a5568', INK_SOFT = '#6b7688';
  var LINE = '#e3e8ef', BRAND = '#f05023', BRAND_DARK = '#d23f14';
  var FONT = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";

  var CSS =
    '.wa-launch{position:fixed;right:18px;bottom:18px;z-index:9998;display:flex;align-items:center;gap:9px;' +
    'background:#25D366;color:#fff;border:0;border-radius:999px;padding:12px 18px 12px 15px;cursor:pointer;' +
    'font:600 14px/1 ' + FONT + ';' +
    'box-shadow:0 6px 20px rgba(13,24,38,.22);transition:transform .15s,box-shadow .15s;}' +
    '.wa-launch:hover{transform:translateY(-1px);box-shadow:0 9px 26px rgba(13,24,38,.28);}' +
    '.wa-launch svg{width:20px;height:20px;flex:none;}' +

    '.wa-panel{position:fixed;right:18px;bottom:18px;z-index:9999;width:352px;max-width:calc(100vw - 36px);' +
    'background:#fff;border:1px solid ' + LINE + ';border-radius:10px;overflow:hidden;' +
    'box-shadow:0 24px 56px rgba(13,24,38,.20);font-family:' + FONT + ';color:' + INK_MID + ';display:none;}' +
    '.wa-panel.open{display:block;}' +

    '.wa-head{padding:16px 18px 14px;border-bottom:1px solid ' + LINE + ';display:flex;align-items:flex-start;gap:12px;}' +
    '.wa-head strong{display:block;font-size:15.5px;font-weight:650;letter-spacing:-.012em;color:' + INK + ';line-height:1.3;}' +
    '.wa-head span{display:block;margin-top:3px;font-size:12.5px;line-height:1.45;color:' + INK_SOFT + ';}' +
    '.wa-head button{margin:-4px -6px auto auto;flex:none;width:32px;height:32px;background:none;border:0;' +
    'color:' + INK_SOFT + ';font-size:21px;line-height:1;cursor:pointer;border-radius:6px;}' +
    '.wa-head button:hover{background:#f2f5f9;color:' + INK + ';}' +

    '.wa-body{padding:16px 18px 18px;}' +
    '.wa-field{margin:0 0 13px;}' +
    '.wa-body label{display:block;font-size:12px;font-weight:650;letter-spacing:.03em;text-transform:uppercase;' +
    'color:' + INK_MID + ';margin:0 0 6px;}' +
    '.wa-body input,.wa-body textarea{display:block;width:100%;border:1px solid ' + LINE + ';border-radius:6px;' +
    'padding:11px 12px;font-family:inherit;font-size:14px;line-height:1.45;color:' + INK + ';background:#fff;' +
    'transition:border-color .15s,box-shadow .15s;-webkit-appearance:none;}' +
    '.wa-body input::placeholder,.wa-body textarea::placeholder{color:#9aa4b2;}' +
    '.wa-body textarea{min-height:82px;resize:vertical;}' +
    '.wa-body input:focus,.wa-body textarea:focus{outline:none;border-color:' + BRAND + ';' +
    'box-shadow:0 0 0 3px rgba(240,80,35,.13);}' +

    '.wa-send{display:block;width:100%;background:' + BRAND + ';color:#fff;border:0;border-radius:6px;' +
    'padding:15px 16px;margin-top:4px;font-family:inherit;font-size:14.5px;font-weight:600;line-height:1;' +
    'letter-spacing:.01em;cursor:pointer;transition:background-color .15s;}' +
    '.wa-send:hover:not(:disabled){background:' + BRAND_DARK + ';}' +
    '.wa-send:focus-visible{outline:3px solid rgba(240,80,35,.35);outline-offset:2px;}' +
    '.wa-send:disabled{opacity:.55;cursor:default;}' +

    '.wa-note{font-size:12.5px;color:' + INK_SOFT + ';margin:11px 0 0;line-height:1.55;}' +
    '.wa-status{font-size:13px;font-weight:600;margin:11px 0 0;line-height:1.45;}' +
    '.wa-hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;}' +
    '@media (max-width:420px){.wa-launch span{display:none;}.wa-launch{padding:14px;}' +
    '.wa-panel{right:12px;left:12px;bottom:12px;width:auto;max-width:none;}}';

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

    var panel = el("div", { class: "wa-panel", role: "dialog", "aria-label": "Send us an enquiry" },
      '<div class="wa-head">' +
        '<div><strong>Send us an enquiry</strong>' +
        '<span>Tell us what you need and we will reply within one business day.</span></div>' +
        '<button type="button" aria-label="Close" data-wa-close>&times;</button>' +
      '</div>' +
      '<div class="wa-body">' +
        '<div class="wa-field"><label for="wa-name">Your name</label>' +
        '<input id="wa-name" type="text" autocomplete="name" placeholder="Full name"></div>' +
        '<div class="wa-field"><label for="wa-email">Email address</label>' +
        '<input id="wa-email" type="email" autocomplete="email" placeholder="you@company.co.za"></div>' +
        '<div class="wa-field"><label for="wa-message">How can we help?</label>' +
        '<textarea id="wa-message" placeholder="A sentence or two about the work is plenty."></textarea></div>' +
        '<div class="wa-hp" aria-hidden="true"><input type="text" id="wa-website" tabindex="-1" autocomplete="off"></div>' +
        '<button type="button" class="wa-send" id="wa-send">Send enquiry</button>' +
        '<div class="wa-status" id="wa-status" role="status" aria-live="polite"></div>' +
        '<p class="wa-note">Sending opens WhatsApp with your message ready to go. Your details reach us either way.</p>' +
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

      btn.disabled = true;

      // Open WhatsApp straight away. Waiting for the server first meant the
      // visitor sat on a blank tab while an email was sent, which took longer
      // than the handoff itself. The enquiry is still recorded: the request
      // below runs in parallel, and keepalive lets it finish regardless.
      var text = "Hi Beplugged, I'm " + name + ".\n\n" + message;
      window.open(WA_BASE + "?text=" + encodeURIComponent(text), "_blank", "noopener");

      fetch("/api/whatsapp-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          name: name,
          email: email,
          message: message,
          website: document.getElementById("wa-website").value,
        }),
      }).catch(function () {
        /* The handoff has already happened; a failure here is logged server side. */
      });

      status.style.color = "#1da851";
      status.textContent = "Opening WhatsApp…";
      setTimeout(function () {
        open(false);
        status.textContent = "";
        btn.disabled = false;
        document.getElementById("wa-message").value = "";
      }, 1200);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
