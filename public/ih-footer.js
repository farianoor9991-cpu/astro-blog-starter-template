/* InviteHeaven invitation footer: one function that makes the footer markup.
   Used by the invitation page (envelope-engine.js) and by the dashboard preview, so both always look the same.
   IHFooter.html({ bride, groom, mode: 'couple' | 'family' | 'none', family, seatRows: [{ label, n }] }) */
(function () {
	var esc = function (s) {
		return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
		});
	};
	var first = function (n) {
		return String(n || '').trim().split(/\s+/)[0] || '';
	};
	// "Baraat & Walima" / "Mehndi, Baraat & Walima"
	var joinNames = function (a) {
		return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1];
	};
	// rows: [{ label, n }] in the guest's event order; n = 0 means Full Family.
	// Lines with a seat number first (fewest seats on top, same number keeps the event order), then ONE "Full Family" line.
	// If every event is Full Family there is nothing to write.
	var seatLines = function (rows) {
		rows = (rows || []).filter(function (r) { return r && r.label; });
		var specific = rows
			.map(function (r, i) { return { r: r, i: i }; })
			.filter(function (x) { return x.r.n >= 1; })
			.sort(function (a, b) { return a.r.n - b.r.n || a.i - b.i; })
			.map(function (x) { return { text: x.r.label + ': ' + x.r.n + (x.r.n === 1 ? ' Seat' : ' Seats') }; });
		var full = rows.filter(function (r) { return !(r.n >= 1); }).map(function (r) { return r.label; });
		if (!specific.length) return [];
		if (full.length) specific.push({ text: joinNames(full) + ': Full Family' });
		return specific;
	};
	/* ---- layout: positions come from her sample images (design pixels), then everything is scaled to the real width ---- */
	var WIDE_Q = '(min-width: 700px) and (orientation: landscape)';
	var PD = { W: 1920, H: 1080, nameY: 232, nameMax: 1000, resY: 442, l1: 530, l2: 602, maxLine: 1250, brandY: 965, brandFs: 40 };
	var PM = { W: 1080, H: 1500, nameY: 405, nameMax: 880, resY: 648, l1: 735, l2: 805, maxLine: 880, brandY: 1360, brandFs: 50 };
	var FS_NAME = 65, FS_RES = 37.6, FS_EV = 34.4;
	var fit = function (root) {
		if (!root) return;
		var box = root.querySelector('.ihf2-in');
		if (!box) return;
		var force = box.getAttribute('data-force');
		var wide = force ? force === 'd' : window.matchMedia(WIDE_Q).matches;
		var P = wide ? PD : PM;
		var bw = box.clientWidth;
		if (!bw) return;
		var k = bw / P.W; // design px > real px
		var place = function (el, y, fs) {
			el.style.top = (y / P.H) * 100 + '%';
			el.style.fontSize = fs * k + 'px';
		};
		var widthOf = function (el) { return el.getBoundingClientRect().width / k; };
		// names (long names get a smaller size)
		var nm = box.querySelector('.ihf2-names');
		if (nm) {
			place(nm, P.nameY, FS_NAME);
			var w0 = widthOf(nm);
			if (w0 > P.nameMax) place(nm, P.nameY, Math.max(26, (FS_NAME * P.nameMax) / w0));
		}
		// "Reserved In Your Honour" + the seat lines: the block keeps the same top and bottom as the sample;
		// fewer lines are spaced evenly, more lines get a smaller font
		var res = box.querySelector('.ihf2-res');
		var ls = box.querySelectorAll('.ihf2-l');
		var n = ls.length;
		if (res && n) {
			var resY = P.resY, ys = [], fs = FS_EV;
			if (n === 1) {
				var c = (P.resY + P.l2) / 2;
				var g = Math.min(P.l2 - P.resY, 1.25 * (P.l1 - P.resY));
				resY = c - g / 2;
				ys = [c + g / 2];
			} else if (n === 2) {
				ys = [P.l1, P.l2];
			} else {
				var bottom = P.l2 + 14 * (n - 2);
				var pitch = (bottom - P.l1) / (n - 1);
				fs = Math.max(15, Math.min(FS_EV, pitch / 1.5));
				for (var i = 0; i < n; i++) ys.push(P.l1 + i * pitch);
			}
			place(res, resY, FS_RES);
			var worst = 1;
			Array.prototype.forEach.call(ls, function (el, i) {
				place(el, ys[i], fs);
				var w = widthOf(el);
				if (w > P.maxLine) worst = Math.min(worst, P.maxLine / w);
			});
			if (worst < 1) Array.prototype.forEach.call(ls, function (el, i) { place(el, ys[i], fs * worst); });
		}
		var br = box.querySelector('.ihf2-brand');
		if (br) place(br, P.brandY, P.brandFs);
	};
	var fitAll = function () {
		Array.prototype.forEach.call(document.querySelectorAll('.ihf2'), fit);
	};
	var wired = false;
	var init = function (root) {
		if (!root) return;
		fit(root);
		if (typeof ResizeObserver !== 'undefined' && !root._ro) {
			root._ro = new ResizeObserver(function () { fit(root); });
			root._ro.observe(root.querySelector('.ihf2-in'));
		}
		if (!wired) {
			wired = true;
			window.addEventListener('resize', fitAll);
			if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
		}
		if (document.fonts && document.fonts.load) document.fonts.load("65px 'Berkshire Swash'").then(function () { fit(root); });
	};
	window.IHFooter = {
		seatLines: seatLines,
		fit: init,
		html: function (o) {
			o = o || {};
			var mode = o.mode === 'family' || o.mode === 'none' ? o.mode : 'couple';
			var names = first(o.groom) + (first(o.bride) && first(o.groom) ? ' & ' : '') + first(o.bride);
			if (mode === 'family') names = String(o.family || '').trim() || names;
			if (mode === 'none') names = 'With Love & Warm Regards';
			var lines = seatLines(o.seatRows);
			var v = lines.length ? 'seats' : 'family'; // everyone Full Family: the small picture instead of the seat lines
			var force = o.layout === 'd' || o.layout === 'm' ? ' data-force="' + o.layout + '"' : '';
			return (
				'<div class="ihf2"><div class="ihf2-in v-' + v + (o.layout ? ' f-' + o.layout : '') + '"' + force + '>' +
				'<h2 class="ihf2-t ihf2-names">' + esc(names) + '</h2>' +
				(lines.length ? '<p class="ihf2-t ihf2-res">Reserved In Your Honour</p>' + lines.map(function (l) { return '<p class="ihf2-t ihf2-l">' + esc(l.text) + '</p>'; }).join('') : '') +
				'<a class="ihf2-brand" href="/"><span class="ihf2-by">Created by</span><span class="ihf2-bn">Invite<b>Heaven</b></span></a>' +
				'<img class="ihf2-hook" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" onload="window.IHFooter.fit(this.closest(\'.ihf2\'))">' +
				'</div></div>'
			);
		},
	};
})();
