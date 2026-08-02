/* The run engine — a real C++ compiler, in the browser.
   ---------------------------------------------------------------------------
   Contract used by the page:

       CodeRunner.ready()            -> Promise<{ ready, label }>
       CodeRunner.run(source, stdin) -> Promise<{ stdout, stderr, exitCode }>

   clang and lld are fetched from this origin and run as WebAssembly in a
   worker. Nothing is sent anywhere: a student's code never leaves their
   machine, there is no per-run cost, and it keeps working offline once the
   toolchain has been cached.

   The first run is slow — the clang bundle is 21.5MB and decompresses to
   about 110MB — so progress is reported rather than leaving a dead button.
   After that it is cached in IndexedDB and subsequent runs are quick.
   --------------------------------------------------------------------------- */

window.CodeRunner = (function () {
  /* The toolchain logs its progress to the console: which bundles it fetches,
     what it extracts, which tool it resolves. When something fails deep inside
     it, that trail is the only evidence of what actually happened, and asking
     someone to open devtools and copy it is a poor way to find out. So the
     last of it is kept here and attached to any failure. */
  const TRAIL = [];
  (function captureConsole() {
    ["log", "warn", "error"].forEach((level) => {
      const original = console[level].bind(console);
      console[level] = function (...args) {
        try {
          const line = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
          if (/Emception|LazyFS|Kernel|bundle|python|clang|em\+\+/i.test(line)) {
            TRAIL.push(line.slice(0, 200));
            if (TRAIL.length > 40) TRAIL.shift();
          }
        } catch (e) {}
        return original(...args);
      };
    });
  })();

  const SRC = "/home/user/main.cpp";
  const EXE = "/home/user/main.js";

  let emPromise = null;
  let onProgress = () => {};

  // clang targeting emscripten does not leave a native binary behind, so what
  // "run the program" means depends on what the toolchain produced. Rather
  // than guess, try the plausible artefacts once and remember which worked.
  let runner = null;
  try { runner = localStorage.getItem("cos1511:runner"); } catch (e) {}

  async function execute(em, stdin) {
    const candidates = runner
      ? [runner]
      : [EXE, "/home/user/main.js", "/home/user/a.out.js", "/home/user/a.out"];

    const tried = [];
    let last = { stdout: "", stderr: "", exitCode: 1 };

    for (const candidate of candidates) {
      tried.push(candidate);
      try {
        // Same argv convention as the compiler: lead with the program name.
        const r = await em.run(candidate, [candidate], { stdin: stdin || "" });
        // "not found" means the artefact is not there; anything else is a
        // real result, including a program that legitimately printed nothing.
        const missing = /not found|no such file/i.test(String(r.stderr || ""));
        if (!missing) {
          return { ...r, runner: candidate, tried };
        }
        last = r;
      } catch (err) {
        last = { stdout: "", stderr: String(err && err.message ? err.message : err), exitCode: 1 };
      }
    }
    return { ...last, runner: null, tried };
  }

  async function boot() {
    onProgress("Starting the compiler…");
    const { createEmception } = await import("/academy/vendor/emception.bundle.js?v=10");
    const em = await createEmception({
      manifestUrl: "/academy/cdn/manifest.json",
      tty: "none",
    });
    return em;
  }

  function emception() {
    // Booted once per page and reused. A failure clears it so the next Run
    // tries again rather than being stuck forever.
    if (!emPromise) {
      emPromise = boot().catch((err) => {
        emPromise = null;
        throw err;
      });
    }
    return emPromise;
  }

  // Cheap checks for the mistakes the COS1511 papers are full of. Run before
  // the compiler so an obvious slip is caught in milliseconds. These never
  // claim a program is correct, only that something looks wrong.
  function lint(source) {
    const notes = [];
    const opens = (source.match(/\{/g) || []).length;
    const closes = (source.match(/\}/g) || []).length;
    if (opens !== closes) notes.push(`Braces do not balance: ${opens} opening, ${closes} closing.`);

    if (/\bcout\b|\bcin\b/.test(source) && !/#include\s*<iostream>/.test(source)) {
      notes.push("Uses cout or cin but does not #include <iostream>.");
    }
    if (/\bsetprecision\b/.test(source) && !/#include\s*<iomanip>/.test(source)) {
      notes.push("Uses setprecision but does not #include <iomanip>.");
    }
    if (!/\bint\s+main\s*\(/.test(source)) notes.push("No int main() function.");
    return notes;
  }

  return {
    name: "in-browser clang",

    // The page shows this while the toolchain downloads on first use.
    setProgressHandler(fn) {
      onProgress = typeof fn === "function" ? fn : () => {};
    },

    ready() {
      return Promise.resolve({ ready: true, label: "Compiler ready" });
    },

    // True once the toolchain has been fetched and cached on this device.
    isPrepared() {
      try { return localStorage.getItem("cos1511:toolchain") === "ready"; }
      catch (e) { return false; }
    },

    /* Fetches and caches everything a lesson will need, so the download
       happens deliberately rather than in the middle of someone's first
       exercise.

       The bundles are fetched here, by us, rather than left to the toolchain,
       purely so the byte counts are real. Reading the response as a stream
       gives an honest progress bar instead of an animation that means
       nothing. They land in the HTTP cache, so when the compiler asks for
       them a moment later they are already on the device.

       Compiling a tiny program afterwards is what proves it: that pulls the
       linker, the headers and the standard library, so anyone who finishes
       setup has the whole set rather than meeting a second download at their
       first #include <string>. */
    async prepare(progress) {
      const report = typeof progress === "function" ? progress : () => {};

      // Everything a plain C++ program needs. Graphics, cmake and the rest of
      // the payload are never touched by this course, so students do not pay
      // for them.
      const WANTED = [
        "clang", "lld", "include", "clang-headers", "usr-bin", "share",
        "cache-core", "cache-crt", "cache-libc-variants", "cache-libcxx-variants",
        "usr-lib-misc", "emscripten-core", "wasm-opt", "python", "python-runtime",
      ];

      report({ phase: "Reading the manifest…", loaded: 0, total: 0 });
      const manifest = await (await fetch("/academy/cdn/manifest.json")).json();

      const bundles = WANTED
        .map((name) => manifest.bundles && manifest.bundles[name])
        .filter((b) => b && b.url)
        .map((b) => ({ url: b.url.replace(/^\/cdn/, "/academy/cdn"), size: b.size || 0 }));
      // Bundle URLs are left exactly as the manifest declares them, because the
      // loader keys extracted files by that URL. Cache-bust the vendor JS, not
      // these payload URLs.

      const total = bundles.reduce((n, b) => n + b.size, 0);
      let loaded = 0;

      for (const bundle of bundles) {
        const res = await fetch(bundle.url);
        if (!res.ok) {
          // A missing bundle is not fatal here; the compiler will ask for it
          // itself and fail with something more useful than we could say.
          loaded += bundle.size;
          report({ phase: "Downloading the compiler…", loaded, total });
          continue;
        }

        if (!res.body || !res.body.getReader) {
          await res.arrayBuffer();
          loaded += bundle.size;
          report({ phase: "Downloading the compiler…", loaded, total });
          continue;
        }

        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          loaded += value.length;
          report({ phase: "Downloading the compiler…", loaded, total });
        }
      }

      report({ phase: "Starting the compiler…", loaded: total, total });
      const em = await emception();

      report({ phase: "Building a test program…", loaded: total, total });
      await em.writeFile(SRC, '#include <iostream>\nint main(){ std::cout << "ready"; return 0; }\n');
  /* The runner replaces argv[0] with the tool it resolves rather than
     prepending it, so the first argument passed here is swallowed. Passing the
     source file first meant it never reached the compiler, and Python — which
     locates its standard library from argv[0] — ended up treating main.cpp as
     its own executable and could not find its encodings module. Leading with
     the tool name gives it something to consume. */
      const compiled = await em.run("em++", ["em++", SRC, "-o", EXE]);
      if (compiled.exitCode !== 0) {
        // Python dies saying it cannot find its codecs. Ask the filesystem
        // directly whether the encodings package is actually there, so we stop
        // inferring it from a traceback.
        let fsReport = "";
        for (const dir of ["/usr/lib/python3.13", "/usr/lib/python3.13/encodings"]) {
          try {
            const entries = await em.listDir(dir);
            const names = (entries || []).map((e) => (typeof e === "string" ? e : e && e.name)).filter(Boolean);
            fsReport += `\n${dir}: ${names.length} entries` +
              (names.length ? ` -> ${names.slice(0, 12).join(", ")}` : " (EMPTY)");
          } catch (err) {
            fsReport += `\n${dir}: FAILED (${err && err.message ? err.message : err})`;
          }
        }
        throw new Error(
          String(compiled.stderr || "the compiler could not build a test program") +
            "\n\n--- is the stdlib actually there? ---" + fsReport +
            "\n\n--- what the toolchain did ---\n" + TRAIL.join("\n"),
        );
      }

      report({ phase: "Checking it runs…", loaded: total, total });

      const outcome = await execute(em, "");
      if (!String(outcome.stdout || "").includes("ready")) {
        let listing = "(could not read the directory)";
        try {
          const entries = await em.listDir("/home/user");
          listing = JSON.stringify(entries);
        } catch (e) {}
        throw new Error(
          "it compiled, but the built program would not run.\n\n" +
            "Tried: " + outcome.tried.join(", ") + "\n" +
            "Last error: " + String(outcome.stderr || "none").slice(0, 300) + "\n" +
            "Files produced: " + listing,
        );
      }

      runner = outcome.runner;
      try {
        localStorage.setItem("cos1511:toolchain", "ready");
        if (runner) localStorage.setItem("cos1511:runner", runner);
      } catch (e) {}
      return true;
    },

    async run(source, stdin) {
      const notes = lint(source);
      let em;

      try {
        em = await emception();
      } catch (err) {
        return {
          stdout: "",
          stderr:
            "The compiler could not start.\n\n" +
            String(err && err.message ? err.message : err) +
            "\n\nThis needs a computer rather than a phone, and about 100MB " +
            "of download the first time.",
          exitCode: 1,
        };
      }

      try {
        await em.writeFile(SRC, source);

        onProgress("Compiling…");
        const compiled = await em.run("em++", ["em++", SRC, "-o", EXE]);

        if (compiled.exitCode !== 0) {
          const extra = notes.length
            ? "\n\nAlso worth checking:\n" + notes.map((n) => "  • " + n).join("\n")
            : "";
          return {
            stdout: "",
            stderr: String(compiled.stderr || "Compilation failed.") + extra,
            exitCode: compiled.exitCode || 1,
          };
        }

        onProgress("Running…");
        const ran = await execute(em, stdin);
        if (ran.runner) runner = ran.runner;

        return {
          stdout: String(ran.stdout || ""),
          stderr: String(ran.stderr || ""),
          exitCode: typeof ran.exitCode === "number" ? ran.exitCode : 0,
        };
      } catch (err) {
        return {
          stdout: "",
          stderr: "The compiler stopped unexpectedly:\n" + String(err && err.message ? err.message : err),
          exitCode: 1,
        };
      }
    },
  };
})();
