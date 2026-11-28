/* Card combination finder. One file shared by the customization form and the dashboard.
   IHCombos.create({ mount, getEvents, isSelected, toggle, remove }) -> { refresh() }
   - getEvents(): [{ id, label }] in the order the cards should be shown
   - isSelected(key): is this combination already chosen (key = ids joined by "+")
   - toggle(cards): add or remove the combination (cards = array of event ids)
   - IHCombos.label(cards, events): "Nikkah only" / "Nikkah + Mehndi"  */
(function () {
	var CSS =
		'.cm{font-family:Nunito,sans-serif;color:#5a5a5a;font-size:13.5px}' +
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
		'.cm-gh{width:100%;display:flex;align-items:center;gap:8px;padding:11px 12px;border:0;background:#fffdf7;font:600 13.5px Nunito,sans-serif;color:#1a1a1a;cursor:pointer;text-align:left}' +
		'.cm-gh span{margin-left:auto;font-weight:500;font-size:12px;color:#8a7a5c}' +
		'.cm-gh i{font-style:normal;transition:transform .15s;color:#b8793c}' +
		'.cm-grp.open .cm-gh i{transform:rotate(90deg)}' +
		'.cm-rows{display:none;border-top:1px solid #f0e6d0}' +
		'.cm-grp.open .cm-rows{display:block}' +
		'.cm-row{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;border-bottom:1px solid #f6efdf;background:#fff;font:inherit;font-size:13.5px;color:#1a1a1a;cursor:pointer;text-align:left}' +
		'.cm-row:last-child{border-bottom:0}' +
		'.cm-row.cm-on{background:#fbf3e4}' +
		'.cm-list{max-height:420px;overflow-y:auto;border-radius:12px}' +
		'.cm-empty{padding:14px 12px;color:#8a7a5c;font-size:13px}' +
		'.cm-hw-bg{position:fixed;inset:0;background:rgba(26,26,26,.55);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}' +
		'.cm-hw{font-family:Nunito,sans-serif;background:#fcf9f1;border-radius:18px;max-width:520px;width:100%;max-height:90vh;overflow:auto;padding:22px 20px;box-shadow:0 20px 60px rgba(0,0,0,.3);color:#5a5a5a;font-size:14px;line-height:1.55}' +
		'.cm-hw h3{margin:0 0 8px;font:700 22px Nunito,sans-serif;color:#1a1a1a}' +
		'.cm-hw p{margin:0 0 10px}' +
		'.cm-ex{border:1px solid #e6d9bd;background:#fff;border-radius:12px;padding:10px 12px;margin:0 0 8px}' +
		'.cm-ex b{display:block;color:#1a1a1a;font-size:13.5px}' +
		'.cm-ex span{display:block;color:#5a5a5a;font-size:13px;margin-top:2px}' +
		'.cm-arrow{text-align:center;color:#b8793c;line-height:1;margin:0 0 8px}' +
		'.lk{font-family:Nunito,sans-serif;color:#5a5a5a;font-size:13.5px}' +
		'.lk *{box-sizing:border-box}' +
		'.lk-h{margin:0 0 4px;font:700 22px Nunito,sans-serif;color:#1a1a1a}' +
		'.lk-sub{margin:0 0 14px;color:#5a5a5a;line-height:1.5}' +
		'.lk-box{border:1px solid #e6d9bd;border-radius:14px;background:#fffdf7;padding:14px;margin:0 0 12px}' +
		'.lk-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 6px}' +
		'.lk-top b{color:#1a1a1a;font-weight:600;font-size:15px}' +
		'.lk-how{border:0;background:none;color:#b8793c;font:500 12.5px Nunito,sans-serif;text-decoration:underline;cursor:pointer;padding:0}' +
		'.lk-all{display:flex;align-items:center;gap:8px;color:#1a1a1a;font-weight:600;margin:2px 0 2px}' +
		'.lk-note{color:#8a7a5c;font-size:12.5px;margin:2px 0 0}' +
		'.lk-lab{margin:0 0 8px;line-height:1.45}' +
		'.lk-fld{position:relative;max-width:380px}.lk-dd{max-width:380px}' +
		'.lk-q{width:100%;padding:11px 36px 11px 14px;border:1px solid #e0d2b4;border-radius:999px;background:#fff;font:inherit;font-size:13.5px;color:#1a1a1a;outline:none}' +
		'.lk-q:focus{border-color:#d4a276}' +
		'.lk-car{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:28px;height:28px;border:0;background:none;color:#b8793c;font-size:14px;cursor:pointer}' +
		'.lk-dd{margin:6px 0 0;border:1px solid #eadfc9;border-radius:12px;background:#fff;max-height:230px;overflow-y:auto}' +
		'.lk-opt{display:flex;align-items:center;gap:10px;width:100%;padding:11px 12px;border:0;border-bottom:1px solid #f6efdf;background:#fff;font:inherit;font-size:13.5px;color:#1a1a1a;cursor:pointer;text-align:left}' +
		'.lk-opt:last-child{border-bottom:0}' +
		'.lk-opt.on{background:#fbf3e4}' +
		'.lk-pills{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0}' +
		'.lk-err{color:#b3261e;font-size:12.5px;margin:8px 0 0}' +
		'.lk-act{display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin:12px 0 0}' +
		'.lk-done{display:block;margin:12px auto 0;background:#d4a276;color:#fff;border:0;border-radius:999px;padding:10px 34px;font:700 14px Nunito,sans-serif;cursor:pointer}.lk-ok{margin:10px 0 0;color:#2c7a35;font-weight:700;font-size:13px;line-height:1.5}.lk-q.lk-set{font-weight:700;color:#1a1a1a;background:#fbf3e4;border-color:#d4a276}' +
		'.lk-sum{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 0}' +
		'.lk-sum span{color:#1a1a1a}' +
		'.lk-mini{border:0;background:none;color:#b8793c;font:500 12.5px Nunito,sans-serif;text-decoration:underline;cursor:pointer;padding:0 0 0 6px}' +
		'.lk-add{width:100%;border:1.5px dashed #d4a276;background:#fff;color:#b8793c;border-radius:14px;padding:12px;font:600 14px Nunito,sans-serif;cursor:pointer}' +
		'.cm-mock{border:1px solid #e6d9bd;border-radius:12px;background:#fffdf7;padding:12px;margin:0 0 6px}' +
		'.cm-mock b{color:#1a1a1a;display:block;margin:0 0 2px}' +
		'.cm-mock .mf{border:1px solid #d4a276;border-radius:999px;background:#fff;padding:8px 12px;color:#8a7a5c;font-size:13px;margin:6px 0}' +
		'.cm-mock .mr{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fbf3e4;border-radius:8px;margin:0 0 4px;color:#1a1a1a;font-size:13px}' +
		'.cm-mock .mr i{width:18px;height:18px;border-radius:5px;background:#d4a276;color:#fff;font-style:normal;font-size:12px;display:inline-flex;align-items:center;justify-content:center}' +
		'.cm-lk{font-family:monospace;font-size:12.5px;background:#fff;border:1px solid #e6d9bd;border-radius:8px;padding:6px 8px;color:#1a1a1a;word-break:break-all;margin:4px 0}' +
		'.hw-step{margin:0 0 12px;font-size:15px;color:#1a1a1a}' +
		'.hw-two{display:flex;gap:10px;align-items:stretch;margin:0 0 14px}' +
		'.hw-col{flex:1;min-width:0;border:1px solid #e6d9bd;background:#fff;border-radius:14px;padding:12px 8px;text-align:center}' +
		'.hw-pill{display:inline-block;background:#1a1a1a;color:#fff;border-radius:999px;padding:5px 12px;font:600 12.5px Nunito,sans-serif}' +
		'.hw-arrow{height:40px;display:flex;align-items:center;justify-content:center}' +
		'.hw-cards{display:flex;justify-content:center;gap:4px;margin:0 0 8px}' +
		'.hw-cards i{display:block;width:26px;height:40px;border-radius:4px;background:linear-gradient(160deg,#f3dcb8,#d4a276);border:1px solid #c28f5f;box-shadow:0 2px 4px rgba(0,0,0,.12)}' +
		'.hw-t{margin:0 0 4px;color:#1a1a1a;font-weight:600;font-size:13px;line-height:1.4}' +
		'.hw-s{margin:0;color:#8a7a5c;font-size:12px;line-height:1.4}' +
		'.hw-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}' +
		'.hw-list li{background:#fbf3e4;border:1px solid #ead9b9;border-radius:10px;padding:9px 12px;color:#1a1a1a;font-weight:700;font-size:13.5px}' +
		'.hw-list li span{margin-right:4px}' +
		'.cm-hw button.cm-ok{background:#d4a276;color:#fff;border:0;border-radius:999px;padding:10px 26px;font:600 14px Nunito,sans-serif;cursor:pointer}';

	CSS +=
		'.hw2{font-family:Nunito,sans-serif;background:#fcf9f1;border-radius:22px;max-width:640px;width:100%;max-height:92vh;overflow:auto;padding:24px 18px 22px;box-shadow:0 24px 70px rgba(0,0,0,.35);color:#5a5a5a;border:1px solid #ead9b9}' +
		'.hw2 *{box-sizing:border-box}' +
		'.hw2 h3{margin:0 0 4px;text-align:center;font:700 26px/1.2 Nunito,sans-serif;color:#1a1a1a}' +
		'.hw2 h3{margin-bottom:20px}' +
		'.hw2-two{display:grid;grid-template-columns:1fr 1fr;column-gap:14px;row-gap:0;align-items:stretch}' +
		'.hw2-two>*{min-width:0}' +
		'.hw2-card{display:flex;flex-direction:column;align-items:center;text-align:center;width:100%;height:100%;background:#fff;border:1px solid #e3cfa6;border-radius:18px;padding:18px 10px 14px;box-shadow:0 8px 22px rgba(120,84,30,.12);background-image:linear-gradient(180deg,#fffdf7,#fff)}' +
		'.hw2-card h4{margin:0 0 6px;font:700 16px/1.3 Nunito,sans-serif;color:#1a1a1a}' +
		'.hw2-tag{display:block;margin:0 0 14px;font:500 12.5px/1.4 Nunito,sans-serif;color:#8a7a5c}' +
		'.hw2-tag.green{color:#2c7a35;font-weight:700}' +
		'.hw2-tiles{display:flex;justify-content:center;gap:6px;width:100%;margin:0 0 16px}' +
		'.hw2-tile{flex:0 1 calc((100% - 12px)/3);min-width:0;max-width:62px;aspect-ratio:1/1;border-radius:12px;background:#fbf3e4;border:1px solid #ead9b9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:#9a6a36;font:600 11px/1 Nunito,sans-serif}' +
		'.hw2-tile svg{width:22px;height:22px;stroke:#b8793c;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}' +
		'.hw2-tile span{color:#1a1a1a}' +
		'.hw2-arrow{height:56px;display:flex;align-items:center;justify-content:center}' +
		'.hw2-url{width:100%;margin-top:auto;background:#fff;border:1px dashed #d4a276;border-radius:12px;padding:10px 8px;font:500 11.5px/1.6 Nunito,sans-serif;color:#1a1a1a;word-break:break-all;text-align:center}' +
		'.hw2-url b{color:#b8793c}' +
		'.hw2-send u{color:#c58b52;font-weight:800;text-decoration:underline;text-underline-offset:3px}' +
		'.hw2-send{margin:0;text-align:center;font:600 13px/1.65 Nunito,sans-serif;color:#3a3a3a}' +
		'.hw2-list{list-style:none;margin:24px 0 0;padding:16px 16px;background:#fff;border:1px solid #ead9b9;border-radius:14px;display:flex;flex-direction:column;gap:11px}' +
		'.hw2-list li{color:#1a1a1a;font:500 13.5px/1.4 Nunito,sans-serif}' +
		'.hw2-list li{line-height:1.55}.hw2 .cm-ok{background:#d4a276;color:#fff;border:0;border-radius:999px;padding:11px 34px;font:600 14.5px Nunito,sans-serif;cursor:pointer;box-shadow:0 6px 14px rgba(180,120,60,.3)}' +
		'@media(max-width:480px){.hw2{padding:26px 16px 22px}.hw2-two{column-gap:10px}.hw2-card{padding:16px 8px 12px}.hw2-card h4{font-size:14.5px}.hw2-tile{border-radius:10px;font-size:9.5px;gap:2px}.hw2-tile svg{width:18px;height:18px}.hw2-url{font-size:10.5px}.hw2-send{font-size:12.5px}}' +
		'.lk-howrow{margin:0 0 12px;text-align:center}.lk-ask{margin:16px 0 4px;color:#1a1a1a;font:700 14.5px/1.45 Nunito,sans-serif}.lk-ask2{margin:0 0 6px;color:#5a5a5a;font:400 14px/1.45 Nunito,sans-serif}' +
		'.lk-bt{display:block;margin:0 0 8px;color:#1a1a1a;font:700 14.5px/1.35 Nunito,sans-serif}' +
		'.lk-rm{border:0;background:none;color:#b3261e;font:500 12px Nunito,sans-serif;text-decoration:underline;cursor:pointer;padding:6px 0 0}' +
		'.lk-fld{max-width:380px}';

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
		var ARROW = '<svg viewBox="0 0 30 42" width="30" height="42" aria-hidden="true"><path d="M15 3v28M5 22l10 13 10-13" fill="none" stroke="#c28f5f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		var IC = {
			Mehndi: '<svg viewBox="0 0 24 24"><path d="M12 3c3.5 3.2 5.5 6 5.5 9.2A5.5 5.5 0 016.5 12.2C6.5 9 8.5 6.2 12 3z"/><path d="M12 9v8M12 12.5l-2-1.5M12 14.5l2-1.5"/></svg>',
			Baraat: '<svg viewBox="0 0 24 24"><path d="M4 18h16l1-10-5 4-4-6-4 6-5-4z"/><path d="M4 21h16"/></svg>',
			Walima: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="6"/><circle cx="12" cy="13" r="3"/><path d="M3.5 5v6M5.5 5v6M3.5 8h2M4.5 11v8M20.5 5c-1.5 1.5-2 3.5-2 6h2v8"/></svg>'
		};
		var tiles = function (names) {
			return '<div class="hw2-tiles">' + names.map(function (n) { return '<div class="hw2-tile">' + IC[n] + '<span>' + n + '</span></div>'; }).join('') + '</div>';
		};
		w.innerHTML =
			'<div class="hw2" role="dialog" aria-modal="true" aria-label="How it works"><h3>How It Works</h3>' +
			'<div class="hw2-two">' +
			'<div class="hw2-card"><h4>Invitation Link 1</h4><span class="hw2-tag">All events selected</span>' + tiles(['Mehndi', 'Baraat', 'Walima']) + '<div class="hw2-url"><b>Link 1:</b> ali-weds-sara/group=all-events/</div></div>' +
			'<div class="hw2-card"><h4>Invitation Link 2</h4><span class="hw2-tag green">&#9989;2 events selected</span>' + tiles(['Baraat', 'Walima']) + '<div class="hw2-url"><b>Link 2:</b> ali-weds-sara/group=baraat&amp;walima/</div></div>' +
			'<div class="hw2-arrow">' + ARROW + '</div><div class="hw2-arrow">' + ARROW + '</div>' +
			'<p class="hw2-send">Send <u>Link 1</u> to 50 guests invited to all events.</p>' +
			'<p class="hw2-send">Send <u>Link 2</u> to 20 guests invited ONLY to Baraat &amp; Walima.</p>' +
			'</div>' +
			'<ul class="hw2-list"><li>&#9989; Personal dashboard provided</li><li>&#9989; Edit anything anytime</li><li>&#9989; Create as many invitation links as you like</li></ul>' +
			'<div style="text-align:center;margin-top:18px"><button type="button" class="cm-ok">Got it</button></div></div>';
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
			'<div class="cm-count"></div><div class="cm-sel"></div>' +
			'<div class="cm-tools"><input class="cm-q" type="search" placeholder="Search, e.g. Mehndi + Walima" autocomplete="off" aria-label="Search combinations"><div class="cm-chips"></div></div>' +
			'<div class="cm-list"></div>';
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

	/* Invitation links builder (the new step 3). One file shared by the form and the dashboard.
	   IHCombos.createLinks({ mount, getEvents, getLinks, add, update, remove, doneNote, showHeading })
	   - getLinks(): the links already created (not the "All events" link): [{ id, cards }]
	   - add(cards) -> id,  update(id, cards),  remove(id) */
	function createLinks(o) {
		addCss();
		var m = o.mount;
		m.classList.add('lk');
		var items = []; // { k, id, cards, dd, q, err } : one box per extra link (Invitation Link 2, 3, ...)
		var seq = 0;
		function evs() { return o.getEvents() || []; }
		function evIds() { return evs().map(function (e) { return e.id; }); }
		function nm(id) { var e = evs().filter(function (x) { return x.id === id; })[0]; return e ? e.label : id; }
		function newDraft() { return { k: 'd' + (++seq), id: null, cards: [], pend: [], dd: true, q: '', err: '' }; }
		function keyOf(c) { return c.slice().sort().join('+'); }
		function sync() {
			var have = {};
			var ids = evIds();
			o.getLinks().forEach(function (l) { have[l.id] = l; });
			items = items.filter(function (it) { return !it.id || have[it.id]; });
			items.forEach(function (it) { if (it.id) it.cards = have[it.id].cards.slice(); else it.cards = it.cards.filter(function (c) { return ids.indexOf(c) >= 0; }); });
			var known = {};
			items.forEach(function (it) { if (it.id) known[it.id] = 1; });
			var saved = items.filter(function (it) { return it.id; });
			var rest = items.filter(function (it) { return !it.id; });
			o.getLinks().forEach(function (l) {
				if (!known[l.id]) saved.push({ k: 'd' + (++seq), id: l.id, cards: l.cards.slice(), pend: [], dd: false, q: '', err: '' });
			});
			items = saved.concat(rest);
		}
		function summary(it) { return it.cards.map(nm).join(' + '); }
		function ph(n) { return n === 2 ? 'e.g, Baraat & Walima' : 'e.g, Walima only'; }
		function draw() {
			sync();
			var events = evs();
			var h = '';
			if (o.showHeading !== false) h += '<h3 class="lk-h">Create Separate Links for Different Guests</h3><p class="lk-sub">Choose event/events for each Invitation Link</p>';
			h += '<div class="lk-box"><b class="lk-bt">Invitation Link 1</b><div class="lk-all"><span class="cm-bx on">&#10003;</span>All events</div><p class="lk-note">This link will display all event cards.</p></div>';
			if (events.length < 2) {
				h += '<div class="lk-box"><p class="lk-note" style="margin:0">Choose at least 2 events in Step 2 to create more links. Every guest will get the link with all your events.</p></div>';
				m.innerHTML = h; return;
			}
			h += '<p class="lk-ask"><b>Want to send different event cards to different group of guests?</b></p><p class="lk-ask2">Create a separate invitation link for each group!</p>';
			h += '<p class="lk-howrow"><button type="button" class="lk-how" data-lkhow="1">See how it works</button></p>';
			items.forEach(function (it, ix) {
				var n = ix + 2;
				h += '<div class="lk-box" data-lkk="' + it.k + '"><b class="lk-bt">Choose events for Invitation Link ' + n + ':</b>' +
					'<div class="lk-fld"><input class="lk-q' + (!it.dd && it.cards.length ? ' lk-set' : '') + '" type="text" data-lkq="' + it.k + '" placeholder="' + esc(ph(n)) + '" autocomplete="off" value="' + esc(!it.dd && it.cards.length ? summary(it) : it.q) + '" aria-label="Choose events for Invitation Link ' + n + '"><button type="button" class="lk-car" data-lkcar="' + it.k + '" aria-label="Show events">' + (it.dd ? '&#9652;' : '&#9662;') + '</button></div>' +
					(it.dd ? '<div class="lk-dd" data-lkdd="' + it.k + '">' + ddRows(it) + '</div><button type="button" class="lk-done" data-lkdone="' + it.k + '">Done</button>' : '') +
					(it.dd ? '<div class="lk-pills" data-lkpl="' + it.k + '">' + pills(it) + '</div>' : '') +
					(!it.dd && it.id && it.cards.length ? '<p class="lk-ok">&#9989; Invitation link ' + n + ' is ready' + (o.readyNote ? '. ' + esc(o.readyNote) : '') + '</p>' : '') +
					'<p class="lk-err" data-lker="' + it.k + '"' + (it.err ? '' : ' hidden') + '>' + esc(it.err) + '</p>' +
					(it.id || ix > 0 ? '<button type="button" class="lk-rm" data-lkdel="' + it.k + '">Remove Link ' + n + '</button>' : '') + '</div>';
			});
			var last = items[items.length - 1];
			if (!last || last.id) h += '<button type="button" class="lk-add" data-lknew="1">+Create Another Invitation Link</button>';
			m.innerHTML = h;
		}
		function ddRows(it) {
			var q = it.q.toLowerCase().split(/[+,&\s]+/).filter(Boolean);
			var list = evs().filter(function (e) { return q.every(function (t) { return e.label.toLowerCase().indexOf(t) >= 0; }); });
			if (!list.length) return '<div class="cm-empty">No event matches.</div>';
			return list.map(function (e) {
				var on = it.pend.indexOf(e.id) >= 0;
				return '<button type="button" class="lk-opt' + (on ? ' on' : '') + '" data-lkpick="' + esc(e.id) + '"><span class="cm-bx' + (on ? ' on' : '') + '">' + (on ? '&#10003;' : '') + '</span>' + esc(e.label) + '</button>';
			}).join('');
		}
		function pills(it) {
			return it.pend.map(function (id) { return '<span class="cm-pill">' + esc(nm(id)) + '<button type="button" data-lkunpick="' + esc(id) + '" aria-label="Remove">&times;</button></span>'; }).join('');
		}
		function find(k) { return items.filter(function (x) { return x.k === k; })[0]; }
		function ordered(cards) { return evIds().filter(function (id) { return cards.indexOf(id) >= 0; }); }
		function partial(it) {
			var box = m.querySelector('[data-lkk="' + it.k + '"]');
			if (!box) return;
			var dd = box.querySelector('[data-lkdd]');
			if (dd) dd.innerHTML = ddRows(it);
			var pl = box.querySelector('[data-lkpl]');
			if (pl) pl.innerHTML = pills(it);
			var er = box.querySelector('[data-lker]');
			if (er) { er.textContent = it.err; er.hidden = !it.err; }
		}
		// the chosen events are saved as soon as they are valid; returns false when this choice is not allowed
		function commit(it, cards) {
			cards = ordered(cards);
			if (!cards.length) {
				if (it.id && o.remove) { var r = o.remove(it.id); if (r === false) return false; }
				it.id = null; it.cards = [];
				return true;
			}
			if (cards.length >= evIds().length) { it.err = 'That is the same as Invitation Link 1 (all events). Please leave at least one event out.'; return false; }
			if (o.getLinks().some(function (l) { return l.id !== it.id && keyOf(l.cards) === keyOf(cards); })) { it.err = 'You already have a link with these events.'; return false; }
			it.err = '';
			if (it.id) o.update(it.id, cards); else { var nid = o.add(cards); if (!nid) return false; it.id = nid; }
			it.cards = cards;
			return true;
		}
		// nothing is saved while events are being ticked; the link is made only when Done is pressed
		function finish(it) {
			var cards = ordered(it.pend || []);
			if (!cards.length && !it.id) { items = items.filter(function (x) { return x !== it; }); draw(); return; }
			if (!cards.length) { it.err = 'Please choose at least one event, or use Remove Link.'; partial(it); return; }
			if (!commit(it, cards)) { partial(it); return; }
			it.cards = cards; it.dd = false; it.q = ''; it.err = ''; it.pend = [];
			draw();
		}
		m.addEventListener('input', function (e) {
			var k = e.target.getAttribute && e.target.getAttribute('data-lkq');
			if (!k) return;
			var it = find(k); if (!it) return;
			it.q = e.target.value; it.err = '';
			if (!it.dd) { it.dd = true; it.pend = it.cards.slice(); draw(); var q = m.querySelector('[data-lkq="' + k + '"]'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } return; }
			partial(it);
		});
		m.addEventListener('focusin', function (e) {
			var k = e.target.getAttribute && e.target.getAttribute('data-lkq');
			if (!k) return;
			var it = find(k);
			if (it && !it.dd) { it.dd = true; it.pend = it.cards.slice(); draw(); var q = m.querySelector('[data-lkq="' + k + '"]'); if (q) q.focus(); }
		});
		m.addEventListener('click', function (e) {
			var t = e.target.closest ? e.target.closest('button') : null;
			if (!t) return;
			var it;
			if (t.hasAttribute('data-lkhow')) { howItWorks(); return; }
			if (t.hasAttribute('data-lknew')) { items.push(newDraft()); draw(); return; }
			if (t.hasAttribute('data-lkdone')) { finish(find(t.getAttribute('data-lkdone'))); return; }
			if (t.hasAttribute('data-lkcar')) { it = find(t.getAttribute('data-lkcar')); if (it.dd) { finish(it); return; } it.dd = true; it.pend = it.cards.slice(); draw(); return; }
			if (t.hasAttribute('data-lkpick')) {
				var box = t.closest('[data-lkk]'); it = find(box.getAttribute('data-lkk'));
				var id = t.getAttribute('data-lkpick'); var i = it.pend.indexOf(id);
				if (i >= 0) it.pend.splice(i, 1); else it.pend.push(id);
				it.err = ''; partial(it);
				return;
			}
			if (t.hasAttribute('data-lkunpick')) {
				it = find(t.closest('[data-lkk]').getAttribute('data-lkk'));
				it.pend = it.pend.filter(function (c) { return c !== t.getAttribute('data-lkunpick'); });
				it.err = ''; partial(it);
				return;
			}
			if (t.hasAttribute('data-lkdel')) {
				it = find(t.getAttribute('data-lkdel'));
				if (it.id && o.remove) { var r = o.remove(it.id); if (r === false) return; }
				items = items.filter(function (x) { return x !== it; });
				draw(); return;
			}
		});
		draw();
		return { refresh: draw };
	}
	window.IHCombos = { create: create, createLinks: createLinks, label: label, howItWorks: howItWorks };
})();
