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

/* Stamp a version onto every bundle URL in the manifest.

   This exists because a bug once served one of these files truncated while
   also telling the browser to keep it for a year as immutable. Fixing the
   server could not help: nothing was asking the server any more. A version in
   the query string means a bad copy can always be stepped over, for everyone,
   without asking anyone to clear their cache. Bump TOOLCHAIN_VERSION whenever
   the payload changes. */
const TOOLCHAIN_VERSION = "2";
{
  const manifestPath = `${CDN}/manifest.json`;
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  let stamped = 0;
  for (const bundle of Object.values(manifest.bundles || {})) {
    if (bundle && typeof bundle.url === "string" && !bundle.url.includes("?v=")) {
      bundle.url = `${bundle.url}?v=${TOOLCHAIN_VERSION}`;
      stamped += 1;
    }
  }
  writeFileSync(manifestPath, JSON.stringify(manifest));
  console.log(`  stamped v${TOOLCHAIN_VERSION} onto ${stamped} bundle URLs`);
}

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
