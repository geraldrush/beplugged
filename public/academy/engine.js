/* The run engine — a real C++ compiler, in the browser.
   ---------------------------------------------------------------------------
   Contract used by the page:

       CodeRunner.ready()            -> Promise<{ ready, label }>
       CodeRunner.run(source, stdin) -> Promise<{ stdout, stderr, exitCode }>

   clang and lld are fetched from this origin and run as WebAssembly in a
   worker. Nothing is sent anywhere: a student's code never leaves their
   machine, there is no per-run cost, and it keeps working offline once the
   toolchain has been cached.

   The first run is slow — the clang and lld bundles are large and decompress
   into a local browser filesystem — so progress is reported rather than
   leaving a dead button.
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
          if (/Emception|LazyFS|Kernel|bundle|clang|lld|wasm|wasi/i.test(line)) {
            TRAIL.push(line.slice(0, 200));
            if (TRAIL.length > 40) TRAIL.shift();
          }
        } catch (e) {}
        return original(...args);
      };
    });
  })();

  const SRC = "/home/user/main.cpp";
  const OBJ = "/home/user/main.o";
  const EXE = "/home/user/main.wasm";
  const TOOLCHAIN_CACHE_VERSION = "26";
  const READY_KEY = "cos1511:toolchain";
  const RUNNER_KEY = "cos1511:runner";
  const VERSION_KEY = "cos1511:toolchain-version";
  const COMPILER_DATABASES = [
    "lazyfs-cache-v3-academy-26",
    "overlay-writes-academy-26",
    "user-files-academy-26",
    "lazyfs-cache-v3-academy-25",
    "overlay-writes-academy-25",
    "user-files-academy-25",
    "lazyfs-cache-v3-academy-24",
    "overlay-writes-academy-24",
    "user-files-academy-24",
    "lazyfs-cache-v3-academy-23",
    "overlay-writes-academy-23",
    "user-files-academy-23",
    "lazyfs-cache-v3",
    "lazyfs-cache-v2",
    "lazyfs-cache",
    "overlay-writes",
    "user-files",
  ];

  function compileArgs() {
    return [
      "clang++",
      "-c", SRC,
      "-o", OBJ,
      "--target=wasm32-unknown-emscripten",
      "--sysroot=/usr",
      "-isystem", "/usr/include/compat",
      "-std=c++17",
      "-fno-exceptions",
    ];
  }

  function linkArgs() {
    return [
      "wasm-ld",
      "/usr/lib/emscripten/cache-lib/wasm32-emscripten/crt1.o",
      OBJ,
      "-o", EXE,
      "-L/usr/lib/emscripten/cache-lib/wasm32-emscripten",
      "-lc++-noexcept",
      "-lc++abi-noexcept",
      "-lunwind-noexcept",
      "-lc",
      "-ldlmalloc",
      "-lcompiler_rt",
      "--entry=_start",
      "--export=main",
      "--export=__wasm_call_ctors",
      "--allow-undefined",
    ];
  }

  let emPromise = null;
  let onProgress = () => {};

  // clang targeting emscripten does not leave a native binary behind, so what
  // "run the program" means depends on what the toolchain produced. Rather
  // than guess, try the plausible artefacts once and remember which worked.
  let runner = null;
  try { runner = localStorage.getItem(RUNNER_KEY); } catch (e) {}

  function storageGet(key) {
    try { return localStorage.getItem(key); }
    catch (e) { return null; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }

  function clearPreparedState() {
    runner = null;
    storageRemove(READY_KEY);
    storageRemove(RUNNER_KEY);
  }

  function hasCurrentCacheVersion() {
    return storageGet(VERSION_KEY) === TOOLCHAIN_CACHE_VERSION;
  }

  function rememberCurrentCacheVersion() {
    storageSet(VERSION_KEY, TOOLCHAIN_CACHE_VERSION);
  }

  async function disposeEmception() {
    if (!emPromise) return;
    const current = emPromise;
    emPromise = null;
    try {
      const em = await current;
      if (em && typeof em.dispose === "function") em.dispose();
    } catch (e) {}
  }

  function deleteDatabase(name) {
    if (!window.indexedDB || !indexedDB.deleteDatabase) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), 3500);
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => { clearTimeout(timer); finish(true); };
      request.onerror = () => { clearTimeout(timer); finish(false); };
      request.onblocked = () => console.warn("[COS1511] Compiler cache reset is blocked by another open academy tab:", name);
    });
  }

  async function resetCompilerCache(options) {
    const opts = options || {};
    const progress = typeof opts.progress === "function" ? opts.progress : onProgress;
    progress("Refreshing the compiler cache...");
    if (opts.dispose !== false) {
      await disposeEmception();
    }
    clearPreparedState();
    await Promise.all(COMPILER_DATABASES.map(deleteDatabase));
    rememberCurrentCacheVersion();
    progress("Compiler cache refreshed.");
  }

  async function ensureCurrentCompilerCache() {
    if (hasCurrentCacheVersion()) return;
    await resetCompilerCache({ dispose: false });
  }

  function formatElapsed(ms) {
    const seconds = Math.max(1, Math.round(ms / 1000));
    if (seconds < 60) return seconds + "s";
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return rest ? minutes + "m " + rest + "s" : minutes + "m";
  }

  async function withHeartbeat(label, promise, messages, progress) {
    const started = Date.now();
    const notify = typeof progress === "function" ? progress : onProgress;
    const hints = messages && messages.length ? messages : [""];
    let tick = 0;
    const pulse = () => {
      const hint = hints[Math.min(tick, hints.length - 1)];
      tick += 1;
      notify(label + " (" + formatElapsed(Date.now() - started) + ")" + (hint ? "\n" + hint : ""));
    };
    const first = setTimeout(pulse, 8000);
    const interval = setInterval(pulse, 15000);
    try {
      return await promise;
    } finally {
      clearTimeout(first);
      clearInterval(interval);
    }
  }

  async function execute(em, stdin) {
    const defaults = [EXE, "/home/user/a.out.wasm", "/home/user/main.js", "/home/user/a.out.js", "/home/user/a.out"];
    const candidates = runner
      ? [runner, ...defaults.filter((candidate) => candidate !== runner)]
      : defaults;

    const tried = [];
    let last = { stdout: "", stderr: "", exitCode: 1 };

    for (const candidate of candidates) {
      tried.push(candidate);
      try {
        const r = candidate.endsWith(".wasm")
          ? await em.run("wasi-run", ["wasi-run", candidate], { stdin: stdin || "" })
          : await em.run(candidate, [candidate], { stdin: stdin || "" });
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

  function decodeFile(data) {
    if (!data) return "";
    if (typeof data === "string") return data;
    try { return new TextDecoder().decode(data); }
    catch (e) { return String(data); }
  }

  async function readFile(em, path) {
    if (!em || typeof em.readFile !== "function") return null;
    try { return await em.readFile(path); }
    catch (e) { return null; }
  }

  async function hasOutputArtifact(em, path) {
    const data = await readFile(em, path);
    const size = data && (data.byteLength || data.length || 0);
    return size > 0;
  }

  async function readLog(em, path) {
    const text = decodeFile(await readFile(em, path)).trim();
    return text ? text.slice(-1200) : "";
  }

  async function listUserFiles(em) {
    try {
      const entries = await em.listDir("/home/user");
      return JSON.stringify(entries);
    } catch (e) {
      return "(could not read /home/user)";
    }
  }

  async function compilerFailureDetails(em, compiled, fallback) {
    const sections = [];
    const stderr = String(compiled && compiled.stderr || "").trim();
    const stdout = String(compiled && compiled.stdout || "").trim();
    if (stderr) sections.push(stderr);
    if (stdout) sections.push("--- compiler stdout ---\n" + stdout.slice(-1200));

    const stderrLog = await readLog(em, "/tmp/stderr.log");
    const stdoutLog = await readLog(em, "/tmp/stdout.log");
    if (stderrLog && !stderr.includes(stderrLog)) sections.push("--- stderr.log ---\n" + stderrLog);
    if (stdoutLog && !stdout.includes(stdoutLog)) sections.push("--- stdout.log ---\n" + stdoutLog);

    sections.push("Files in /home/user: " + await listUserFiles(em));
    if (TRAIL.length) sections.push("--- what the toolchain did ---\n" + TRAIL.join("\n"));
    return sections.filter(Boolean).join("\n\n") || fallback;
  }

  async function clearBuildArtifacts(em) {
    const empty = new Uint8Array(0);
    await Promise.all([
      em.writeFile(OBJ, empty).catch(() => {}),
      em.writeFile(EXE, empty).catch(() => {}),
    ]);
  }

  function joinToolOutput(first, second, key) {
    return [first && first[key], second && second[key]]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join("\n");
  }

  async function buildExecutable(em, options) {
    const opts = options || {};
    const progress = typeof opts.progress === "function" ? opts.progress : undefined;
    await clearBuildArtifacts(em);

    const compiled = await withHeartbeat(
      opts.compileLabel || "Compiling…",
      em.run("clang++", compileArgs(), { cwd: "/home/user" }),
      opts.compileMessages || [
        "Loading the in-browser C++ compiler.",
        "Running clang++.",
        "Still compiling. Keep this tab open.",
      ],
      progress,
    );
    if (compiled.exitCode !== 0 || !(await hasOutputArtifact(em, OBJ))) {
      return {
        ...compiled,
        exitCode: compiled.exitCode || 1,
        stage: "compile",
        expectedOutput: OBJ,
      };
    }

    const linked = await withHeartbeat(
      opts.linkLabel || "Linking…",
      em.run("wasm-ld", linkArgs(), { cwd: "/home/user" }),
      opts.linkMessages || [
        "Loading the WebAssembly linker and C++ runtime libraries.",
        "Building the runnable WebAssembly program.",
        "Still linking. Keep this tab open.",
      ],
      progress,
    );
    return {
      exitCode: linked.exitCode || 0,
      stdout: joinToolOutput(compiled, linked, "stdout"),
      stderr: joinToolOutput(compiled, linked, "stderr"),
      stage: linked.exitCode === 0 && await hasOutputArtifact(em, EXE) ? "done" : "link",
      expectedOutput: EXE,
    };
  }

  async function boot() {
    await ensureCurrentCompilerCache();
    onProgress("Starting the compiler…");
    const { createEmception } = await import("/academy/vendor/emception.bundle.js?v=26");
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
      return hasCurrentCacheVersion() && storageGet(READY_KEY) === "ready";
    },

    resetCompilerCache(progress) {
      return resetCompilerCache({ progress });
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
    async prepare(progress, options) {
      const report = typeof progress === "function" ? progress : () => {};
      const force = options && options.force;

      if (force || !hasCurrentCacheVersion()) {
        await resetCompilerCache({
          dispose: !!force,
          progress: (message) => report({ phase: message, loaded: 0, total: 0 }),
        });
      }

      // Everything a plain C++ program needs. Graphics, cmake and the rest of
      // the payload are never touched by this course, so students do not pay
      // for them.
      const WANTED = [
        "clang", "lld", "clang-headers", "usr-include", "usr-bin",
        "cache-core", "cache-crt",
      ];

      report({ phase: "Reading the manifest…", loaded: 0, total: 0 });
      const manifest = await (await fetch("/academy/cdn/manifest.json", { cache: "no-cache" })).json();

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
        const res = await fetch(bundle.url, { cache: "no-cache" });
        if (!res.ok) {
          let foundPart = false;
          for (let i = 0; i < 16; i++) {
            const partRes = await fetch(`${bundle.url}.part${i}`, { cache: "no-cache" });
            if (!partRes.ok) break;
            foundPart = true;
            if (!partRes.body || !partRes.body.getReader) {
              const part = await partRes.arrayBuffer();
              loaded += part.byteLength;
              report({ phase: "Downloading the compiler…", loaded, total });
              continue;
            }
            const partReader = partRes.body.getReader();
            for (;;) {
              const { done, value } = await partReader.read();
              if (done) break;
              loaded += value.length;
              report({ phase: "Downloading the compiler…", loaded, total });
            }
          }
          if (foundPart) continue;
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
      const setupProgress = (message) => report({ phase: String(message).split("\n")[0], loaded: total, total });
      const compiled = await buildExecutable(em, {
        compileLabel: "Building a test program…",
        linkLabel: "Linking the test program…",
        compileMessages: [
          "Loading clang++ from browser storage.",
          "Running the first test compile.",
          "Still compiling. Leave this tab open.",
        ],
        linkMessages: [
          "Loading the WebAssembly linker and runtime libraries.",
          "Creating the test WebAssembly program.",
          "Still linking. Leave this tab open.",
        ],
        progress: setupProgress,
      });
      if (compiled.exitCode !== 0 || compiled.stage !== "done") {
        let fsReport = "";
        for (const dir of ["/usr/include/c++/v1", "/usr/lib/emscripten/cache-lib/wasm32-emscripten"]) {
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
          await compilerFailureDetails(em, compiled, "the compiler could not build a test program") +
            "\n\n--- are the direct compiler assets there? ---" + fsReport +
            "\n\nExpected output: " + (compiled.expectedOutput || EXE),
        );
      }

      report({ phase: "Checking it runs…", loaded: total, total });

      const outcome = await withHeartbeat(
        "Checking it runs…",
        execute(em, ""),
        ["Starting the compiled WebAssembly program."],
        setupProgress,
      );
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
        localStorage.setItem(READY_KEY, "ready");
        localStorage.setItem(VERSION_KEY, TOOLCHAIN_CACHE_VERSION);
        if (runner) localStorage.setItem(RUNNER_KEY, runner);
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
            "\n\nThis needs a computer rather than a phone, and about 45MB " +
            "of download the first time.",
          exitCode: 1,
        };
      }

      try {
        await em.writeFile(SRC, source);

        onProgress("Compiling…");
        const compiled = await buildExecutable(em);

        if (compiled.exitCode !== 0 || compiled.stage !== "done") {
          const extra = notes.length
            ? "\n\nAlso worth checking:\n" + notes.map((n) => "  • " + n).join("\n")
            : "";
          const details = await compilerFailureDetails(
            em,
            compiled,
            "Compilation failed.",
          );
          const artifactHint = compiled.exitCode === 0
            ? "\n\nThe compiler reported success but did not create " + (compiled.expectedOutput || EXE) + "."
            : "";
          return {
            stdout: "",
            stderr: details + artifactHint + extra,
            exitCode: compiled.exitCode || 1,
          };
        }

        onProgress("Running…");
        const ran = await withHeartbeat(
          "Running…",
          execute(em, stdin),
          ["Starting the compiled WebAssembly program."],
        );
        if (ran.runner) runner = ran.runner;
        if (runner) storageSet(RUNNER_KEY, runner);

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
