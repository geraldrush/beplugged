/* BePlugged Studio — book designer.
 *
 * Everything here runs in the customer's browser and nothing leaves it until
 * they press send. That is a deliberate choice rather than a shortcut: people
 * build these books over an evening, on a phone, on a connection that drops,
 * and a design that only exists on a server they lost contact with is a design
 * they have to start again. The book lives in IndexedDB, photos included, and
 * the upload happens once, at the end, when they have decided.
 *
 * No framework and no build step, because the rest of the site has neither.
 */
(function () {
	"use strict";

	// --- what we can print ------------------------------------------------

	// Sizes, layouts and page drawing live in book-render.js, shared with the
	// read-only view a customer opens with their reference. Aliased here so the
	// call sites below read the same as they always did.
	var SB = window.StudioBook;
	var SIZES = SB.SIZES;
	var LAYOUTS = SB.LAYOUTS;
	var MIN_PRINT_DPI = SB.MIN_PRINT_DPI;
	var sizeFor = SB.sizeFor;
	var layoutFor = SB.layoutFor;
	var applySlotImage = SB.applySlotImage;
	var COVER_DESIGNS = SB.COVER_DESIGNS;
	var coverDesignFor = SB.coverDesignFor;
	var UV_PATTERNS = SB.UV_PATTERNS;

	// A varnish mask has to be vector to be made into a plate at all. A raster
	// file cannot be one: there is no such thing as a halftone varnish, so a
	// soft edge has nowhere to go.
	var UV_FILE_TYPES = ["application/pdf", "image/svg+xml", "application/postscript", "application/illustrator"];
	var UV_FILE_EXTENSIONS = { pdf: "application/pdf", svg: "image/svg+xml", ai: "application/illustrator", eps: "application/postscript" };
	var MAX_UV_BYTES = 30 * 1024 * 1024;

	// How far a photo can be pushed into its frame before it is throwing away
	// more than it is worth. Past this the resolution warning is shouting at
	// something the customer did on purpose.
	var MAX_ZOOM = 3;

	// Enough to title a page, name a place and date it. Past this a page is
	// being used as a letter, and the caption under it is the better tool.
	var MAX_TEXTS_PER_PAGE = 6;

	var PAGE_COUNTS = [20, 24, 28, 32, 36, 40, 48, 60];

	// Roughly how many photos each fits, which is the question behind the
	// question. One a page is the common case; two or three a page is normal
	// once a book gets long.
	var PAGE_NOTES = {
		20: "A short book — about 20 to 40 photos",
		24: "The usual starting point",
		28: "A little more room",
		32: "About 30 to 60 photos",
		36: "A full story",
		40: "About 40 to 80 photos",
		48: "A thick book",
		60: "The biggest we bind in one volume"
	};

	var MAX_PHOTO_BYTES = 30 * 1024 * 1024;
	var MAX_PHOTOS = 300;
	var MAX_TOTAL_BYTES = 600 * 1024 * 1024;
	var THUMB_EDGE = 700;

	// --- storage ----------------------------------------------------------

	var DB_NAME = "beplugged-studio";
	var DB_VERSION = 1;
	var dbPromise = null;

	function openDb() {
		if (dbPromise) return dbPromise;
		dbPromise = new Promise(function (resolve, reject) {
			var request = indexedDB.open(DB_NAME, DB_VERSION);
			request.onupgradeneeded = function () {
				var db = request.result;
				if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
				if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos", { keyPath: "id" });
			};
			request.onsuccess = function () { resolve(request.result); };
			request.onerror = function () { reject(request.error); };
			// Neither of the above fires while another tab holds the database
			// open at an older version, and a promise that never settles stops
			// restore, which stops the editor booting at all. Better to fail.
			request.onblocked = function () {
				reject(new Error("The book is open in another tab."));
			};
		});
		return dbPromise;
	}

	function idbRun(store, mode, fn) {
		return openDb().then(function (db) {
			return new Promise(function (resolve, reject) {
				var tx = db.transaction(store, mode);
				var result = fn(tx.objectStore(store));
				tx.oncomplete = function () { resolve(result && result.result !== undefined ? result.result : result); };
				tx.onerror = function () { reject(tx.error); };
				tx.onabort = function () { reject(tx.error); };
			});
		});
	}

	function putMeta(key, value) {
		return idbRun("meta", "readwrite", function (s) { return s.put(value, key); });
	}

	function getMeta(key) {
		return idbRun("meta", "readonly", function (s) { return s.get(key); });
	}

	function putPhoto(record) {
		return idbRun("photos", "readwrite", function (s) { return s.put(record); });
	}

	function deletePhotoRecord(id) {
		return idbRun("photos", "readwrite", function (s) { return s.delete(id); });
	}

	function allPhotoRecords() {
		return idbRun("photos", "readonly", function (s) { return s.getAll(); });
	}

	function clearEverything() {
		return Promise.all([
			idbRun("photos", "readwrite", function (s) { return s.clear(); }),
			idbRun("meta", "readwrite", function (s) { return s.clear(); })
		]);
	}

	// IndexedDB refuses writes for reasons the customer cannot act on and we
	// cannot predict: private browsing, a full disk, a profile whose storage
	// has gone bad. Chrome reports most of them as a bare "UnknownError:
	// Internal error." with no stack worth reading.
	//
	// None of that is a reason to lose a photo. The file is already in memory
	// and can still be placed, previewed and uploaded — what the customer
	// actually loses is the ability to close the tab and come back, so that is
	// what they are told, once, rather than nothing at all while the console
	// fills up with unhandled rejections.
	var storageBroken = false;

	function storageFailed() {
		if (storageBroken) return;
		storageBroken = true;
		setDockStatus("This browser will not save your book. It still works — finish and send it in this tab.");
	}

	// --- state ------------------------------------------------------------

	var state = null;          // the design, exactly as it is sent
	var photoBlobs = new Map();  // id -> original File/Blob, for upload
	var thumbUrls = new Map();   // id -> object URL of the small copy
	var selectedPhotoId = null;
	var panSlot = null;          // {page: n, slot: n} currently being repositioned
	var selectedText = null;     // {page: n, id: "..."} text box being edited
	var step = "size";
	var saveTimer = null;
	var sending = false;

	// rotate and fit are written out even at their defaults. They cost a few
	// bytes in a design that has 400 KB to play with, and having them present
	// means every slot in a book has the same shape whichever version of the
	// editor built it.
	function blankSlot() {
		return { photoId: null, zoom: 1, x: 50, y: 50, rotate: 0, fit: "cover" };
	}

	function blankPage(layoutKey) {
		var layout = layoutFor(layoutKey || "full");
		var slots = [];
		for (var i = 0; i < layout.cols * layout.rows; i++) slots.push(blankSlot());
		return { layout: layout.key, caption: "", slots: slots, texts: [] };
	}

	function blankState() {
		var s = {
			version: 1,
			product: { size: "a4-portrait", pages: 24, finish: "photo-wrap" },
			cover: {
				design: "full-bleed", title: "", subtitle: "",
				slots: [blankSlot()], texts: [],
				uv: { pattern: "none", monogram: "", file: null }
			},
			pages: [],
			photos: []
		};
		setPageCount(s, s.product.pages);
		return s;
	}

	function setPageCount(s, count) {
		while (s.pages.length > count) s.pages.pop();
		while (s.pages.length < count) s.pages.push(blankPage("full"));
		s.product.pages = s.pages.length;
	}

	function coverDesign() {
		return coverDesignFor(state.cover.design);
	}

	function coverUv() {
		if (!state.cover.uv) state.cover.uv = { pattern: "none", monogram: "", file: null };
		return state.cover.uv;
	}

	function uvPattern() {
		return SB.uvPatternFor(coverUv().pattern);
	}

	// The frames the current design actually has. A design change can leave the
	// stored array the wrong length either way, so everything reads through
	// here rather than trusting state.cover.slots.length.
	function coverSlots() {
		var wanted = coverDesign().frames.length;
		if (!Array.isArray(state.cover.slots)) state.cover.slots = [];
		while (state.cover.slots.length < wanted) state.cover.slots.push(blankSlot());
		return state.cover.slots.slice(0, wanted);
	}

	// Text boxes for a page, or for the cover at -1. Created on demand so a
	// book built before this existed grows them as it is opened rather than
	// needing a migration pass.
	function textsFor(pageIndex) {
		if (pageIndex === -1) {
			if (!Array.isArray(state.cover.texts)) state.cover.texts = [];
			return state.cover.texts;
		}
		var page = state.pages[pageIndex];
		if (!page) return [];
		if (!Array.isArray(page.texts)) page.texts = [];
		return page.texts;
	}

	function textById(pageIndex, id) {
		var list = textsFor(pageIndex);
		for (var i = 0; i < list.length; i++) {
			if (list[i].id === id) return list[i];
		}
		return null;
	}

	// A saved draft is read back through the same normaliser the renderer uses,
	// so the style controls are always handed a complete box. Without this a
	// draft missing a colour hands undefined to a colour input, which quietly
	// resets itself to black the moment it is touched.
	function normalizeTexts(list) {
		return (Array.isArray(list) ? list : []).map(function (raw) {
			var box = SB.textBoxOf(raw);
			if (!box.id) box.id = newTextId();
			return box;
		}).slice(0, MAX_TEXTS_PER_PAGE);
	}

	function newTextId() {
		return "t" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
	}

	function selectedTextBox() {
		return selectedText ? textById(selectedText.page, selectedText.id) : null;
	}

	function addText(pageIndex) {
		var list = textsFor(pageIndex);
		if (list.length >= MAX_TEXTS_PER_PAGE) {
			window.alert("That is as much text as one page can carry. The caption under the page is the better place for anything longer.");
			return;
		}
		// Low and centred, which is where a caption on a photograph nearly
		// always goes, and out of the way of faces, which are nearly always
		// higher up.
		var box = SB.textBoxOf({ id: newTextId(), text: "", x: 50, y: 80, w: 64 });
		list.push(box);
		selectedText = { page: pageIndex, id: box.id };
		scheduleSave();
		renderPages();
	}

	function removeText(pageIndex, id) {
		var list = textsFor(pageIndex);
		for (var i = 0; i < list.length; i++) {
			if (list[i].id === id) { list.splice(i, 1); break; }
		}
		if (selectedText && selectedText.id === id) selectedText = null;
		scheduleSave();
		renderPages();
	}

	// Splitting and rejoining a colour, so that the background can be made
	// translucent. Type over a photograph nearly always wants a ground that
	// lets some of the picture through, and a colour picker alone cannot say
	// that.
	function splitColour(value) {
		var v = String(value || "");
		if (/^#[0-9a-fA-F]{8}$/.test(v)) {
			return { rgb: v.slice(0, 7), alpha: parseInt(v.slice(7), 16) / 255 };
		}
		if (/^#[0-9a-fA-F]{6}$/.test(v)) return { rgb: v, alpha: 1 };
		return { rgb: "#000000", alpha: 0 };
	}

	function joinColour(rgb, alpha) {
		var a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16);
		return rgb + (a.length < 2 ? "0" + a : a);
	}

	// Slots hold ids; the photo list holds what those ids mean. Sending one
	// without the other is what the server rejects, so they are rebuilt
	// together every time.
	function usedPhotoIds() {
		var used = new Set();
		coverSlots().forEach(function (slot) {
			if (slot.photoId) used.add(slot.photoId);
		});
		state.pages.forEach(function (page) {
			page.slots.forEach(function (slot) {
				if (slot.photoId) used.add(slot.photoId);
			});
		});
		return used;
	}

	// A frame with a photo just dropped into it. Every drop, tap and autofill
	// goes through here so a new placement can never disagree with blankSlot
	// about what the untouched defaults are.
	function placed(photoId) {
		var slot = blankSlot();
		slot.photoId = photoId;
		return slot;
	}

	function photoById(id) {
		for (var i = 0; i < state.photos.length; i++) {
			if (state.photos[i].id === id) return state.photos[i];
		}
		return null;
	}

	function totalBytes() {
		return state.photos.reduce(function (sum, p) { return sum + (p.bytes || 0); }, 0);
	}

	function formatBytes(n) {
		if (n >= 1024 * 1024 * 1024) return (n / (1024 * 1024 * 1024)).toFixed(1) + " GB";
		if (n >= 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
		if (n >= 1024) return Math.round(n / 1024) + " KB";
		return n + " bytes";
	}

	// --- persistence ------------------------------------------------------

	function scheduleSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(function () {
			saveTimer = null;
			putMeta("design", JSON.parse(JSON.stringify(state))).then(function () {
				if (!storageBroken) setDockStatus("Saved in this browser.");
			}).catch(storageFailed);
		}, 400);
	}

	function setDockStatus(text) {
		var el = document.getElementById("dock-status");
		if (el) el.textContent = text;
	}

	// --- photos -----------------------------------------------------------

	function newPhotoId() {
		return "p" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
	}

	// Kept in step with STUDIO_IMAGE_TYPES in src/index.js. Accepting a wider
	// set here than the server will take only moves the rejection to the end of
	// the upload, which is the worst moment to discover it: the customer has
	// already waited out forty photos on a phone connection.
	var SENDABLE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

	var EXTENSION_TYPES = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		webp: "image/webp",
		heic: "image/heic",
		heif: "image/heif"
	};

	// What the file actually is. A HEIC straight off an iPhone routinely
	// arrives with an empty type, and defaulting those to JPEG is how HEIC
	// bytes reached the bucket under a .jpg key that nothing downstream could
	// open. A browser derives File.type from the extension anyway, so where
	// there is an extension it is the better answer, not the worse one.
	function contentTypeFor(file) {
		var match = /\.([A-Za-z0-9]+)$/.exec(file.name || "");
		var byExtension = match ? EXTENSION_TYPES[match[1].toLowerCase()] : null;
		if (byExtension) return byExtension;
		var declared = String(file.type || "").toLowerCase();
		return SENDABLE_TYPES.indexOf(declared) !== -1 ? declared : "";
	}

	// A 700px copy for the screen. Holding forty full-resolution images in the
	// DOM is what makes an editor like this crawl on the phone it will
	// actually be used on; the originals stay in IndexedDB until upload.
	function makeThumb(file) {
		if (!window.createImageBitmap) return Promise.resolve(null);
		return createImageBitmap(file).then(function (bitmap) {
			var scale = Math.min(1, THUMB_EDGE / Math.max(bitmap.width, bitmap.height));
			var w = Math.max(1, Math.round(bitmap.width * scale));
			var h = Math.max(1, Math.round(bitmap.height * scale));
			var canvas = document.createElement("canvas");
			canvas.width = w;
			canvas.height = h;
			canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
			var natural = { w: bitmap.width, h: bitmap.height };
			bitmap.close && bitmap.close();
			return new Promise(function (resolve) {
				canvas.toBlob(function (blob) {
					resolve({ blob: blob, w: natural.w, h: natural.h });
				}, "image/jpeg", 0.82);
			});
		}).catch(function () {
			// HEIC off an iPhone, usually. The file is still perfectly
			// printable, the browser just cannot draw it.
			return null;
		});
	}

	function addFiles(fileList) {
		var files = Array.prototype.slice.call(fileList || []);
		if (!files.length) return Promise.resolve();

		var rejected = [];
		var accepted = [];
		var running = totalBytes();

		files.forEach(function (file) {
			var type = contentTypeFor(file);
			if (!type) {
				rejected.push(file.name + " is not a JPEG, PNG, WebP or HEIC");
				return;
			}
			if (file.size > MAX_PHOTO_BYTES) {
				rejected.push(file.name + " is over 30 MB");
				return;
			}
			if (state.photos.length + accepted.length >= MAX_PHOTOS) {
				rejected.push(file.name + " — that is more than " + MAX_PHOTOS + " photos");
				return;
			}
			if (running + file.size > MAX_TOTAL_BYTES) {
				rejected.push(file.name + " — the book is at its total size limit");
				return;
			}
			running += file.size;
			accepted.push({ file: file, type: type });
		});

		showPhotoStatus("Reading " + accepted.length + " photo" + (accepted.length === 1 ? "" : "s") + "…", "");

		var chain = Promise.resolve();
		accepted.forEach(function (entry) {
			var file = entry.file;
			chain = chain.then(function () {
				return makeThumb(file).then(function (thumb) {
					var id = newPhotoId();
					var record = {
						id: id,
						name: file.name,
						type: entry.type,
						bytes: file.size,
						w: thumb ? thumb.w : 0,
						h: thumb ? thumb.h : 0,
						blob: file,
						thumb: thumb ? thumb.blob : null
					};
					photoBlobs.set(id, file);
					if (thumb) thumbUrls.set(id, URL.createObjectURL(thumb.blob));
					state.photos.push({
						id: id,
						name: file.name,
						bytes: file.size,
						type: record.type,
						w: record.w,
						h: record.h
					});
					// Deliberately not rethrown: the photo is usable from
					// memory either way, and letting this reject would abort
					// the chain and silently drop every photo after it in the
					// batch — which is what filled the console and left the
					// customer looking at half an import.
					return putPhoto(record).catch(storageFailed);
				});
			});
		});

		return chain.then(function () {
			var message = "Added " + accepted.length + " photo" + (accepted.length === 1 ? "" : "s") + ".";
			if (rejected.length) {
				showPhotoStatus(message + " Left out: " + rejected.join("; ") + ".", "warn");
			} else if (accepted.length) {
				showPhotoStatus(message, "good");
			} else {
				showPhotoStatus("Nothing was added. " + rejected.join("; ") + ".", "bad");
			}
			scheduleSave();
			renderPhotos();
			renderTray();
			renderPages();
			renderSteps();
		});
	}

	function showPhotoStatus(text, tone) {
		var el = document.getElementById("photo-status");
		if (!el) return;
		el.textContent = text;
		el.className = "ed-note" + (tone ? " " + tone : "");
		el.style.display = text ? "block" : "none";
	}

	// Takes one photo out of the design and out of storage, and draws nothing.
	// The caller decides when to repaint, which is what lets three hundred
	// removals be three hundred mutations and one repaint rather than three
	// hundred of each — the difference between a tap and a frozen phone.
	function detachPhoto(id) {
		state.photos = state.photos.filter(function (p) { return p.id !== id; });
		coverSlots().forEach(function (slot, i) {
			if (slot.photoId === id) state.cover.slots[i] = blankSlot();
		});
		state.pages.forEach(function (page) {
			page.slots.forEach(function (slot, i) {
				if (slot.photoId === id) page.slots[i] = blankSlot();
			});
		});
		if (selectedPhotoId === id) selectedPhotoId = null;
		var url = thumbUrls.get(id);
		if (url) URL.revokeObjectURL(url);
		thumbUrls.delete(id);
		photoBlobs.delete(id);
		// Nothing useful follows from a browser refusing the delete, and
		// three hundred unhandled rejections at once help nobody.
		return deletePhotoRecord(id).catch(storageFailed);
	}

	function afterPhotosChanged() {
		scheduleSave();
		renderPhotos();
		renderTray();
		renderPages();
		renderSteps();
	}

	function removePhoto(id) {
		detachPhoto(id);
		afterPhotosChanged();
	}

	function removeAllPhotos() {
		state.photos.slice().forEach(function (p) { detachPhoto(p.id); });
		panSlot = null;
		afterPhotosChanged();
	}

	// --- resolution -------------------------------------------------------

	// Every resolution answer in the editor comes from book-render, so the
	// badge on a frame, the list in the review step and the note in the
	// preview can never disagree with each other or with what is printed.
	function lowResSlots() {
		return SB.lowResSlots(state, previewResolve);
	}

	function unreadablePhotos() {
		return state.photos.filter(function (p) { return !p.w || !p.h; });
	}

	function emptySlotCount() {
		var n = 0;
		coverSlots().forEach(function (slot) { if (!slot.photoId) n++; });
		state.pages.forEach(function (page) {
			page.slots.forEach(function (slot) { if (!slot.photoId) n++; });
		});
		return n;
	}

	function uvSummary() {
		var pattern = uvPattern();
		if (pattern.key === "none") return "none — a plain printed case";
		if (pattern.key === "custom") {
			return coverUv().file
				? "your own artwork — " + coverUv().file.name
				: "your own artwork — no file attached yet";
		}
		var extra = pattern.monogram && coverUv().monogram ? " — " + coverUv().monogram : "";
		return "spot UV, " + pattern.label.toLowerCase() + extra;
	}

	// "chosen" told a customer nothing once a cover could hold three frames.
	function coverPhotoSummary() {
		var slots = coverSlots();
		var filled = slots.filter(function (slot) { return slot.photoId; }).length;
		if (!filled) return slots.length === 1 ? "not chosen" : "none of " + slots.length + " chosen";
		if (filled === slots.length) return slots.length === 1 ? "chosen" : "all " + slots.length + " chosen";
		return filled + " of " + slots.length + " chosen";
	}

	function unusedPhotoCount() {
		var used = usedPhotoIds();
		return state.photos.filter(function (p) { return !used.has(p.id); }).length;
	}

	// --- rendering: step 1 ------------------------------------------------

	function renderSizeOptions() {
		var host = document.getElementById("size-options");
		host.innerHTML = "";
		SIZES.forEach(function (size) {
			var button = document.createElement("button");
			button.type = "button";
			button.className = "ed-choice";
			button.setAttribute("aria-pressed", String(state.product.size === size.key));

			var scale = 58 / Math.max(size.w, size.h);
			var shape = document.createElement("span");
			shape.className = "ed-shape";
			shape.style.width = Math.round(size.w * scale) + "px";
			shape.style.height = Math.round(size.h * scale) + "px";

			var text = document.createElement("span");
			text.innerHTML = "<strong></strong><small></small>";
			text.querySelector("strong").textContent = size.label;
			text.querySelector("small").textContent = size.w + " × " + size.h + " mm — " + size.note;

			button.appendChild(shape);
			button.appendChild(text);
			button.addEventListener("click", function () {
				state.product.size = size.key;
				scheduleSave();
				renderSizeOptions();
				renderUvOptions();
				renderPages();
				renderSummary();
			});
			host.appendChild(button);
		});
	}

	function renderFinishOptions() {
		var host = document.getElementById("finish-options");
		host.innerHTML = "";
		SB.COVER_FINISHES.forEach(function (finish) {
			var button = document.createElement("button");
			button.type = "button";
			button.className = "ed-choice";
			button.setAttribute("aria-pressed", String(state.product.finish === finish.key));
			button.innerHTML = "<span><strong></strong><small></small></span>";
			button.querySelector("strong").textContent = finish.label;
			button.querySelector("small").textContent = finish.note;
			button.addEventListener("click", function () {
				state.product.finish = finish.key;
				scheduleSave();
				renderFinishOptions();
				renderSummary();
			});
			host.appendChild(button);
		});
	}

	function renderCoverDesignOptions() {
		var host = document.getElementById("cover-design-options");
		if (!host) return;
		host.innerHTML = "";
		COVER_DESIGNS.forEach(function (design) {
			var button = document.createElement("button");
			button.type = "button";
			button.className = "ed-choice";
			button.setAttribute("aria-pressed", String(coverDesign().key === design.key));
			button.innerHTML = '<span class="ed-cover-thumb"></span><span><strong></strong><small></small></span>';
			button.querySelector(".ed-cover-thumb").className =
				"ed-cover-thumb is-" + design.key;
			button.querySelector("strong").textContent = design.label;
			button.querySelector("small").textContent = design.note;
			button.addEventListener("click", function () { changeCoverDesign(design.key); });
			host.appendChild(button);
		});
	}

	function changeCoverDesign(key) {
		var design = coverDesignFor(key);
		if (design.key === coverDesign().key) return;
		var next = reflowSlots(coverSlots(), design.frames.length, "cover");
		if (!next) return;
		state.cover.design = design.key;
		state.cover.slots = next;
		panSlot = null;
		scheduleSave();
		renderCoverDesignOptions();
		renderPages();
		renderTray();
		renderSummary();
	}

	// Spot UV is a second pass laid over a cover that is otherwise printed
	// normally, so it is chosen separately from the design and the finish and
	// does not disturb either.
	function renderUvOptions() {
		var host = document.getElementById("uv-options");
		if (!host) return;
		host.innerHTML = "";
		var size = sizeFor(state.product.size);

		UV_PATTERNS.forEach(function (pattern) {
			var button = document.createElement("button");
			button.type = "button";
			button.className = "ed-choice";
			button.setAttribute("aria-pressed", String(uvPattern().key === pattern.key));

			var thumb = document.createElement("span");
			thumb.className = "ed-uv-thumb is-" + pattern.key;
			if (pattern.key !== "none" && pattern.key !== "custom") {
				thumb.innerHTML = '<svg viewBox="0 0 ' + size.w + " " + size.h +
					'" preserveAspectRatio="none" aria-hidden="true">' +
					SB.uvMaskShapes(pattern.key, size, coverUv().monogram || "AB") + "</svg>";
			}

			var text = document.createElement("span");
			text.innerHTML = "<strong></strong><small></small>";
			var strong = text.querySelector("strong");
			strong.textContent = pattern.label;
			if (pattern.coverage !== null && pattern.coverage > 0) {
				var badge = document.createElement("span");
				// Raised spot UV stops reading as an accent past roughly a
				// third of the case, so the number is shown rather than
				// buried in a note nobody opens.
				badge.className = "ed-uv-coverage" + (pattern.coverage > SB.UV_ACCENT_COVERAGE ? " is-high" : "");
				badge.textContent = "~" + pattern.coverage + "% covered";
				strong.appendChild(badge);
			}
			text.querySelector("small").textContent = pattern.note;

			button.appendChild(thumb);
			button.appendChild(text);
			button.addEventListener("click", function () { chooseUv(pattern.key); });
			host.appendChild(button);
		});

		renderUvExtras();
	}

	// The monogram letters and the upload only mean anything for the pattern
	// that uses them, so they appear with it rather than sitting there greyed
	// out for the eight that do not.
	function renderUvExtras() {
		var host = document.getElementById("uv-extras");
		if (!host) return;
		host.innerHTML = "";
		var pattern = uvPattern();

		if (pattern.monogram) {
			var field = document.createElement("div");
			field.className = "ed-field";
			field.innerHTML = '<label for="uv-monogram">Letters for the medallion</label>';
			var input = document.createElement("input");
			input.id = "uv-monogram";
			input.type = "text";
			input.maxLength = 4;
			input.placeholder = "TN";
			input.value = coverUv().monogram || "";
			input.addEventListener("input", function () {
				coverUv().monogram = input.value.toUpperCase().slice(0, 4);
				scheduleSave();
				renderPages();
				// Redraw the thumbnails too, since one of them is these very
				// letters.
				renderUvThumbs();
			});
			field.appendChild(input);
			host.appendChild(field);
		}

		if (pattern.upload) {
			var file = coverUv().file;
			var wrap = document.createElement("div");

			var label = document.createElement("label");
			label.className = "ed-btn secondary small";
			label.setAttribute("for", "uv-input");
			label.style.display = "inline-block";
			label.textContent = file ? "Choose a different file" : "Choose your varnish file";
			wrap.appendChild(label);

			var status = document.createElement("p");
			status.className = "ed-note";
			status.style.margin = "12px 0 0";
			if (file) {
				status.classList.add("good");
				status.textContent = file.name + " — " + formatBytes(file.bytes) + ", sent with the book.";
			} else {
				status.textContent = "PDF, SVG, AI or EPS. Vector, solid black where the varnish goes, and the same shape as the case. Anything soft-edged or greyscale cannot be made into a plate.";
			}
			wrap.appendChild(status);

			if (file) {
				var drop = smallButton("Remove it", "Take this varnish file off the order", function () {
					coverUv().file = null;
					photoBlobs.delete("uv");
					deletePhotoRecord("uv").catch(storageFailed);
					scheduleSave();
					renderUvExtras();
					renderPages();
				});
				drop.style.marginTop = "10px";
				wrap.appendChild(drop);
			}

			host.appendChild(wrap);
		}
	}

	function renderUvThumbs() {
		var host = document.getElementById("uv-options");
		if (!host) return;
		var size = sizeFor(state.product.size);
		var index = 0;
		UV_PATTERNS.forEach(function (pattern) {
			var thumb = host.children[index++].querySelector(".ed-uv-thumb");
			if (!thumb || pattern.key === "none" || pattern.key === "custom") return;
			thumb.innerHTML = '<svg viewBox="0 0 ' + size.w + " " + size.h +
				'" preserveAspectRatio="none" aria-hidden="true">' +
				SB.uvMaskShapes(pattern.key, size, coverUv().monogram || "AB") + "</svg>";
		});
	}

	function chooseUv(key) {
		coverUv().pattern = SB.uvPatternFor(key).key;
		scheduleSave();
		renderUvOptions();
		renderPages();
		renderSummary();
	}

	// The varnish file rides to the studio the same way a photograph does: it
	// is declared in the design and uploaded into the order's own prefix, so
	// it inherits the token, the retries and the size accounting rather than
	// growing a second delivery path of its own.
	function addUvFile(file) {
		if (!file) return;
		var ext = (/\.([A-Za-z0-9]+)$/.exec(file.name || "") || [])[1];
		var type = UV_FILE_EXTENSIONS[String(ext || "").toLowerCase()] ||
			(UV_FILE_TYPES.indexOf(file.type) !== -1 ? file.type : "");
		if (!type) {
			window.alert("A varnish mask has to be a PDF, SVG, AI or EPS. A photograph or a screenshot cannot be made into a plate.");
			return;
		}
		if (file.size > MAX_UV_BYTES) {
			window.alert("That file is larger than 30 MB. Send a flattened copy of it.");
			return;
		}
		coverUv().file = { id: "uv", name: file.name, bytes: file.size, type: type };
		photoBlobs.set("uv", file);
		putPhoto({ id: "uv", name: file.name, type: type, bytes: file.size, w: 0, h: 0, blob: file, thumb: null })
			.catch(storageFailed);
		scheduleSave();
		renderUvExtras();
		renderPages();
		renderSummary();
	}

	function renderPageOptions() {
		var host = document.getElementById("page-options");
		host.innerHTML = "";
		PAGE_COUNTS.forEach(function (count) {
			var button = document.createElement("button");
			button.type = "button";
			button.className = "ed-choice";
			button.setAttribute("aria-pressed", String(state.product.pages === count));
			button.innerHTML = "<span><strong></strong><small></small></span>";
			button.querySelector("strong").textContent = count + " pages";
			button.querySelector("small").textContent = PAGE_NOTES[count] || "";
			button.addEventListener("click", function () {
				if (count < state.product.pages) {
					var losing = 0;
					state.pages.slice(count).forEach(function (page) {
						page.slots.forEach(function (slot) { if (slot.photoId) losing++; });
					});
					if (losing && !window.confirm("Going down to " + count + " pages removes " + losing + " photo" + (losing === 1 ? "" : "s") + " from the end of the book. Continue?")) {
						return;
					}
				}
				setPageCount(state, count);
				scheduleSave();
				renderPageOptions();
				renderPages();
				renderSummary();
			});
			host.appendChild(button);
		});
	}

	// --- rendering: photos ------------------------------------------------

	function thumbElement(photo, options) {
		var button = document.createElement("button");
		button.type = "button";
		button.className = "ed-thumb";
		button.title = photo.name;
		button.setAttribute("aria-label", photo.name);

		var url = thumbUrls.get(photo.id);
		if (url) {
			var img = document.createElement("img");
			img.src = url;
			img.alt = "";
			button.appendChild(img);
		} else {
			var fallback = document.createElement("span");
			fallback.className = "ed-thumb-fallback";
			fallback.textContent = photo.name;
			button.appendChild(fallback);
		}

		if (options && options.draggable) {
			button.draggable = true;
			button.addEventListener("dragstart", function (event) {
				event.dataTransfer.setData("text/plain", photo.id);
				event.dataTransfer.effectAllowed = "copy";
				selectedPhotoId = photo.id;
				renderTray();
			});
		}
		return button;
	}

	function renderPhotos() {
		var host = document.getElementById("photo-list");
		var empty = document.getElementById("photo-empty");
		var count = document.getElementById("photo-count");
		host.innerHTML = "";
		empty.style.display = state.photos.length ? "none" : "block";
		count.textContent = state.photos.length
			? "— " + state.photos.length + " photo" + (state.photos.length === 1 ? "" : "s") + ", " + formatBytes(totalBytes())
			: "";

		state.photos.forEach(function (photo) {
			var wrap = document.createElement("div");
			wrap.style.position = "relative";
			var thumb = thumbElement(photo, { draggable: false });
			thumb.addEventListener("click", function () { removePhoto(photo.id); });
			thumb.title = photo.name + " — click to remove";
			wrap.appendChild(thumb);
			host.appendChild(wrap);
		});
	}

	function renderTray() {
		var host = document.getElementById("tray-list");
		var empty = document.getElementById("tray-empty");
		host.innerHTML = "";
		empty.style.display = state.photos.length ? "none" : "block";
		var used = usedPhotoIds();

		state.photos.forEach(function (photo) {
			var thumb = thumbElement(photo, { draggable: true });
			if (used.has(photo.id)) thumb.classList.add("is-used");
			if (selectedPhotoId === photo.id) thumb.classList.add("is-selected");
			thumb.addEventListener("click", function () {
				selectedPhotoId = selectedPhotoId === photo.id ? null : photo.id;
				renderTray();
			});
			host.appendChild(thumb);
		});
	}

	// --- rendering: pages -------------------------------------------------

	function layoutIcon(layout) {
		var cells = "";
		var w = 20 / layout.cols;
		var h = 14 / layout.rows;
		for (var r = 0; r < layout.rows; r++) {
			for (var c = 0; c < layout.cols; c++) {
				cells += '<rect x="' + (2 + c * w) + '" y="' + (2 + r * h) + '" width="' + (w - 1.5) + '" height="' + (h - 1.5) + '" rx="1" fill="currentColor" opacity="0.55"/>';
			}
		}
		return '<svg width="24" height="18" viewBox="0 0 24 18" aria-hidden="true">' + cells + "</svg>";
	}

	// One frame, whether it is on a page or on the cover. These were two
	// functions that had drifted into near-copies of each other; unified
	// because every control added below would otherwise have to be written and
	// then maintained twice, and the cover half was already missing the
	// adjust tools the page half had.
	//
	// pageIndex -1 means the cover. dpi is worked out by the caller, because a
	// cover frame is a fraction of the case and a page frame is a share of a
	// grid, and only the caller knows which.
	function buildFrame(slot, pageIndex, slotIndex, dpi) {
		var cell = document.createElement("div");
		cell.className = "ed-slot";
		var isAdjusting = adjusting(pageIndex, slotIndex);
		var photo = slot.photoId ? photoById(slot.photoId) : null;

		if (photo) {
			cell.classList.add("is-filled");
			var url = thumbUrls.get(photo.id);
			if (url) {
				var img = document.createElement("img");
				img.src = url;
				img.alt = "";
				applySlotImage(img, slot);
				cell.appendChild(img);
			} else {
				var fallback = document.createElement("span");
				fallback.className = "ed-slot-empty";
				fallback.textContent = photo.name;
				cell.appendChild(fallback);
			}

			if (dpi !== null && dpi < MIN_PRINT_DPI) {
				var warn = document.createElement("span");
				warn.className = "ed-slot-warn";
				warn.textContent = "small";
				warn.title = "About " + Math.round(dpi) + " dots per inch at this size. It will look soft in print. Use it smaller, turn off the crop, or send a bigger copy.";
				cell.appendChild(warn);
			}

			var tools = document.createElement("div");
			tools.className = "ed-slot-tools";
			tools.appendChild(miniButton(isAdjusting ? "done" : "adjust", function (event) {
				event.stopPropagation();
				panSlot = isAdjusting ? null : { page: pageIndex, slot: slotIndex };
				renderPages();
			}));
			tools.appendChild(miniButton("✕", function (event) {
				event.stopPropagation();
				emptySlot(slot);
				panSlot = null;
				scheduleSave();
				renderPages();
				renderTray();
				renderSummary();
			}));
			cell.appendChild(tools);

			if (isAdjusting) {
				cell.classList.add("is-adjusting");
				// Only while repositioning. Setting this permanently would take
				// the page scroll away from anyone on a phone, which is exactly
				// the sort of thing this site has had to undo before.
				cell.style.touchAction = "none";
				attachPan(cell, slot);
			}
		} else {
			var placeholder = document.createElement("span");
			placeholder.className = "ed-slot-empty";
			placeholder.textContent = pageIndex === -1
				? (selectedPhotoId ? "Tap for the cover" : "Cover photo")
				: (selectedPhotoId ? "Tap to place" : "Drop a photo");
			cell.appendChild(placeholder);
		}

		cell.addEventListener("click", function () {
			if (isAdjusting) return;
			if (!selectedPhotoId) return;
			fillSlot(slot, selectedPhotoId);
			scheduleSave();
			renderPages();
			renderTray();
			renderSummary();
		});

		cell.addEventListener("dragover", function (event) {
			event.preventDefault();
			event.dataTransfer.dropEffect = "copy";
			cell.classList.add("is-drop");
		});
		cell.addEventListener("dragleave", function () { cell.classList.remove("is-drop"); });
		cell.addEventListener("drop", function (event) {
			event.preventDefault();
			cell.classList.remove("is-drop");
			var id = event.dataTransfer.getData("text/plain");
			if (!id || !photoById(id)) return;
			fillSlot(slot, id);
			scheduleSave();
			renderPages();
			renderTray();
			renderSummary();
		});

		return cell;
	}

	function adjusting(pageIndex, slotIndex) {
		return Boolean(panSlot && panSlot.page === pageIndex && panSlot.slot === slotIndex);
	}

	// Resize, recentre, crop and turn, for the frame currently being adjusted.
	// It sits under the whole card rather than inside the frame: a four-photo
	// page gives a frame about a thumbnail's width, and a slider in there is a
	// control nobody on a phone can actually hit.
	function adjustBar(slot, cell) {
		var bar = document.createElement("div");
		bar.className = "ed-adjust";

		var zoomWrap = document.createElement("label");
		zoomWrap.className = "ed-adjust-zoom";
		zoomWrap.innerHTML = "<span>Size</span>";

		var zoom = document.createElement("input");
		zoom.type = "range";
		zoom.min = "1";
		zoom.max = String(MAX_ZOOM);
		zoom.step = "0.01";
		zoom.value = String(slot.zoom || 1);
		zoom.setAttribute("aria-label", "Size of the photo in its frame");

		// Dragging the slider redraws the one image rather than the page. A
		// full re-render on every input event would rebuild the slider under
		// the finger holding it, which ends the drag on the first move.
		zoom.addEventListener("input", function () {
			slot.zoom = Math.round(Number(zoom.value) * 100) / 100;
			var img = cell.querySelector("img");
			if (img) applySlotImage(img, slot);
			scheduleSave();
		});
		// The resolution badge and the review notes only settle once the drag
		// stops, so they are brought up to date then.
		zoom.addEventListener("change", function () { renderPages(); renderSummary(); });

		zoomWrap.appendChild(zoom);
		bar.appendChild(zoomWrap);

		var buttons = document.createElement("div");
		buttons.className = "ed-adjust-buttons";

		buttons.appendChild(smallButton("Recentre", "Put the photo back in the middle at its original size", function () {
			slot.zoom = 1;
			slot.x = 50;
			slot.y = 50;
			scheduleSave();
			renderPages();
			renderSummary();
		}));

		var cropping = SB.slotFit(slot) === "cover";
		buttons.appendChild(smallButton(cropping ? "Show all of it" : "Fill the frame",
			cropping
				? "Show the whole photo, with space at the sides rather than a crop"
				: "Crop the photo so it fills the frame edge to edge",
			function () {
				slot.fit = cropping ? "contain" : "cover";
				scheduleSave();
				renderPages();
				renderSummary();
			}));

		buttons.appendChild(smallButton("Turn", "Turn the photo a quarter turn", function () {
			slot.rotate = (SB.slotRotate(slot) + 90) % 360;
			scheduleSave();
			renderPages();
			renderSummary();
		}));

		buttons.appendChild(smallButton("Done", "Finish adjusting this photo", function () {
			panSlot = null;
			renderPages();
		}));

		bar.appendChild(buttons);

		var hint = document.createElement("p");
		hint.className = "ed-adjust-hint";
		hint.textContent = "Drag the photo to move it inside its frame.";
		bar.appendChild(hint);

		return bar;
	}

	// Filling and emptying a frame mutate it in place, so nothing needs to know
	// which array the frame came out of, and a new placement can never disagree
	// with blankSlot about the untouched defaults.
	function fillSlot(slot, photoId) {
		var fresh = placed(photoId);
		Object.keys(fresh).forEach(function (key) { slot[key] = fresh[key]; });
	}

	function emptySlot(slot) {
		var fresh = blankSlot();
		Object.keys(fresh).forEach(function (key) { slot[key] = fresh[key]; });
	}

	function miniButton(label, onClick) {
		var button = document.createElement("button");
		button.type = "button";
		button.className = "ed-mini";
		button.textContent = label;
		button.addEventListener("click", onClick);
		return button;
	}

	function attachPan(cell, slot) {
		var dragging = false;
		var startX = 0;
		var startY = 0;
		var originX = slot.x;
		var originY = slot.y;

		cell.addEventListener("pointerdown", function (event) {
			// The tools sit inside the frame. Capturing the pointer for a drag
			// that started on the zoom button swallows its click, which is how
			// zoom and remove quietly stopped working while repositioning.
			if (event.target.closest && event.target.closest(".ed-slot-tools")) return;
			dragging = true;
			startX = event.clientX;
			startY = event.clientY;
			originX = slot.x;
			originY = slot.y;
			cell.setPointerCapture(event.pointerId);
		});

		cell.addEventListener("pointermove", function (event) {
			if (!dragging) return;
			var rect = cell.getBoundingClientRect();
			// Dragging right should bring what is on the left into view, so the
			// focal point moves the other way.
			var nextX = originX - ((event.clientX - startX) / Math.max(1, rect.width)) * 100;
			var nextY = originY - ((event.clientY - startY) / Math.max(1, rect.height)) * 100;
			slot.x = Math.max(0, Math.min(100, Math.round(nextX)));
			slot.y = Math.max(0, Math.min(100, Math.round(nextY)));
			var img = cell.querySelector("img");
			if (img) applySlotImage(img, slot);
		});

		function stop(event) {
			if (!dragging) return;
			dragging = false;
			try { cell.releasePointerCapture(event.pointerId); } catch (e) { /* already gone */ }
			scheduleSave();
		}

		cell.addEventListener("pointerup", stop);
		cell.addEventListener("pointercancel", stop);
	}

	// --- text on a page, in the editor ------------------------------------

	function buildTextLayer(pageIndex) {
		var layer = document.createElement("div");
		layer.className = "ed-text-layer is-editable";

		textsFor(pageIndex).forEach(function (box) {
			var el = SB.textElement(box);
			el.setAttribute("data-text-id", box.id);

			// An empty box would be an invisible one, and a box you cannot see
			// is a box you cannot select to type into.
			if (!String(box.text || "").trim()) {
				var ghost = document.createElement("span");
				ghost.className = "ed-text-empty";
				ghost.textContent = "Your words here";
				el.textContent = "";
				el.appendChild(ghost);
			}

			if (selectedText && selectedText.page === pageIndex && selectedText.id === box.id) {
				el.classList.add("is-selected");
				var handle = document.createElement("button");
				handle.type = "button";
				handle.className = "ed-text-handle";
				handle.setAttribute("aria-label", "Change how wide this text is");
				el.appendChild(handle);
				attachTextResize(handle, box, layer);
			}

			attachTextDrag(el, box, layer, pageIndex);
			layer.appendChild(el);
		});

		return layer;
	}

	// Redraws one box in place. Typing re-renders nothing else, because
	// rebuilding the page on every keystroke takes the cursor out of the
	// textarea the customer is typing into.
	function liveUpdateText(box) {
		var el = document.querySelector('.ed-text-layer [data-text-id="' + box.id + '"]');
		if (!el) return;
		var fresh = SB.textElement(box);
		el.className = fresh.className + " is-selected";
		el.setAttribute("style", fresh.getAttribute("style"));
		el.textContent = "";
		if (String(box.text || "").trim()) {
			el.textContent = box.text;
		} else {
			var ghost = document.createElement("span");
			ghost.className = "ed-text-empty";
			ghost.textContent = "Your words here";
			el.appendChild(ghost);
		}
		var handle = document.createElement("button");
		handle.type = "button";
		handle.className = "ed-text-handle";
		handle.setAttribute("aria-label", "Change how wide this text is");
		el.appendChild(handle);
		attachTextResize(handle, box, el.parentNode);
	}

	// Dragging moves the box; a press that does not move selects it. Doing the
	// selection on pointerdown instead would re-render the page and destroy the
	// element under the finger before the drag had started.
	function attachTextDrag(el, box, layer, pageIndex) {
		var dragging = false;
		var moved = false;
		var startX = 0;
		var startY = 0;
		var originX = 0;
		var originY = 0;

		el.addEventListener("pointerdown", function (event) {
			// The width handle lives inside the box. A drag that begins on it
			// is a resize, not a move — the same guard attachPan uses for the
			// slot tools, and there for the same reason.
			if (event.target.closest && event.target.closest(".ed-text-handle")) return;
			event.stopPropagation();
			dragging = true;
			moved = false;
			startX = event.clientX;
			startY = event.clientY;
			originX = box.x;
			originY = box.y;
			el.setPointerCapture(event.pointerId);
		});

		el.addEventListener("pointermove", function (event) {
			if (!dragging) return;
			var rect = layer.getBoundingClientRect();
			var dx = ((event.clientX - startX) / Math.max(1, rect.width)) * 100;
			var dy = ((event.clientY - startY) / Math.max(1, rect.height)) * 100;
			if (Math.abs(event.clientX - startX) > 3 || Math.abs(event.clientY - startY) > 3) moved = true;
			box.x = Math.round(Math.max(0, Math.min(100, originX + dx)));
			box.y = Math.round(Math.max(0, Math.min(100, originY + dy)));
			el.style.left = box.x + "%";
			el.style.top = box.y + "%";
		});

		function stop(event) {
			if (!dragging) return;
			dragging = false;
			try { el.releasePointerCapture(event.pointerId); } catch (e) { /* already gone */ }
			if (moved) {
				scheduleSave();
				return;
			}
			var already = selectedText && selectedText.page === pageIndex && selectedText.id === box.id;
			selectedText = already ? null : { page: pageIndex, id: box.id };
			renderPages();
		}

		el.addEventListener("pointerup", stop);
		el.addEventListener("pointercancel", stop);
	}

	function attachTextResize(handle, box, layer) {
		var sizing = false;
		var startX = 0;
		var originW = 0;

		handle.addEventListener("pointerdown", function (event) {
			event.stopPropagation();
			event.preventDefault();
			sizing = true;
			startX = event.clientX;
			originW = box.w;
			handle.setPointerCapture(event.pointerId);
		});

		handle.addEventListener("pointermove", function (event) {
			if (!sizing) return;
			var rect = layer.getBoundingClientRect();
			// The box is centred on x, so it grows from both edges at once and
			// the pointer covers half the change.
			var dw = ((event.clientX - startX) / Math.max(1, rect.width)) * 200;
			box.w = Math.round(Math.max(8, Math.min(100, originW + dw)));
			var el = handle.parentNode;
			if (el) el.style.width = box.w + "%";
		});

		function stop(event) {
			if (!sizing) return;
			sizing = false;
			try { handle.releasePointerCapture(event.pointerId); } catch (e) { /* already gone */ }
			scheduleSave();
		}

		handle.addEventListener("pointerup", stop);
		handle.addEventListener("pointercancel", stop);
		handle.addEventListener("click", function (event) { event.stopPropagation(); });
	}

	// Everything a text box can be: what it says, what colour it is, what it
	// sits on, what shape that is, and how it is set. Under the card, for the
	// same reason the adjust bar is — a text box on a four-photo page is too
	// small to hold controls anyone can hit.
	function textTools(box, pageIndex) {
		var wrap = document.createElement("div");
		wrap.className = "ed-text-tools";

		var area = document.createElement("textarea");
		area.value = box.text || "";
		area.maxLength = SB.TEXT_MAX_LENGTH;
		area.placeholder = "What should this say?";
		area.setAttribute("aria-label", "The words in this text box");
		area.addEventListener("input", function () {
			box.text = area.value;
			scheduleSave();
			liveUpdateText(box);
		});
		wrap.appendChild(area);

		var row = function (label) {
			var r = document.createElement("div");
			r.className = "ed-text-row";
			if (label) {
				var l = document.createElement("span");
				l.className = "ed-text-label";
				l.textContent = label;
				r.appendChild(l);
			}
			wrap.appendChild(r);
			return r;
		};

		var toggle = function (label, pressed, onClick, title) {
			var b = document.createElement("button");
			b.type = "button";
			b.className = "ed-text-toggle";
			b.textContent = label;
			if (title) b.title = title;
			b.setAttribute("aria-pressed", String(Boolean(pressed)));
			b.addEventListener("click", function () {
				onClick();
				scheduleSave();
				renderPages();
			});
			return b;
		};

		// --- font colour ---
		var colourRow = row("Text");
		var ink = document.createElement("input");
		ink.type = "color";
		ink.value = box.color || "#ffffff";
		ink.setAttribute("aria-label", "Colour of the words");
		ink.addEventListener("input", function () {
			box.color = ink.value;
			scheduleSave();
			liveUpdateText(box);
		});
		colourRow.appendChild(ink);

		// --- background colour, with the translucency type on a photo needs ---
		var bg = splitColour(box.background);
		var bgRow = row("Behind");
		var bgInput = document.createElement("input");
		bgInput.type = "color";
		bgInput.value = bg.rgb;
		bgInput.setAttribute("aria-label", "Colour behind the words");
		var alpha = document.createElement("input");
		alpha.type = "range";
		alpha.min = "0";
		alpha.max = "1";
		alpha.step = "0.05";
		alpha.value = String(bg.alpha);
		alpha.setAttribute("aria-label", "How solid the colour behind the words is");

		var applyBackground = function () {
			box.background = Number(alpha.value) === 0 ? "" : joinColour(bgInput.value, Number(alpha.value));
			scheduleSave();
			liveUpdateText(box);
		};
		bgInput.addEventListener("input", function () {
			// Picking a colour with the slider at nothing plainly means it
			// should be visible, so it is brought up rather than staying blank.
			if (Number(alpha.value) === 0) alpha.value = "0.6";
			applyBackground();
		});
		alpha.addEventListener("input", applyBackground);
		bgRow.appendChild(bgInput);
		bgRow.appendChild(alpha);
		bgRow.appendChild(toggle("None", !box.background, function () { box.background = ""; },
			"No colour behind the words at all"));

		// --- shape ---
		var shapeRow = row("Shape");
		SB.TEXT_SHAPES.forEach(function (shape) {
			shapeRow.appendChild(toggle(shape.label, box.shape === shape.key, function () {
				box.shape = shape.key;
			}));
		});

		// --- typeface and weight ---
		var fontRow = row("Style");
		SB.TEXT_FONTS.forEach(function (font) {
			var b = toggle(font.label, box.font === font.key, function () { box.font = font.key; });
			b.style.fontFamily = font.stack;
			fontRow.appendChild(b);
		});
		fontRow.appendChild(toggle("Bold", box.weight === 700, function () {
			box.weight = box.weight === 700 ? 400 : 700;
		}));
		fontRow.appendChild(toggle("Italic", box.italic, function () { box.italic = !box.italic; }));

		// --- alignment ---
		var alignRow = row("Align");
		[["Left", "left"], ["Centre", "center"], ["Right", "right"]].forEach(function (pair) {
			alignRow.appendChild(toggle(pair[0], box.align === pair[1], function () { box.align = pair[1]; }));
		});

		// --- size ---
		var sizeRow = row("Size");
		var size = document.createElement("input");
		size.type = "range";
		size.min = String(SB.TEXT_MIN_SIZE);
		size.max = String(SB.TEXT_MAX_SIZE);
		size.step = "0.1";
		size.value = String(box.size);
		size.setAttribute("aria-label", "How big the words are");
		size.addEventListener("input", function () {
			box.size = Math.round(Number(size.value) * 10) / 10;
			scheduleSave();
			liveUpdateText(box);
		});
		sizeRow.appendChild(size);

		var lastRow = row("");
		lastRow.appendChild(smallButton("Remove this text", "Take this text off the page", function () {
			removeText(pageIndex, box.id);
		}));
		lastRow.appendChild(smallButton("Done", "Finish editing this text", function () {
			selectedText = null;
			renderPages();
		}));

		return wrap;
	}

	function pageCard(title, body) {
		var card = document.createElement("div");
		card.className = "ed-page";
		var head = document.createElement("div");
		head.className = "ed-page-head";
		var label = document.createElement("span");
		label.className = "ed-page-label";
		label.textContent = title;
		head.appendChild(label);
		card.appendChild(head);
		card.appendChild(body);
		return { card: card, head: head };
	}

	function sheetElement(layout) {
		var size = sizeFor(state.product.size);
		var sheet = document.createElement("div");
		sheet.className = "ed-sheet";
		sheet.style.aspectRatio = size.w + " / " + size.h;
		sheet.style.gridTemplateColumns = "repeat(" + layout.cols + ", 1fr)";
		sheet.style.gridTemplateRows = "repeat(" + layout.rows + ", 1fr)";
		return sheet;
	}

	function renderPages() {
		var host = document.getElementById("pages");
		if (!host) return;
		host.innerHTML = "";

		// Cover first. It is the page everyone judges the book by and the one
		// customers forget to fill in, so it is not hidden behind a tab.
		host.appendChild(buildCoverCard());

		state.pages.forEach(function (page, pageIndex) {
			var layout = layoutFor(page.layout);
			var sheet = sheetElement(layout);
			var adjustCell = null;
			page.slots.forEach(function (slot, slotIndex) {
				var photo = slot.photoId ? photoById(slot.photoId) : null;
				var cell = buildFrame(slot, pageIndex, slotIndex,
					photo ? SB.slotDpi(photo, state.product.size, layout, slot) : null);
				if (adjusting(pageIndex, slotIndex)) adjustCell = cell;
				sheet.appendChild(cell);
			});

			sheet.appendChild(buildTextLayer(pageIndex));

			var built = pageCard("Page " + (pageIndex + 1), sheet);
			if (adjustCell) {
				built.card.appendChild(adjustBar(page.slots[panSlot.slot], adjustCell));
			}
			if (selectedText && selectedText.page === pageIndex) {
				var chosen = selectedTextBox();
				if (chosen) built.card.appendChild(textTools(chosen, pageIndex));
			}

			var tools = document.createElement("div");
			tools.className = "ed-page-tools";
			tools.appendChild(smallButton("Add text", "Put words on this page", function () { addText(pageIndex); }));
			tools.appendChild(smallButton("↑", "Move this page earlier", function () { movePage(pageIndex, -1); }));
			tools.appendChild(smallButton("↓", "Move this page later", function () { movePage(pageIndex, 1); }));
			built.head.appendChild(tools);

			var layouts = document.createElement("div");
			layouts.className = "ed-layouts";
			LAYOUTS.forEach(function (option) {
				var button = document.createElement("button");
				button.type = "button";
				button.className = "ed-layout";
				button.title = option.label;
				button.setAttribute("aria-label", option.label);
				button.setAttribute("aria-pressed", String(page.layout === option.key));
				button.innerHTML = layoutIcon(option);
				button.addEventListener("click", function () { changeLayout(pageIndex, option.key); });
				layouts.appendChild(button);
			});
			built.card.appendChild(layouts);

			var caption = document.createElement("input");
			caption.type = "text";
			caption.className = "ed-caption-input";
			caption.maxLength = 200;
			caption.placeholder = "Caption for this page (optional)";
			caption.value = page.caption || "";
			caption.addEventListener("input", function () {
				page.caption = caption.value;
				scheduleSave();
			});
			built.card.appendChild(caption);

			host.appendChild(built.card);
		});
	}

	// The cover as the chosen design arranges it. The frame wrapper carries the
	// same ed-cover-design-* class the shared renderer uses, so the geometry is
	// one set of rules in the stylesheet rather than a second copy that drifts.
	function buildCoverCard() {
		var design = coverDesign();
		var slots = coverSlots();

		var frame = document.createElement("div");
		frame.className = "ed-cover-frame ed-cover-design-" + design.key;

		var sheet = document.createElement("div");
		sheet.className = "ed-sheet ed-cover-sheet";
		sheet.style.aspectRatio = "auto";

		var adjustCell = null;
		slots.forEach(function (slot, index) {
			var photo = slot.photoId ? photoById(slot.photoId) : null;
			var cell = buildFrame(slot, -1, index,
				photo ? SB.coverSlotDpi(photo, state.product.size, design, index, slot) : null);
			if (adjusting(-1, index)) adjustCell = cell;
			sheet.appendChild(cell);
		});
		sheet.appendChild(buildTextLayer(-1));
		frame.appendChild(sheet);

		if (design.text !== "overlay" || state.cover.title || state.cover.subtitle) {
			var text = document.createElement("div");
			text.className = "ed-preview-cover-text is-" + design.text;
			text.innerHTML = '<div class="t"></div><div class="s"></div>';
			text.querySelector(".t").textContent = state.cover.title || "";
			text.querySelector(".s").textContent = state.cover.subtitle || "";
			frame.appendChild(text);
		}

		// Varnish goes on last, over the picture and the type alike. Built by
		// the shared renderer, so the arrange grid, the preview, the print
		// sheet and the customer's read-only view all show the same sheen.
		var varnish = SB.uvLayer(state);
		if (varnish) frame.appendChild(varnish);

		// The case is a fixed shape, so the frame has to be given the paper's
		// proportions here rather than by ed-sheet as a page card is.
		var size = sizeFor(state.product.size);
		frame.style.aspectRatio = size.w + " / " + size.h;

		var built = pageCard("Cover — " + design.label, frame);

		var tools = document.createElement("div");
		tools.className = "ed-page-tools";
		tools.appendChild(smallButton("Add text", "Put words on the cover", function () { addText(-1); }));
		built.head.appendChild(tools);

		if (adjustCell) {
			built.card.appendChild(adjustBar(state.cover.slots[panSlot.slot], adjustCell));
		}
		if (selectedText && selectedText.page === -1) {
			var chosen = selectedTextBox();
			if (chosen) built.card.appendChild(textTools(chosen, -1));
		}
		return built.card;
	}

	function smallButton(label, title, onClick) {
		var button = document.createElement("button");
		button.type = "button";
		button.className = "ed-btn secondary small";
		button.textContent = label;
		button.title = title;
		button.addEventListener("click", onClick);
		return button;
	}

	function movePage(index, direction) {
		var target = index + direction;
		if (target < 0 || target >= state.pages.length) return;
		var moved = state.pages.splice(index, 1)[0];
		state.pages.splice(target, 0, moved);
		// The words travel with the page, because they live on it. The
		// selection does not: it names a position, and the page that was at
		// that position is no longer the one that is there.
		panSlot = null;
		selectedText = null;
		scheduleSave();
		renderPages();
	}

	// Fitting a set of frames to a new count. Photos already placed are kept in
	// order and anything left without a frame comes off, announced rather than
	// silent. Returns null if the customer would rather not.
	//
	// Shared by page layouts and cover designs because it is the same question
	// asked about two different things, and a second copy would be a second
	// place for the confirmation to go missing.
	function reflowSlots(slots, wanted, where) {
		var filled = slots.filter(function (slot) { return slot.photoId; });
		if (filled.length > wanted) {
			var losing = filled.length - wanted;
			if (!window.confirm(
				"That " + where + " holds " + wanted + " photo" + (wanted === 1 ? "" : "s") +
				", so " + losing + " would come off. Continue?"
			)) {
				return null;
			}
		}
		var next = [];
		for (var i = 0; i < wanted; i++) next.push(filled[i] || blankSlot());
		return next;
	}

	function changeLayout(pageIndex, layoutKey) {
		var page = state.pages[pageIndex];
		var layout = layoutFor(layoutKey);
		var next = reflowSlots(page.slots, layout.cols * layout.rows, "layout");
		if (!next) return;
		page.layout = layout.key;
		page.slots = next;
		panSlot = null;
		scheduleSave();
		renderPages();
		renderTray();
		renderSummary();
	}

	function autofill() {
		var used = usedPhotoIds();
		var queue = state.photos.filter(function (p) { return !used.has(p.id); });
		if (!queue.length) {
			window.alert("Every photo is already placed somewhere.");
			return;
		}
		coverSlots().forEach(function (slot, i) {
			if (slot.photoId || !queue.length) return;
			state.cover.slots[i] = placed(queue.shift().id);
		});
		for (var p = 0; p < state.pages.length && queue.length; p++) {
			var page = state.pages[p];
			for (var s = 0; s < page.slots.length && queue.length; s++) {
				if (page.slots[s].photoId) continue;
				page.slots[s] = { photoId: queue.shift().id, zoom: 1, x: 50, y: 50 };
			}
		}
		scheduleSave();
		renderPages();
		renderTray();
		renderSummary();
		if (queue.length) {
			window.alert(queue.length + " photo" + (queue.length === 1 ? " did" : "s did") + " not fit. Add pages, or use layouts that hold more photos.");
		}
	}

	function clearPages() {
		if (!window.confirm("Take every photo off every page? The photos stay in your list.")) return;
		state.cover.slots = coverSlots().map(function () { return blankSlot(); });
		state.cover.texts = [];
		selectedText = null;
		state.pages.forEach(function (page) {
			page.texts = [];
			page.slots = page.slots.map(function () { return blankSlot(); });
		});
		panSlot = null;
		scheduleSave();
		renderPages();
		renderTray();
		renderSummary();
	}

	// --- rendering: review ------------------------------------------------

	function renderSummary() {
		var table = document.getElementById("summary");
		if (!table) return;
		var size = sizeFor(state.product.size);
		var used = usedPhotoIds();
		var rows = [
			["Size", size.label + " — " + size.w + " × " + size.h + " mm"],
			["Pages", String(state.product.pages)],
			["Cover", SB.finishFor(state.product.finish).label + " — case bound"],
			["Cover title", state.cover.title ? state.cover.title + (state.cover.subtitle ? " — " + state.cover.subtitle : "") : "no title yet"],
			["Cover design", coverDesign().label],
			["Varnish", uvSummary()],
			["Cover photo", coverPhotoSummary()],
			["Photos in the book", state.photos.length + " (" + used.size + " placed, " + formatBytes(totalBytes()) + ")"],
			["Empty frames", String(emptySlotCount())]
		];
		table.innerHTML = rows.map(function (row) {
			var th = document.createElement("th");
			th.textContent = row[0];
			var td = document.createElement("td");
			td.textContent = row[1];
			return "<tr>" + th.outerHTML + td.outerHTML + "</tr>";
		}).join("");

		renderReviewNotes();
	}

	function renderReviewNotes() {
		var host = document.getElementById("review-notes");
		if (!host) return;
		host.innerHTML = "";

		var lowRes = lowResSlots();
		var unreadable = unreadablePhotos();
		var empties = emptySlotCount();
		var unused = unusedPhotoCount();

		if (!state.photos.length) {
			host.appendChild(note("bad", "There are no photos in this book yet. Add some in step 2."));
			return;
		}

		if (lowRes.length) {
			var list = lowRes.slice(0, 6).map(function (item) {
				return frameLabel(item) + " — about " + item.dpi + " dpi" + (item.name ? " (" + item.name + ")" : "");
			});
			var extra = lowRes.length > 6 ? "<li>and " + (lowRes.length - 6) + " more</li>" : "";
			host.appendChild(note(
				"warn",
				lowRes.length + " photo" + (lowRes.length === 1 ? " is" : "s are") + " smaller than we would like at the size " +
				(lowRes.length === 1 ? "it is" : "they are") + " printed. " +
				"They will still print, just softer. Using them in a smaller frame, or sending the original file rather than a copy from WhatsApp, usually fixes it." +
				"<ul>" + list.map(function (l) { return "<li>" + escapeHtml(l) + "</li>"; }).join("") + extra + "</ul>",
				true
			));
		}

		if (unreadable.length) {
			host.appendChild(note("", unreadable.length + " photo" + (unreadable.length === 1 ? "" : "s") +
				" could not be opened by this browser — usually iPhone HEIC files. They will still be sent and we will check them here."));
		}

		if (empties) {
			host.appendChild(note("", empties + " frame" + (empties === 1 ? " is" : "s are") + " still empty. We can leave them blank or fill them when we design — tell us in the notes."));
		}

		if (unused) {
			host.appendChild(note("", unused + " photo" + (unused === 1 ? " is" : "s are") + " not placed on any page. They are still sent, and we will find a home for them if you would like."));
		}

		if (!lowRes.length && !empties && !unused && !unreadable.length) {
			host.appendChild(note("good", "The book is complete and every photo is big enough for the size it prints at."));
		}
	}

	// lowResSlots reports the cover as page 0, because a cover is not page one.
	function frameLabel(item) {
		if (item.page === 0) {
			return coverDesign().frames.length > 1 ? "Cover, photo " + item.slot : "Cover photo";
		}
		return "Page " + item.page + ", frame " + item.slot;
	}

	function note(tone, html, isHtml) {
		var div = document.createElement("div");
		div.className = "ed-note" + (tone ? " " + tone : "");
		if (isHtml) div.innerHTML = html;
		else div.textContent = html;
		return div;
	}

	function escapeHtml(value) {
		return String(value).replace(/[&<>"']/g, function (c) {
			return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
		});
	}

	// --- preview ----------------------------------------------------------
	//
	// The arrange grid shows twenty page cards with layout buttons and caption
	// boxes all over them, which is the right tool for building a book and the
	// wrong one for judging whether it is any good. This is the book: two
	// facing pages at a time, at their real proportions, with nothing to click
	// on them. It is the last thing between designing and sending.

	var previewViews = [];
	var previewIndex = 0;

	// How the shared renderer turns a photo id into a picture here: the small
	// screen copy made when the photo was added, held as an object URL.
	function previewResolve(photoId) {
		var photo = photoById(photoId);
		if (!photo) return null;
		return {
			url: thumbUrls.get(photo.id) || null,
			name: photo.name,
			w: photo.w,
			h: photo.h
		};
	}

	function buildPreviewViews() {
		return SB.buildViews(state);
	}

	function renderPreview() {
		var stage = document.getElementById("preview-spread");
		var view = previewViews[previewIndex];
		if (!stage || !view) return;

		stage.innerHTML = "";
		if (view.cover) {
			stage.appendChild(SB.leaf(state, null, previewResolve));
		} else {
			view.pages.forEach(function (pageIndex) {
				stage.appendChild(SB.leaf(state, pageIndex, previewResolve));
			});
		}

		var label = view.cover
			? "Cover"
			: view.pages.length === 2
				? "Pages " + (view.pages[0] + 1) + " and " + (view.pages[1] + 1)
				: "Page " + (view.pages[0] + 1);
		document.getElementById("preview-label").textContent = label;
		document.getElementById("preview-count").textContent =
			previewIndex + 1 + " of " + previewViews.length;
		document.getElementById("preview-prev").disabled = previewIndex === 0;
		document.getElementById("preview-next").disabled = previewIndex >= previewViews.length - 1;

		SB.fitSpread(document.querySelector(".ed-preview-stage"), stage, state, view);

		// The review step lists every soft photo in the book, which is a list
		// nobody maps back to a page. Here it can be said about the pages the
		// reader is looking at, which is the moment it means something.
		var soft = lowResSlots().filter(function (item) {
			return view.cover
				? item.page === 0
				: view.pages.indexOf(item.page - 1) !== -1;
		});
		var hint = document.getElementById("preview-hint");
		hint.textContent = soft.length
			? soft.length + (soft.length === 1 ? " photo here is" : " photos here are") +
				" smaller than we would like at this size — it will print softer than it looks on screen."
			: "Use the arrows, or the ← and → keys. Esc closes.";
		hint.style.color = soft.length ? "#f0b27a" : "";
	}

	function previewGo(delta) {
		var next = previewIndex + delta;
		if (next < 0 || next >= previewViews.length) return;
		previewIndex = next;
		renderPreview();
	}

	function openPreview() {
		previewViews = buildPreviewViews();
		previewIndex = 0;
		var overlay = document.getElementById("preview");
		overlay.hidden = false;
		document.body.style.overflow = "hidden";
		renderPreview();
		document.getElementById("preview-close").focus();
	}

	function closePreview() {
		document.getElementById("preview").hidden = true;
		document.body.style.overflow = "";
		document.getElementById("preview-spread").innerHTML = "";
	}

	function previewIsOpen() {
		return !document.getElementById("preview").hidden;
	}

	// Every page, one per sheet. Built on demand rather than kept in the DOM,
	// because a sixty-page book is sixty more images than the editor needs to
	// be carrying around while someone is still working.
	function printBook() {
		var host = document.getElementById("print-book");
		host.innerHTML = "";
		// Every sheet comes out at the trim size of the book, so the PDF the
		// dialog saves is the file a printer can work from rather than a
		// picture of one.
		SB.applyPrintPageSize(state);
		SB.allLeaves(state, previewResolve).forEach(function (leaf) {
			host.appendChild(leaf);
		});
		// Give the browser a frame to lay it out before the print dialog
		// freezes everything.
		window.requestAnimationFrame(function () {
			window.requestAnimationFrame(function () {
				window.print();
			});
		});
	}

	// --- steps ------------------------------------------------------------

	var STEPS = ["size", "photos", "arrange", "send"];

	function canReach(target) {
		if (target === "send") return state.photos.length > 0;
		return true;
	}

	function goTo(target) {
		if (!canReach(target)) return;
		step = target;
		document.querySelectorAll(".ed-panel").forEach(function (panel) {
			panel.classList.toggle("is-active", panel.getAttribute("data-panel") === target);
		});
		renderSteps();
		if (target === "arrange") renderPages();
		if (target === "send") renderSummary();
		window.scrollTo({ top: 0, behavior: "auto" });
	}

	function renderSteps() {
		document.querySelectorAll(".ed-step").forEach(function (button) {
			var target = button.getAttribute("data-step");
			button.setAttribute("aria-current", target === step ? "step" : "false");
			button.disabled = !canReach(target);
		});
		var index = STEPS.indexOf(step);
		// Worth offering only once there is something to look at, and only on
		// the two steps where the book exists.
		var preview = document.getElementById("dock-preview");
		preview.hidden = !(state.photos.length && (step === "arrange" || step === "send"));
		var back = document.getElementById("dock-back");
		var next = document.getElementById("dock-next");
		back.disabled = index <= 0;
		next.disabled = index >= STEPS.length - 1 || !canReach(STEPS[index + 1]);
		next.textContent = index === STEPS.length - 2 ? "Review & send" : "Next";
	}

	// --- sending ----------------------------------------------------------

	function setSendStatus(text, tone) {
		var el = document.getElementById("send-status");
		el.textContent = text;
		el.className = "ed-note" + (tone ? " " + tone : "");
		el.style.display = text ? "block" : "none";
	}

	function setProgress(done, total) {
		var wrap = document.getElementById("send-progress");
		var bar = document.getElementById("send-progress-bar");
		if (total <= 0) {
			wrap.style.display = "none";
			return;
		}
		wrap.style.display = "block";
		bar.style.width = Math.round((done / total) * 100) + "%";
	}

	function collectCustomer() {
		return {
			name: document.getElementById("cust-name").value.trim(),
			email: document.getElementById("cust-email").value.trim(),
			phone: document.getElementById("cust-phone").value.trim(),
			occasion: document.getElementById("cust-occasion").value,
			copies: Number(document.getElementById("cust-copies").value || 1),
			needed_by: document.getElementById("cust-needed").value,
			notes: document.getElementById("cust-notes").value.trim(),
			website: document.getElementById("cust-website").value.trim()
		};
	}

	// The design goes as it stands. Photos not placed on a page are still part
	// of the order — the customer sent them for a reason.
	function designPayload() {
		return JSON.parse(JSON.stringify(state));
	}

	function send(event) {
		event.preventDefault();
		if (sending) return;

		var customer = collectCustomer();
		if (!customer.name) { setSendStatus("Please give us your name.", "bad"); return; }
		if (!customer.email || customer.email.indexOf("@") < 1) { setSendStatus("Please give us an email address we can reply to.", "bad"); return; }
		if (!state.photos.length) { setSendStatus("Add at least one photo before sending.", "bad"); return; }

		sending = true;
		var button = document.getElementById("send-button");
		button.disabled = true;
		setSendStatus("Sending your book…", "");

		var orderId = null;
		var token = null;

		fetch("/api/studio/orders", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ customer: customer, design: designPayload() })
		})
			.then(readJson)
			.then(function (result) {
				orderId = result.id;
				token = result.upload_token;
				if (!orderId || !token) {
					// Honeypot path answers without an order; treat as done.
					throw { done: true, reference: result.reference };
				}
				// If the bucket is not there, forty failing requests tell the
				// customer nothing useful. The design is already saved, so
				// finish the order and let the studio ask for the files.
				if (result.uploads_enabled === false) {
					return state.photos.map(function (p) { return p.name; });
				}
				return uploadAll(orderId, token);
			})
			.then(function (failures) {
				setSendStatus(
					failures.length === 0
						? "Photos uploaded. Finishing up…"
						: failures.length === state.photos.length
							? "Your layout is on its way, but the photos would not attach. We will email you for the files."
							: failures.length + " photo" + (failures.length === 1 ? "" : "s") + " would not upload. Sending the rest…",
					failures.length ? "warn" : ""
				);
				return fetch("/api/studio/orders/" + encodeURIComponent(orderId) + "/submit", {
					method: "POST",
					headers: { "X-Studio-Token": token }
				}).then(readJson);
			})
			.then(function (result) {
				finish(result.reference);
			})
			.catch(function (error) {
				if (error && error.done) {
					finish(error.reference);
					return;
				}
				sending = false;
				button.disabled = false;
				setProgress(0, 0);
				setSendStatus(
					(error && error.message) ||
					"Your book could not be sent. Your work is still saved here — check your connection and try again, or send us a message and we will help.",
					"bad"
				);
			});
	}

	function readJson(response) {
		return response.json().catch(function () { return {}; }).then(function (body) {
			if (!response.ok) {
				var error = new Error(body.error || "That did not go through (" + response.status + ").");
				throw error;
			}
			return body;
		});
	}

	// A dropped photo is the difference between a book we can print and one we
	// have to email about, so a failed upload gets two more goes before it is
	// called a failure. A 4xx means the server has decided — too large, wrong
	// type, already submitted — and retrying it just wastes the customer's
	// data; only network errors and 5xx are worth another attempt.
	function putPhotoWithRetry(orderId, token, photo, blob, position, attempt) {
		var tries = attempt || 1;
		return fetch(
			"/api/studio/orders/" + encodeURIComponent(orderId) + "/photos/" + encodeURIComponent(photo.id),
			{
				method: "PUT",
				headers: {
					// The type worked out when the photo was added, not the
					// one the blob carries: a HEIC often carries none at all,
					// and the server keys the stored object off this header.
					"Content-Type": photo.type || blob.type || "image/jpeg",
					"X-Studio-Token": token
				},
				body: blob
			}
		).then(function (response) {
			if (response.ok) return true;
			if (response.status < 500 && response.status !== 429) return false;
			throw new Error("retryable " + response.status);
		}).catch(function () {
			// Everything that lands here is worth another go: a 5xx, a 429, or
			// the connection dropping. A settled 4xx returned false above and
			// never reaches this.
			if (tries >= 3) return false;
			setSendStatus("Photo " + position + " did not go through. Trying again…", "warn");
			return new Promise(function (resolve) {
				setTimeout(resolve, tries * 900);
			}).then(function () {
				return putPhotoWithRetry(orderId, token, photo, blob, position, tries + 1);
			});
		});
	}

	// One request per photo, in sequence. Parallel uploads finish sooner on a
	// good connection and fall over on a bad one, and the people sending forty
	// photos from a phone are on the bad one.
	function uploadAll(orderId, token) {
		var photos = state.photos.slice();
		// The varnish mask is not a photograph and is not in the photo list,
		// but it is a file this order needs, so it rides along on the same
		// token, the same retries and the same size accounting.
		if (coverUv().file) photos.push(coverUv().file);
		var failures = [];
		var done = 0;
		setProgress(0, photos.length);

		return photos.reduce(function (chain, photo) {
			return chain.then(function () {
				var blob = photoBlobs.get(photo.id);
				if (!blob) {
					failures.push(photo.name);
					return;
				}
				var position = done + 1;
				setSendStatus("Uploading photo " + position + " of " + photos.length + "…", "");
				return putPhotoWithRetry(orderId, token, photo, blob, position).then(function (ok) {
					if (!ok) failures.push(photo.name);
					done += 1;
					setProgress(done, photos.length);
				});
			});
		}, Promise.resolve()).then(function () { return failures; });
	}

	function finish(reference) {
		sending = false;
		setProgress(0, 0);
		document.getElementById("send-live").style.display = "none";
		document.getElementById("done-reference").textContent = reference || "";
		// Carry the reference through, so they only have to type the email.
		document.getElementById("done-open").href =
			"/studio/order" + (reference ? "?ref=" + encodeURIComponent(reference) : "");
		document.getElementById("send-done").style.display = "block";
		setDockStatus("Sent. Reference " + (reference || "") + ".");
		window.scrollTo({ top: 0, behavior: "auto" });
	}

	// --- boot -------------------------------------------------------------

	function restore() {
		return Promise.all([getMeta("design"), allPhotoRecords()]).then(function (results) {
			var saved = results[0];
			var records = results[1] || [];

			records.forEach(function (record) {
				photoBlobs.set(record.id, record.blob);
				if (record.thumb) thumbUrls.set(record.id, URL.createObjectURL(record.thumb));
			});

			if (saved && saved.product && Array.isArray(saved.pages) && saved.pages.length) {
				state = saved;
				// A draft saved before the choice existed never picked either,
				// so it gets the house default like a new book would.
				if (!state.product.finish) state.product.finish = "photo-wrap";
				if (!state.cover) state.cover = { title: "", subtitle: "", slot: blankSlot() };
				// A draft saved before cover designs existed holds one
				// cover.slot. Read it as the first frame, exactly as
				// book-render does for the orders already in the database.
				if (!state.cover.design) state.cover.design = "full-bleed";
				if (!Array.isArray(state.cover.slots)) {
					state.cover.slots = state.cover.slot ? [state.cover.slot] : [blankSlot()];
				}
				delete state.cover.slot;
				if (!Array.isArray(state.photos)) state.photos = [];
				// A draft saved before contentTypeFor existed recorded every
				// typeless HEIC as a JPEG. Work it out again from the name
				// rather than uploading the old answer.
				state.photos.forEach(function (p) {
					p.type = contentTypeFor({ name: p.name, type: p.type }) || p.type || "image/jpeg";
				});
				// A photo whose blob did not survive (a cleared browser, a
				// half-finished import) must not stay in the design: the
				// server would expect an upload that can never arrive.
				state.photos = state.photos.filter(function (p) { return photoBlobs.has(p.id); });
				var known = new Set(state.photos.map(function (p) { return p.id; }));
				state.cover.slots = coverSlots().map(function (slot) {
					return slot && slot.photoId && !known.has(slot.photoId) ? blankSlot() : slot || blankSlot();
				});
				state.cover.texts = normalizeTexts(state.cover.texts);
				if (!state.cover.uv) state.cover.uv = { pattern: "none", monogram: "", file: null };
				// A varnish file whose blob did not survive must not stay in
				// the design: the server would wait for an upload that can
				// never arrive, exactly as it would for a lost photograph.
				if (state.cover.uv.file && !photoBlobs.has("uv")) state.cover.uv.file = null;
				state.pages.forEach(function (page) {
					page.texts = normalizeTexts(page.texts);
				});
				state.pages.forEach(function (page) {
					page.slots = (page.slots || []).map(function (slot) {
						return slot && slot.photoId && !known.has(slot.photoId) ? blankSlot() : slot || blankSlot();
					});
				});
				setDockStatus("Picked up where you left off.");
			} else {
				state = blankState();
			}
		}).catch(function () {
			state = blankState();
			setDockStatus("This browser will not keep your book between visits. Finish in one sitting.");
		});
	}

	function wire() {
		document.getElementById("photo-input").addEventListener("change", function (event) {
			// Catch before clear, so the picker is always reset and the same
			// files can be chosen again after a failure.
			addFiles(event.target.files)
				.catch(storageFailed)
				.then(function () { event.target.value = ""; });
		});

		document.getElementById("clear-photos").addEventListener("click", function () {
			if (!state.photos.length) return;
			if (!window.confirm("Remove all " + state.photos.length + " photos and empty every page?")) return;
			removeAllPhotos();
		});

		document.getElementById("uv-input").addEventListener("change", function (event) {
			addUvFile(event.target.files && event.target.files[0]);
			event.target.value = "";
		});

		document.getElementById("autofill").addEventListener("click", autofill);
		document.getElementById("clear-pages").addEventListener("click", clearPages);

		var title = document.getElementById("cover-title");
		var subtitle = document.getElementById("cover-subtitle");
		title.addEventListener("input", function () {
			state.cover.title = title.value;
			scheduleSave();
			renderPages();
		});
		subtitle.addEventListener("input", function () {
			state.cover.subtitle = subtitle.value;
			scheduleSave();
			renderPages();
		});

		document.querySelectorAll(".ed-step").forEach(function (button) {
			button.addEventListener("click", function () { goTo(button.getAttribute("data-step")); });
		});

		document.getElementById("dock-back").addEventListener("click", function () {
			var index = STEPS.indexOf(step);
			if (index > 0) goTo(STEPS[index - 1]);
		});
		document.getElementById("dock-next").addEventListener("click", function () {
			var index = STEPS.indexOf(step);
			if (index < STEPS.length - 1) goTo(STEPS[index + 1]);
		});

		document.getElementById("dock-preview").addEventListener("click", openPreview);
		document.getElementById("review-preview").addEventListener("click", openPreview);
		document.getElementById("preview-print").addEventListener("click", printBook);
		document.getElementById("preview-close").addEventListener("click", closePreview);
		window.addEventListener("afterprint", function () {
			document.getElementById("print-book").innerHTML = "";
		});
		document.getElementById("preview-prev").addEventListener("click", function () { previewGo(-1); });
		document.getElementById("preview-next").addEventListener("click", function () { previewGo(1); });

		// Swipe, because that is what a phone expects of something shaped like
		// a book. Only a decisively horizontal drag counts, so it cannot be
		// mistaken for anything else.
		var swipeX = null;
		var swipeY = null;
		var stage = document.querySelector(".ed-preview-stage");
		stage.addEventListener("pointerdown", function (event) {
			// The arrows sit inside the stage. A press that starts on one and
			// drifts sideways before release is a click on that arrow, and
			// counting it as a swipe as well turned two pages at once.
			if (event.target.closest && event.target.closest(".ed-preview-arrow")) {
				swipeX = null;
				swipeY = null;
				return;
			}
			swipeX = event.clientX;
			swipeY = event.clientY;
		});
		stage.addEventListener("pointerup", function (event) {
			if (swipeX === null) return;
			var dx = event.clientX - swipeX;
			var dy = event.clientY - swipeY;
			swipeX = null;
			swipeY = null;
			if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
			previewGo(dx < 0 ? 1 : -1);
		});
		stage.addEventListener("pointercancel", function () {
			swipeX = null;
			swipeY = null;
		});

		document.addEventListener("keydown", function (event) {
			if (!previewIsOpen()) return;
			if (event.key === "Escape") { closePreview(); return; }
			if (event.key === "ArrowLeft") { event.preventDefault(); previewGo(-1); }
			if (event.key === "ArrowRight") { event.preventDefault(); previewGo(1); }
		});

		// Which pages share a view no longer depends on the screen, so a turn
		// sideways does not change the sequence. Only the spread's size has to
		// be worked out again, which is what redrawing the current view does.
		window.addEventListener("resize", function () {
			if (!previewIsOpen()) return;
			renderPreview();
		});

		document.getElementById("send-form").addEventListener("submit", send);

		document.getElementById("start-new").addEventListener("click", function () {
			if (!window.confirm("Start a new book? The one you just sent is safe with us, but this browser will forget it.")) return;
			// Reload either way. Failing to clear is a reason to start the
			// page again, not a reason to sit on a dead button.
			clearEverything()
				.catch(function () {})
				.then(function () { window.location.reload(); });
		});

		// Photos placed but not yet sent are the thing worth warning about.
		window.addEventListener("beforeunload", function (event) {
			if (sending) {
				event.preventDefault();
				event.returnValue = "";
			}
		});
	}

	function start() {
		restore().then(function () {
			document.getElementById("cover-title").value = state.cover.title || "";
			document.getElementById("cover-subtitle").value = state.cover.subtitle || "";
			renderSizeOptions();
			renderFinishOptions();
			renderCoverDesignOptions();
			renderUvOptions();
			renderPageOptions();
			renderPhotos();
			renderTray();
			renderPages();
			renderSummary();
			wire();
			goTo("size");
		}).catch(function () {
			// restore() handles its own storage failures, so reaching here
			// means the editor is half-built and nothing below will work.
			setDockStatus("The editor did not start properly. Reload the page.");
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start);
	} else {
		start();
	}
})();
