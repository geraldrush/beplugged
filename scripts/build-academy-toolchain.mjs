/* Builds the in-browser C++ toolchain into public/academy/.
   Not committed: the payload is ~126MB, so it is rebuilt from node_modules
   with `npm run academy:toolchain` before a deploy that needs it.

   Two things make this necessary rather than a plain copy:
   - the browser adapter is published for a bundler, using Vite `?raw`
     imports, so it must be bundled with a text loader for .py
   - the worker entry is a separate module that needs its own bundle, and
     the main bundle references it without a file extension */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";

const OUT = "public/academy";
const CDN = `${OUT}/cdn`;
const VENDOR = `${OUT}/vendor`;
const CAP = 25 * 1024 * 1024; // Cloudflare's per-file static asset limit

if (!existsSync("node_modules/emception/cdn")) {
  console.error("Run `npm install` first: node_modules/emception is missing.");
  process.exit(1);
}

rmSync(CDN, { recursive: true, force: true });
rmSync(VENDOR, { recursive: true, force: true });
mkdirSync(CDN, { recursive: true });
mkdirSync(VENDOR, { recursive: true });
mkdirSync(".build", { recursive: true });

// The terminal bridge is never constructed headless, so it is stubbed out
// rather than pulling xterm into the bundle.
writeFileSync(".build/xterm-stub.js",
  'export class TTYBridge { constructor(){ throw new Error("headless: no terminal"); } }\n' +
  "export default { TTYBridge };\n");
writeFileSync(".build/entry.mjs", "export { createEmception } from '@gameguild/emception-browser';\n");

const VENDOR_CACHE_VERSION = "11";

const esbuild = (entry, outfile) =>
  execFileSync("npx", ["esbuild", entry, "--bundle", "--format=esm", "--platform=browser",
    "--loader:.py=text", "--loader:.txt=text", "--loader:.wasm=binary",
    "--alias:@gameguild/emception-xterm=./.build/xterm-stub.js",
    `--outfile=${outfile}`, "--allow-overwrite"], { stdio: "inherit" });

esbuild(".build/entry.mjs", `${VENDOR}/emception.bundle.js`);
esbuild("node_modules/@gameguild/emception-browser/dist/worker-entry.js", `${VENDOR}/worker-entry.js`);

// The main bundle spawns the worker with an extensionless URL, which a
// browser will not load as a module.
const main = `${VENDOR}/emception.bundle.js`;
writeFileSync(main, readFileSync(main, "utf8")
  .replaceAll('new URL("./worker-entry", import.meta.url)', `new URL("./worker-entry.js?v=${VENDOR_CACHE_VERSION}", import.meta.url)`)
  .replaceAll('new URL("./worker-entry.js", import.meta.url)', `new URL("./worker-entry.js?v=${VENDOR_CACHE_VERSION}", import.meta.url)`));

