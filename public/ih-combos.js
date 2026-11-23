/* Card combination finder. One file shared by the customization form and the dashboard.
   IHCombos.create({ mount, getEvents, isSelected, toggle, remove }) -> { refresh() }
   - getEvents(): [{ id, label }] in the order the cards should be shown
   - isSelected(key): is this combination already chosen (key = ids joined by "+")
   - toggle(cards): add or remove the combination (cards = array of event ids)
   - IHCombos.label(cards, events): "Nikkah only" / "Nikkah + Mehndi"  */
(function () {
	var CSS =
		'.cm{font-family:Poppins,sans-serif;color:#5a5a5a;font-size:13.5px}' +
		'.cm *{box-sizing:border-box}' +
		'.cm-all{display:flex;align-items:center;gap:10px;background:#fffdf7;border:1px solid #d4a276;border-radius:12px;padding:10px 12px;margin:0 0 12px}' +
		'.cm-all b{color:#1a1a1a;font-weight:600}' +
		'.cm-all small{margin-left:auto;color:#b8793c;font-weight:600;font-size:11.5px;white-space:nowrap}' +
		'.cm-bx{flex:none;width:20px;height:20px;border:1.6px solid #c9b48f;border-radius:6px;background:#fff;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:13px;line-height:1}' +
		'.cm-on>.cm-bx,.cm-bx.on{background:#d4a276;border-color:#d4a276}' +
		'.cm-tools{display:flex;flex-direction:column;gap:8px;margin:0 0 10px}' +
		'.cm-q{width:100%;padding:11px 14px;border:1px solid #e0d2b4;border-radius:999px;background:#fff;font:inherit;font-size:13.5px;color:#1a1a1a;outline:none}' +
		'.cm-q:focus{border-color:#d4a276}' +
		'.cm-chips{display:flex;flex-wrap:wrap;gap:6px}' +
		'.cm-chip{border:1px solid #e0d2b4;background:#fff;color:#5a5a5a;border-radius:999px;padding:6px 12px;font:inherit;font-size:12.5px;cursor:pointer}' +
		'.cm-chip.on{background:#1a1a1a;border-color:#1a1a1a;color:#fff}' +
		'.cm-count{display:flex;justify-content:space-between;align-items:center;margin:0 0 8px;font-size:12.5px}' +
		'.cm-count b{color:#1a1a1a}' +
		'.cm-sel{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}' +
		'.cm-pill{display:inline-flex;align-items:center;gap:6px;background:#f7ecd9;border:1px solid #ead9b9;border-radius:999px;padding:4px 6px 4px 11px;font-size:12px;color:#1a1a1a}' +
		'.cm-pill button{border:0;background:#fff;border-radius:50%;width:18px;height:18px;line-height:16px;font-size:12px;color:#8a6a3b;cursor:pointer;padding:0}' +
		'.cm-grp{border:1px solid #eadfc9;border-radius:12px;background:#fff;margin:0 0 8px;overflow:hidden}' +
		'.cm-gh{width:100%;display:flex;align-items:center;gap:8px;padding:11px 12px;border:0;background:#fffdf7;font:600 13.5px Poppins,sans-serif;color:#1a1a1a;cursor:pointer;text-align:left}' +
		'.cm-gh span{margin-left:auto;font-weight:500;font-size:12px;color:#8a7a5c}' +
		'.cm-gh i{font-style:normal;transition:transform .15s;color:#b8793c}' +
		'.cm-grp.open .cm-gh i{transform:rotate(90deg)}' +
		'.cm-rows{display:none;border-top:1px solid #f0e6d0}' +
		'.cm-grp.open .cm-rows{display:block}' +
		'.cm-row{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;border-bottom:1px solid #f6efdf;background:#fff;font:inherit;font-size:13.5px;color:#1a1a1a;cursor:pointer;text-align:left}' +
		'.cm-row:last-child{border-bottom:0}' +
		'.cm-row.cm-on{background:#fbf3e4}' +
		'.cm-empty{padding:14px 12px;color:#8a7a5c;font-size:13px}' +
		'.cm-hw-bg{position:fixed;inset:0;background:rgba(26,26,26,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}' +
		'.cm-hw{font-family:Poppins,sans-serif;background:#fcf9f1;border-radius:18px;max-width:520px;width:100%;max-height:90vh;overflow:auto;padding:22px 20px;box-shadow:0 20px 60px rgba(0,0,0,.3);color:#5a5a5a;font-size:14px;line-height:1.55}' +
		'.cm-hw h3{margin:0 0 8px;font:700 22px "Playfair Display",serif;color:#1a1a1a}' +
		'.cm-hw p{margin:0 0 10px}' +
		'.cm-ex{border:1px solid #e6d9bd;background:#fff;border-radius:12px;padding:10px 12px;margin:0 0 8px}' +
		'.cm-ex b{display:block;color:#1a1a1a;font-size:13.5px}' +
		'.cm-ex span{display:block;color:#5a5a5a;font-size:13px;margin-top:2px}' +
		'.cm-arrow{text-align:center;color:#b8793c;line-height:1;margin:0 0 8px}' +
		'.cm-hw button.cm-ok{background:#d4a276;color:#fff;border:0;border-radius:999px;padding:10px 26px;font:600 14px Poppins,sans-serif;cursor:pointer}';

	function addCss() {
		if (document.getElementById('cm-css')) return;
		var s = document.createElement('style');
		s.id = 'cm-css';
		s.textContent = CSS;
		document.head.appendChild(s);
	}
	function esc(t) {
		return String(t).replace(/[&<>"]/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
		});
	}
	function short(l) {
		return String(l);
	}
	function label(cards, events) {
		var names = cards.map(function (id) {
			var e = events.filter(function (x) { return x.id === id; })[0];
			return e ? short(e.label) : id;
		});
		return names.length === 1 ? names[0] + ' only' : names.join(' + ');
	}
	// every combination of a given size, in the order of the events
	function ofSize(ids, k, cap) {
		var out = [];
		var cur = [];
		(function rec(start) {
			if (out.length >= cap) return;
			if (cur.length === k) { out.push(cur.slice()); return; }
			for (var i = start; i < ids.length; i++) {
				cur.push(ids[i]);
				rec(i + 1);
				cur.pop();
			}
		})(0);
		return out;
	}
	function howItWorks() {
		var w = document.createElement('div');
		w.className = 'cm-hw-bg';
		w.innerHTML =
			'<div class="cm-hw" role="dialog" aria-modal="true"><h3>How Card Combinations Work</h3>' +
			'<p>Not every guest is invited to every wedding event. You can create different combinations of event cards for different guests.</p>' +
			'<p><b style="color:#1a1a1a">Each combination gets its own invitation link.</b></p>' +
			'<p style="margin-bottom:6px">For example:</p>' +
			'<div class="cm-ex"><b>Combo 1: Nikkah only</b><span>Ali gets a link with only the Nikkah card.</span></div>' +
			'<div class="cm-arrow">&#8595;</div>' +
			'<div class="cm-ex"><b>Combo 2: Nikkah + Mehndi + Baraat</b><span>Sara gets a link with the 3 events she is invited to.</span></div>' +
			'<p style="margin-top:12px">Create as many combinations as you like.</p>' +
			'<p><b style="color:#1a1a1a">Send on WhatsApp:</b> copy the link of a combination and send it to the guests who belong to it.</p>' +
			'<div style="text-align:center;margin-top:14px"><button type="button" class="cm-ok">Got it</button></div></div>';
		w.addEventListener('click', function (e) {
			var t = e.target;
			if (t === w || (t.closest && t.closest('.cm-ok'))) w.remove();
		});
		document.body.appendChild(w);
	}

	function create(o) {
		addCss();
		var st = { q: '', size: 0, open: {} };
		var m = o.mount;
		m.classList.add('cm');
		m.innerHTML =
			'<div class="cm-all cm-on"><span class="cm-bx on">&#10003;</span><b>All events</b><small>Always included</small></div>' +
			'<div class="cm-tools"><input class="cm-q" type="search" placeholder="Search, e.g. Mehndi + Walima" autocomplete="off" aria-label="Search combinations"><div class="cm-chips"></div></div>' +
			'<div class="cm-count"></div><div class="cm-sel"></div><div class="cm-list"></div>';
		var qEl = m.querySelector('.cm-q');
		var chipsEl = m.querySelector('.cm-chips');
		var countEl = m.querySelector('.cm-count');
		var selEl = m.querySelector('.cm-sel');
		var listEl = m.querySelector('.cm-list');

		function evs() { return o.getEvents() || []; }
		function chosen() {
			// every selected combination the host knows about, as arrays of ids
			return (o.getChosen ? o.getChosen() : []).filter(function (c) { return c && c.length; });
		}
		function matches(cards, events, q) {
			if (!q) return true;
			var text = cards.map(function (id) {
				var e = events.filter(function (x) { return x.id === id; })[0];
				return e ? e.label.toLowerCase() : '';
			}).join(' ');
			var toks = q.toLowerCase().split(/[+,&\s]+/).filter(Boolean);
			return toks.every(function (t) { return text.indexOf(t) >= 0; });
		}
		function drawTop() {
			var events = evs();
			var n = events.length;
			var chips = '<button type="button" class="cm-chip' + (st.size === 0 ? ' on' : '') + '" data-size="0">All</button>';
			for (var k = 1; k < n; k++) chips += '<button type="button" class="cm-chip' + (st.size === k ? ' on' : '') + '" data-size="' + k + '">' + k + (k === 1 ? ' Event' : ' Events') + '</button>';
			chipsEl.innerHTML = n > 2 ? chips : '';
			var ch = chosen();
			countEl.innerHTML = '<span><b>' + ch.length + '</b> ' + (ch.length === 1 ? 'combination' : 'combinations') + ' selected <span style="color:#8a7a5c">(plus All events)</span></span>';
			selEl.innerHTML = ch.map(function (c) {
				return '<span class="cm-pill">' + esc(label(c, events)) + '<button type="button" data-rm="' + esc(c.join('+')) + '" aria-label="Remove">&times;</button></span>';
			}).join('');
		}
		function drawList() {
			var events = evs();
			var ids = events.map(function (e) { return e.id; });
			var n = ids.length;
			if (n < 2) {
				listEl.innerHTML = '<div class="cm-empty">Choose at least 2 events in the previous step to create combinations. Every guest will get the link with all your events.</div>';
				return;
			}
			var html = '';
			var any = false;
			for (var k = 1; k < n; k++) {
				if (st.size && st.size !== k) continue;
				var list = ofSize(ids, k, 400).filter(function (c) { return matches(c, events, st.q); });
				if (!list.length) continue;
				any = true;
				var open = st.q || st.size ? true : !!st.open[k];
				var nsel = list.filter(function (c) { return o.isSelected(c.join('+')); }).length;
				html += '<div class="cm-grp' + (open ? ' open' : '') + '"><button type="button" class="cm-gh" data-grp="' + k + '"><i>&#9656;</i>' + k + (k === 1 ? ' Event' : ' Events') + '<span>' + (nsel ? nsel + ' selected &middot; ' : '') + list.length + '</span></button><div class="cm-rows">';
				if (open) {
					html += list.map(function (c) {
						var on = o.isSelected(c.join('+'));
						return '<button type="button" class="cm-row' + (on ? ' cm-on' : '') + '" data-c="' + esc(c.join('+')) + '"><span class="cm-bx' + (on ? ' on' : '') + '">' + (on ? '&#10003;' : '') + '</span>' + esc(label(c, events)) + '</button>';
					}).join('');
				}
				html += '</div></div>';
			}
			listEl.innerHTML = any ? html : '<div class="cm-empty">No combination matches your search.</div>';
		}
		function refresh() { drawTop(); drawList(); }
		qEl.addEventListener('input', function () { st.q = qEl.value.trim(); drawList(); });
		m.addEventListener('click', function (e) {
			var t = e.target.closest ? e.target.closest('button') : null;
			if (!t) return;
			if (t.hasAttribute('data-size')) { st.size = Number(t.getAttribute('data-size')); drawTop(); drawList(); return; }
			if (t.hasAttribute("data-grp")) { var k = t.getAttribute("data-grp"); st.open[k] = !st.open[k]; drawList(); return; }
			if (t.hasAttribute('data-c')) { o.toggle(t.getAttribute('data-c').split('+')); refresh(); return; }
			if (t.hasAttribute('data-rm')) { o.toggle(t.getAttribute('data-rm').split('+')); refresh(); return; }
		});
		refresh();
		return { refresh: refresh };
	}
	window.IHCombos = { create: create, label: label, howItWorks: howItWorks };
})();
