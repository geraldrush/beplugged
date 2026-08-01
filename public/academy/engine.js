/* The run engine.
   ---------------------------------------------------------------------------
   Everything the page knows about running code is the contract below:

       CodeRunner.ready()            -> Promise<{ ready:boolean, label:string }>
       CodeRunner.run(source, stdin) -> Promise<{ stdout, stderr, exitCode }>

   Swapping in the real compiler means replacing this file and nothing else.
   The page never assumes where compilation happens.

   Currently: no compiler is connected. This deliberately refuses to run rather
   than approximating C++. A teaching tool that is subtly wrong about
   setprecision or string::erase would cost students marks, which is worse than
   one that plainly says it is not ready yet.
   --------------------------------------------------------------------------- */

window.CodeRunner = (function () {
  const NOT_CONNECTED =
    "The C++ compiler is not connected to this page yet.\n\n" +
    "Everything else works: pick an exercise, read the question, write your " +
    "answer and it is saved in this browser. When the compiler is wired in, " +
    "Run will compile and execute exactly what you have written.\n\n" +
    "In the meantime, compile in Code::Blocks as usual.";

  // Cheap checks that catch the mistakes these papers are full of, so the
  // page is useful before the compiler lands. This is not a parser and does
  // not pretend to be: it never reports success, only likely problems.
  function lint(source) {
    const notes = [];
    const lines = source.split("\n");

    const opens = (source.match(/\{/g) || []).length;
    const closes = (source.match(/\}/g) || []).length;
    if (opens !== closes) {
      notes.push(`Braces do not balance: ${opens} opening, ${closes} closing.`);
    }

    const parenOpen = (source.match(/\(/g) || []).length;
    const parenClose = (source.match(/\)/g) || []).length;
    if (parenOpen !== parenClose) {
      notes.push(`Brackets do not balance: ${parenOpen} opening, ${parenClose} closing.`);
    }

    if (/\bcout\b/.test(source) && !/#include\s*<iostream>/.test(source)) {
      notes.push("Uses cout but does not #include <iostream>.");
    }
    if (/\bstring\b/.test(source) && !/#include\s*<string>/.test(source)) {
      notes.push("Uses string but does not #include <string>.");
    }
    if (/\bsetprecision\b/.test(source) && !/#include\s*<iomanip>/.test(source)) {
      notes.push("Uses setprecision but does not #include <iomanip>.");
    }
    if (/\b(cout|cin|string|endl)\b/.test(source) && !/using\s+namespace\s+std\s*;/.test(source) && !/std::/.test(source)) {
      notes.push("No 'using namespace std;' and no std:: prefixes.");
    }
    if (!/\bint\s+main\s*\(/.test(source)) {
      notes.push("No int main() function.");
    }

    // if (x = 0) is the classic COS1511 trap, and it is in the Jan paper.
    lines.forEach((line, i) => {
      const m = line.match(/\bif\s*\(\s*[A-Za-z_]\w*\s*=\s*[^=]/);
      if (m) {
        notes.push(`Line ${i + 1}: 'if (x = ...)' assigns instead of comparing. Did you mean '=='?`);
      }
    });

    // Statements that plainly need a semicolon and do not have one.
    lines.forEach((line, i) => {
      const t = line.trim();
      if (!t || t.startsWith("//") || t.startsWith("#") || t.startsWith("*")) return;
      if (/[{};:]$/.test(t) || t.startsWith("}") || /^(if|else|for|while|switch|do|case|default)\b/.test(t)) return;
      if (/^(cout|cin|return|int|float|double|char|bool|string|const)\b/.test(t)) {
        notes.push(`Line ${i + 1}: looks like a statement with no semicolon — "${t.slice(0, 46)}"`);
      }
    });

    return notes;
  }

  return {
    name: "none",

    ready() {
      return Promise.resolve({ ready: false, label: "Compiler not connected" });
    },

    run(source) {
      const notes = lint(source);
      const found = notes.length
        ? "Before it even compiles, these look wrong:\n\n" +
          notes.map((n) => "  • " + n).join("\n") +
          "\n\n"
        : "";
      return Promise.resolve({
        stdout: "",
        stderr: found + NOT_CONNECTED,
        exitCode: 1,
      });
    },
  };
})();
