/* BePlugged Studio — the read-only view of a book already sent.
 *
 * A customer who has pressed send no longer has the book in their browser once
 * they clear it or move to another device, and "what did I actually send you?"
 * is the first question anyone asks while waiting for a quote. This answers it
 * from the order itself.
 *
 * Read-only is a property of what exists here, not a flag: this page holds no
 * editing controls and the API it talks to has no route that writes. The token
 * it is given opens one order's photos for a few hours and nothing else.
 */
(function () {
	"use strict";

	var SB = window.StudioBook;

	var order = null;       // what the lookup returned
	var book = null;        // order.design, the same shape the editor sends
	var uploaded = null;    // photo ids that actually made it to storage
	var previewViews = [];
	var previewIndex = 0;

	function el(id) {
		return document.getElementById(id);
	}

	function setStatus(text, tone) {
		var box = el("lookup-status");
		box.textContent = text;
		box.className = "ed-note" + (tone ? " " + tone : "");
		box.style.display = text ? "block" : "none";
	}

	// The design refers to photos by id; here they come from the order's own
	// photo route, opened by the view token rather than by being public.
	function resolve(photoId) {
		var meta = null;
		var photos = (book && book.photos) || [];
		for (var i = 0; i < photos.length; i++) {
			if (photos[i].id === photoId) { meta = photos[i]; break; }
		}
		if (!meta) return null;
		return {
			// A photo that never finished uploading has no file to show. The
			// frame says so rather than pretending the page is blank.
			url: uploaded.has(photoId)
				? "/api/studio/orders/" + encodeURIComponent(order.id) +
					"/view/" + encodeURIComponent(photoId) +
					"?t=" + encodeURIComponent(order.view_token)
				: null,
			name: meta.name,
			w: meta.w,
			h: meta.h
		};
	}

	// --- lookup -----------------------------------------------------------

	function find(event) {
		event.preventDefault();
		var reference = el("lookup-reference").value.trim();
		var email = el("lookup-email").value.trim();
		if (!reference || !email) {
			setStatus("Please give both the reference and the email address you used.", "bad");
			return;
		}

		var button = el("lookup-button");
		button.disabled = true;
		setStatus("Looking…", "");

		fetch("/api/studio/lookup", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ reference: reference, email: email })
		})
			.then(function (response) {
				return response.json().catch(function () { return {}; }).then(function (body) {
					if (!response.ok) throw new Error(body.error || "That did not work (" + response.status + ").");
					return body;
				});
			})
			.then(show)
			.catch(function (error) {
				button.disabled = false;
				setStatus(error.message, "bad");
			});
	}

	function show(result) {
		order = result;
		book = result.design || {};
		uploaded = new Set(result.uploaded_photo_ids || []);

		el("lookup-panel").hidden = true;
		el("book-panel").hidden = false;

		el("book-heading").textContent = order.reference;
		el("book-line").textContent =
			"Sent by " + (order.customer_name || "you") +
			(order.submitted_at ? " on " + String(order.submitted_at).slice(0, 10) : "") + ".";

		var missing = Number(order.photo_count || 0) - Number(order.uploaded_count || 0);
		var rows = [
			["Book", order.size_label + " · " + order.page_count + " pages"],
			["Cover", (order.cover_label || "Photo wrap") + " · case bound"],
			["Copies", String(order.copies || 1)],
			["Occasion", order.occasion || "not given"],
			["Needed by", order.needed_by || "not given"],
			["Photos received", order.uploaded_count + " of " + order.photo_count],
			["Where it is", statusWords(order.status)]
		];
		el("book-summary").innerHTML = rows.map(function (row) {
			var th = document.createElement("th");
			th.textContent = row[0];
			var td = document.createElement("td");
			td.textContent = row[1];
			return "<tr>" + th.outerHTML + td.outerHTML + "</tr>";
		}).join("");

		if (missing > 0) {
			var note = document.createElement("div");
			note.className = "ed-note warn";
			note.textContent =
				missing + " photo" + (missing === 1 ? "" : "s") + " did not finish uploading, so " +
				(missing === 1 ? "its frame is" : "those frames are") +
				" marked in the book. Reply to your confirmation email and we will collect " +
				(missing === 1 ? "it" : "them") + " another way.";
			el("book-summary").parentNode.appendChild(note);
		}

		openPreview();
	}

	function statusWords(status) {
		return {
			new: "With us, waiting to be quoted",
			quoted: "Quoted — waiting on you",
			in_design: "Being designed",
			proof_sent: "Proof sent for your approval",
			approved: "Approved, going to print",
			printing: "At the printer",
			completed: "Finished",
			cancelled: "Cancelled"
		}[status] || "With us";
	}

	// --- preview ----------------------------------------------------------

	function renderPreview() {
		var stage = el("preview-spread");
		var view = previewViews[previewIndex];
		if (!stage || !view) return;

		stage.innerHTML = "";
		if (view.cover) {
			stage.appendChild(SB.leaf(book, null, resolve));
		} else {
			view.pages.forEach(function (pageIndex) {
				stage.appendChild(SB.leaf(book, pageIndex, resolve));
			});
		}

		var label = view.cover
			? "Cover"
			: view.pages.length === 2
				? "Pages " + (view.pages[0] + 1) + " and " + (view.pages[1] + 1)
				: "Page " + (view.pages[0] + 1);
		el("preview-label").textContent = label;
		el("preview-count").textContent = previewIndex + 1 + " of " + previewViews.length;
		el("preview-prev").disabled = previewIndex === 0;
		el("preview-next").disabled = previewIndex >= previewViews.length - 1;

		SB.fitSpread(document.querySelector(".ed-preview-stage"), stage, book, view);
	}

	function previewGo(delta) {
		var next = previewIndex + delta;
		if (next < 0 || next >= previewViews.length) return;
		previewIndex = next;
		renderPreview();
	}

	function openPreview() {
		previewViews = SB.buildViews(book);
		previewIndex = 0;
		el("preview").hidden = false;
		document.body.style.overflow = "hidden";
		renderPreview();
		el("preview-close").focus();
	}

	function closePreview() {
		el("preview").hidden = true;
		document.body.style.overflow = "";
		el("preview-spread").innerHTML = "";
	}

	function previewIsOpen() {
		return !el("preview").hidden;
	}

	function printBook() {
		var host = el("print-book");
		host.innerHTML = "";
		// Every sheet comes out at the trim size of the book, so the PDF the
		// dialog saves is the file a printer can work from rather than a
		// picture of one.
		SB.applyPrintPageSize(book);
		SB.allLeaves(book, resolve).forEach(function (leaf) {
			host.appendChild(leaf);
		});
		window.requestAnimationFrame(function () {
			window.requestAnimationFrame(function () {
				window.print();
			});
		});
	}

	// --- boot -------------------------------------------------------------

	function wire() {
		el("lookup-form").addEventListener("submit", find);
		el("book-open").addEventListener("click", openPreview);
		el("book-print").addEventListener("click", printBook);
		el("preview-print").addEventListener("click", printBook);
		el("preview-close").addEventListener("click", closePreview);
		el("preview-prev").addEventListener("click", function () { previewGo(-1); });
		el("preview-next").addEventListener("click", function () { previewGo(1); });

		document.addEventListener("keydown", function (event) {
			if (!previewIsOpen()) return;
			if (event.key === "Escape") { closePreview(); return; }
			if (event.key === "ArrowLeft") { event.preventDefault(); previewGo(-1); }
			if (event.key === "ArrowRight") { event.preventDefault(); previewGo(1); }
		});

		var swipeX = null;
		var swipeY = null;
		var stage = document.querySelector(".ed-preview-stage");
		stage.addEventListener("pointerdown", function (event) {
			// The arrows sit inside the stage. A press on one that drifts
			// sideways before release is a click on that arrow, and counting it
			// as a swipe as well turned two pages. Same fix as the editor.
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
		stage.addEventListener("pointercancel", function () { swipeX = null; swipeY = null; });

		window.addEventListener("resize", function () {
			if (!previewIsOpen()) return;
			renderPreview();
		});

		window.addEventListener("afterprint", function () {
			el("print-book").innerHTML = "";
		});

		// Arriving from the confirmation email with the reference already in
		// the link saves typing it out.
		var params = new URLSearchParams(window.location.search);
		if (params.get("ref")) el("lookup-reference").value = params.get("ref");
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", wire);
	} else {
		wire();
	}
})();