const worker = `${VENDOR}/worker-entry.js`;
{
  const before = readFileSync(worker, "utf8");
  const old = /      const BATCH = 100;\n      let warmed = 0;\n      for \(let i = 0; i < pyPaths\.length; i \+= BATCH\) \{\n        const batch = pyPaths\.slice\(i, i \+ BATCH\);\n        const results = await Promise\.all\(batch\.map\(\(p\) => this\.vfs\.fetchFile\(p\)\.catch\(\(\) => null\)\)\);\n        for \(let j = 0; j < batch\.length; j\+\+\) \{\n          if \(results\[j\]\) \{\n            try \{\n              instance\.FS\.writeFile\(batch\[j\], results\[j\]\);\n              warmed\+\+;\n            \} catch \{\n            \}\n          \}\n        \}\n      \}\n      console\.log\(`\$\{LOG_PREFIX2\}   Pre-warmed \$\{warmed\}\/\$\{pyPaths\.length\} python files in \$\{elapsed\(tWarm\)\}`\);/;
  const patched = `      const BATCH = 100;
      let warmed = 0;
      let fsWarmed = 0;
      const fsWriteFailures = [];
      for (let i = 0; i < pyPaths.length; i += BATCH) {
        const batch = pyPaths.slice(i, i + BATCH);
        const results = await Promise.all(batch.map((p) => this.vfs.fetchFile(p).catch(() => null)));
        for (let j = 0; j < batch.length; j++) {
          const data = results[j];
          if (data) {
            fileData.set(batch[j], data);
            warmed++;
            try {
              instance.FS.writeFile(batch[j], data);
              fsWarmed++;
            } catch (e) {
              if (fsWriteFailures.length < 24) {
                fsWriteFailures.push(batch[j]);
              }
            }
          }
        }
      }
      console.log(\`\${LOG_PREFIX2}   Pre-warmed \${warmed}/\${pyPaths.length} python files into VFSFS fileData in \${elapsed(tWarm)} (FS.writeFile accepted \${fsWarmed})\`);
      if (fsWriteFailures.length > 0) {
        console.warn(\`\${LOG_PREFIX2}   FS.writeFile skipped \${fsWriteFailures.length} pre-warmed Python path(s): \${fsWriteFailures.join(", ")}\`);
      }
      const resolveManifestSymlink = (from, target) => {
        if (target.startsWith("/")) return target;
        const base = from.slice(0, from.lastIndexOf("/") + 1);
        const parts = \`\${base}\${target}\`.split("/");
        const resolved = [];
        for (const part of parts) {
          if (!part || part === ".") continue;
          if (part === "..") resolved.pop();
          else resolved.push(part);
        }
        return \`/\${resolved.join("/")}\`;
      };
      const manifestFiles = this.vfs.manifest?.files || this.vfs.lazyFs?.manifest?.files || {};
      const pythonStdlibAliases = Object.entries(manifestFiles)
        .filter(([path, entry]) => path.startsWith("/usr/lib/python3.13/") && path.endsWith(".py") && entry?.symlink)
        .map(([path, entry]) => [path, resolveManifestSymlink(path, entry.symlink)])
        .filter(([, target]) => target.startsWith("/usr/lib/python3.12/") && target.endsWith(".py"));
      let aliasSeeded = 0;
      const aliasFailures = [];
      for (const [py313, py312] of pythonStdlibAliases) {
        const data = fileData.get(py313) || fileData.get(py312) || await this.vfs.fetchFile(py312).catch(() => null);
        if (data) {
          fileData.set(py313, data);
          aliasSeeded++;
        } else if (aliasFailures.length < 24) {
          aliasFailures.push(\`\${py313} -> \${py312}\`);
        }
      }
      console.log(\`\${LOG_PREFIX2}   Seeded \${aliasSeeded}/\${pythonStdlibAliases.length} Python 3.13 stdlib symlink source files from python3.12 targets\`);
      if (aliasFailures.length > 0) {
        console.warn(\`\${LOG_PREFIX2}   Missing Python stdlib alias data: \${aliasFailures.join(", ")}\`);
      }`;
  if (!old.test(before)) {
    throw new Error("Could not patch worker-entry.js Python pre-warm block; inspect generated vendor bundle.");
  }
  writeFileSync(worker, before.replace(old, patched));
}

cpSync("node_modules/emception/cdn", CDN, { recursive: true });

/* python-runtime drives em++, which is what turns a compiled program into
   something runnable with working stdout. It cannot be dropped. At 25.17 MiB
   it is fractionally over Cloudflare's 25 MiB per-file cap, so it ships as two
   halves and the Worker streams them back as one file at the original path. */
const python = `${CDN}/usr/lib/python-runtime.tar.br`;
if (existsSync(python)) {
  const buf = readFileSync(python);
  const half = Math.ceil(buf.length / 2);
  writeFileSync(`${python}.part0`, buf.subarray(0, half));
  writeFileSync(`${python}.part1`, buf.subarray(half));
  rmSync(python);
  console.log(
    `  split python-runtime.tar.br (${(buf.length / 1048576).toFixed(2)} MiB) into 2 parts; ` +
      `the Worker rejoins them at request time`,
  );
}

/* Bundle URLs are deliberately NOT versioned.

   A ?v= stamp was tried here and broke the loader: bundles fetched and
   reported themselves extracted, then their files could not be found, because
   the extracted entries are keyed off the bundle URL and the query string no
   longer matched. Cache-busting has to happen some other way. */

const over = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p);
    else if (statSync(p).size > CAP) over.push(p);
  }
};
walk(OUT);
if (over.length) {
  console.error("These exceed the 25 MiB per-file cap and will fail to deploy:");
  over.forEach((f) => console.error("  " + f));
  process.exit(1);
}
console.log("Toolchain built. Files are gitignored; rerun this before deploying.");
