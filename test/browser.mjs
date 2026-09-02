/* The suites that drive the real editor in Chromium.
 *
 * These exist because every serious bug found in this editor so far only
 * existed once the page was running: an import that silently dropped every
 * photo when one write failed, a cover geometry that disagreed with the
 * resolution warning, and an invisible layer that swallowed every tap meant
 * for a photo frame. None of the three is visible in the source.
 */
import {
	suite, check, photoFixtures, startStatic, launchBrowser,
	openEditor, waitForSave, addPhotos, loadStudioBook, READY, preparePage,
} from "./helpers.mjs";

const DESIGNS = ["full-bleed", "title-band", "inset-window", "split-block", "collage", "plate"];
const CARD = (n) => `.ed-page:nth-of-type(${n})`;          // 1 = cover, 2 = front end sheet, 3 = page 1
const PAGE1 = CARD(3);
const pickDesign = (page, key) => page.evaluate(([k, order]) => {
	document.querySelectorAll("#cover-design-options .ed-choice")[order.indexOf(k)].click();
}, [key, DESIGNS]);

/* --- covers, and adjusting a photo in its frame ------------------------ */

async function covers(browser, base, files) {
	const { page, problems } = await openEditor(browser, base);
	const SB = loadStudioBook();
	const SBUV = SB.UV_PATTERNS;

	suite("Covers: the six designs");
	check("the picker offers six",
		(await page.$$("#cover-design-options .ed-choice")).length === 6);
	const thumbs = await page.$$eval("#cover-design-options .ed-cover-thumb", (n) => n.map((e) => e.className));
	check("each has a drawn thumbnail", DESIGNS.every((d) => thumbs.some((c) => c.includes(`is-${d}`))));

	await addPhotos(page, files);

	suite("End sheets: designing one");
	const frontEndSheet = CARD(2);
	const endSheetSeen = await page.evaluate((selector) => {
		const card = document.querySelector(selector);
		const sheet = card.querySelector(".ed-endpaper-sheet");
		const r = sheet.getBoundingClientRect();
		return {
			label: card.querySelector(".ed-page-label").textContent,
			ratio: Math.round((r.width / r.height) * 1000) / 1000,
			layouts: card.querySelectorAll(".ed-layout").length,
			patterns: card.querySelectorAll(".ed-text-toggle").length,
			swatches: card.querySelectorAll(".ed-swatch").length,
		};
	}, frontEndSheet);
	check("the front end sheet is A3 landscape for an A4 portrait book",
		/Front end sheet/.test(endSheetSeen.label) &&
		/A3 landscape/.test(endSheetSeen.label) &&
		Math.abs(endSheetSeen.ratio - (420 / 297)) < 0.02,
		`${endSheetSeen.label}, ratio ${endSheetSeen.ratio}`);
	check("it offers layout, pattern and colour controls",
		endSheetSeen.layouts === 5 && endSheetSeen.patterns === 5 && endSheetSeen.swatches === 6,
		`${endSheetSeen.layouts}/${endSheetSeen.patterns}/${endSheetSeen.swatches}`);

	await page.evaluate((selector) => {
		const card = document.querySelector(selector);
		[...card.querySelectorAll(".ed-layout")].find((b) => b.title === "One photo").click();
	}, frontEndSheet);
	await page.waitForTimeout(200);
	await page.click("#tray-list .ed-thumb");
	await page.click(`${frontEndSheet} .ed-slot`);
	await page.waitForTimeout(250);
	check("a photo can be placed on the end sheet",
		(await page.$(`${frontEndSheet} .ed-slot.is-filled img`)) !== null);

	await page.evaluate((selector) => {
		const card = document.querySelector(selector);
		[...card.querySelectorAll(".ed-text-toggle")].find((b) => b.textContent.trim() === "Dots").click();
		[...card.querySelectorAll(".ed-swatch")].find((b) => b.title === "Sage").click();
	}, frontEndSheet);
	await page.waitForTimeout(250);
	const endSheetStyled = await page.$eval(`${frontEndSheet} .ed-endpaper-sheet`, (e) => ({
		cls: e.className,
		bg: e.style.backgroundColor,
	}));
	check("pattern and paper colour apply to the end sheet",
		endSheetStyled.cls.includes("ed-endpaper-pattern-dots") && /rgb\(223, 232, 220\)/.test(endSheetStyled.bg),
		`${endSheetStyled.cls}, ${endSheetStyled.bg}`);

	await page.click("#dock-preview");
	await page.waitForTimeout(300);
	await page.click("#preview-next");
	await page.waitForTimeout(250);
	const endPreview = await page.evaluate(() => ({
		label: document.getElementById("preview-label").textContent,
		endpaper: Boolean(document.querySelector("#preview-spread .ed-preview-leaf.is-endpaper")),
		images: document.querySelectorAll("#preview-spread .ed-preview-leaf.is-endpaper img").length,
	}));
	check("the preview turns from cover to front end sheet",
		endPreview.endpaper && /Front end sheet/.test(endPreview.label) && /A3 landscape/.test(endPreview.label) && endPreview.images === 1,
		`${endPreview.label}, ${endPreview.images} image(s)`);
	await page.keyboard.press("Escape");
	await page.waitForTimeout(150);
	await page.evaluate((selector) => {
		const card = document.querySelector(selector);
		[...card.querySelectorAll(".ed-slot-tools .ed-mini")]
			.find((b) => b.textContent.trim() === "✕").click();
	}, frontEndSheet);
	await page.waitForTimeout(200);

	for (const key of DESIGNS) {
		await pickDesign(page, key);
		await page.waitForTimeout(120);
		const seen = await page.evaluate(() => {
			const frame = document.querySelector(".ed-cover-frame");
			const box = frame.getBoundingClientRect();
			const slot = frame.querySelector(".ed-slot").getBoundingClientRect();
			return {
				cls: frame.className,
				frames: frame.querySelectorAll(".ed-slot").length,
				w: Math.round((slot.width / box.width) * 100),
				h: Math.round((slot.height / box.height) * 100),
			};
		});
		// The rendered picture area has to match the frames array in
		// book-render, because that array is what decides whether a photo is
		// called too small. A layout disagreeing with it makes the one number
		// the customer is trusting into a guess. Writing this in percentages
		// rather than fr silently broke exactly this.
		const want = SB.coverDesignFor(key).frames[0];
		const near = (a, b) => Math.abs(a - b) <= 1.5;
		check(`${key.padEnd(13)} ${seen.frames} frame(s), first frame ${seen.w}% x ${seen.h}%`,
			seen.cls.includes(`ed-cover-design-${key}`) &&
			seen.frames === (key === "collage" ? 3 : 1) &&
			near(seen.w, want.w * 100) && near(seen.h, want.h * 100),
			`resolution warning assumes ${Math.round(want.w * 100)}% x ${Math.round(want.h * 100)}%`);
	}

	suite("Covers: filling and changing one");
	await pickDesign(page, "collage");
	await page.waitForTimeout(120);
	await page.click("#autofill");
	await page.waitForTimeout(300);
	check("filling the book fills all three collage frames",
		(await page.$$(".ed-cover-frame .ed-slot.is-filled")).length === 3);

	await page.click("#dock-preview");
	await page.waitForTimeout(400);
	const preview = await page.evaluate(() => {
		const print = document.querySelector("#preview-spread .ed-cover-print");
		const text = document.querySelector("#preview-spread .ed-preview-cover-text");
		return { cls: print.className, frames: print.querySelectorAll(".ed-preview-slot").length,
			images: print.querySelectorAll("img").length, text: text ? text.className : "none" };
	});
	check("the preview draws the same cover",
		preview.cls.includes("ed-cover-design-collage") && preview.frames === 3 && preview.images === 3);
	check("and puts the title where the design says", /is-band/.test(preview.text), preview.text);
	await page.keyboard.press("Escape");
	await page.waitForTimeout(200);

	suite("Covers: sizing, turning and centring a photo");
	// This click also guards a regression: the text layer covers the whole
	// picture area, and if it takes pointer events it swallows every tap
	// meant for a frame — which broke placing photos altogether.
	await page.click(".ed-cover-frame .ed-slot.is-filled .ed-mini");
	await page.waitForTimeout(200);
	check("the adjust bar opens under the card", (await page.$(".ed-adjust")) !== null);

	const style = () => page.$eval(".ed-cover-frame .ed-slot.is-adjusting img",
		(e) => ({ t: e.style.transform, fit: e.style.objectFit, pos: e.style.objectPosition, cls: e.className }));
	const pressAdjust = (label) => page.evaluate((l) =>
		[...document.querySelectorAll(".ed-adjust .ed-btn")].find((b) => b.textContent.trim() === l).click(), label);

	await page.$eval(".ed-adjust input[type=range]", (el) => {
		el.value = "2.4"; el.dispatchEvent(new Event("input", { bubbles: true }));
	});
	await page.waitForTimeout(150);
	check("the slider resizes it", /scale\(2\.4\)/.test((await style()).t), (await style()).t);

	await pressAdjust("Show all of it"); await page.waitForTimeout(200);
	check("show-all stops cropping it", (await style()).fit === "contain");

	await pressAdjust("Turn"); await page.waitForTimeout(200);
	const turned = await style();
	check("turning is a quarter turn, sized to the frame",
		/rotate\(90deg\)/.test(turned.t) && turned.cls.includes("is-turned"), turned.t);

	await pressAdjust("Recentre"); await page.waitForTimeout(200);
	const centred = await style();
	check("recentre puts it back in the middle at full size",
		/scale\(1\)/.test(centred.t) && centred.pos === "50% 50%");

	await waitForSave(page);
	await page.reload();
	await page.waitForTimeout(900);
	await page.click('.ed-step[data-step="arrange"]');
	await page.waitForTimeout(300);
	const kept = await page.evaluate(() => {
		const frame = document.querySelector(".ed-cover-frame");
		const img = frame.querySelector(".ed-slot.is-filled img");
		return { cls: frame.className, filled: frame.querySelectorAll(".ed-slot.is-filled").length,
			fit: img.style.objectFit, t: img.style.transform };
	});
	check("design and frames survive a reload", kept.cls.includes("collage") && kept.filled === 3);
	check("so do the fit and the turn", kept.fit === "contain" && /rotate\(90deg\)/.test(kept.t));

	let dialog = null;
	page.once("dialog", async (d) => { dialog = d.message(); await d.dismiss(); });
	await pickDesign(page, "full-bleed");
	await page.waitForTimeout(250);
	check("dropping to fewer frames warns first", /would come off/.test(dialog || ""), JSON.stringify(dialog));
	check("and declining keeps the collage",
		await page.$eval(".ed-cover-frame", (e) => e.className.includes("collage")));

	suite("Covers: a book stored before designs existed");
	// Both orders currently in D1 carry a single cover.slot and no design, and
	// those customers open their book through this exact renderer.
	const legacy = await page.evaluate(() => {
		const book = {
			product: { size: "a4-portrait", finish: "photo-wrap" },
			cover: { title: "Old book", subtitle: "sent before designs existed",
				slot: { photoId: "x", zoom: 1, x: 50, y: 50 } },
			pages: [{ layout: "full", caption: "", slots: [{ photoId: "x", zoom: 1, x: 50, y: 50 }] }],
		};
		const resolve = () => ({ url: "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
			name: "x.jpg", w: 800, h: 600 });
		const leaf = window.StudioBook.leaf(book, null, resolve);
		document.body.appendChild(leaf);
		return {
			cls: leaf.querySelector(".ed-cover-print").className,
			frames: leaf.querySelectorAll(".ed-preview-slot").length,
			images: leaf.querySelectorAll("img").length,
			title: leaf.querySelector(".ed-preview-cover-text .t").textContent,
			softCover: window.StudioBook.lowResSlots(book, resolve).filter((i) => i.page === 0).length,
		};
	});
	check("it still renders, as one full-bleed frame",
		legacy.cls.includes("ed-cover-design-full-bleed") && legacy.frames === 1 &&
		legacy.images === 1 && legacy.title === "Old book");
	check("and its cover is checked for resolution now too", legacy.softCover === 1);

	suite("Covers: spot UV varnish");
	// The varnish is a second pass over a cover that is otherwise printed
	// normally, so choosing one must not disturb the design or the photographs
	// underneath it.
	const beforeUv = await page.$eval(".ed-cover-frame", (e) => e.className);
	check("the picker offers every pattern",
		(await page.$$("#uv-options .ed-choice")).length === SBUV.length, `${(await page.$$("#uv-options .ed-choice")).length}`);
	check("each drawn pattern has a thumbnail",
		(await page.$$eval("#uv-options .ed-uv-thumb svg", (n) => n.length)) === SBUV.filter((p) => p.key !== "none" && p.key !== "custom").length);
	check("high coverage is flagged on the one pattern that has it",
		(await page.$$eval("#uv-options .ed-uv-coverage.is-high", (n) => n.length)) === 1);

	const pickUv = (key) => page.evaluate(([k, keys]) => {
		document.querySelectorAll("#uv-options .ed-choice")[keys.indexOf(k)].click();
	}, [key, SBUV.map((p) => p.key)]);

    for (const key of ["botanical", "diagonals", "border", "dots", "deco", "title"]) {
		await pickUv(key);
		await page.waitForTimeout(150);
		const drawn = await page.evaluate(() => {
			const layer = document.querySelector(".ed-cover-frame .ed-uv-layer");
			return layer ? { cls: layer.className, shapes: layer.querySelectorAll("svg *").length } : null;
		});
		check(`varnish: ${key.padEnd(11)} draws over the cover`,
			drawn && drawn.cls.includes(`is-${key}`) && drawn.shapes > 0, drawn ? `${drawn.shapes} shapes` : "nothing drawn");
	}
	check("and the cover design underneath is untouched",
		(await page.$eval(".ed-cover-frame", (e) => e.className)) === beforeUv);

	await pickUv("monogram");
	await page.waitForTimeout(200);
	check("the monogram asks for its letters", (await page.$("#uv-monogram")) !== null);
	// The varnish picker lives on the size step while this is looking at the
	// arrange step, so the field is in the document but not on screen. Drive
	// it directly rather than switching panels back and forth.
	await page.evaluate(() => {
		const el = document.getElementById("uv-monogram");
		el.value = "TN";
		el.dispatchEvent(new Event("input", { bubbles: true }));
	});
	await page.waitForTimeout(250);
	check("and sets them into the medallion",
		(await page.$eval(".ed-cover-frame .ed-uv-layer text", (e) => e.textContent)) === "TN");

	await pickUv("custom");
	await page.waitForTimeout(200);
	check("their own artwork offers an upload", (await page.$("#uv-input")) !== null);
	check("and says what it needs until a file arrives",
		/Vector, solid black/.test(await page.$eval("#uv-extras .ed-note", (e) => e.textContent)));

	await pickUv("none");
	await page.waitForTimeout(150);
	check("no varnish draws nothing at all",
		(await page.$(".ed-cover-frame .ed-uv-layer")) === null);

	suite("Covers: the printed proof");
	// On screen the cover is drawn as a bound book — a case, a weave, the page
	// block at the fore-edge and the groove where the board hinges. A proof is
	// the artwork instead: what goes on the press, with nothing over it.
	await pickUv("botanical");
	await page.waitForTimeout(200);
	await page.evaluate(() => { window.print = () => { window.__printed = true; }; });
	await page.click("#dock-preview");
	await page.waitForTimeout(300);
	await page.click("#preview-print");
	await page.waitForTimeout(600);
	await page.emulateMedia({ media: "print" });
	await page.waitForTimeout(200);

	const proof = await page.evaluate(() => {
		const leaf = document.querySelector("#print-book .ed-preview-leaf");
		const seen = (sel) => {
			const el = leaf.querySelector(sel);
			return el ? getComputedStyle(el).display !== "none" : false;
		};
		const caseEl = leaf.querySelector(".ed-cover-case");
		const cs = getComputedStyle(caseEl);
		return {
			built: Boolean(leaf),
			groove: seen(".ed-cover-spine"),
			varnish: seen(".ed-uv-layer"),
			photo: leaf.querySelectorAll("img").length,
			title: (leaf.querySelector(".ed-preview-cover-text .t") || {}).textContent,
			label: (leaf.querySelector(".ed-preview-number") || {}).textContent,
			padding: cs.padding,
			shadow: cs.boxShadow,
			weave: getComputedStyle(caseEl, "::after").display,
		};
	});
	check("the proof is built", proof.built);
	check("the spine groove is gone", proof.groove === false);
	check("so is the case weave and its shadow",
		proof.weave === "none" && proof.shadow === "none", `weave ${proof.weave}, shadow ${proof.shadow}`);
	check("the case no longer insets the artwork", proof.padding === "0px", proof.padding);
	check("the photographs are there, clear", proof.photo === 3, `${proof.photo} of 3`);

	// A press-ready sheet is the trim size of the book and holds nothing else:
	// no label beside it, no border drawn on it, no padding around it. This is
	// what makes the saved PDF a file a printer can work from.
	const sheet = await page.evaluate(() => {
		const leaf = document.querySelector("#print-book .ed-preview-leaf");
		const pageEl = leaf.querySelector(".ed-preview-page");
		const mm = (px) => Math.round((px / 96) * 25.4);
		const r = pageEl.getBoundingClientRect();
		const label = leaf.querySelector(".ed-preview-number");
		const rule = [...document.getElementById("ed-print-page-size").sheet.cssRules]
			.map((x) => x.cssText).join(" ");
		return {
			w: mm(r.width), h: mm(r.height),
			border: getComputedStyle(pageEl).borderTopWidth,
			leafPad: getComputedStyle(leaf).padding,
			labelShown: label ? getComputedStyle(label).display !== "none" : false,
			atPage: rule,
		};
	});
	check("the sheet is the book's trim size", sheet.w === 210 && sheet.h === 297, `${sheet.w} x ${sheet.h} mm`);
	check("@page is set to match", /size:\s*210mm 297mm/.test(sheet.atPage) && /margin:\s*0/.test(sheet.atPage), sheet.atPage.slice(0, 60));
	check("nothing is drawn around the page", sheet.border === "0px" && sheet.leafPad === "0px",
		`border ${sheet.border}, padding ${sheet.leafPad}`);
	check("the page label does not print", sheet.labelShown === false);

	const endPrint = await page.evaluate(() => {
		const leaf = document.querySelector("#print-book .ed-preview-leaf.is-endpaper");
		const pageEl = leaf.querySelector(".ed-preview-page");
		const mm = (px) => Math.round((px / 96) * 25.4);
		const r = pageEl.getBoundingClientRect();
		const rule = [...document.getElementById("ed-print-page-size").sheet.cssRules]
			.map((x) => x.cssText).join(" ");
		return {
			w: mm(r.width),
			h: mm(r.height),
			labelShown: getComputedStyle(leaf.querySelector(".ed-preview-number")).display !== "none",
			rule,
		};
	});
	check("the printed file includes A3 landscape end sheets",
		endPrint.w === 420 && endPrint.h === 297,
		`${endPrint.w} x ${endPrint.h} mm`);
	check("the end sheet has its own named @page",
		/@page ed-endpaper/.test(endPrint.rule) && /size:\s*420mm 297mm/.test(endPrint.rule),
		endPrint.rule);
	check("the end sheet label does not print", endPrint.labelShown === false);

	// Varnish is clear, so a paper proof cannot show it and should not dull the
	// photograph pretending to. The label carries the choice instead.
	check("the varnish does not print over the photograph", proof.varnish === false);
	check("but the leaf is labelled with it",
		/spot UV: botanical/.test(proof.label || ""), JSON.stringify(proof.label));

	await page.emulateMedia({ media: "screen" });
	await page.waitForTimeout(150);
	check("and on screen the book still looks like a book",
		await page.evaluate(() => {
			const el = document.querySelector("#print-book .ed-cover-spine");
			return el ? getComputedStyle(el).display !== "none" : false;
		}));
	await page.keyboard.press("Escape");
	await page.waitForTimeout(150);

	check("nothing was logged to the console", problems.length === 0, JSON.stringify(problems.slice(0, 3)));
	check("nothing was left unhandled",
		(await page.evaluate("window.__unhandled")).length === 0);
	await page.close();
}

