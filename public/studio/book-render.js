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

	var MIN_PRINT_DPI = 150;

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

	function applySlotImage(img, slot) {
		var x = slot && typeof slot.x === "number" ? slot.x : 50;
		var y = slot && typeof slot.y === "number" ? slot.y : 50;
		img.style.objectPosition = x + "% " + y + "%";
		img.style.transformOrigin = x + "% " + y + "%";
		img.style.transform = "scale(" + ((slot && slot.zoom) || 1) + ")";
	}

	// Effective print resolution of one slot: the frame is a physical size, the
	// photo is a pixel count, and "cover" scales the photo until the smaller
	// side fits. Zooming in throws pixels away, so it divides.
	function slotDpi(photo, sizeKey, layout, zoom) {
		if (!photo || !photo.w || !photo.h) return null;
		var size = sizeFor(sizeKey);
		var slotWin = (size.w / layout.cols) / 25.4;
		var slotHin = (size.h / layout.rows) / 25.4;
		return Math.min(photo.w / slotWin, photo.h / slotHin) / Math.max(1, zoom || 1);
	}

	// Which pages are shown together. A spread on a phone is two postage
	// stamps, so a narrow screen turns them one at a time.
	function buildViews(book, narrow) {
		var pages = (book && book.pages) || [];
		var views = [{ cover: true }];
		if (narrow) {
			pages.forEach(function (_, index) { views.push({ pages: [index] }); });
			return views;
		}
		for (var i = 0; i < pages.length; i += 2) {
			views.push({ pages: i + 1 < pages.length ? [i, i + 1] : [i] });
		}
		return views;
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
		var layout = layoutFor(isCover ? "full" : page.layout);
		var cover = book.cover || {};

		var wrap = document.createElement("div");
		wrap.className = "ed-preview-leaf";

		var pageEl = document.createElement("div");
		pageEl.className = "ed-preview-page" + (isCover ? " ed-cover-case" : "");
		// The page is exactly the shape of the paper: definite height from the
		// stylesheet, width from this ratio.
		pageEl.style.aspectRatio = size.w + " / " + size.h;

		var sheet = document.createElement("div");
		sheet.className = "ed-preview-sheet";
		sheet.style.gridTemplateColumns = "repeat(" + layout.cols + ", 1fr)";
		sheet.style.gridTemplateRows = "repeat(" + layout.rows + ", 1fr)";

		if (isCover) {
			sheet.appendChild(slotElement(cover.slot, resolve));
		} else {
			(page.slots || []).forEach(function (slot) {
				sheet.appendChild(slotElement(slot, resolve));
			});
		}

		if (isCover) {
			// A hardcover is a case with the print mounted on it, so the canvas
			// shows as a border around the picture and down the spine. Flat
			// rectangle in, bound book out.
			var print = document.createElement("div");
			print.className = "ed-cover-print";
			print.appendChild(sheet);

			if (cover.title || cover.subtitle) {
				var text = document.createElement("div");
				text.className = "ed-preview-cover-text";
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

	// Every slot in the book whose photo is too small for the size it prints
	// at, as {page, slot, name, dpi}. Page numbers are 1-based.
	function lowResSlots(book, resolve) {
		var out = [];
		var sizeKey = book.product && book.product.size;
		(book.pages || []).forEach(function (page, pageIndex) {
			var layout = layoutFor(page.layout);
			(page.slots || []).forEach(function (slot, slotIndex) {
				if (!slot || !slot.photoId) return;
				var photo = resolve(slot.photoId);
				var dpi = slotDpi(photo, sizeKey, layout, slot.zoom);
				if (dpi !== null && dpi < MIN_PRINT_DPI) {
					out.push({
						page: pageIndex + 1,
						slot: slotIndex + 1,
						name: photo ? photo.name : "",
						dpi: Math.round(dpi)
					});
				}
			});
		});
		return out;
	}

	global.StudioBook = {
		SIZES: SIZES,
		LAYOUTS: LAYOUTS,
		MIN_PRINT_DPI: MIN_PRINT_DPI,
		sizeFor: sizeFor,
		layoutFor: layoutFor,
		applySlotImage: applySlotImage,
		slotDpi: slotDpi,
		buildViews: buildViews,
		leaf: leaf,
		allLeaves: allLeaves,
		lowResSlots: lowResSlots
	};
})(window);
