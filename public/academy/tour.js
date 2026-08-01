/* A short walkthrough of this workspace for a student opening it the first
   time. Self-contained: no library, and the overlay is four panels laid
   around the highlighted element rather than a box with a hole in it, so
   whatever is being pointed at stays visible. */

(function () {
  const SEEN = "cos1511:tour:v1";

  const STEPS = [
    {
      title: "This is your COS1511 workspace",
      body: "Write C++, run it, and see what it prints — without leaving the browser. The questions are real ones from past UNISA examination papers.",
      use: "Nothing here is marked or sent anywhere. It is somewhere to practise.",
    },
    {
      target: ".pane.list",
      title: "1. Pick a question",
      body: "Each one is taken from a past paper, with the paper and the marks shown underneath. They start easier and get harder.",
      use: "Your work is kept separately for each question, so you can move between them without losing anything.",
    },
    {
      target: ".pane.side",
      title: "2. Read what is being asked",
      body: "The question sits on the right. Where the paper printed the expected output, it is shown here too — your program has to produce exactly that, spaces and all.",
      use: "Read the whole question before typing. Marks are lost more often to misread requirements than to bad code.",
    },
    {
      target: ".pane.editor",
      title: "3. Write your answer here",
      body: "A C++ editor with line numbers and colouring. Each question starts with a skeleton and comments showing what goes where — you fill in the rest.",
      use: "Your code saves by itself every few seconds and is still here when you come back.",
    },
    {
      target: "#stdin",
      title: "4. Type what the keyboard would give it",
      body: "When your program uses cin, it reads from this box instead of from a person. Put one value on each line, in the order the program asks for them.",
      use: "This is the part most people miss. If your program asks for three numbers and this box is empty, it will sit there waiting and produce nothing.",
    },
    {
      target: "#run-btn",
      title: "5. Run it",
      body: "Compiles and runs your program using the input above.",
      use: "Run early and often. A program that compiles after every few lines is far easier to fix than one written all at once.",
    },
    {
      target: ".pane.output",
      title: "6. Read the output",
      body: "What your program printed appears here. Errors appear here too, in red, with the line number.",
      use: "Where the paper gave an expected output, this tells you whether yours matches it exactly.",
    },
    {
      target: ".gutter.h",
      title: "Make the space work for you",
      body: "Every divider drags. Pull this one up for a taller output pane, or use Expand. Double click a divider to put it back.",
      use: "The size you choose is remembered on this computer.",
    },
    {
      title: "One thing to know",
      body: "The compiler is still being connected to this page. Until it is, Run will check your code for common mistakes — missing semicolons, unbalanced braces, a missing using namespace std; — but will not execute it.",
      use: "Keep compiling in Code::Blocks in the meantime. Reopen this walkthrough any time with the Guide button.",
    },
  ];

  let index = 0;
  let nodes = null;

  function teardown() {
    if (!nodes) return;
    nodes.forEach((n) => n.remove());
    nodes = null;
    window.removeEventListener("resize", reposition);
    window.removeEventListener("keydown", keys);
  }

  function keys(e) {
    if (e.key === "Escape") end();
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  }

  function end() {
    try { localStorage.setItem(SEEN, "1"); } catch (_) {}
    teardown();
  }

  function go(delta) {
    const next = index + delta;
    if (next < 0) return;
    if (next >= STEPS.length) return end();
    index = next;
    render();
  }

  function reposition() { if (nodes) render(true); }

  function render(keepScroll) {
    const step = STEPS[index];
    teardown();

    const el = step.target ? document.querySelector(step.target) : null;
    if (el && !keepScroll && el.scrollIntoView) {
      el.scrollIntoView({ block: "nearest" });
    }

    const r = el
      ? el.getBoundingClientRect()
      : { top: 0, left: 0, right: 0, bottom: 0 };
    const pad = 5;
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const made = [];

    const veil = (css) => {
      const d = document.createElement("div");
      d.className = "tourx-veil";
      Object.assign(d.style, css);
      d.addEventListener("click", end);
      document.body.appendChild(d);
      made.push(d);
    };

    if (el) {
      const top = Math.max(0, r.top - pad);
      const bottom = Math.min(vh, r.bottom + pad);
      const left = Math.max(0, r.left - pad);
      const right = Math.min(vw, r.right + pad);
      veil({ top: 0, left: 0, width: "100%", height: top + "px" });
      veil({ top: bottom + "px", left: 0, width: "100%", height: Math.max(0, vh - bottom) + "px" });
      veil({ top: top + "px", left: 0, width: left + "px", height: bottom - top + "px" });
      veil({ top: top + "px", left: right + "px", width: Math.max(0, vw - right) + "px", height: bottom - top + "px" });

      const ring = document.createElement("div");
      ring.className = "tourx-ring";
      Object.assign(ring.style, {
        top: top + "px", left: left + "px",
        width: right - left + "px", height: bottom - top + "px",
      });
      document.body.appendChild(ring);
      made.push(ring);
    } else {
      veil({ top: 0, left: 0, width: "100%", height: "100%" });
    }

    const bubble = document.createElement("div");
    bubble.className = "tourx-bubble";
    bubble.innerHTML =
      "<h4></h4><p></p><div class='tourx-use'></div>" +
      "<div class='tourx-foot'><button type='button' class='tourx-skip'>Skip</button>" +
      "<span class='tourx-step'></span><span class='tourx-btns'>" +
      "<button type='button' class='tourx-back'>Back</button>" +
      "<button type='button' class='tourx-next'></button></span></div>";
    bubble.querySelector("h4").textContent = step.title;
    bubble.querySelector("p").textContent = step.body;
    bubble.querySelector(".tourx-use").textContent = step.use;
    bubble.querySelector(".tourx-step").textContent = index + 1 + " of " + STEPS.length;
    const back = bubble.querySelector(".tourx-back");
    back.disabled = index === 0;
    back.style.opacity = index === 0 ? ".45" : "1";
    bubble.querySelector(".tourx-next").textContent =
      index === STEPS.length - 1 ? "Start coding" : "Next";
    document.body.appendChild(bubble);
    made.push(bubble);

    bubble.querySelector(".tourx-skip").addEventListener("click", end);
    back.addEventListener("click", () => go(-1));
    bubble.querySelector(".tourx-next").addEventListener("click", () => go(1));

    // Try each side and take the first that fits without covering the target.
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const gap = 14;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
    let pos;

    if (!el) {
      pos = { left: (vw - bw) / 2, top: (vh - bh) / 2 };
    } else {
      const options = [
        { left: r.right + gap, top: clamp(r.top, 12, Math.max(12, vh - bh - 12)) },
        { left: r.left - gap - bw, top: clamp(r.top, 12, Math.max(12, vh - bh - 12)) },
        { left: clamp(r.left, 12, Math.max(12, vw - bw - 12)), top: r.bottom + gap },
        { left: clamp(r.left, 12, Math.max(12, vw - bw - 12)), top: r.top - gap - bh },
      ];
      const fits = (c) => c.left >= 8 && c.top >= 8 && c.left + bw <= vw - 8 && c.top + bh <= vh - 8;
      const clear = (c) =>
        c.left > r.right || c.left + bw < r.left || c.top > r.bottom || c.top + bh < r.top;
      // A target as large as the editor leaves nowhere beside it for the
      // bubble. Rather than land in the middle of it, tuck into the bottom
      // right so the ring and most of the pane stay visible.
      pos =
        options.find((c) => fits(c) && clear(c)) ||
        options.find(fits) || {
          left: Math.max(12, vw - bw - 16),
          top: Math.max(12, vh - bh - 16),
        };
    }

    bubble.style.left = Math.round(pos.left) + "px";
    bubble.style.top = Math.round(pos.top) + "px";

    nodes = made;
  }

  window.startAcademyTour = function () {
    index = 0;
    render();
    window.addEventListener("resize", reposition);
    window.addEventListener("keydown", keys);
  };

  // First visit only, once the panes have settled.
  let seen = "1";
  try { seen = localStorage.getItem(SEEN); } catch (_) {}
  if (!seen) {
    window.addEventListener("load", function () {
      setTimeout(window.startAcademyTour, 1200);
    });
  }
})();
