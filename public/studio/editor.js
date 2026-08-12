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

	// --- state ------------------------------------------------------------

	var state = null;          // the design, exactly as it is sent
	var photoBlobs = new Map();  // id -> original File/Blob, for upload
	var thumbUrls = new Map();   // id -> object URL of the small copy
	var selectedPhotoId = null;
	var panSlot = null;          // {page: n, slot: n} currently being repositioned
	var step = "size";
	var saveTimer = null;
	var sending = false;

	function blankSlot() {
		return { photoId: null, zoom: 1, x: 50, y: 50 };
	}

	function blankPage(layoutKey) {
		var layout = layoutFor(layoutKey || "full");
		var slots = [];
		for (var i = 0; i < layout.cols * layout.rows; i++) slots.push(blankSlot());
		return { layout: layout.key, caption: "", slots: slots };
	}

	function blankState() {
		var s = {
			version: 1,
			product: { size: "a4-portrait", pages: 24 },
			cover: { title: "", subtitle: "", slot: blankSlot() },
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

	// Slots hold ids; the photo list holds what those ids mean. Sending one
	// without the other is what the server rejects, so they are rebuilt
	// together every time.
	function usedPhotoIds() {
		var used = new Set();
		if (state.cover.slot.photoId) used.add(state.cover.slot.photoId);
		state.pages.forEach(function (page) {
			page.slots.forEach(function (slot) {
				if (slot.photoId) used.add(slot.photoId);
			});
		});
		return used;
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
				setDockStatus("Saved in this browser.");
			}).catch(function () {
				setDockStatus("This browser would not save your book. Keep this tab open.");
			});
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
			if (!/^image\//i.test(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
				rejected.push(file.name + " is not an image");
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
			accepted.push(file);
		});

		showPhotoStatus("Reading " + accepted.length + " photo" + (accepted.length === 1 ? "" : "s") + "…", "");

		var chain = Promise.resolve();
		accepted.forEach(function (file) {
			chain = chain.then(function () {
				return makeThumb(file).then(function (thumb) {
					var id = newPhotoId();
					var record = {
						id: id,
						name: file.name,
						type: file.type || "image/jpeg",
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
					return putPhoto(record);
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

	function removePhoto(id) {
		state.photos = state.photos.filter(function (p) { return p.id !== id; });
		if (state.cover.slot.photoId === id) state.cover.slot = blankSlot();
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
		deletePhotoRecord(id);
		scheduleSave();
		renderPhotos();
		renderTray();
		renderPages();
		renderSteps();
	}

	// --- resolution -------------------------------------------------------

	// Effective print resolution of one slot: the frame is a physical size, the
	// photo is a pixel count, and "cover" scales the photo until the smaller
	// side fits. Zooming in throws pixels away, so it divides.
	// The arrange grid's own badge. Same arithmetic as everywhere else, because
	// it is the module's.
	function slotDpi(photo, layout, zoom) {
		return SB.slotDpi(photo, state.product.size, layout, zoom);
	}

	function lowResSlots() {
		return SB.lowResSlots(state, previewResolve);
	}

	function unreadablePhotos() {
		return state.photos.filter(function (p) { return !p.w || !p.h; });
	}

	function emptySlotCount() {
		var n = 0;
		state.pages.forEach(function (page) {
			page.slots.forEach(function (slot) { if (!slot.photoId) n++; });
		});
		return n;
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
				renderPages();
				renderSummary();
			});
			host.appendChild(button);
		});
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

	function buildSlot(slot, pageIndex, slotIndex, layout) {
		var cell = document.createElement("div");
		cell.className = "ed-slot";
		var isPanning = panSlot && panSlot.page === pageIndex && panSlot.slot === slotIndex;

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

			var dpi = slotDpi(photo, layout, slot.zoom);
			if (dpi !== null && dpi < MIN_PRINT_DPI) {
				var warn = document.createElement("span");
				warn.className = "ed-slot-warn";
				warn.textContent = "small";
				warn.title = "About " + Math.round(dpi) + " dots per inch at this size. It will look soft in print. Use it smaller, or send a bigger copy.";
				cell.appendChild(warn);
			}

			var tools = document.createElement("div");
			tools.className = "ed-slot-tools";
			tools.appendChild(miniButton(isPanning ? "done" : "move", function (event) {
				event.stopPropagation();
				panSlot = isPanning ? null : { page: pageIndex, slot: slotIndex };
				renderPages();
			}));
			tools.appendChild(miniButton("+", function (event) {
				event.stopPropagation();
				slot.zoom = Math.min(3, Math.round((slot.zoom + 0.15) * 100) / 100);
				scheduleSave();
				renderPages();
			}));
			tools.appendChild(miniButton("−", function (event) {
				event.stopPropagation();
				slot.zoom = Math.max(1, Math.round((slot.zoom - 0.15) * 100) / 100);
				scheduleSave();
				renderPages();
			}));
			tools.appendChild(miniButton("✕", function (event) {
				event.stopPropagation();
				var fresh = blankSlot();
				slot.photoId = fresh.photoId;
				slot.zoom = fresh.zoom;
				slot.x = fresh.x;
				slot.y = fresh.y;
				panSlot = null;
				scheduleSave();
				renderPages();
				renderTray();
				renderSummary();
			}));
			cell.appendChild(tools);

			if (isPanning) {
				cell.style.outline = "2px solid var(--brand)";
				// Only while repositioning. Setting this permanently would take
				// the page scroll away from anyone on a phone, which is exactly
				// the sort of thing this site has had to undo before.
				cell.style.touchAction = "none";
				attachPan(cell, slot);
			}
		} else {
			var placeholder = document.createElement("span");
			placeholder.className = "ed-slot-empty";
			placeholder.textContent = selectedPhotoId ? "Tap to place" : "Drop a photo";
			cell.appendChild(placeholder);
		}

		cell.addEventListener("click", function () {
			if (isPanning) return;
			if (!selectedPhotoId) return;
			slot.photoId = selectedPhotoId;
			slot.zoom = 1;
			slot.x = 50;
			slot.y = 50;
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
			slot.photoId = id;
			slot.zoom = 1;
			slot.x = 50;
			slot.y = 50;
			scheduleSave();
			renderPages();
			renderTray();
			renderSummary();
		});

		return cell;
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
		var coverLayout = layoutFor("full");
		var coverSheet = sheetElement(coverLayout);
		coverSheet.appendChild(buildCoverSlot());
		var cover = pageCard("Cover", coverSheet);
		host.appendChild(cover.card);

		state.pages.forEach(function (page, pageIndex) {
			var layout = layoutFor(page.layout);
			var sheet = sheetElement(layout);
			page.slots.forEach(function (slot, slotIndex) {
				sheet.appendChild(buildSlot(slot, pageIndex, slotIndex, layout));
			});

			var built = pageCard("Page " + (pageIndex + 1), sheet);

			var tools = document.createElement("div");
			tools.className = "ed-page-tools";
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

	function buildCoverSlot() {
		var layout = layoutFor("full");
		var slot = state.cover.slot;
		var cell = document.createElement("div");
		cell.className = "ed-slot";
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
			}
			var tools = document.createElement("div");
			tools.className = "ed-slot-tools";
			tools.appendChild(miniButton("✕", function (event) {
				event.stopPropagation();
				state.cover.slot = blankSlot();
				scheduleSave();
				renderPages();
				renderTray();
			}));
			cell.appendChild(tools);

			var dpi = slotDpi(photo, layout, slot.zoom);
			if (dpi !== null && dpi < MIN_PRINT_DPI) {
				var warn = document.createElement("span");
				warn.className = "ed-slot-warn";
				warn.textContent = "small";
				warn.title = "About " + Math.round(dpi) + " dots per inch on a cover this size.";
				cell.appendChild(warn);
			}
		} else {
			var placeholder = document.createElement("span");
			placeholder.className = "ed-slot-empty";
			placeholder.textContent = "Cover photo";
			cell.appendChild(placeholder);
		}

		// The cover text sits over the picture, roughly where it will print.
		if (state.cover.title || state.cover.subtitle) {
			var overlay = document.createElement("div");
			overlay.style.cssText = "position:absolute;left:0;right:0;bottom:0;padding:10px 12px;background:linear-gradient(to top,rgba(13,24,38,0.72),rgba(13,24,38,0));color:#fff;z-index:1;pointer-events:none;";
			overlay.innerHTML = '<div style="font-size:15px;font-weight:650;line-height:1.25;"></div><div style="font-size:11px;opacity:0.85;margin-top:2px;"></div>';
			overlay.children[0].textContent = state.cover.title || "";
			overlay.children[1].textContent = state.cover.subtitle || "";
			cell.appendChild(overlay);
		}

		cell.addEventListener("click", function () {
			if (!selectedPhotoId) return;
			state.cover.slot = { photoId: selectedPhotoId, zoom: 1, x: 50, y: 50 };
			scheduleSave();
			renderPages();
			renderTray();
		});
		cell.addEventListener("dragover", function (event) {
			event.preventDefault();
			cell.classList.add("is-drop");
		});
		cell.addEventListener("dragleave", function () { cell.classList.remove("is-drop"); });
		cell.addEventListener("drop", function (event) {
			event.preventDefault();
			cell.classList.remove("is-drop");
			var id = event.dataTransfer.getData("text/plain");
			if (!id || !photoById(id)) return;
			state.cover.slot = { photoId: id, zoom: 1, x: 50, y: 50 };
			scheduleSave();
			renderPages();
			renderTray();
		});

		return cell;
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
		panSlot = null;
		scheduleSave();
		renderPages();
	}

	// Changing layout keeps the photos already placed, in order, and drops any
	// that no longer have a frame — announced rather than silent.
	function changeLayout(pageIndex, layoutKey) {
		var page = state.pages[pageIndex];
		var layout = layoutFor(layoutKey);
		var wanted = layout.cols * layout.rows;
		var filled = page.slots.filter(function (slot) { return slot.photoId; });

		if (filled.length > wanted) {
			var losing = filled.length - wanted;
			if (!window.confirm("That layout holds " + wanted + " photo" + (wanted === 1 ? "" : "s") + ", so " + losing + " would come off this page. Continue?")) {
				return;
			}
		}

		var next = [];
		for (var i = 0; i < wanted; i++) {
			next.push(filled[i] ? filled[i] : blankSlot());
		}
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
		if (!state.cover.slot.photoId && queue.length) {
			var first = queue.shift();
			state.cover.slot = { photoId: first.id, zoom: 1, x: 50, y: 50 };
		}
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
		state.cover.slot = blankSlot();
		state.pages.forEach(function (page) {
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
			["Cover", state.cover.title ? state.cover.title + (state.cover.subtitle ? " — " + state.cover.subtitle : "") : "no title yet"],
			["Cover photo", state.cover.slot.photoId ? "chosen" : "not chosen"],
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
				return "Page " + item.page + ", frame " + item.slot + " — about " + item.dpi + " dpi" + (item.name ? " (" + item.name + ")" : "");
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

	// On a phone a spread is two postage stamps, so a narrow screen turns the
	// pages one at a time instead.
	function previewIsNarrow() {
		return window.innerWidth < 760;
	}

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
		return SB.buildViews(state, previewIsNarrow());
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

		// The review step lists every soft photo in the book, which is a list
		// nobody maps back to a page. Here it can be said about the pages the
		// reader is looking at, which is the moment it means something.
		var soft = view.cover ? [] : lowResSlots().filter(function (item) {
			return view.pages.indexOf(item.page - 1) !== -1;
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
					"Content-Type": blob.type || "image/jpeg",
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
				if (!state.cover) state.cover = { title: "", subtitle: "", slot: blankSlot() };
				if (!state.cover.slot) state.cover.slot = blankSlot();
				if (!Array.isArray(state.photos)) state.photos = [];
				// A photo whose blob did not survive (a cleared browser, a
				// half-finished import) must not stay in the design: the
				// server would expect an upload that can never arrive.
				state.photos = state.photos.filter(function (p) { return photoBlobs.has(p.id); });
				var known = new Set(state.photos.map(function (p) { return p.id; }));
				if (state.cover.slot.photoId && !known.has(state.cover.slot.photoId)) state.cover.slot = blankSlot();
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
			addFiles(event.target.files).then(function () { event.target.value = ""; });
		});

		document.getElementById("clear-photos").addEventListener("click", function () {
			if (!state.photos.length) return;
			if (!window.confirm("Remove all " + state.photos.length + " photos and empty every page?")) return;
			state.photos.slice().forEach(function (p) { removePhoto(p.id); });
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

		// A phone turned sideways goes from one page at a time to a spread, so
		// the views have to be rebuilt. Keep the reader on the page they were
		// looking at rather than throwing them back to the cover.
		window.addEventListener("resize", function () {
			if (!previewIsOpen()) return;
			var current = previewViews[previewIndex];
			var anchor = current && current.pages ? current.pages[0] : null;
			previewViews = buildPreviewViews();
			previewIndex = 0;
			if (anchor !== null) {
				for (var i = 0; i < previewViews.length; i++) {
					if (previewViews[i].pages && previewViews[i].pages.indexOf(anchor) !== -1) {
						previewIndex = i;
						break;
					}
				}
			}
			renderPreview();
		});

		document.getElementById("send-form").addEventListener("submit", send);

		document.getElementById("start-new").addEventListener("click", function () {
			if (!window.confirm("Start a new book? The one you just sent is safe with us, but this browser will forget it.")) return;
			clearEverything().then(function () { window.location.reload(); });
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
			renderPageOptions();
			renderPhotos();
			renderTray();
			renderPages();
			renderSummary();
			wire();
			goTo("size");
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start);
	} else {
		start();
	}
})();
