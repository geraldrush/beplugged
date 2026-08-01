/* Builds the in-browser C++ toolchain into public/academy/.
   Not committed: the payload is ~126MB, so it is rebuilt from node_modules
   with `npm run academy:toolchain` before a deploy that needs it.

   Two things make this necessary rather than a plain copy:
   - the browser adapter is published for a bundler, using Vite `?raw`
     imports, so it must be bundled with a text loader for .py
   - the worker entry is a separate module that needs its own bundle, and
     the main bundle references it without a file extension */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, statSync } from "node:fs";
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
  .replaceAll('new URL("./worker-entry", import.meta.url)', 'new URL("./worker-entry.js", import.meta.url)'));

cpSync("node_modules/emception/cdn", CDN, { recursive: true });

// python-runtime drives emcc. We invoke clang directly, and it is the only
// file over Cloudflare's per-file cap, so it is left out.
const python = `${CDN}/usr/lib/python-runtime.tar.br`;
if (existsSync(python)) {
  console.log(`  omitting python-runtime.tar.br (${(statSync(python).size / 1048576).toFixed(1)} MiB, over the ${CAP / 1048576} MiB cap)`);
  rmSync(python);
}

const over = [];
const walk = (dir) => {
  for (const e of readFileSync ? require("node:fs").readdirSync(dir, { withFileTypes: true }) : []) {
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
