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

const VENDOR_CACHE_VERSION = "26";

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
  const shimOld = `    request = json.dumps({'cmd': cmd_str, 'cwd': cwd or ''})
    with open('/tmp/.subprocess_request', 'w') as f:
        f.write(request)`;
  const shimPatched = `    request = json.dumps({'cmd': cmd_str, 'cwd': cwd or ''}) + '\\\\n'
    for p in ['/tmp/.subprocess_request', '/tmp/__dispatch_subprocess__', '/tmp/.subprocess_stdout', '/tmp/.subprocess_stderr']:
        try:
            os.unlink(p)
        except (FileNotFoundError, OSError):
            pass
    with open('/tmp/.subprocess_request', 'w') as f:
        f.write(request)`;
  const requestParseOld = `const requestData = String(instanceRef.FS.readFile("/tmp/.subprocess_request", { encoding: "utf8" }));
            const request = JSON.parse(requestData);`;
  const requestParsePatched = `const requestData = String(instanceRef.FS.readFile("/tmp/.subprocess_request", { encoding: "utf8" }));
            const request = JSON.parse(requestData.split("\\n", 1)[0]);`;
  const requestAssignOld = `const requestData = String(instanceRef.FS.readFile("/tmp/.subprocess_request", { encoding: "utf8" }));
            request = JSON.parse(requestData);`;
  const requestAssignPatched = `const requestData = String(instanceRef.FS.readFile("/tmp/.subprocess_request", { encoding: "utf8" }));
            request = JSON.parse(requestData.split("\\n", 1)[0]);`;
  const asyncVersionProbeOld = `const subBasename = parts[0].split("/").pop() ?? parts[0];
          const isVersionCheck = parts.includes("--version") || parts.includes("-v");
          if (subBasename === "ninja" && isVersionCheck) {`;
  const asyncVersionProbePatched = `const subBasename = parts[0].split("/").pop() ?? parts[0];
          const isVersionCheck = parts.includes("--version") || parts.includes("-v");
          const versionProbeOutput = {
            clang: "clang version 23.0.0 (emception-browser)\\\\nTarget: wasm32-unknown-emscripten\\\\n",
            "clang++": "clang version 23.0.0 (emception-browser)\\\\nTarget: wasm32-unknown-emscripten\\\\n",
            "wasm-ld": "LLD 23.0.0 (compatible with GNU linkers)\\\\n",
            lld: "LLD 23.0.0 (compatible with GNU linkers)\\\\n",
            "llvm-ar": "LLVM version 23.0.0\\\\n",
            "llvm-nm": "LLVM version 23.0.0\\\\n"
          }[subBasename];
          if (isVersionCheck && versionProbeOutput) {
            console.log(\`\${LOG_PREFIX2}   [subprocess] Fast-path: \${subBasename} version probe\`);
            instanceRef.FS.writeFile("/tmp/.subprocess_stdout", versionProbeOutput);
            instanceRef.FS.writeFile("/tmp/.subprocess_stderr", "");
            if (typeof cmdStr === "string") return 0;
            instanceRef.FS.writeFile("/tmp/__dispatch_subprocess__", "0");
            return;
          }
          if (subBasename === "ninja" && isVersionCheck) {`;
  const syncVersionProbeOld = `const subBasename = parts[0].split("/").pop() ?? "";
            const isVersionCheck = parts.includes("--version") || parts.includes("-v");
            if (subBasename === "ninja" && isVersionCheck) {`;
  const syncVersionProbePatched = `const subBasename = parts[0].split("/").pop() ?? "";
            const isVersionCheck = parts.includes("--version") || parts.includes("-v");
            const versionProbeOutput = {
              clang: "clang version 23.0.0 (emception-browser)\\\\nTarget: wasm32-unknown-emscripten\\\\n",
              "clang++": "clang version 23.0.0 (emception-browser)\\\\nTarget: wasm32-unknown-emscripten\\\\n",
              "wasm-ld": "LLD 23.0.0 (compatible with GNU linkers)\\\\n",
              lld: "LLD 23.0.0 (compatible with GNU linkers)\\\\n",
              "llvm-ar": "LLVM version 23.0.0\\\\n",
              "llvm-nm": "LLVM version 23.0.0\\\\n"
            }[subBasename];
            if (isVersionCheck && versionProbeOutput) {
              console.log(\`\${LOG_PREFIX2}   [subprocess] Sync fast-path: \${subBasename} version probe\`);
              instanceRef.FS.writeFile("/tmp/.subprocess_stdout", versionProbeOutput);
              instanceRef.FS.writeFile("/tmp/.subprocess_stderr", "");
              return 0 << 8 | 0;
            }
            if (subBasename === "ninja" && isVersionCheck) {`;
  const lldPreloadOld = `const bundlesNeeded = options.hints?.bundlesNeeded ?? [];
      const graphicsBundles = ["sdl3", "raylib", "allegro"].filter((b) => bundlesNeeded.includes(b));
      try {
        await Promise.all([this.vfs.preloadBundle("cache-core"), ...graphicsBundles.map((b) => this.vfs.preloadBundle(b))]);
        const bundleList = ["cache-core", ...graphicsBundles].join(" + ");
        console.log(\`\${LOG_PREFIX2}   Preloaded \${bundleList} bundles for lld in \${elapsed(tPreload)}\`);
      } catch (e) {
        console.warn(\`\${LOG_PREFIX2}   \\u26A0\\uFE0F Failed to preload lld bundles:\`, e);
      }
      const tWarm = performance.now();
      const libPaths = [];
      for (const bundleName of ["cache-core", ...graphicsBundles]) {
        for (const fp of this.vfs.getBundleFilePaths(bundleName)) {
          libPaths.push(fp);
        }
      }`;
  const lldPreloadPatched = `const bundlesNeeded = options.hints?.bundlesNeeded ?? [];
      const graphicsBundles = ["sdl3", "raylib", "allegro"].filter((b) => bundlesNeeded.includes(b));
      const needsDebug = argv.some((a) => /^-g[1-9]?$/.test(a) || a === "-O0" || /debug/.test(a));
      const needsSanitizers = argv.some((a) => /^-fsanitize=/.test(a));
      const needsLibcVariants = argv.some((a) => /(?:legacyexcept|wasmexcept|mt|ww|tracing)/.test(a));
      const lldCacheBundles = [
        "cache-core",
        "cache-crt",
        ...needsDebug ? ["cache-debug"] : [],
        ...needsLibcVariants ? ["cache-libc-variants", "cache-libcxx-variants"] : [],
        ...needsSanitizers ? ["cache-sanitizers"] : []
      ];
      const lldBundles = [...new Set([...lldCacheBundles, ...graphicsBundles])];
      try {
        await Promise.all(lldBundles.map((b) => this.vfs.preloadBundle(b).catch((e) => {
          console.warn(\`\${LOG_PREFIX2}   Failed to preload lld bundle "\${b}":\`, e);
        })));
        const bundleList = lldBundles.join(" + ");
        console.log(\`\${LOG_PREFIX2}   Preloaded \${bundleList} bundles for lld in \${elapsed(tPreload)}\`);
      } catch (e) {
        console.warn(\`\${LOG_PREFIX2}   \\u26A0\\uFE0F Failed to preload lld bundles:\`, e);
      }
      const tWarm = performance.now();
      const libPaths = [];
      for (const bundleName of lldBundles) {
        for (const fp of this.vfs.getBundleFilePaths(bundleName)) {
          libPaths.push(fp);
        }
      }`;
  const lldCrtOld = `if (toolBasename === "wasm-ld" || toolBasename === "lld") {
      argv = argv.map((a) => a.replace("/usr/lib/emscripten/cache/sysroot/lib", "/usr/lib/emscripten/cache-lib").replace("/home/user/.emscripten_cache/sysroot/lib", "/usr/lib/emscripten/cache-lib"));
      const hadCrt1 = argv.some((a) => a.endsWith("/crt1.o"));
      argv = argv.filter((a) => !a.endsWith("/crt1.o"));
      if (hadCrt1 && !argv.some((a) => a.startsWith("--entry=") || a === "--entry" || a === "--no-entry")) {
        argv.push("--entry=main");
      }
    }`;
  const lldCrtPatched = `if (toolBasename === "wasm-ld" || toolBasename === "lld") {
      argv = argv.map((a) => a.replace("/usr/lib/emscripten/cache/sysroot/lib", "/usr/lib/emscripten/cache-lib").replace("/home/user/.emscripten_cache/sysroot/lib", "/usr/lib/emscripten/cache-lib"));
      const wantsCrtStartup = argv.some((a) => /standalonewasm/.test(a) || a === "--entry=_start");
      const hadCrt1 = argv.some((a) => a.endsWith("/crt1.o"));
      if (!wantsCrtStartup) {
        argv = argv.filter((a) => !a.endsWith("/crt1.o"));
        if (hadCrt1 && !argv.some((a) => a.startsWith("--entry=") || a === "--entry" || a === "--no-entry")) {
          argv.push("--entry=main");
        }
      } else if (hadCrt1) {
        console.log(\`\${LOG_PREFIX2}   Keeping crt1.o for WASM startup/stdio flushing\`);
      }
    }`;
  const splitBundleOld = `const response = await fetch(bundle.url);
    if (!response.ok)
      throw new Error(\`Failed to fetch bundle \${bundleName}: HTTP \${response.status}\`);
    let data = new Uint8Array(await response.arrayBuffer());`;
  const splitBundlePatched = `let data;
    const readSplitBundle = async (maxParts, originalStatus) => {
      const parts = [];
      let total = 0;
      for (let i = 0; i < maxParts; i++) {
        const partUrl = \`\${bundle.url}.part\${i}\`;
        const partResponse = await fetch(partUrl, { cache: "no-cache" });
        if (!partResponse.ok) {
          if (i === 0)
            throw new Error(\`Failed to fetch bundle \${bundleName}: HTTP \${originalStatus ?? partResponse.status}\`);
          break;
        }
        const part = new Uint8Array(await partResponse.arrayBuffer());
        parts.push(part);
        total += part.byteLength;
      }
      const joined = new Uint8Array(total);
      let offset = 0;
      for (const part of parts) {
        joined.set(part, offset);
        offset += part.byteLength;
      }
      console.log(\`\${P3}   loadBundle: reassembled split bundle "\${bundleName}" from \${parts.length} part(s) (\${fmtSize2(total)})\`);
      if (bundle.size && total !== bundle.size) {
        throw new Error(\`Split bundle \${bundleName} size mismatch: expected \${bundle.size}, got \${total}\`);
      }
      return joined;
    };
    if (bundleName === "python-runtime") {
      data = await readSplitBundle(2);
    } else {
      const response = await fetch(bundle.url, { cache: "no-cache" });
      if (response.ok) {
        data = new Uint8Array(await response.arrayBuffer());
      } else {
        data = await readSplitBundle(16, response.status);
      }
    }`;
  const ipcPathOld = `function isDynamicIpcPath(path) {
  return path === "/tmp/__dispatch_subprocess__" || path.startsWith("/tmp/.subprocess_");
}`;
  const ipcPathPatched = `function isDynamicIpcPath(path) {
  return path === "/tmp/__dispatch_subprocess__";
}`;
  const idbPutBatchOld = `async idbPutBatch(entries) {
    if (!this.idb || entries.length === 0)
      return;
    return new Promise((resolve, reject) => {
      const tx = this.idb.transaction("files", "readwrite");
      const store = tx.objectStore("files");
      for (const entry of entries) {
        store.put({ path: entry.path, data: entry.data, hash: entry.hash });
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }`;
  const idbPutBatchPatched = `async idbPutBatch(entries) {
    if (!this.idb || entries.length === 0)
      return;
    const MAX_BATCH_ENTRIES = 128;
    const MAX_BATCH_BYTES = 8 * 1024 * 1024;
    let batch = [];
    let batchBytes = 0;
    const flush = async () => {
      if (batch.length === 0)
        return;
      const current = batch;
      batch = [];
      batchBytes = 0;
      await new Promise((resolve, reject) => {
        const tx = this.idb.transaction("files", "readwrite");
        const store = tx.objectStore("files");
        for (const entry of current) {
          store.put({ path: entry.path, data: entry.data, hash: entry.hash });
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    };
    for (const entry of entries) {
      const size = entry.data?.byteLength ?? entry.data?.length ?? 0;
      if (batch.length > 0 && (batch.length >= MAX_BATCH_ENTRIES || batchBytes + size > MAX_BATCH_BYTES)) {
        await flush();
      }
      batch.push(entry);
      batchBytes += size;
    }
    await flush();
  }`;
  const extractTarOld = `async extractTar(data) {
    const idbEntries = [];
    let offset = 0;
    while (offset < data.length) {
      const header = data.slice(offset, offset + 512);
      offset += 512;
      if (header.every((b) => b === 0))
        break;
      const name = "/" + this.readTarString(header, 0, 100).replace(/\\0+$/, "");
      const size = parseInt(this.readTarString(header, 124, 12), 8) || 0;
      const typeFlag = header[156];
      const content = data.slice(offset, offset + size);
      offset += Math.ceil(size / 512) * 512;
      if (typeFlag === 48 || typeFlag === 0) {
        const fileData = new Uint8Array(content);
        const entry = this.manifest.files[name];
        if (entry) {
          idbEntries.push({ path: name, data: fileData, hash: entry.hash });
        }
        if (name.endsWith(".wasm") || name.endsWith(".mjs") || name.endsWith(".js")) {
          this.createBlobUrl(name, fileData);
        }
      }
    }
    await this.idbPutBatch(idbEntries);
  }`;
  const extractTarPatched = `async extractTar(data) {
    const { P: P3, fmtSize: fmtSize2 } = _LazyFS;
    const idbEntries = [];
    let pendingBytes = 0;
    let storedFiles = 0;
    let storedBytes = 0;
    let parsedFiles = 0;
    let offset = 0;
    let nextLogAt = 16 * 1024 * 1024;
    const flush = async () => {
      if (idbEntries.length === 0)
        return;
      const batch = idbEntries.splice(0);
      const batchBytes = pendingBytes;
      pendingBytes = 0;
      await this.idbPutBatch(batch);
      storedFiles += batch.length;
      storedBytes += batchBytes;
      console.log(\`\${P3}   extractTar: stored \${storedFiles} file(s), \${fmtSize2(storedBytes)} (offset \${fmtSize2(offset)}/\${fmtSize2(data.length)})\`);
      await new Promise((resolve) => setTimeout(resolve, 0));
    };
    while (offset < data.length) {
      const header = data.slice(offset, offset + 512);
      offset += 512;
      if (header.every((b) => b === 0))
        break;
      const name = "/" + this.readTarString(header, 0, 100).replace(/\\0+$/, "");
      const size = parseInt(this.readTarString(header, 124, 12), 8) || 0;
      const typeFlag = header[156];
      const content = data.slice(offset, offset + size);
      offset += Math.ceil(size / 512) * 512;
      if (typeFlag === 48 || typeFlag === 0) {
        const fileData = new Uint8Array(content);
        const entry = this.manifest.files[name];
        if (entry) {
          idbEntries.push({ path: name, data: fileData, hash: entry.hash });
          pendingBytes += fileData.byteLength;
          parsedFiles++;
        }
        if (name.endsWith(".wasm") || name.endsWith(".mjs") || name.endsWith(".js")) {
          this.createBlobUrl(name, fileData);
        }
        if (offset >= nextLogAt) {
          console.log(\`\${P3}   extractTar: parsed \${parsedFiles} file(s) (\${fmtSize2(offset)}/\${fmtSize2(data.length)})\`);
          nextLogAt += 16 * 1024 * 1024;
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        if (idbEntries.length >= 128 || pendingBytes >= 8 * 1024 * 1024) {
          await flush();
        }
      }
    }
    await flush();
  }`;
  const clangPreloadOld = `if (descriptor.modulePath === "/usr/lib/clang.wasm") {
      const tPreload = performance.now();
      const needsImgui = (options.hints?.bundlesNeeded ?? []).includes("sdl3");
      try {
        await Promise.all([
          this.vfs.preloadBundle("clang-headers"),
          this.vfs.preloadBundle("usr-include"),
          this.vfs.preloadBundle("sdl3"),
          this.vfs.preloadBundle("cache-core"),
          ...needsImgui ? [this.vfs.preloadBundle("imgui").catch(() => {
          })] : []
        ]);
        console.log(\`\${LOG_PREFIX2}   Preloaded clang-headers + usr-include + sdl3 + cache-core\${needsImgui ? " + imgui" : ""} bundles for clang in \${elapsed(tPreload)}\`);
      } catch (e) {
        console.warn(\`\${LOG_PREFIX2}   \\u26A0\\uFE0F Failed to preload clang bundles:\`, e);
      }
      const tWarm = performance.now();
      const bundlesToWarm = needsImgui ? ["clang-headers", "usr-include", "sdl3", "imgui"] : ["clang-headers", "usr-include", "sdl3"];`;
  const clangPreloadPatched = `if (descriptor.modulePath === "/usr/lib/clang.wasm") {
      const tPreload = performance.now();
      const needsSdl3ForClang = (options.hints?.bundlesNeeded ?? []).includes("sdl3");
      const clangBundles = [
        "clang-headers",
        "usr-include",
        ...needsSdl3ForClang ? ["sdl3", "imgui"] : []
      ];
      try {
        await Promise.all(clangBundles.map((b) => this.vfs.preloadBundle(b).catch((e) => {
          console.warn(\`\${LOG_PREFIX2}   Failed to preload clang bundle "\${b}":\`, e);
        })));
        console.log(\`\${LOG_PREFIX2}   Preloaded \${clangBundles.join(" + ")} bundles for clang in \${elapsed(tPreload)}\`);
      } catch (e) {
        console.warn(\`\${LOG_PREFIX2}   \\u26A0\\uFE0F Failed to preload clang bundles:\`, e);
      }
      const tWarm = performance.now();
      const bundlesToWarm = needsSdl3ForClang ? ["clang-headers", "usr-include", "sdl3", "imgui"] : ["clang-headers", "usr-include"];`;
  const clangHeaderWarmOld = `      const headerPaths = [];
      for (const bundleName of bundlesToWarm) {
        for (const fp of this.vfs.getBundleFilePaths(bundleName)) {
          headerPaths.push(fp);
        }
      }`;
  const clangHeaderWarmPatched = `      const isConsoleHeader = (fp) => {
        if (!fp.startsWith("/usr/include/")) return true;
        return !/^\\\\/usr\\\\/include\\\\/(?:python3\\\\.|SDL|SDL2|allegro5|X11|GL|GLES|GLES2|GLES3|KHR|webgl|raylib|imgui|mimalloc|sqlite3|bzlib|zlib|zconf|deflate|inflate|inffast|inffixed|inftrees|trees|crc32|gzguts)/.test(fp);
      };
      const headerPaths = [];
      for (const bundleName of bundlesToWarm) {
        for (const fp of this.vfs.getBundleFilePaths(bundleName)) {
          if (!needsSdl3ForClang && !isConsoleHeader(fp))
            continue;
          headerPaths.push(fp);
        }
      }`;
  const pythonWarmOld = `const shimmedModules = /* @__PURE__ */ new Set(["subprocess", "sitecustomize"]);
      const bundlesToWarm = ["python-runtime", "emscripten-core", "sdl3"];`;
  const pythonWarmPatched = `const shimmedModules = /* @__PURE__ */ new Set(["subprocess", "sitecustomize"]);
      const bundlesToWarm = ["python-runtime", "emscripten-core", ...needsSdl3ForPython ? ["sdl3"] : []];`;
  const wasiStdinOld = `const fd_close = () => 0;
    const fd_seek = () => 8;
    const stdinProvider = options.stdin ?? null;
    console.log(\`\${LOG_PREFIX2}   [WASI-STDIN] stdinProvider=\${stdinProvider ? "SET" : "NULL"}\`);`;
  const wasiStdinPatched = `const fd_close = () => 0;
    const fd_seek = () => 8;
    const stdinText = options.stdin == null ? "" : String(options.stdin);
    const stdinBytes = new TextEncoder().encode(stdinText.replace(/\\r\\n/g, "\\n"));
    let stdinOffset = 0;
    const stdinProvider = () => stdinOffset < stdinBytes.length ? stdinBytes[stdinOffset++] : null;
    console.log(\`\${LOG_PREFIX2}   [WASI-STDIN] stdinBytes=\${stdinBytes.length}\`);`;
  const wasiEntrypointOld = `const startFn = instance.exports._start;
      const mainFn = instance.exports.main;
      const initFn = instance.exports.__wasm_call_ctors;
      if (initFn) {
        try {
          initFn();
        } catch {
        }
      }
      if (startFn) {
        console.log(\`\${LOG_PREFIX2}   Calling _start()...\`);
        try {
          const result = startFn();
          if (result && typeof result.then === "function") {
            await result;
          }
        } catch (e) {
          if (e instanceof WasiExit) {
            exitCode = e.code;
          } else {
            throw e;
          }
        }
      } else if (mainFn) {
        console.log(\`\${LOG_PREFIX2}   Calling main()...\`);
        try {
          const result = mainFn(0, 0);
          if (result && typeof result.then === "function") {
            await result;
            exitCode = 0;
          } else {
            exitCode = Number(result ?? 0);
          }
        } catch (e) {
          if (e instanceof WasiExit) {
            exitCode = e.code;
          } else {
            throw e;
          }
        }
      } else {
        console.warn(\`\${LOG_PREFIX2}   No _start or main export found\`);
        exitCode = 0;
      }`;
  const wasiEntrypointPatched = `const startFn = instance.exports._start;
      const initFn = instance.exports.__wasm_call_ctors || instance.exports._initialize;
      const entryCandidates = [
        ["__main_argc_argv", instance.exports.__main_argc_argv, [programArgs.length, 0]],
        ["__main_void", instance.exports.__main_void, []],
        ["main", instance.exports.main, [programArgs.length, 0]],
        ["_main", instance.exports._main, [programArgs.length, 0]],
        ["__original_main", instance.exports.__original_main, []]
      ];
      const callEntrypoint = async (label, fn, args = []) => {
        console.log(\`\${LOG_PREFIX2}   Calling \${label}()...\`);
        try {
          const result = fn(...args);
          if (result && typeof result.then === "function") {
            await result;
            return 0;
          }
          return Number(result ?? 0);
        } catch (e) {
          if (e instanceof WasiExit) {
            return e.code;
          }
          throw e;
        }
      };
      if (startFn) {
        exitCode = await callEntrypoint("_start", startFn);
      } else {
        if (initFn) {
          try {
            initFn();
          } catch {
          }
        }
        const entry = entryCandidates.find(([, fn]) => typeof fn === "function");
        if (entry) {
          exitCode = await callEntrypoint(entry[0], entry[1], entry[2]);
        } else {
          const msg = \`No runnable WASM entrypoint found. Exports: \${exportNames.join(", ")}\`;
          console.warn(\`\${LOG_PREFIX2}   \${msg}\`);
          stderrChunks.push(msg);
          options.onStderr?.(msg);
          return {
            exitCode: 1,
            stdout: stdoutChunks.join("\\n"),
            stderr: stderrChunks.join("\\n")
          };
        }
      }`;
  const lazyFsDbOld = `constructor(manifest, dbName = "lazyfs-cache-v3")`;
  const lazyFsDbPatched = `constructor(manifest, dbName = "lazyfs-cache-v3-academy-${VENDOR_CACHE_VERSION}")`;
  const overlayDbOld = `const writeFs = new IDBFS("overlay-writes", { version: manifestVersion });`;
  const overlayDbPatched = `const writeFs = new IDBFS("overlay-writes-academy-${VENDOR_CACHE_VERSION}", { version: manifestVersion });`;
  const userFilesDbOld = `const idbFs = new IDBFS("user-files");`;
  const userFilesDbPatched = `const idbFs = new IDBFS("user-files-academy-${VENDOR_CACHE_VERSION}");`;
  const missingOutputOld = `          console.warn(\`\${LOG_PREFIX2}   \\\\u26A0 Output artifact MISSING at \${outputPath}\`);`;
  const missingOutputPatched = `          console.warn(\`\${LOG_PREFIX2}   \\\\u26A0 Output artifact MISSING at \${outputPath}\`);
          if (!isOptionalTool && outputPath !== "/dev/null") {
            const msg = \`Required output artifact missing at \${outputPath}\`;
            stderrChunks.push(msg);
            options.onStderr?.(msg);
            exitCode = 1;
          }`;
  const seedUserFilesCallOld = `    const { fileData, protectedPaths } = this.setupProcessFS(instance, moduleConfig, options);
    if (isInteractive) {`;
  const seedUserFilesCallPatched = `    const { fileData, protectedPaths } = this.setupProcessFS(instance, moduleConfig, options);
    await this.seedProcessUserFiles(instance.FS, fileData);
    if (isInteractive) {`;
  const seedUserFilesMethodOld = `    return { fileData, protectedPaths };
  }
  /* ---------------------------------------------------------------- */
  /*  WASI runtime (standalone WASM execution)                         */`;
  const seedUserFilesMethodPatched = `    return { fileData, protectedPaths };
  }
  async seedProcessUserFiles(FS, fileData, root = "/home/user") {
    const seeded = [];
    const visit = async (dir, depth) => {
      if (depth > 2)
        return;
      let entries = [];
      try {
        entries = await this.vfs.overlay.readdir(dir);
      } catch {
        return;
      }
      for (const name of entries) {
        if (!name || name === "." || name === "..")
          continue;
        const base = dir.replace(/\\\\/$/, "");
        const path = base + "/" + name;
        const stat = await this.vfs.overlay.stat(path).catch(() => null);
        if (stat?.type === "dir") {
          try {
            FS.mkdirTree(path);
          } catch {
          }
          await visit(path, depth + 1);
          continue;
        }
        const data = await this.vfs.fetchFile(path).catch(() => null);
        if (!data || data.length === 0)
          continue;
        fileData.set(path, data);
        try {
          const slash = path.lastIndexOf("/");
          if (slash > 0)
            FS.mkdirTree(path.slice(0, slash));
          FS.writeFile(path, data);
        } catch {
        }
        seeded.push(path + "(" + data.length + "B)");
      }
    };
    await visit(root, 0);
    if (seeded.length > 0) {
      console.log(LOG_PREFIX2 + "   Seeded " + seeded.length + " user file(s) into process FS: " + seeded.slice(0, 8).join(", ") + (seeded.length > 8 ? ", ..." : ""));
    }
  }
  /* ---------------------------------------------------------------- */
  /*  WASI runtime (standalone WASM execution)                         */`;
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
  let next = before;
  if (!next.includes(lazyFsDbOld)) {
    throw new Error("Could not patch LazyFS cache database name; inspect generated vendor bundle.");
  }
  next = next.replace(lazyFsDbOld, lazyFsDbPatched);
  if (!next.includes(overlayDbOld)) {
    throw new Error("Could not patch overlay database name; inspect generated vendor bundle.");
  }
  next = next.replace(overlayDbOld, overlayDbPatched);
  if (!next.includes(userFilesDbOld)) {
    throw new Error("Could not patch user-files database name; inspect generated vendor bundle.");
  }
  next = next.replace(userFilesDbOld, userFilesDbPatched);
  if (!next.includes(missingOutputOld)) {
    throw new Error("Could not patch missing output artifact handling; inspect generated vendor bundle.");
  }
  next = next.replace(missingOutputOld, missingOutputPatched);
  if (!next.includes(seedUserFilesCallOld)) {
    throw new Error("Could not patch user file seed call; inspect generated vendor bundle.");
  }
  next = next.replace(seedUserFilesCallOld, seedUserFilesCallPatched);
  if (!next.includes(seedUserFilesMethodOld)) {
    throw new Error("Could not patch user file seed method; inspect generated vendor bundle.");
  }
  next = next.replace(seedUserFilesMethodOld, seedUserFilesMethodPatched);
  if (!next.includes(shimOld)) {
    throw new Error("Could not patch subprocess shim request writer; inspect generated vendor bundle.");
  }
  next = next.replace(shimOld, shimPatched);
  if (!next.includes(requestParseOld) || !next.includes(requestAssignOld)) {
    throw new Error("Could not patch subprocess request parser; inspect generated vendor bundle.");
  }
  next = next.replaceAll(requestParseOld, requestParsePatched);
  next = next.replaceAll(requestAssignOld, requestAssignPatched);
  if (!next.includes(asyncVersionProbeOld)) {
    throw new Error("Could not patch subprocess version probe fast-path; inspect generated vendor bundle.");
  }
  next = next.replaceAll(asyncVersionProbeOld, asyncVersionProbePatched);
  if (!next.includes(syncVersionProbeOld)) {
    throw new Error("Could not patch sync subprocess version probe fast-path; inspect generated vendor bundle.");
  }
  next = next.replace(syncVersionProbeOld, syncVersionProbePatched);
  if (!next.includes(lldPreloadOld)) {
    throw new Error("Could not patch lld cache bundle preloader; inspect generated vendor bundle.");
  }
  next = next.replace(lldPreloadOld, lldPreloadPatched);
  if (!next.includes(lldCrtOld)) {
    throw new Error("Could not patch standalone crt1.o handling; inspect generated vendor bundle.");
  }
  next = next.replace(lldCrtOld, lldCrtPatched);
  next = next.replace(
    `const warmBundles = ["cache-core", ...graphicsBundles].join("+");`,
    `const warmBundles = lldBundles.join("+");`,
  );
  if (!next.includes(splitBundleOld)) {
    throw new Error("Could not patch split bundle loader; inspect generated vendor bundle.");
  }
  next = next.replace(splitBundleOld, splitBundlePatched);
  if (!next.includes(ipcPathOld)) {
    throw new Error("Could not patch subprocess IPC path classification; inspect generated vendor bundle.");
  }
  next = next.replace(ipcPathOld, ipcPathPatched);
  if (!next.includes(idbPutBatchOld)) {
    throw new Error("Could not patch IndexedDB bundle writer; inspect generated vendor bundle.");
  }
  next = next.replace(idbPutBatchOld, idbPutBatchPatched);
  if (!next.includes(extractTarOld)) {
    throw new Error("Could not patch tar extractor batching; inspect generated vendor bundle.");
  }
  next = next.replace(extractTarOld, extractTarPatched);
  if (!next.includes(clangPreloadOld)) {
    throw new Error("Could not patch clang bundle preloader; inspect generated vendor bundle.");
  }
  next = next.replace(clangPreloadOld, clangPreloadPatched);
  if (!next.includes(clangHeaderWarmOld)) {
    throw new Error("Could not patch clang header warmer; inspect generated vendor bundle.");
  }
  next = next.replace(clangHeaderWarmOld, clangHeaderWarmPatched);
  if (!next.includes(pythonWarmOld)) {
    throw new Error("Could not patch Python bundle warmer; inspect generated vendor bundle.");
  }
  next = next.replace(pythonWarmOld, pythonWarmPatched);
  if (!next.includes(wasiStdinOld)) {
    throw new Error("Could not patch WASI stdin handling; inspect generated vendor bundle.");
  }
  next = next.replace(wasiStdinOld, wasiStdinPatched);
  if (!next.includes(wasiEntrypointOld)) {
    throw new Error("Could not patch WASI entrypoint handling; inspect generated vendor bundle.");
  }
  next = next.replace(wasiEntrypointOld, wasiEntrypointPatched);
  next = next.replaceAll("WASM may be stuck", "waiting for Asyncify/subprocess completion");
  if (!old.test(next)) {
    throw new Error("Could not patch worker-entry.js Python pre-warm block; inspect generated vendor bundle.");
  }
  writeFileSync(worker, next.replace(old, patched));
}

cpSync("node_modules/emception/cdn", CDN, { recursive: true });

/* python-runtime is kept in the CDN for optional em++ compatibility, but the
   COS1511 academy runner bypasses it with direct clang++ + wasm-ld. At 25.17
   MiB it is fractionally over Cloudflare's 25 MiB per-file cap, so it ships as
   two halves. The Worker can stream the original path, and the browser loader
   can reassemble .partN files if the original path is served directly as 404. */
const python = `${CDN}/usr/lib/python-runtime.tar.br`;
if (existsSync(python)) {
  const buf = readFileSync(python);
  const half = Math.ceil(buf.length / 2);
  writeFileSync(`${python}.part0`, buf.subarray(0, half));
  writeFileSync(`${python}.part1`, buf.subarray(half));
  rmSync(python);
  console.log(
    `  split python-runtime.tar.br (${(buf.length / 1048576).toFixed(2)} MiB) into 2 parts; ` +
      `the Worker or browser loader rejoins them at request time`,
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
