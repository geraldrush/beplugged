/* The run engine — g++ on the server.
   ---------------------------------------------------------------------------
   Contract used by the page (identical to engine.js, so the two are
   interchangeable):

       CodeRunner.ready()            -> Promise<{ ready, label }>
       CodeRunner.run(source, stdin) -> Promise<{ stdout, stderr, exitCode }>

   The student's source is posted to /api/academy/run, which forwards it to a
   sandboxed compile service and returns the compiler's stderr and the
   program's stdout. A run costs one request and about a second.

   This exists because the browser-hosted toolchain (engine.js) cannot meet the
   thing that actually matters here: a student opens the page during a practice
   session and presses Run. That path needs a ~39MB download, only works on a
   desktop, and is unusable on the mobile data most students are on. Compiling
   on the server costs a small amount of money per run and removes every one of
   those barriers. It also means the compiler is g++, which is what the module
   is marked against — so the error messages a student learns to read here are
   the ones they will see in the exam environment.

   The trade is that this needs a connection. There is no offline mode.
   --------------------------------------------------------------------------- */

window.CodeRunner = (function () {
  const ENDPOINT = "/api/academy/run";

  // A compile plus a run is quick, but a cold compile service or a program
  // stuck waiting on input it was never given should fail with something a
  // student can act on rather than hanging the button forever.
  const TIMEOUT_MS = 30000;

  let onProgress = () => {};

  // Cheap checks for the mistakes the COS1511 papers are full of. Run before
  // the request so an obvious slip is caught in milliseconds and without
  // spending a compile. These never claim a program is correct, only that
  // something looks wrong.
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

  function withNotes(stderr, notes) {
    if (!notes.length) return stderr;
    const list = "\n\nAlso worth checking:\n" + notes.map((n) => "  • " + n).join("\n");
    return stderr ? stderr + list : list.trimStart();
  }

  async function post(source, stdin) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, stdin }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    name: "server g++",

    setProgressHandler(fn) {
      onProgress = typeof fn === "function" ? fn : () => {};
    },

    ready() {
      // Deliberately not probed on load. The endpoint is rate limited per
      // address, and spending one of a student's few requests per minute to
      // discover something the first Run would tell them anyway is a bad
      // trade. A misconfigured service surfaces on the first run instead.
      return Promise.resolve({ ready: true, label: "Compiler ready" });
    },

    // Nothing is downloaded, so there is nothing to prepare. Reported as
    // already prepared so the setup lesson shows as done rather than inviting
    // a student to sit through a download that no longer exists.
    isPrepared() {
      return true;
    },

    prepare(progress) {
      if (typeof progress === "function") {
        progress({ phase: "Nothing to download — the compiler runs on the server.", loaded: 1, total: 1 });
      }
      return Promise.resolve(true);
    },

    resetCompilerCache() {
      return Promise.resolve(true);
    },

    async run(source, stdin) {
      const notes = lint(source);

      onProgress("Compiling…");

      let response;
      try {
        response = await post(source, stdin || "");
      } catch (err) {
        const timedOut = err && err.name === "AbortError";
        return {
          stdout: "",
          stderr: withNotes(
            timedOut
              ? "That took too long and was stopped.\n\n" +
                "A program that waits for input it never receives will do this. " +
                "Check that you have typed the input the question asks for into " +
                "the input box below the editor."
              : "Could not reach the compiler.\n\n" +
                "Check your connection and press Run again.",
            notes,
          ),
          exitCode: 1,
        };
      }

      const result = await response.json().catch(() => null);

      if (!response.ok || !result) {
        const message = (result && result.error)
          || "The compiler service is not available right now.";
        return { stdout: "", stderr: withNotes(String(message), notes), exitCode: 1 };
      }

      onProgress("Running…");

      // The Worker already puts compiler errors ahead of program output, so a
      // failed compile arrives here as stderr with an empty stdout. Lint notes
      // are only worth showing when something actually went wrong — appending
      // them to a working program is noise.
      const stderr = String(result.stderr || "");
      const exitCode = typeof result.exitCode === "number" ? result.exitCode : 0;
      return {
        stdout: String(result.stdout || ""),
        stderr: exitCode === 0 && !stderr ? "" : withNotes(stderr, notes),
        exitCode,
      };
    },
  };
})();
