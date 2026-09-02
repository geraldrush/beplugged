/* BePlugged Studio — how a book is drawn.
 *
 * Shared by the editor's preview and the read-only view a customer opens with
 * their reference after sending. Those two have to draw the same book from the
 * same design: if they drift, someone is shown a book that is not the one they
 * built, which is worse than showing them nothing.
 *
 * Nothing here touches storage, the network or the editor's state. It takes a
 * design and a way to turn a photo id into a picture, and returns elements.
 */
(function (global) {
	"use strict";

	// Kept in step with STUDIO_SIZES in src/index.js. The millimetres matter:
	// they are what turns "is this photo big enough" into a real answer.
	var SIZES = [
		{ key: "a4-portrait", label: "A4 portrait", w: 210, h: 297, note: "The usual choice. Room for one big photo a page." },
		{ key: "a4-landscape", label: "A4 landscape", w: 297, h: 210, note: "Wide. Good for group photos and scenery." },
		{ key: "a5-portrait", label: "A5 portrait", w: 148, h: 210, note: "Smaller and lighter. Popular for giveaways." },
		{ key: "square-210", label: "Square", w: 210, h: 210, note: "Square pages. Suits mixed portrait and landscape." }
	];

	// Every layout is a plain grid, so a slot's printed size is just the page
	// divided by the columns and rows. Anything cleverer would make the
	// resolution warning a guess.
	var LAYOUTS = [
		{ key: "full", cols: 1, rows: 1, label: "One photo" },
		{ key: "two-across", cols: 2, rows: 1, label: "Two side by side" },
		{ key: "two-stacked", cols: 1, rows: 2, label: "Two stacked" },
		{ key: "three-strip", cols: 3, rows: 1, label: "Three in a row" },
		{ key: "four-grid", cols: 2, rows: 2, label: "Four" }
	];

	// What the case is covered in. Case binding is the method either way — the
	// pages are bound into a block and set into a rigid case — and this is what
	// that case is wrapped in, which is the part the customer actually sees.
	// Photo wrap leads because it is what the studio makes by default. The
	// first entry is also the fallback, so the order here is the answer to
	// "what is this book if nobody said".
	var COVER_FINISHES = [
		{
			key: "photo-wrap",
			label: "Photo wrap",
			note: "Your picture printed across the whole case, over the boards and the spine, and laminated."
		},
		{
			key: "cloth",
			label: "Canvas case",
			note: "Cloth-bound, with your picture mounted on the front. The canvas shows around it and down the spine."
		}
	];

	function finishFor(key) {
		for (var i = 0; i < COVER_FINISHES.length; i++) {
			if (COVER_FINISHES[i].key === key) return COVER_FINISHES[i];
		}
		return COVER_FINISHES[0];
	}

	// How the front of the case is arranged. The finish above is what the case
	// is covered in; this is where the picture and the title sit on it, and the
	// two are chosen separately.
	//
	// Each design carries the fraction of the cover each of its frames takes
	// up. That is not decoration: it is what turns "is this photo big enough"
	// into a real answer for a cover, and a collage frame at half the width
	// needs a photo of a very different size to a full-bleed one.
	//
	// "text" says where the title goes, and pairs with a modifier class on
	// .ed-preview-cover-text:
	//   overlay - over the picture, in a gradient (a full-bleed cover)
	//   band    - a light band below the picture
	//   block   - a solid colour block below the picture
	//   margin  - in the case margin, under an inset picture
	//
	// Kept in step with STUDIO_COVER_DESIGNS in src/index.js.
	var COVER_DESIGNS = [
		{
			key: "full-bleed",
			label: "Full bleed",
			note: "One picture to every edge, the title over it. The usual choice for a single strong photograph.",
			text: "overlay",
			frames: [{ w: 1, h: 1 }]
		},
		{
			key: "title-band",
			label: "Title band",
			note: "The picture stops short of the foot and the title gets a band of its own, so type never fights the photograph.",
			text: "band",
			frames: [{ w: 1, h: 0.78 }]
		},
		{
			key: "inset-window",
			label: "Inset window",
			note: "The picture sits inside a wide margin with the title beneath it. Quiet, and the margin is part of the design.",
			text: "margin",
			frames: [{ w: 0.76, h: 0.62 }]
		},
		{
			key: "split-block",
			label: "Split block",
			note: "Picture above, a solid block of colour below carrying the title. The strongest separation of the six.",
			text: "block",
			frames: [{ w: 1, h: 0.62 }]
		},
		{
			key: "collage",
			label: "Three photographs",
			note: "Two above, one across the foot. Three is as many as a cover holds before they start competing.",
			text: "band",
			frames: [
				{ w: 0.5, h: 0.39 },
				{ w: 0.5, h: 0.39 },
				{ w: 1, h: 0.39 }
			]
		},
		{
			key: "plate",
			label: "Mounted plate",
			note: "A small picture mounted centrally with the title under it. Reads as a plate set into the case, and suits the canvas finish.",
			text: "margin",
			frames: [{ w: 0.52, h: 0.42 }]
		}
	];

	function coverDesignFor(key) {
		for (var i = 0; i < COVER_DESIGNS.length; i++) {
			if (COVER_DESIGNS[i].key === key) return COVER_DESIGNS[i];
		}
		return COVER_DESIGNS[0];
	}

	function coverDesign(book) {
		return coverDesignFor(book && book.cover && book.cover.design);
	}

	// Every book sent before designs existed carries a single cover.slot, and
	// two of them are already in the database. Read that as the first frame of
	// a full-bleed cover rather than making those customers' books stop
	// opening. The editor migrates its own drafts the same way.
	function coverSlots(book) {
		var cover = (book && book.cover) || {};
		if (Array.isArray(cover.slots)) return cover.slots;
		return cover.slot ? [cover.slot] : [];
	}

	var MIN_PRINT_DPI = 150;

	// --- text on a page ---------------------------------------------------
	//
	// A caption prints in a bar under a page, which is a different thing from
	// type set on a photograph. These are the latter: free-floating boxes
	// placed anywhere over the picture area, with their own ground, shape and
	// colour.
	//
	// Position and width are percentages of the picture area and the size is in
	// cqw, because the very same design is drawn at four sizes — the arrange
	// grid, the preview, the print sheet and the customer's read-only view —
	// and anything in pixels would only be right at one of them.
	//
	// Kept in step with the STUDIO_TEXT_* tables in src/index.js.
	var TEXT_FONTS = [
		{ key: "sans", label: "Sans", stack: "'Inter', system-ui, -apple-system, sans-serif" },
		{ key: "serif", label: "Serif", stack: "Georgia, 'Times New Roman', serif" },
		{ key: "mono", label: "Typewriter", stack: "'Courier New', Courier, monospace" }
	];

	var TEXT_SHAPES = [
		{ key: "none", label: "No shape" },
		{ key: "rectangle", label: "Rectangle" },
		{ key: "rounded", label: "Rounded" },
		{ key: "pill", label: "Pill" }
	];

	var TEXT_ALIGNS = ["left", "center", "right"];

	var TEXT_MIN_SIZE = 2;
	var TEXT_MAX_SIZE = 14;
	var TEXT_MAX_LENGTH = 400;

	function fontFor(key) {
		for (var i = 0; i < TEXT_FONTS.length; i++) {
			if (TEXT_FONTS[i].key === key) return TEXT_FONTS[i];
		}
		return TEXT_FONTS[0];
	}

	function shapeFor(key) {
		for (var i = 0; i < TEXT_SHAPES.length; i++) {
			if (TEXT_SHAPES[i].key === key) return TEXT_SHAPES[i];
		}
		return TEXT_SHAPES[0];
	}

	function clampNumber(value, low, high, fallback) {
		var n = Number(value);
		if (!isFinite(n)) return fallback;
		return Math.min(high, Math.max(low, n));
	}

	// Hex only, and anything else becomes the fallback rather than being passed
	// through. Assigning a bad value through the CSSOM is dropped rather than
	// injected, so this is not the last line of defence, but a design document
	// is opened later by the studio as well as by the person who wrote it and
	// it should not be carrying anything but colours.
	function colourOf(value, fallback) {
		return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(String(value || ""))
			? String(value)
			: fallback;
	}

	// One text box, normalised. Every reader goes through this, so a design
	// with something odd in it draws the same way everywhere rather than
	// differently in each of the four places it is rendered.
	function textBoxOf(raw) {
		return {
			id: String((raw && raw.id) || ""),
			text: String((raw && raw.text) || "").slice(0, TEXT_MAX_LENGTH),
			x: clampNumber(raw && raw.x, 0, 100, 50),
			y: clampNumber(raw && raw.y, 0, 100, 50),
			w: clampNumber(raw && raw.w, 8, 100, 46),
			align: TEXT_ALIGNS.indexOf(raw && raw.align) !== -1 ? raw.align : "center",
			font: fontFor(raw && raw.font).key,
			size: clampNumber(raw && raw.size, TEXT_MIN_SIZE, TEXT_MAX_SIZE, 5),
			weight: (raw && raw.weight) === 700 || (raw && raw.weight) === "700" ? 700 : 400,
			italic: Boolean(raw && raw.italic),
			color: colourOf(raw && raw.color, "#ffffff"),
			background: colourOf(raw && raw.background, ""),
			shape: shapeFor(raw && raw.shape).key,
			pad: clampNumber(raw && raw.pad, 0, 12, 2)
		};
	}

	function textElement(raw) {
		var box = textBoxOf(raw);
		var el = document.createElement("div");
		el.className = "ed-text-box is-" + box.shape;
		el.style.left = box.x + "%";
		el.style.top = box.y + "%";
		el.style.width = box.w + "%";
		el.style.textAlign = box.align;
		el.style.fontFamily = fontFor(box.font).stack;
		el.style.fontSize = box.size + "cqw";
		el.style.fontWeight = String(box.weight);
		el.style.fontStyle = box.italic ? "italic" : "normal";
		el.style.color = box.color;
		el.style.padding = box.pad + "cqw";
		// No ground at all is a real choice — type straight onto a light sky
		// wants nothing behind it — so an unset background stays unset rather
		// than defaulting to something.
		el.style.background = box.background || "transparent";
		el.textContent = box.text;
		return el;
	}

	// The layer is its own element rather than the picture area itself so that
	// it can be the container the cqw sizes resolve against without taking on
	// any of the picture area's layout duties.
	function textLayer(boxes) {
		var list = Array.isArray(boxes) ? boxes : [];
		if (!list.length) return null;
		var layer = document.createElement("div");
		layer.className = "ed-text-layer";
		list.forEach(function (box) { layer.appendChild(textElement(box)); });
		return layer;
	}

	function layoutFor(key) {
		for (var i = 0; i < LAYOUTS.length; i++) {
			if (LAYOUTS[i].key === key) return LAYOUTS[i];
		}
		return LAYOUTS[0];
	}

	function sizeFor(key) {
		for (var i = 0; i < SIZES.length; i++) {
			if (SIZES[i].key === key) return SIZES[i];
		}
		return SIZES[0];
	}

	function slotFit(slot) {
		return slot && slot.fit === "contain" ? "contain" : "cover";
	}

	// Quarter turns only, normalised, so a design that arrives with anything
	// else in it still draws something sensible.
	function slotRotate(slot) {
		var value = Number(slot && slot.rotate) || 0;
		return (((Math.round(value / 90) * 90) % 360) + 360) % 360;
	}

	function slotZoom(slot) {
		return Math.max(1, Number(slot && slot.zoom) || 1);
	}

	// A quarter turn has to be handed the frame's other dimension or it will
	// not fill it: rotating a W by H box a quarter turn leaves it covering
	// H by W. Container query units let the stylesheet say that without
	// anything measuring a frame in script, which matters because the very
	// same element is laid out at four different sizes — the arrange grid, the
	// preview, the print sheet and the customer's read-only view.
	//
	// Panning stays on object-position, which applies to the picture inside the
	// element and is therefore unaffected by the turn.
	function applySlotImage(img, slot) {
		var x = slot && typeof slot.x === "number" ? slot.x : 50;
		var y = slot && typeof slot.y === "number" ? slot.y : 50;
		var rotate = slotRotate(slot);
		var turned = rotate === 90 || rotate === 270;

		img.style.objectFit = slotFit(slot);
		img.style.objectPosition = x + "% " + y + "%";
		img.classList.toggle("is-turned", turned);
		img.style.transformOrigin = turned ? "center" : x + "% " + y + "%";
		img.style.transform =
			(turned ? "translate(-50%, -50%) " : "") +
			"rotate(" + rotate + "deg) scale(" + slotZoom(slot) + ")";
	}

	// Effective print resolution of one frame. The frame is a physical size in
	// millimetres, the photo is a pixel count, and how the two meet depends on
	// the fit:
	//
	//   cover   crops. The photo is scaled until the tighter side fills the
	//           frame, so the worse of the two ratios decides.
	//   contain fits the whole photo in. The better one decides, and the
	//           number is higher, because the picture prints smaller.
	//
	// A quarter turn presents the photo's height to the frame's width, so the
	// two swap. Zooming in throws pixels away, so it divides.
	//
	// This is the one number in the editor a customer is actually trusting, so
	// every control that changes how a photo meets its frame has to reach it.
	function dpiFor(photo, frameWmm, frameHmm, slot) {
		if (!photo || !photo.w || !photo.h) return null;
		if (!(frameWmm > 0) || !(frameHmm > 0)) return null;

		var turned = slotRotate(slot) % 180 !== 0;
		var pw = turned ? photo.h : photo.w;
		var ph = turned ? photo.w : photo.h;

		var frameWin = frameWmm / 25.4;
		var frameHin = frameHmm / 25.4;

		var fitted = slotFit(slot) === "contain"
			? Math.max(pw / frameWin, ph / frameHin)
			: Math.min(pw / frameWin, ph / frameHin);

		return fitted / slotZoom(slot);
	}

	// A page frame: every layout is a plain grid, so the frame is the page
	// divided by the columns and rows.
	function slotDpi(photo, sizeKey, layout, slot) {
		var size = sizeFor(sizeKey);
		return dpiFor(photo, size.w / layout.cols, size.h / layout.rows, slot);
	}

	// A cover frame, which is a fraction of the cover rather than a share of a
	// grid. Without this a collage frame at half the width would be judged as
	// though it printed across the whole cover, and the warning would go quiet
	// exactly where it is needed most.
	function coverSlotDpi(photo, sizeKey, design, index, slot) {
		var size = sizeFor(sizeKey);
		var frame = design.frames[index] || design.frames[0];
		return dpiFor(photo, size.w * frame.w, size.h * frame.h, slot);
	}

	// Which pages are shown together. Always facing pages, on every screen: an
	// opened book is what a book looks like, and turning one page at a time on
	// a phone hid the thing the customer is trying to judge. A phone gets the
	// spread scaled to fit instead — see fitSpread.
	function buildViews(book) {
		var pages = (book && book.pages) || [];
		var views = [{ cover: true }];
		for (var i = 0; i < pages.length; i += 2) {
			views.push({ pages: i + 1 < pages.length ? [i, i + 1] : [i] });
		}
		return views;
	}

	// Sizes the spread to whichever runs out first, the width or the height.
	// Height alone was enough while a spread only ever appeared on a desktop;
	// on a phone two pages side by side are wider than the screen, so the
	// width has to be allowed to decide.
	function fitSpread(stageEl, spreadEl, book, view) {
		if (!stageEl || !spreadEl || !view) return;
		var size = sizeFor(book.product && book.product.size);
		var ratio = size.w / size.h;
		var count = view.cover ? 1 : (view.pages || []).length || 1;
		var labelHeight = 30;   // the page label, outside the page
		var gaps = 3 * (count - 1);

		// Arrows that sit beside the book take width from it; on a phone they
		// are lifted out of the flow and ride over the page edges instead.
		var arrows = 0;
		Array.prototype.forEach.call(stageEl.querySelectorAll(".ed-preview-arrow"), function (arrow) {
			if (getComputedStyle(arrow).position !== "absolute") {
				arrows += arrow.offsetWidth + 10;
			}
		});

		var availableWidth = Math.max(140, stageEl.clientWidth - arrows - 20);
		var availableHeight = Math.max(180, stageEl.clientHeight - 10);
		var heightThatFitsWidth = (availableWidth - gaps) / (count * ratio) + labelHeight;

		spreadEl.style.height = Math.floor(Math.min(availableHeight, heightThatFitsWidth, 680)) + "px";
	}

	// Every page of the book in order, cover first. Used for printing, where
	// there are no spreads and no turning — just sheets.
	function allLeaves(book, resolve) {
		var leaves = [leaf(book, null, resolve)];
		(book.pages || []).forEach(function (_, index) {
			leaves.push(leaf(book, index, resolve));
		});
		return leaves;
	}

	function slotElement(slot, resolve) {
		var cell = document.createElement("div");
		cell.className = "ed-preview-slot";
		var photo = slot && slot.photoId ? resolve(slot.photoId) : null;

		if (!photo) {
			cell.innerHTML = '<span class="ed-preview-blank">blank</span>';
			return cell;
		}
		if (!photo.url) {
			// HEIC and friends: we cannot draw it, and pretending the page is
			// blank would be worse than saying so.
			var name = document.createElement("span");
			name.className = "ed-preview-blank";
			name.textContent = photo.name || "photo";
			cell.appendChild(name);
			return cell;
		}

		var img = document.createElement("img");
		img.src = photo.url;
		img.alt = "";
		// An <img> is draggable by default, and dragging one starts a native
		// image drag that swallows the pointerup — which is the swipe.
		img.draggable = false;
		applySlotImage(img, slot);
		cell.appendChild(img);
		return cell;
	}

	// One leaf: the page, plus its label outside the page edge. pageIndex null
	// builds the cover. The label is outside on purpose — a page number drawn
	// inside the sheet is a page number the customer thinks we will print.
	function leaf(book, pageIndex, resolve) {
		var size = sizeFor(book.product && book.product.size);
		var isCover = pageIndex === null;
		var page = isCover ? null : (book.pages || [])[pageIndex];
		if (!isCover && !page) return document.createElement("div");
		var layout = isCover ? null : layoutFor(page.layout);
		var design = isCover ? coverDesign(book) : null;
		var cover = book.cover || {};

		var wrap = document.createElement("div");
		wrap.className = "ed-preview-leaf";

		var pageEl = document.createElement("div");
		var finish = finishFor(book.product && book.product.finish).key;
		pageEl.className = "ed-preview-page" +
			(isCover ? " ed-cover-case" + (finish === "photo-wrap" ? " is-wrap" : "") : "");
		// The page is exactly the shape of the paper: definite height from the
		// stylesheet, width from this ratio.
		pageEl.style.aspectRatio = size.w + " / " + size.h;

		var sheet = document.createElement("div");
		sheet.className = "ed-preview-sheet";

		if (isCover) {
			// A cover's frames are not a uniform grid, so the arrangement is
			// left to the stylesheet, keyed off the design.
			sheet.classList.add("ed-cover-sheet");
			var slots = coverSlots(book);
			for (var frame = 0; frame < design.frames.length; frame++) {
				sheet.appendChild(slotElement(slots[frame], resolve));
			}
			var coverText = textLayer(cover.texts);
			if (coverText) sheet.appendChild(coverText);
		} else {
			sheet.style.gridTemplateColumns = "repeat(" + layout.cols + ", 1fr)";
			sheet.style.gridTemplateRows = "repeat(" + layout.rows + ", 1fr)";
			(page.slots || []).forEach(function (slot) {
				sheet.appendChild(slotElement(slot, resolve));
			});
			var pageText = textLayer(page.texts);
			if (pageText) sheet.appendChild(pageText);
		}

		if (isCover) {
			// A hardcover is a case with the print mounted on it, so the canvas
			// shows as a border around the picture and down the spine. Flat
			// rectangle in, bound book out.
			var print = document.createElement("div");
			print.className = "ed-cover-print ed-cover-design-" + design.key;
			print.appendChild(sheet);

			// An overlay only exists to carry type, so it is drawn only when
			// there is type to carry. Every other design reserves the space
			// whether or not it has been filled in yet: that reserved space is
			// the design, it is what the frame fractions above are measured
			// against, and hiding it would make choosing a design do nothing
			// until a title was typed.
			if (design.text !== "overlay" || cover.title || cover.subtitle) {
				var text = document.createElement("div");
				text.className = "ed-preview-cover-text is-" + design.text;
				text.innerHTML = '<div class="t"></div><div class="s"></div>';
				text.querySelector(".t").textContent = cover.title || "";
				text.querySelector(".s").textContent = cover.subtitle || "";
				print.appendChild(text);
			}

			pageEl.appendChild(print);

			var spine = document.createElement("div");
			spine.className = "ed-cover-spine";
			pageEl.appendChild(spine);
		} else {
			pageEl.appendChild(sheet);

			// Captions print on the page, so this is where they have to be
			// looked at — an input under a thumbnail tells you nothing about
			// how a long one sits under a photo.
			if (page.caption) {
				var caption = document.createElement("div");
				caption.className = "ed-preview-caption";
				caption.textContent = page.caption;
				pageEl.appendChild(caption);
			}
		}

		wrap.appendChild(pageEl);

		var label = document.createElement("div");
		label.className = "ed-preview-number";
		label.textContent = isCover ? "Front cover" : "Page " + (pageIndex + 1);
		wrap.appendChild(label);

		return wrap;
	}

	// Every frame in the book whose photo is too small for the size it prints
	// at, as {page, slot, name, dpi}. Page numbers are 1-based; the cover is
	// page 0, which callers label rather than number.
	//
	// The cover used to be skipped entirely, so the one picture everybody
	// actually looks at was the only one nobody was warned about. That was
	// survivable while a cover was always one full-bleed frame. It is not now
	// that a collage frame prints at half the width and needs four times the
	// pixels for the same result.
	function lowResSlots(book, resolve) {
		var out = [];
		var sizeKey = book.product && book.product.size;

		var note = function (pageNumber, slotIndex, slot, dpi, photo) {
			if (dpi === null || dpi >= MIN_PRINT_DPI) return;
			out.push({
				page: pageNumber,
				slot: slotIndex + 1,
				name: photo ? photo.name : "",
				dpi: Math.round(dpi)
			});
		};

		var design = coverDesign(book);
		coverSlots(book).forEach(function (slot, frameIndex) {
			if (!slot || !slot.photoId) return;
			if (frameIndex >= design.frames.length) return;
			var photo = resolve(slot.photoId);
			note(0, frameIndex, slot, coverSlotDpi(photo, sizeKey, design, frameIndex, slot), photo);
		});

		(book.pages || []).forEach(function (page, pageIndex) {
			var layout = layoutFor(page.layout);
			(page.slots || []).forEach(function (slot, slotIndex) {
				if (!slot || !slot.photoId) return;
				var photo = resolve(slot.photoId);
				note(pageIndex + 1, slotIndex, slot, slotDpi(photo, sizeKey, layout, slot), photo);
			});
		});

		return out;
	}

	global.StudioBook = {
		SIZES: SIZES,
		LAYOUTS: LAYOUTS,
		COVER_FINISHES: COVER_FINISHES,
		COVER_DESIGNS: COVER_DESIGNS,
		finishFor: finishFor,
		coverDesignFor: coverDesignFor,
		coverDesign: coverDesign,
		coverSlots: coverSlots,
		coverSlotDpi: coverSlotDpi,
		slotRotate: slotRotate,
		slotFit: slotFit,
		TEXT_FONTS: TEXT_FONTS,
		TEXT_SHAPES: TEXT_SHAPES,
		TEXT_ALIGNS: TEXT_ALIGNS,
		TEXT_MIN_SIZE: TEXT_MIN_SIZE,
		TEXT_MAX_SIZE: TEXT_MAX_SIZE,
		TEXT_MAX_LENGTH: TEXT_MAX_LENGTH,
		textBoxOf: textBoxOf,
		textElement: textElement,
		textLayer: textLayer,
		fontFor: fontFor,
		MIN_PRINT_DPI: MIN_PRINT_DPI,
		sizeFor: sizeFor,
		layoutFor: layoutFor,
		applySlotImage: applySlotImage,
		slotDpi: slotDpi,
		buildViews: buildViews,
		fitSpread: fitSpread,
		leaf: leaf,
		allLeaves: allLeaves,
		lowResSlots: lowResSlots
	};
})(window);
