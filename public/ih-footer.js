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
	// Full Family is always written too (e.g. "Baraat & Walima: Full Family").
	var seatLines = function (rows) {
		rows = (rows || []).filter(function (r) { return r && r.label; });
		var specific = rows
			.map(function (r, i) { return { r: r, i: i }; })
			.filter(function (x) { return x.r.n >= 1; })
			.sort(function (a, b) { return a.r.n - b.r.n || a.i - b.i; })
			.map(function (x) { return { text: x.r.label + ': ' + x.r.n + (x.r.n === 1 ? ' Seat' : ' Seats') }; });
		var full = rows.filter(function (r) { return !(r.n >= 1); }).map(function (r) { return r.label; });
		// Full Family on every event (and more than one event): just "All events: Full Family"
		if (full.length) specific.push({ text: (!specific.length && full.length > 1 ? 'All events' : joinNames(full)) + ': Full Family' });
		return specific;
	};
	/* ---- layout: positions come from her sample images (design pixels), then everything is scaled to the real width ----
	   s = size of the parchment (768 x 512 in its own pixels) in that design; cx / cy = where its middle sits */
	var WIDE_Q = '(min-width: 700px) and (orientation: landscape)';
	// her Canva sizes (72 names, 26/22 seats text, 32.5/28.5 presence) are turned into screen pixels so the writing is as wide as in her samples
	var CZ_NAME = 1.347, CZ_RES = 1.462, CZ_PRES = 1.338;
	var PD = { W: 1920, H: 1080, nameY: 312, nameMax: 1000, s: 0.84, cx: 960, cy: 569, fsRes: 22 * CZ_RES, presY: 772, presFs: 28.5 * CZ_PRES, presSp: '0.065em', presW: 1300, brandY: 1030, brandFs: 25 };
	var PM = { W: 1080, H: 1500, nameY: 415, nameMax: 880, s: 1, cx: 540, cy: 750, fsRes: 26 * CZ_RES, presY: 1082, presFs: 32.5 * CZ_PRES, presSp: '', presW: 860, brandY: 1436, brandFs: 29 };
	var FS_NAME = 72 * CZ_NAME;
	var fit = function (root) {
		if (!root) return;
		var box = root.querySelector('.ihf2-in');
		if (!box) return;
		var force = box.getAttribute('data-force');
		var wide = force ? force === 'd' : window.matchMedia(WIDE_Q).matches;
		var P = wide ? PD : PM;
		var bw = box.clientWidth;
		if (!bw) return;
		var bh = box.clientHeight;
		var k = bh ? Math.min(bw / P.W, bh / P.H) : bw / P.W; // design px > real px (a shorter footer shrinks everything too)
		var at = function (el, y, fs) {
			el.style.top = (y / P.H) * 100 + '%';
			el.style.fontSize = fs * k + 'px';
		};
		var widthOf = function (el) { return el.getBoundingClientRect().width / k; };
		// names (long names get a smaller size)
		var nm = box.querySelector('.ihf2-names');
		if (nm) {
			at(nm, P.nameY, FS_NAME);
			var w0 = widthOf(nm);
			if (w0 > P.nameMax) at(nm, P.nameY, Math.max(26, (FS_NAME * P.nameMax) / w0));
		}
		// the parchment: its three pieces always keep the same shape, only the size follows the screen
		var scr = box.querySelector('.ihf2-scr');
		if (scr) {
			var sw = 768 * P.s, sh = 512 * P.s;
			scr.style.width = sw * k + 'px';
			scr.style.height = sh * k + 'px';
			scr.style.left = (P.cx / P.W) * 100 + '%';
			scr.style.top = (P.cy / P.H) * 100 + '%';
			var res = scr.querySelector('.ihf2-res');
			var ls = scr.querySelectorAll('.ihf2-l');
			var n = ls.length;
			if (res && n) {
				// heading + seat lines are one block, centred on the paper; more lines or longer lines make the writing smaller
				var HEAD = 1.56, PITCH = 1.34;
				var avail = 218 * P.s;
				var fs = Math.min(P.fsRes, avail / (HEAD + (n - 1) * PITCH + 1));
				var put = function (f) {
					var total = (HEAD + (n - 1) * PITCH) * f;
					var y0 = P.cy - total / 2 + 2 * P.s - (P.cy - sh / 2); // from the top of the parchment
					var place = function (el, y) {
						el.style.top = y * k + 'px';
						el.style.fontSize = f * k + 'px';
					};
					place(res, y0);
					Array.prototype.forEach.call(ls, function (el, i) { place(el, y0 + HEAD * f + i * PITCH * f); });
				};
				put(fs);
				var maxW = 0.68 * sw, worst = 1;
				[res].concat(Array.prototype.slice.call(ls)).forEach(function (el) {
					var w = widthOf(el);
					if (w > maxW) worst = Math.min(worst, maxW / w);
				});
				if (worst < 1) put(fs * worst);
			}
		}
		// "Your presence will make our celebration even more special!"
		var pr = box.querySelector('.ihf2-pres');
		if (pr) {
			pr.style.width = P.presW * k + 'px';
			pr.style.letterSpacing = P.presSp;
			at(pr, P.presY, P.presFs);
		}
		var br = box.querySelector('.ihf2-brand');
		if (br) at(br, P.brandY, P.brandFs);
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
		if (document.fonts && document.fonts.load) document.fonts.load("97px 'Berkshire Swash'").then(function () { fit(root); });
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
			var force = o.layout === 'd' || o.layout === 'm' ? ' data-force="' + o.layout + '"' : '';
			return (
				'<div class="ihf2"><div class="ihf2-in' + (o.layout ? ' f-' + o.layout : '') + '"' + force + '>' +
				'<h2 class="ihf2-t ihf2-names">' + esc(names) + '</h2>' +
				(lines.length
					? '<div class="ihf2-scr"><img class="sc-mid" alt="" src="/haya-scroll-mid.webp">' +
					  '<div class="sc-txt"><p class="ihf2-res">Reserved In Your Honour</p>' + lines.map(function (l) { return '<p class="ihf2-l">' + esc(l.text) + '</p>'; }).join('') + '</div>' +
					  '<img class="sc-l" alt="" src="/haya-scroll-left.webp"><img class="sc-r" alt="" src="/haya-scroll-right.webp"></div>'
					: '') +
				'<p class="ihf2-t ihf2-pres">Your presence will make our celebration even more special!</p>' +
				'<a class="ihf2-brand" href="/"><span class="ihf2-by">Created by</span><span class="ihf2-bn">Invite<b>Heaven</b></span></a>' +
				'<img class="ihf2-hook" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" onload="window.IHFooter.fit(this.closest(\'.ihf2\'))">' +
				'</div></div>'
			);
		},
	};
})();
