/* Everything that can be checked without a browser. */
import { suite, check, loadStudioBook, loadWorkerValidation, loadContentType } from "./helpers.mjs";

export default async function runUnit() {
	const SB = loadStudioBook();
	const worker = await loadWorkerValidation();
	const { contentTypeFor } = await loadContentType();

	/* --- what a photo is ------------------------------------------------ */

	suite("Photo type");
	// A HEIC off an iPhone routinely arrives with an empty type, and calling
	// those JPEG is how HEIC bytes reached the bucket under a .jpg key.
	for (const [file, want] of [
		[{ name: "IMG_4821.HEIC", type: "" }, "image/heic"],
		[{ name: "IMG_4821.heic", type: "" }, "image/heic"],
		[{ name: "clip.HEIF", type: "" }, "image/heif"],
		[{ name: "beach.jpg", type: "image/jpeg" }, "image/jpeg"],
		[{ name: "logo.PNG", type: "image/png" }, "image/png"],
		[{ name: "shot.webp", type: "image/webp" }, "image/webp"],
		[{ name: "scan", type: "image/png" }, "image/png"],
		// Refused here rather than with a 415 at the end of a long upload.
		[{ name: "old.gif", type: "image/gif" }, ""],
		[{ name: "scan.tiff", type: "image/tiff" }, ""],
		[{ name: "notes.pdf", type: "application/pdf" }, ""],
		[{ name: "", type: "" }, ""],
	]) {
		const got = contentTypeFor(file);
		check(`${(file.name || "(no name)").padEnd(16)} ${(file.type || "(no type)").padEnd(17)} -> ${got || "refused"}`, got === want);
	}

	/* --- resolution ----------------------------------------------------- */

	suite("Print resolution");
	// A4 portrait is 210 x 297 mm, so 8.2677 x 11.6929in. Photo is 3000x2000.
	const A4 = "a4-portrait";
	const full = SB.layoutFor("full");
	const photo = { w: 3000, h: 2000, name: "wide.jpg" };
	const near = (got, want) => got !== null && Math.abs(got - want) < 0.05;

	check("cover fit takes the tighter side", near(SB.slotDpi(photo, A4, full, {}), 171.04));
	check("contain takes the other one, so it reads higher", near(SB.slotDpi(photo, A4, full, { fit: "contain" }), 362.86));
	check("a quarter turn swaps the sides", near(SB.slotDpi(photo, A4, full, { rotate: 90 }), 241.90));
	check("270 is the same as 90", near(SB.slotDpi(photo, A4, full, { rotate: 270 }), 241.90));
	check("180 is the same as none", near(SB.slotDpi(photo, A4, full, { rotate: 180 }), 171.04));
	check("zoom divides", near(SB.slotDpi(photo, A4, full, { zoom: 2 }), 85.52));
	check("contain and a turn together", near(SB.slotDpi(photo, A4, full, { fit: "contain", rotate: 90 }), 256.57));
	check("a full-bleed cover frame is the whole page",
		near(SB.coverSlotDpi(photo, A4, SB.coverDesignFor("full-bleed"), 0, {}), 171.04));
	check("a collage frame at half width needs far more of the photo",
		near(SB.coverSlotDpi(photo, A4, SB.coverDesignFor("collage"), 0, {}), 438.57));
	// Full width, so the width limits here and not the height — a different
	// answer to the half-width frames above, which is the whole point.
	check("and the full-width foot frame differs again",
		near(SB.coverSlotDpi(photo, A4, SB.coverDesignFor("collage"), 2, {}), 362.86));
	check("a photo the browser could not open stays silent rather than guessing",
		SB.slotDpi({ w: 0, h: 0 }, A4, full, {}) === null);

	/* --- covers stored before designs existed ---------------------------- */

	suite("Covers stored before designs existed");
	const old = { product: { size: A4 }, cover: { slot: { photoId: "p1", zoom: 1 } }, pages: [] };
	check("a single cover.slot reads as one frame",
		SB.coverSlots(old).length === 1 && SB.coverSlots(old)[0].photoId === "p1");
	check("and defaults to full bleed", SB.coverDesign(old).key === "full-bleed");
	check("cover.slots is read as given",
		SB.coverSlots({ cover: { slots: [{ photoId: "a" }, { photoId: "b" }] } }).length === 2);
	check("an unknown design falls back rather than throwing",
		SB.coverDesignFor("hexagons").key === "full-bleed");
	check("the cover is checked for resolution at all", (() => {
		const book = { product: { size: A4 }, cover: { slot: { photoId: "x" } }, pages: [] };
		return SB.lowResSlots(book, () => ({ w: 800, h: 600, name: "x" })).some((i) => i.page === 0);
	})());

	/* --- the two tables that must agree ---------------------------------- */

	suite("Client and server agree");
	const clientDesigns = JSON.stringify(SB.COVER_DESIGNS.map((d) => ({ k: d.key, f: d.frames.length })));
	const serverDesigns = JSON.stringify(Object.entries(worker.STUDIO_COVER_DESIGNS).map(([k, d]) => ({ k, f: d.frames })));
	check("cover designs and their frame counts", clientDesigns === serverDesigns, clientDesigns === serverDesigns ? undefined : `\n    client ${clientDesigns}\n    server ${serverDesigns}`);
	check("typefaces", JSON.stringify(SB.TEXT_FONTS.map((f) => f.key)) === JSON.stringify([...worker.STUDIO_TEXT_FONTS]));
	check("text shapes", JSON.stringify(SB.TEXT_SHAPES.map((s) => s.key)) === JSON.stringify([...worker.STUDIO_TEXT_SHAPES]));

	/* --- what the server accepts ----------------------------------------- */

	const { normalizeStudioDesign } = worker;
	const reason = (design) => {
		try { normalizeStudioDesign(design); return null; } catch (e) { return e.message; }
	};
	const photos = [{ id: "p1", name: "a.jpg", bytes: 10 }, { id: "p2", name: "b.jpg", bytes: 10 }, { id: "p3", name: "c.jpg", bytes: 10 }];
	const book = (cover, texts) => ({
		product: { size: A4, finish: "photo-wrap" },
		cover,
		pages: [{ layout: "full", slots: [{ photoId: "p1" }], texts }],
		photos,
	});

	suite("Server: covers");
	check("a collage cover is accepted",
		reason(book({ design: "collage", slots: [{ photoId: "p1" }, { photoId: "p2" }, { photoId: "p3" }] })) === null);
	check("no cover at all is accepted", reason(book(undefined)) === null);
	check("the stored cover.slot shape is still accepted", reason(book({ slot: { photoId: "p1" } })) === null);
	check("an unknown design is refused", reason(book({ design: "hexagons", slots: [] })) === "Choose a cover design");
	check("more pictures than the design holds is refused",
		/does not have that many/.test(reason(book({ design: "full-bleed", slots: [{ photoId: "p1" }, { photoId: "p2" }] })) || ""));
	check("a cover naming a photo not in the order is refused",
		/cover refers to a photo/.test(reason(book({ design: "collage", slots: [{ photoId: "p1" }, { photoId: "ghost" }] })) || ""));
	check("the third frame is checked, not only the first",
		reason(book({ design: "collage", slots: [{ photoId: "p1" }, { photoId: "p2" }, { photoId: "nope" }] })) !== null);
	// Sending everything unplaced is a customer asking the studio to lay the
	// book out, which the review step offers in as many words.
	check("a book with nothing placed is still an order",
		reason({ product: { size: A4, finish: "photo-wrap" }, cover: {}, pages: [{ layout: "full", slots: [{ photoId: null }] }], photos }) === null);

	suite("Server: text on a page");
	const good = { id: "t1", text: "Cape Town", x: 50, y: 80, w: 60, align: "center",
		font: "serif", size: 5, weight: 700, italic: true,
		color: "#ffffff", background: "#000000aa", shape: "pill", pad: 2 };
	check("a fully styled box is accepted", reason(book({}, [good])) === null, reason(book({}, [good])) || "");
	check("no text at all is accepted", reason(book({}, undefined)) === null);
	check("an empty list is accepted", reason(book({}, [])) === null);
	check("no background is accepted", reason(book({}, [{ ...good, background: "" }])) === null);
	check("short hex is accepted", reason(book({}, [{ ...good, color: "#fff" }])) === null);
	check("too many on one page is refused", /more text on page 1/.test(reason(book({}, Array(7).fill(good))) || ""));
	check("an over-long one is refused", /longer than we can set/.test(reason(book({}, [{ ...good, text: "x".repeat(401) }])) || ""));
	check("one off the page is refused", /off the page/.test(reason(book({}, [{ ...good, y: 900 }])) || ""));
	check("a negative coordinate is refused", /off the page/.test(reason(book({}, [{ ...good, x: -5 }])) || ""));
	check("an impossible width is refused", /impossible width/.test(reason(book({}, [{ ...good, w: 2 }])) || ""));
	check("an impossible size is refused", /impossible size/.test(reason(book({}, [{ ...good, size: 99 }])) || ""));
	check("an unknown shape is refused", /shape we do not have/.test(reason(book({}, [{ ...good, shape: "star" }])) || ""));
	check("an unknown typeface is refused", /typeface we do not have/.test(reason(book({}, [{ ...good, font: "comic" }])) || ""));
	check("an unknown alignment is refused", /aligned in a way/.test(reason(book({}, [{ ...good, align: "justify" }])) || ""));
	check("a colour carrying more than a colour is refused",
		/colour we cannot read/.test(reason(book({}, [{ ...good, color: "red; background:url(x)" }])) || ""));
	check("so is a background that is not a colour",
		/colour we cannot read/.test(reason(book({}, [{ ...good, background: "javascript:alert(1)" }])) || ""));
	check("something that is not a list at all is refused", /could not be read/.test(reason(book({}, "nope")) || ""));
	check("the message names the page", /page 1/.test(reason(book({}, [{ ...good, y: 900 }])) || ""));
	check("and says 'the cover' for cover text",
		/the cover/.test(reason({ ...book({ design: "full-bleed", slots: [], texts: [{ ...good, y: 900 }] }) }) || ""));
}
