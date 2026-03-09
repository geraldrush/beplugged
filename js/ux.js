(function () {
  "use strict";

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  if (typeof Lenis === "undefined") {
    return;
  }

  var lenis = new Lenis({
    duration: 1,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.1,
    normalizeWheel: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
})();
