/* The run engine.
   ---------------------------------------------------------------------------
   Contract used by the page, and the only thing it knows about running code:

       CodeRunner.ready()            -> Promise<{ ready:boolean, label:string }>
       CodeRunner.run(source, stdin) -> Promise<{ stdout, stderr, exitCode }>

   Compilation happens on a backend, reached through this site's own Worker at
   /api/academy/run. The browser never talks to the compiler directly, so the
   backend address and any credential stay on the server and every run is rate
   limited. Changing compiler means pointing the Worker somewhere else; nothing
   in this file or the page changes.
   --------------------------------------------------------------------------- */

window.CodeRunner = (function () {
  let state = null;

  // Cheap checks for the mistakes the COS1511 papers are full of. These run
  // before the code is sent, so an obvious slip is caught without waiting on
  // the network. They never claim a program is correct, only that something
  // looks wrong.
  function lint(source) {
    const notes = [];
    const lines = source.split("\n");

    const opens = (source.match(/\{/g) || []).length;
    const closes = (source.match(/\}/g) || []).length;
    if (opens !== closes) {
      notes.push(`Braces do not balance: ${opens} opening, ${closes} closing.`);
    }

    const pOpen = (source.match(/\(/g) || []).length;
    const pClose = (source.match(/\)/g) || []).length;
    if (pOpen !== pClose) {
      notes.push(`Brackets do not balance: ${pOpen} opening, ${pClose} closing.`);
    }

    if (/\bcout\b|\bcin\b/.test(source) && !/#include\s*<iostream>/.test(source)) {
      notes.push("Uses cout or cin but does not #include <iostream>.");
    }
    if (/\bstring\b/.test(source) && !/#include\s*<string>/.test(source)) {
      notes.push("Uses string but does not #include <string>.");
    }
    if (/\bsetprecision\b/.test(source) && !/#include\s*<iomanip>/.test(source)) {
      notes.push("Uses setprecision but does not #include <iomanip>.");
    }
    if (
      /\b(cout|cin|string|endl)\b/.test(source) &&
      !/using\s+namespace\s+std\s*;/.test(source) &&
      !/std::/.test(source)
    ) {
      notes.push("No 'using namespace std;' and no std:: prefixes.");
    }
    if (!/\bint\s+main\s*\(/.test(source)) {
      notes.push("No int main() function.");
    }

    lines.forEach((line, i) => {
      if (/\bif\s*\(\s*[A-Za-z_]\w*\s*=\s*[^=]/.test(line)) {
        notes.push(`Line ${i + 1}: 'if (x = ...)' assigns instead of comparing. Did you mean '=='?`);
      }
    });

    return notes;
  }

  async function probe() {
    try {
      const res = await fetch("/api/academy/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "", stdin: "" }),
      });
      // 400 means it got as far as checking the code, so a backend is wired up.
      if (res.status === 400) return { ready: true, label: "Compiler ready" };
      if (res.status === 503) return { ready: false, label: "Compiler not configured" };
      return { ready: true, label: "Compiler ready" };
    } catch (e) {
      return { ready: false, label: "Compiler unreachable" };
    }
  }

  return {
    name: "worker-backed",

    ready() {
      if (!state) state = probe();
      return state;
    },

    async run(source, stdin) {
      const notes = lint(source);

      let res;
      try {
        res = await fetch("/api/academy/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, stdin: stdin || "" }),
        });
      } catch (e) {
        return {
          stdout: "",
          stderr: "Could not reach the compiler. Check your connection and try again.",
          exitCode: 1,
        };
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const prefix = notes.length
          ? "Before it even compiles, these look wrong:\n\n" +
            notes.map((n) => "  • " + n).join("\n") +
            "\n\n"
          : "";
        return {
          stdout: "",
          stderr: prefix + (data.error || "The compiler did not run that."),
          exitCode: 1,
        };
      }

      return {
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        exitCode: typeof data.exitCode === "number" ? data.exitCode : 0,
      };
    },
  };
})();
