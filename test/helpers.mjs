/* Shared machinery for the Studio test suites.
 *
 * Two things here are worth knowing about before changing anything.
 *
 * First, the browser suites drive the real editor over a real static server
 * rather than a mock. Every bug these suites have caught so far — an import
 * that dropped every photo, a cover geometry that disagreed with the
 * resolution warning, an invisible layer that swallowed every tap meant for a
 * photo frame — was a bug that only exists once the page is actually running.
 * A mock would have passed all four.
 *
 * Second, the Worker is one 12,000-line module with no exports beyond its
 * default handler, so the server-side checks lift the pieces they need out of
 * the source text. That is a deliberate trade: adding named exports to a
 * Worker entry point to suit a test is a change to production, and the
 * extraction fails loudly the moment a marker moves.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { deflateSync, crc32 } from "node:zlib";

export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const WORK = join(tmpdir(), "beplugged-studio-tests");
mkdirSync(WORK, { recursive: true });

/* --- reporting --------------------------------------------------------- */

let failures = 0;
let total = 0;

export function suite(name) {
	console.log(`\n${name}`);
}

export function check(name, pass, detail) {
	total += 1;
	if (!pass) failures += 1;
	const line = `  ${pass ? "ok  " : "FAIL"}  ${name}`;
	console.log(detail === undefined ? line : `${line}  ${detail}`);
	return pass;
}

export function failed() {
	return failures;
}

export function report() {
	console.log(
		failures
			? `\n${failures} of ${total} checks FAILED`
			: `\nall ${total} checks pass`,
	);
	return failures;
}

/* --- lifting testable pieces out of the sources ------------------------ */

function slice(source, from, to, what) {
	const a = source.indexOf(from);
	if (a === -1) throw new Error(`test extraction: could not find the start of ${what}`);
	const b = source.indexOf(to, a);
	if (b === -1) throw new Error(`test extraction: could not find the end of ${what}`);
	return source.slice(a, b);
}

async function importSource(code, filename) {
	const path = join(WORK, filename);
	writeFileSync(path, code);
	return import(`${path}?v=${Date.now()}`);
}

/** book-render.js is a plain IIFE taking a global, so it loads with a stub. */
export function loadStudioBook() {
	const src = readFileSync(join(ROOT, "public/studio/book-render.js"), "utf8");
	const stub = {};
	new Function("window", src)(stub);
	if (!stub.StudioBook) throw new Error("book-render.js did not define StudioBook");
	return stub.StudioBook;
}

/** The design validator and the tables it checks against. */
export async function loadWorkerValidation() {
	const src = readFileSync(join(ROOT, "src/index.js"), "utf8");
	const code = [
		slice(src, "class RequestError extends Error {", "export default {", "RequestError"),
		slice(src, "const STUDIO_SIZES = {", "async function hashStudioToken", "the STUDIO_* tables"),
		slice(src, "function studioSafeName(value) {", "// Validates the book", "studioSafeName"),
		slice(src, "function normalizeStudioDesign(raw) {", "function normalizeStudioCustomer", "normalizeStudioDesign"),
		"export { normalizeStudioDesign, RequestError, STUDIO_COVER_DESIGNS, STUDIO_ENDPAPER_LAYOUTS, STUDIO_ENDPAPER_PATTERNS, STUDIO_TEXT_FONTS, STUDIO_TEXT_SHAPES, STUDIO_UV_PATTERNS, STUDIO_UV_FILE_TYPES };",
	].join("\n");
	return importSource(code, "worker-validation.mjs");
}

/** The photo type helpers from the editor. */
export async function loadContentType() {
	const src = readFileSync(join(ROOT, "public/studio/editor.js"), "utf8");
	const code =
		slice(src, "\tvar SENDABLE_TYPES", "\tfunction addFiles", "contentTypeFor") +
		"\nexport { contentTypeFor, SENDABLE_TYPES };\n";
	return importSource(code, "content-type.mjs");
}

/* --- fixtures ---------------------------------------------------------- */

function png(path, w, h, rgb) {
	const raw = Buffer.concat(
		Array.from({ length: h }, () =>
			Buffer.concat([Buffer.from([0]), Buffer.concat(Array.from({ length: w }, () => Buffer.from(rgb)))]),
		),
	);
	const chunk = (type, data) => {
		const body = Buffer.concat([Buffer.from(type), data]);
		const len = Buffer.alloc(4);
		len.writeUInt32BE(data.length);
		const sum = Buffer.alloc(4);
		sum.writeUInt32BE(crc32(body) >>> 0);
		return Buffer.concat([len, body, sum]);
	};
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(w, 0);
	ihdr.writeUInt32BE(h, 4);
	ihdr[8] = 8;
	ihdr[9] = 2;
	writeFileSync(
		path,
		Buffer.concat([
			Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			chunk("IHDR", ihdr),
			chunk("IDAT", deflateSync(raw)),
			chunk("IEND", Buffer.alloc(0)),
		]),
	);
}