/* --- text on a page ---------------------------------------------------- */

async function text(browser, base, files) {
	const { page, problems } = await openEditor(browser, base);
	await addPhotos(page, files);
	await page.click("#autofill");
	await page.waitForTimeout(300);

	const BOX = `${PAGE1} .ed-text-box`;
	const style = () => page.$eval(BOX, (e) => ({
		color: e.style.color, bg: e.style.background, cls: e.className, align: e.style.textAlign,
		weight: e.style.fontWeight, italic: e.style.fontStyle, font: e.style.fontFamily,
		size: e.style.fontSize, left: e.style.left, top: e.style.top, w: e.style.width,
	}));
	// Rows are found by their label; a positional selector breaks the moment a
	// control is added.
	const setIn = (card, label, selector, value) => page.evaluate(([c, l, sel, v]) => {
		const row = [...document.querySelectorAll(`${c} .ed-text-row`)]
			.find((r) => (r.querySelector(".ed-text-label") || {}).textContent === l);
		const el = row.querySelector(sel);
		el.value = v;
		el.dispatchEvent(new Event("input", { bubbles: true }));
	}, [card, label, selector, value]);
	const press = (rowLabel, label) => page.evaluate(([rl, l]) => {
		const row = [...document.querySelectorAll(".ed-page:nth-of-type(3) .ed-text-row")]
			.find((r) => (r.querySelector(".ed-text-label") || {}).textContent === rl);
		[...row.querySelectorAll(".ed-text-toggle")].find((b) => b.textContent.trim() === l).click();
	}, [rowLabel, label]);

	suite("Text: putting words on a page");
	await page.click(`${PAGE1} .ed-page-tools .ed-btn`);
	await page.waitForTimeout(250);
	check("a box appears", (await page.$(BOX)) !== null);
	check("its controls open with it", (await page.$(`${PAGE1} .ed-text-tools`)) !== null);
	await page.fill(`${PAGE1} .ed-text-tools textarea`, "Cape Town, day three");
	await page.waitForTimeout(200);
	check("typing shows on the page", (await page.$eval(BOX, (e) => e.textContent)).includes("Cape Town"));

	suite("Text: colour, ground, shape and style");
	await setIn(PAGE1, "Text", "input[type=color]", "#ffcc00");
	await page.waitForTimeout(150);
	check("font colour", (await style()).color === "rgb(255, 204, 0)", (await style()).color);

	await setIn(PAGE1, "Behind", "input[type=color]", "#102030");
	await page.waitForTimeout(150);
	// Type over a photograph nearly always wants the picture showing through,
	// which is why the ground is a colour and a solidity rather than a colour.
	check("background arrives translucent", /rgba\(16, 32, 48/.test((await style()).bg), (await style()).bg);
	await setIn(PAGE1, "Behind", "input[type=range]", "1");
	await page.waitForTimeout(150);
	check("and its solidity is adjustable",
		/rgb\(16, 32, 48\)|rgba\(16, 32, 48, 1\)/.test((await style()).bg), (await style()).bg);

	await press("Shape", "Pill"); await page.waitForTimeout(200);
	check("shape", (await style()).cls.includes("is-pill"));
	await press("Style", "Serif"); await page.waitForTimeout(200);
	check("typeface", /Georgia/.test((await style()).font));
	await press("Style", "Bold"); await page.waitForTimeout(200);
	check("bold", (await style()).weight === "700");
	await press("Style", "Italic"); await page.waitForTimeout(200);
	check("italic", (await style()).italic === "italic");
	await press("Align", "Right"); await page.waitForTimeout(200);
	check("alignment", (await style()).align === "right");
	await setIn(PAGE1, "Size", "input[type=range]", "9");
	await page.waitForTimeout(150);
	// Relative to the page, because the same design is drawn at four sizes.
	check("size is relative to the page, not in pixels", (await style()).size === "9cqw");

	suite("Text: moving and sizing it");
	const before = await style();
	const at = await page.$eval(BOX, (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
	await page.mouse.move(at.x, at.y);
	await page.mouse.down();
	await page.mouse.move(at.x - 60, at.y - 90, { steps: 12 });
	await page.mouse.up();
	await page.waitForTimeout(250);
	const after = await style();
	check("dragging moves it", after.left !== before.left && after.top !== before.top,
		`${before.left},${before.top} -> ${after.left},${after.top}`);

	const handle = await page.$eval(`${BOX} .ed-text-handle`, (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
	const widthBefore = after.w;
	await page.mouse.move(handle.x, handle.y);
	await page.mouse.down();
	await page.mouse.move(handle.x + 70, handle.y, { steps: 10 });
	await page.mouse.up();
	await page.waitForTimeout(250);
	check("the handle changes its width", (await style()).w !== widthBefore,
		`${widthBefore} -> ${(await style()).w}`);

	suite("Text: the preview agrees with the grid");
	await waitForSave(page);
	await page.click("#dock-preview");
	await page.waitForTimeout(500);
	await page.click("#preview-next");
	await page.click("#preview-next");
	await page.waitForTimeout(300);
	const shown = await page.$eval("#preview-spread .ed-text-box", (e) => ({
		text: e.textContent, cls: e.className, size: e.style.fontSize,
		left: e.style.left, top: e.style.top,
	}));
	check("the words are there", shown.text.includes("Cape Town"));
	check("in the same place, at the same size, in the same shape",
		shown.left === after.left && shown.top === after.top && shown.size === "9cqw" && shown.cls.includes("is-pill"),
		`${shown.left},${shown.top} ${shown.size}`);
	await page.keyboard.press("Escape");
	await page.waitForTimeout(200);

	suite("Text: surviving, on the cover, and removal");
	await page.reload();
	await page.waitForTimeout(900);
	await page.click('.ed-step[data-step="arrange"]');
	await page.waitForTimeout(400);
	const back = await style();
	check("it all survives a reload",
		back.cls.includes("is-pill") && back.size === "9cqw" &&
		back.color === "rgb(255, 204, 0)" && back.align === "right");

	await page.click(`${CARD(1)} .ed-page-tools .ed-btn`);
	await page.waitForTimeout(250);
	check("the cover takes text too", (await page.$(`${CARD(1)} .ed-text-box`)) !== null);
	await page.evaluate(() => {
		const card = document.querySelector(".ed-page:nth-of-type(1)");
		[...card.querySelectorAll(".ed-text-tools .ed-btn")].find((b) => /Remove/.test(b.textContent)).click();
	});
	await page.waitForTimeout(250);
	check("and it can be taken off again", (await page.$(`${CARD(1)} .ed-text-box`)) === null);

	check("nothing was logged to the console", problems.length === 0, JSON.stringify(problems.slice(0, 3)));
	check("nothing was left unhandled", (await page.evaluate("window.__unhandled")).length === 0);
	await page.close();
}

/* --- what happens when the browser will not store anything ------------- */

async function storage(browser, base, files) {
	suite("Storage: when the browser refuses to save");
	// Reported from the console as "UnknownError: Internal error." The console
	// line was the smallest part of it: photos are added through a sequential
	// chain, so the first refused write rejected the whole thing and every
	// photo after it was silently never added.
	const page = await preparePage(await browser.newPage());
	await page.addInitScript(`
		window.__unhandled = [];
		addEventListener("unhandledrejection", function (e) {
			window.__unhandled.push(String((e.reason && e.reason.message) || e.reason));
		});
		var realPut = IDBObjectStore.prototype.put;
		IDBObjectStore.prototype.put = function () {
			if (this.name === "photos") throw new DOMException("Internal error.", "UnknownError");
			return realPut.apply(this, arguments);
		};
	`);
	const errors = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto(`${base}/studio/editor.html`, READY);
	await page.click('.ed-step[data-step="photos"]');
	await page.setInputFiles("#photo-input", files);
	await page.waitForTimeout(1500);

	const seen = await page.evaluate(() => ({
		thumbs: document.querySelectorAll("#photo-list .ed-thumb").length,
		dock: document.getElementById("dock-status").textContent,
		unhandled: window.__unhandled,
	}));
	check("every photo is still added", seen.thumbs === files.length, `${seen.thumbs} of ${files.length}`);
	check("the customer is told, once", /will not save your book/.test(seen.dock), JSON.stringify(seen.dock));
	check("and nothing is left unhandled", seen.unhandled.length === 0 && errors.length === 0,
		JSON.stringify([...seen.unhandled, ...errors].slice(0, 3)));
	await page.close();
}

export default async function runBrowser() {
	const files = photoFixtures();
	const server = await startStatic();
	const browser = await launchBrowser();
	try {
		await covers(browser, server.base, files);
		await text(browser, server.base, files);
		await storage(browser, server.base, files);
	} finally {
		await browser.close();
		await server.stop();
	}
}
