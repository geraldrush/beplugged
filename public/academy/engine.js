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
  const SRC = "/home/user/main.cpp";
  const EXE = "/home/user/a.out";

  let emPromise = null;
  let onProgress = () => {};

  async function boot() {
    onProgress("Starting the compiler…");
    const { createEmception } = await import("/academy/vendor/emception.bundle.js");
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
       exercise. Compiling a tiny program is the surest way to warm it:
       it pulls clang, the linker, the headers and the standard library,
       which is the whole set. */
    async prepare(progress) {
      const say = typeof progress === "function" ? progress : () => {};

      say("Starting the compiler…");
      const em = await emception();

      say("Fetching clang — this is the big one, about 100MB…");
      await em.writeFile(SRC, '#include <iostream>\nint main(){ std::cout << "ready"; return 0; }\n');
      const compiled = await em.run("clang++", [SRC, "-o", EXE]);
      if (compiled.exitCode !== 0) {
        throw new Error(String(compiled.stderr || "the compiler could not build a test program"));
      }

      say("Checking it runs…");
      const ran = await em.run(EXE, [], { stdin: "" });
      if (!String(ran.stdout || "").includes("ready")) {
        throw new Error("the test program compiled but did not run as expected");
      }

      try { localStorage.setItem("cos1511:toolchain", "ready"); } catch (e) {}
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
        const compiled = await em.run("clang++", [SRC, "-o", EXE]);

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
        const ran = await em.run(EXE, [], { stdin: stdin || "" });

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