/** Three small real PNGs. Real, because createImageBitmap has to decode them. */
export function photoFixtures() {
	const colours = [[200, 60, 40], [40, 160, 90], [60, 90, 200]];
	return colours.map((rgb, i) => {
		const path = join(WORK, `shot${i + 1}.png`);
		png(path, 40, 30, rgb);
		return path;
	});
}

/* --- a static server over public/ -------------------------------------- */

const TYPES = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".png": "image/png",
	".webmanifest": "application/manifest+json",
};

export function startStatic(port = 8791) {
	const server = createServer((req, res) => {
		const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
		try {
			const body = readFileSync(join(ROOT, "public", path));
			res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream" });
			res.end(body);
		} catch {
			res.writeHead(404).end("not found");
		}
	});
	return new Promise((resolve) => {
		server.listen(port, "127.0.0.1", () => resolve({
			base: `http://127.0.0.1:${port}`,
			stop: () => new Promise((done) => server.close(done)),
		}));
	});
}

/* --- the browser ------------------------------------------------------- */

export async function launchBrowser() {
	const { chromium } = await import("playwright-core");
	try {
		// Every host but the loopback is pointed at a port nothing listens on, so
		// the connection is refused at once. The editor's stylesheet asks Google
		// for a webfont, and a stylesheet blocks the document: on a machine with
		// no route out the whole suite fails on a navigation timeout and reports
		// the network rather than the code. A refused connection is instant where
		// a failed name lookup is not, which is why this maps rather than
		// NOTFOUNDs.
		return await chromium.launch({
			args: ["--host-resolver-rules=MAP * 127.0.0.1:1, EXCLUDE 127.0.0.1"],
		});
	} catch (error) {
		throw new Error(
			"Chromium is not installed for playwright-core. Run:\n" +
			"    npx playwright install chromium\n" +
			`(${error.message.split("\n")[0]})`,
		);
	}
}

/* Chromium here shares the machine with whatever else is running, and a cold
   navigation has been timed at twenty-three seconds. The suites are checking
   what the editor does, not how fast this box does it, so the clock is set
   well past the point where slowness stops being interesting. */
export const PATIENCE = 60000;

/** Everything a page needs before the first navigation. */
export async function preparePage(page) {
	page.setDefaultTimeout(PATIENCE);
	page.setDefaultNavigationTimeout(PATIENCE);
	/* The editor's stylesheet asks Google for a webfont, and launchBrowser
	   refuses every host but the loopback. Chromium reports that refusal on the
	   console, but not until some point after the document is ready — so which
	   suite it lands in is a race, and the two that lost it failed on the
	   harness's own noise rather than on anything the editor did. Answering the
	   request with an empty stylesheet settles it: the refusal never happens, so
	   there is nothing to report late. Only the lettering depends on the
	   webfont, and no suite here measures that. */
	await page.route(
		(url) => url.hostname !== "127.0.0.1",
		(route) => route.fulfill({ status: 200, contentType: "text/css", body: "" }),
	);
	return page;
}

/* The editor's stylesheet pulls a webfont from Google. "load" therefore waits
   on a request to the open internet, so on a machine with no route out every
   suite fails on a timeout and reports the network instead of the code. The
   readiness that actually matters is the editor having built itself, which is
   what the wait below checks — so navigation only needs the document. */
export const READY = { waitUntil: "domcontentloaded" };

/** A page that records anything the browser complains about. */
export async function openEditor(browser, base) {
	const page = await preparePage(await browser.newPage({ viewport: { width: 1400, height: 950 } }));
	const problems = [];
	page.on("pageerror", (e) => problems.push(`uncaught: ${e.message}`));
	page.on("console", (m) => { if (m.type() === "error") problems.push(`console: ${m.text()}`); });
	await page.addInitScript(`
		window.__unhandled = [];
		addEventListener("unhandledrejection", function (e) {
			window.__unhandled.push(String((e.reason && e.reason.message) || e.reason));
		});
	`);
	await page.goto(`${base}/studio/editor.html`, READY);
	await page.waitForFunction("document.querySelectorAll('#cover-design-options .ed-choice').length > 0");
	return { page, problems };
}

/** Saving is debounced and every edit restarts the timer, so waiting for the
 *  dock to read "Saved" matches instantly if an earlier edit already saved.
 *  Blank it first, then wait for the save that follows. */
export async function waitForSave(page) {
	await page.evaluate(() => { document.getElementById("dock-status").textContent = ""; });
	await page.waitForFunction(
		"document.getElementById('dock-status').textContent.indexOf('Saved in this browser') === 0",
		null, { timeout: 5000 },
	);
}

export async function addPhotos(page, files) {
	await page.click('.ed-step[data-step="photos"]');
	await page.setInputFiles("#photo-input", files);
	await page.waitForFunction(
		`document.querySelectorAll('#photo-list .ed-thumb').length === ${files.length}`,
		null, { timeout: 10000 },
	);
	await page.click('.ed-step[data-step="arrange"]');
}
