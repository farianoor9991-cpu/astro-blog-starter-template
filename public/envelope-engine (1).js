/* InviteHeaven envelope invitation engine (version 2).
   Reads the settings and invitation details from <script id="env-config" type="application/json">,
   draws the guest's cards and runs: welcome > ring of light > envelope opens > cards rise like a deck
   > tap to read (swipe) > Close > cards sink back > envelope closes > footer.
   You normally never edit this file. Change looks and timings in src/data/haya-envelope.ts. */
(function () {
	'use strict';

	var cfg = JSON.parse(document.getElementById('env-config').textContent);
	var S = cfg.design;
	var T = cfg.template;
	var INV = cfg.invitation;
	var L = S.layout;
	var TM = S.timing;
	var root = document.getElementById('env-root');

	var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	var esc = function (s) {
		return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
		});
	};
	var wait = function (ms) {
		return new Promise(function (r) {
			setTimeout(r, ms);
		});
	};
	var nextFrame = function () {
		return new Promise(function (r) {
			requestAnimationFrame(function () {
				requestAnimationFrame(r);
			});
		});
	};

	/* ---------- settings as CSS variables ---------- */
	document.body.style.background = S.background;
	var rs = root.style;
	var setv = function (k, v) {
		rs.setProperty(k, v);
	};
	setv('--ev-bg', S.background);
	setv('--ev-foot-bg', S.footerBackground);
	setv('--ev-max', S.stageMaxWidth + 'px');
	setv('--ev-title-font', "'" + S.welcome.font + "', serif");
	setv('--ev-title-color', S.welcome.color);
	setv('--ev-title-size', S.welcome.size);
	setv('--ev-hint-font', "'" + S.hint.font + "', serif");
	setv('--ev-hint-color', S.hint.color);
	setv('--ev-hint-size', S.hint.size);
	setv('--ev-hf', "'" + S.footer.headingFont + "', serif");
	setv('--ev-hc', S.footer.headingColor);
	setv('--ev-mf', "'" + S.footer.messageFont + "', serif");
	setv('--ev-mc', S.footer.messageColor);
	setv('--ev-b1', S.footer.brandStartColor);
	setv('--ev-b2', S.footer.brandEndColor);
	setv('--ev-by', S.footer.createdByColor);
	setv('--ev-btn-font', "'" + S.buttons.font + "', serif");
	setv('--ev-btn-bg', S.buttons.background);
	setv('--ev-btn-text', S.buttons.text);
	setv('--ev-link', S.buttons.linkColor);
	setv('--ev-vw-bg', S.viewer.background);
	setv('--ev-vw-text', S.viewer.text);
	setv('--ev-tray-w', L.trayWidth + '%');
	setv('--ev-tray-b', L.trayBottom + '%');
	setv('--ev-env-w', L.envelopeWidth + '%');
	setv('--ev-env-lift', String(L.envelopeLift));
	setv('--ev-ratio', String(S.envelope.ratio));
	setv('--ev-enter', TM.entrance + 'ms');
	setv('--ev-mask', 'url(' + S.images.closed + ')');
	setv('--ev-seal-x', S.envelope.sealX + '%');
	setv('--ev-seal-y', S.envelope.sealY + '%');
	setv('--ev-seal-r', S.envelope.sealR + '%');
	setv('--ev-ring-ms', S.ring.duration + 'ms');
	setv('--ev-ring-scale', String(S.ring.scale));
	setv('--ev-ring-rgb', S.ring.color);
	setv('--ev-peek', TM.peek + 'ms');

	/* ---------- markup ---------- */
	root.innerHTML =
		'<div class="ev-stage" id="ev-stage">' +
		'<div class="ev-col">' +
		'<h1 class="ev-title ev-rise">' + esc(S.welcome.text) + '</h1>' +
		'<p class="ev-hint2" id="ev-hint2">' + esc(S.hint.openText) + '</p>' +
		'<div class="ev-tray ev-rise" style="--d:.12s"><img src="' + esc(S.images.tray) + '" alt="" draggable="false"></div>' +
		'<div class="ev-envbox ev-rise" style="--d:.24s">' +
		'<div class="ev-env" id="ev-env" data-st="closed">' +
		'<img class="ev-img ev-b-slight" src="' + esc(S.images.slight) + '" alt="" draggable="false">' +
		'<img class="ev-img ev-b-open" src="' + esc(S.images.open) + '" alt="" draggable="false">' +
		'<div class="ev-cards" id="ev-cards"></div>' +
		'<img class="ev-img ev-o-slight" src="' + esc(S.images.ovSlight) + '" alt="" draggable="false">' +
		'<img class="ev-img ev-o-open" src="' + esc(S.images.ovOpen) + '" alt="" draggable="false">' +
		'<img class="ev-img ev-closed" src="' + esc(S.images.closed) + '" alt="" draggable="false">' +
		'<div class="ev-ringwrap"><span class="ev-glow"></span><span class="ev-ring"></span></div>' +
		'<button class="ev-tap" id="ev-tap" type="button" aria-label="Open the invitation"></button>' +
		'</div></div>' +
		'<p class="ev-hint" id="ev-hint">' + esc(S.hint.text) + '</p>' +
		'<button class="ev-music" id="ev-music" type="button" aria-label="Music on or off" hidden></button>' +
		'</div>' +
		'<button class="ev-peek" id="ev-peek" type="button" aria-label="Scroll down"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
		'</div>' +
		'<div class="ev-footwrap" id="ev-footwrap"><section class="ev-foot">' +
		'<h2 class="ev-foot-h ev-fade">' + esc(S.footer.heading) + '</h2>' +
		'<p class="ev-foot-m ev-fade">' + esc(S.footer.message) + '</p>' +
		'<div class="ev-brandbox ev-fade"><span class="ev-by">' + esc(S.footer.createdBy) + '</span><span class="ev-brand">' + esc(S.footer.brandStart) + '<span>' + esc(S.footer.brandEnd) + '</span></span></div>' +
		'<div><button class="ev-back ev-fade" id="ev-back" type="button">' + esc(S.buttons.goBackLabel) + '</button></div>' +
		'</section></div>' +
		'<div class="ev-vw" id="ev-vw" aria-hidden="true">' +
		'<div class="ev-vw-track" id="ev-vw-track"></div>' +
		'<p class="ev-vw-label" id="ev-vw-label"></p>' +
		'<div class="ev-dots" id="ev-dots"></div>' +
		'<button class="ev-arrow ev-prev" id="ev-prev" type="button" aria-label="Previous card">&#8249;</button>' +
		'<button class="ev-arrow ev-next" id="ev-next" type="button" aria-label="Next card">&#8250;</button>' +
		'</div>' +
		'<button class="ev-close" id="ev-close" type="button">' + esc(S.buttons.closeLabel) + '</button>';

	var $ = function (id) {
		return document.getElementById(id);
	};
	var stage = $('ev-stage');
	var envEl = $('ev-env');
	var cardsEl = $('ev-cards');
	var tapBtn = $('ev-tap');
	var hintEl = $('ev-hint');
	var closeBtn = $('ev-close');
	var backBtn = $('ev-back');
	var vw = $('ev-vw');
	var track = $('ev-vw-track');
	var dotsEl = $('ev-dots');
	var vwLabel = $('ev-vw-label');
	var ringWrap = envEl.querySelector('.ev-ringwrap');

	/* ---------- drawing the cards ---------- */
	var parseDate = function (v) {
		var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
		if (!m) return null;
		var d = new Date(+m[1], +m[2] - 1, +m[3]);
		return isNaN(d.getTime()) ? null : d;
	};
	var fmtTime = function (v) {
		var m = /^(\d{1,2}):(\d{2})/.exec(v || '');
		if (!m) return '';
		var h = +m[1];
		var ap = h >= 12 ? 'PM' : 'AM';
		h = h % 12 || 12;
		return m[2] === '00' ? 'At ' + h + ' ' + ap : 'At ' + h + ':' + m[2] + ' ' + ap;
	};
	var tc = function (s) {
		return String(s || '')
			.trim()
			.replace(/\s+/g, ' ')
			.replace(/(^|[\s\-'])(\p{L})/gu, function (_m, a, b) {
				return a + b.toUpperCase();
			});
	};
	var cleanParents = function (s) {
		return String(s || '')
			.trim()
			.replace(/^(d\s*\/\s*o|s\s*\/\s*o)\s*/i, '')
			.replace(/^mr\.?\s*(&|and)\s*mrs\.?\s*/i, '')
			.trim();
	};
	var evDef = function (id) {
		return T.events.filter(function (e) {
			return e.id === id;
		})[0];
	};
	var textsFor = function (ev) {
		var def = evDef(ev.id);
		var c = INV.couple;
		var d = parseDate(ev.date) || new Date();
		return {
			title: def.title,
			brideName: tc(c.brideName),
			brideParents: 'D/O Mr & Mrs ' + tc(cleanParents(c.brideParents)),
			groomName: tc(c.groomName),
			groomParents: 'S/O Mr & Mrs ' + tc(cleanParents(c.groomParents)),
			month: MONTHS[d.getMonth()],
			dayName: DAYS[d.getDay()],
			date: String(d.getDate()).padStart(2, '0'),
			year: String(d.getFullYear()),
			time: fmtTime(ev.time),
			venue: 'Venue: ' + String(ev.venue || '').trim(),
		};
	};
	var put = function (ctx, t, f, W, H) {
		var size = f.size * W;
		ctx.font = f.weight + ' ' + size + 'px "' + f.font + '", serif';
		var w = ctx.measureText(t).width;
		var max = f.maxW * W;
		if (w > max) {
			size = Math.max((size * max) / w, size * 0.55);
			ctx.font = f.weight + ' ' + size + 'px "' + f.font + '", serif';
		}
		ctx.fillStyle = T.color;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(t, f.x * W, f.y * H);
	};
	var wrapWords = function (ctx, str, maxPx) {
		var words = str.split(/\s+/);
		var lines = [];
		var cur = '';
		words.forEach(function (w) {
			var t = cur ? cur + ' ' + w : w;
			if (ctx.measureText(t).width > maxPx && cur) {
				lines.push(cur);
				cur = w;
			} else cur = t;
		});
		if (cur) lines.push(cur);
		return lines;
	};
	var drawVenue = function (ctx, text, f, W, H) {
		var size = f.size * W;
		var setFont = function (s) {
			ctx.font = f.weight + ' ' + s + 'px "' + f.font + '", serif';
		};
		setFont(size);
		var maxPx = f.maxW * W;
		var full = ctx.measureText(text).width;
		var lines = [text];
		if (text.indexOf(',') >= 0 && full > W * 0.4) {
			var best = -1;
			var bestW = Infinity;
			for (var i = 0; i < text.length; i++) {
				if (text[i] !== ',') continue;
				var a = text.slice(0, i + 1).trim();
				var b = text.slice(i + 1).trim();
				if (!b) continue;
				var m = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
				if (m < bestW) {
					bestW = m;
					best = i;
				}
			}
			if (best >= 0) lines = [text.slice(0, best + 1).trim(), text.slice(best + 1).trim()];
		}
		if (lines.length === 1 && full > maxPx) lines = wrapWords(ctx, text, maxPx);
		if (lines.length > 2) lines = [lines[0], lines.slice(1).join(' ')];
		var widest = Math.max.apply(
			null,
			lines.map(function (l) {
				return ctx.measureText(l).width;
			})
		);
		if (widest > maxPx) {
			size = Math.max((size * maxPx) / widest, size * 0.6);
			setFont(size);
		}
		ctx.fillStyle = T.color;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		lines.forEach(function (l, i) {
			ctx.fillText(l, f.x * W, f.y * H + i * f.lh * H);
		});
	};
	var imgCache = {};
	var loadOne = function (src) {
		if (!imgCache[src])
			imgCache[src] = new Promise(function (res, rej) {
				var i = new Image();
				i.onload = function () {
					res(i);
				};
				i.onerror = function () {
					rej(new Error(src));
				};
				i.src = src;
			});
		return imgCache[src];
	};
	var loadBg = function (list) {
		return list.reduce(function (p, s) {
			return p.catch(function () {
				return loadOne(s);
			});
		}, Promise.reject());
	};
	var drawCard = function (id) {
		var isHosts = id === 'hosts';
		var lay = isHosts ? T.hostsLayout : T.eventLayout;
		return loadBg(lay.bg).then(function (img) {
			var W = Math.min(img.naturalWidth, 900);
			var H = Math.round((W * img.naturalHeight) / img.naturalWidth);
			var cv = document.createElement('canvas');
			cv.width = W;
			cv.height = H;
			var ctx = cv.getContext('2d');
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(img, 0, 0, W, H);
			if (isHosts) {
				var rows = INV.hosts
					.filter(function (h) {
						return String(h.name || '').trim();
					})
					.map(function (h) {
						return tc(h.name) + (String(h.phone || '').trim() ? '  ' + String(h.phone).trim() : '');
					});
				var n = rows.length;
				var gap = n <= 3 ? 0.0388 : n === 4 ? 0.0334 : n === 5 ? 0.02795 : 0.0256;
				var y0 = T.hostsLayout.field.centerY - ((n - 1) * gap) / 2;
				rows.forEach(function (t, i) {
					put(ctx, t, Object.assign({}, T.hostsLayout.field, { y: y0 + i * gap }), W, H);
				});
			} else {
				var ev = INV.events.filter(function (e) {
					return e.id === id;
				})[0];
				var tx = textsFor(ev);
				['title', 'brideName', 'brideParents', 'groomName', 'groomParents', 'month', 'dayName', 'date', 'time', 'year'].forEach(function (k) {
					put(ctx, tx[k], T.eventLayout.fields[k], W, H);
				});
				drawVenue(ctx, tx.venue, T.eventLayout.fields.venue, W, H);
			}
			return new Promise(function (res) {
				cv.toBlob(
					function (b) {
						res(URL.createObjectURL(b));
					},
					'image/jpeg',
					0.9
				);
			});
		});
	};

	var order = INV.events
		.slice()
		.sort(function (a, b) {
			var da = a.date || '9999';
			var db = b.date || '9999';
			if (da !== db) return da < db ? -1 : 1;
			return T.events.indexOf(evDef(a.id)) - T.events.indexOf(evDef(b.id));
		})
		.map(function (e) {
			return e.id;
		});
	if (INV.hosts && INV.hosts.length) order.push('hosts');
	var labelOf = function (id) {
		return id === 'hosts' ? 'Reception Hosts' : evDef(id).label;
	};

	var cards = [];
	var fontsReady = Promise.all([
		document.fonts.load('700 40px "Unna"'),
		document.fonts.load('400 40px "Berkshire Swash"'),
		document.fonts.load('700 40px "Playfair Display"'),
	]).catch(function () {});
	var cardsReady = fontsReady.then(function () {
		return Promise.all(
			order.map(function (id) {
				return drawCard(id).then(function (url) {
					return { id: id, label: labelOf(id), url: url };
				});
			})
		).then(function (list) {
			cards = list;
			list.forEach(function (c, i) {
				var im = document.createElement('img');
				im.className = 'ev-card';
				im.src = c.url;
				im.alt = c.label;
				im.draggable = false;
				im.dataset.i = String(i);
				cardsEl.appendChild(im);
				c.el = im;
				var slide = document.createElement('figure');
				slide.className = 'ev-vw-slide';
				slide.innerHTML = '<img src="' + c.url + '" alt="' + esc(c.label) + '" draggable="false">';
				track.appendChild(slide);
				var dot = document.createElement('i');
				dotsEl.appendChild(dot);
			});
			sizeCards();
		});
	});

	/* ---------- where each card sits ---------- */
	var envSize = function () {
		var r = envEl.getBoundingClientRect();
		return { w: r.width, h: r.width * S.envelope.ratio };
	};
	// a card at (dx px from centre, top at yTop px), tilted
	var tf = function (dx, yTop, rot, scale) {
		return 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), ' + yTop.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + (scale || 1) + ')';
	};
	var spread = function (k) {
		// 0 = top card; the others peek out left and right alternately
		if (k === 0) return { amp: 0, dir: 0 };
		return { amp: Math.ceil(k / 2), dir: k % 2 ? 1 : -1 };
	};
	var pose = function (k, kind) {
		var e = envSize();
		var sp = spread(k);
		var deckY = L.deckTop * e.h;
		if (kind === 'deck') {
			return tf(sp.dir * sp.amp * (L.deckSpread / 100) * e.w, deckY + sp.amp * (L.deckDrop / 100) * e.h, sp.dir * sp.amp * L.deckTilt, 1);
		}
		if (kind === 'stack') return tf(0, deckY, 0, 1);
		// 'inside': tucked into the envelope, only the tops can be seen under the flap
		return tf(sp.dir * sp.amp * 0.004 * e.w, L.insideTop * e.h + sp.amp * 0.006 * e.h, 0, 1);
	};
	function sizeCards() {
		cardsEl.style.setProperty('--ev-card-w', L.cardWidth + '%');
		cardsEl.style.setProperty('--ev-card-x', L.cardCenterX + '%');
		cards.forEach(function (c, i) {
			c.el.style.zIndex = String(100 - i);
		});
	}
	var placeAll = function (kind, instant) {
		cards.forEach(function (c, k) {
			if (instant) c.el.style.transition = 'none';
			c.el.style.transform = pose(k, kind);
		});
	};

	/* ---------- the experience ---------- */
	var state = 'idle'; // idle > opening > open > closing
	var vwOpen = false;
	var audio = null;
	var musicBtn = $('ev-music');
	var lockScroll = function (on) {
		document.documentElement.style.overflow = on ? 'hidden' : '';
		document.body.style.overflow = on ? 'hidden' : '';
	};
	var setSt = function (st, ms) {
		envEl.style.setProperty('--fade', ms + 'ms');
		envEl.dataset.st = st;
	};

	var musicIcon = function (on) {
		return on
			? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
			: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';
	};
	if (S.music && S.music.src) {
		audio = new Audio(S.music.src);
		audio.loop = true;
		audio.volume = S.music.volume || 0.6;
		audio.preload = 'auto';
		musicBtn.hidden = false;
		musicBtn.innerHTML = musicIcon(false);
		musicBtn.addEventListener('click', function () {
			if (audio.paused) audio.play().catch(function () {});
			else audio.pause();
		});
		audio.addEventListener('play', function () {
			musicBtn.innerHTML = musicIcon(true);
		});
		audio.addEventListener('pause', function () {
			musicBtn.innerHTML = musicIcon(false);
		});
	}

	var fireRing = function () {
		if (!S.ring.enabled) return;
		ringWrap.classList.remove('fire');
		void ringWrap.offsetWidth;
		ringWrap.classList.add('fire');
		setTimeout(function () {
			ringWrap.classList.remove('fire');
		}, S.ring.duration + 200);
	};

	var openAll = function () {
		if (state !== 'idle') return;
		state = 'opening';
		hintEl.classList.remove('show');
		if (audio && audio.paused) audio.play().catch(function () {});
		stage.classList.add('is-open');
		cardsReady.then(function () {
			// cards wait inside the envelope, hidden by the closed picture
			cards.forEach(function (c) {
				c.el.style.transition = 'none';
				c.el.style.opacity = '1';
			});
			placeAll('inside', true);
			void cardsEl.offsetWidth;
			fireRing();
			wait(TM.titleFadeDelay).then(function () {
				stage.classList.add('title-out');
			});
			wait(TM.peekDelay).then(function () {
				stage.classList.add('peek-on');
			});
			wait(TM.toSlightDelay)
				.then(function () {
					setSt('slight', TM.toSlight); // the flap lifts, the tops of the cards appear
					return wait(TM.toSlight + TM.slightPause);
				})
				.then(function () {
					setSt('open', TM.toOpen); // the flap opens fully
					return wait(TM.toOpen * 0.55);
				})
				.then(function () {
					var n = cards.length;
					var step = Math.min(TM.cardStagger, TM.cardStaggerTotal / Math.max(1, n));
					cards.forEach(function (c, k) {
						var d = (n - 1 - k) * step; // back cards first, the top card last
						c.el.style.transition = 'transform ' + TM.cardRise + 'ms cubic-bezier(.25,.7,.25,1) ' + d + 'ms';
					});
					placeAll('deck', false);
					stage.classList.add('hint2-on');
					closeBtn.classList.add('show');
					return wait(TM.cardRise + n * step + 150);
				})
				.then(function () {
					state = 'open';
				});
		});
	};

	/* ----- the reading view ----- */
	var vwIndex = 0;
	var slideW = function () {
		var s = track.querySelector('.ev-vw-slide');
		return s ? s.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : 1;
	};
	var markDots = function () {
		var i = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / slideW())));
		vwIndex = i;
		Array.prototype.forEach.call(dotsEl.children, function (d, j) {
			d.className = j === i ? 'on' : '';
		});
		vwLabel.textContent = cards[i] ? cards[i].label : '';
	};
	var goTo = function (i, smooth) {
		var n = cards.length;
		i = Math.max(0, Math.min(n - 1, i));
		track.scrollTo({ left: i * slideW(), behavior: smooth ? 'smooth' : 'auto' });
	};
	var openViewer = function (i) {
		if (vwOpen || state !== 'open') return;
		vwOpen = true;
		lockScroll(true);
		vw.style.setProperty('--vw-in', TM.viewerIn + 'ms');
		vw.style.setProperty('--vw-out', TM.viewerOut + 'ms');
		// start the reading view from where the deck sits on the screen
		var r = cardsEl.getBoundingClientRect();
		vw.style.setProperty('--vw-ox', r.left + r.width / 2 + 'px');
		vw.style.setProperty('--vw-oy', r.top + r.height * 0.3 + 'px');
		vw.classList.add('on');
		stage.classList.add('vw-on');
		vw.setAttribute('aria-hidden', 'false');
		goTo(i, false);
		markDots();
		requestAnimationFrame(markDots);
	};
	var hideViewer = function () {
		if (!vwOpen) return Promise.resolve();
		vwOpen = false;
		vw.classList.remove('on');
		stage.classList.remove('vw-on');
		vw.setAttribute('aria-hidden', 'true');
		return wait(TM.viewerOut + 60).then(function () {
			lockScroll(false);
		});
	};

	var closeAll = function () {
		if (state !== 'open') return;
		state = 'closing';
		closeBtn.classList.remove('show');
		stage.classList.remove('hint2-on');
		var n = cards.length;
		hideViewer()
			.then(function () {
				// 1. the cards tidy into one neat stack
				cards.forEach(function (c) {
					c.el.style.transition = 'transform ' + TM.tidy + 'ms cubic-bezier(.4,0,.2,1)';
				});
				placeAll('stack', false);
				return wait(TM.tidy + 80);
			})
			.then(function () {
				// 2. the stack slides down into the envelope, one card after another
				var step = Math.min(TM.sinkStagger, TM.sinkStaggerTotal / Math.max(1, n));
				cards.forEach(function (c, k) {
					c.el.style.transition = 'transform ' + TM.sink + 'ms cubic-bezier(.45,0,.25,1) ' + k * step + 'ms';
					c.el.style.transform = pose(k, 'inside');
				});
				return wait(TM.sink + n * step + 120);
			})
			.then(function () {
				// 3. the flap lowers, then the envelope closes
				setSt('slight', TM.closeToSlight);
				return wait(TM.closeToSlight + TM.slightPause);
			})
			.then(function () {
				setSt('closed', TM.closeToClosed);
				stage.classList.remove('peek-on');
				stage.classList.remove('title-out');
				return wait(TM.closeToClosed + 100);
			})
			.then(function () {
				cards.forEach(function (c) {
					c.el.style.transition = 'none';
					c.el.style.opacity = '0';
				});
				stage.classList.remove('is-open');
				stage.classList.add('was-opened');
				hintEl.classList.add('show');
				state = 'idle';
			});
	};

	var goBack = function () {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		wait(700).then(function () {
			if (state === 'open') {
				closeAll();
				return;
			}
			stage.classList.add('ev-reset');
			stage.classList.remove('ev-in', 'was-opened');
			hintEl.classList.remove('show');
			void stage.offsetWidth;
			stage.classList.remove('ev-reset');
			void stage.offsetWidth;
			stage.classList.add('ev-in');
			wait(TM.hintDelay).then(function () {
				hintEl.classList.add('show');
			});
		});
	};

	/* ---------- events ---------- */
	tapBtn.addEventListener('click', openAll);
	cardsEl.addEventListener('click', function (e) {
		if (state !== 'open') return;
		var t = e.target.closest('.ev-card');
		openViewer(t ? Number(t.dataset.i) : 0);
	});
	closeBtn.addEventListener('click', closeAll);
	backBtn.addEventListener('click', goBack);
	$('ev-peek').addEventListener('click', function () {
		$('ev-footwrap').scrollIntoView({ behavior: 'smooth' });
	});
	$('ev-prev').addEventListener('click', function () {
		goTo(vwIndex - 1, true);
	});
	$('ev-next').addEventListener('click', function () {
		goTo(vwIndex + 1, true);
	});
	var raf = 0;
	track.addEventListener('scroll', function () {
		cancelAnimationFrame(raf);
		raf = requestAnimationFrame(markDots);
	});
	document.addEventListener('keydown', function (e) {
		if (!vwOpen) return;
		if (e.key === 'ArrowLeft') goTo(vwIndex - 1, true);
		if (e.key === 'ArrowRight') goTo(vwIndex + 1, true);
		if (e.key === 'Escape') closeAll();
	});
	window.addEventListener('resize', function () {
		if (state === 'open') {
			cards.forEach(function (c) {
				c.el.style.transition = 'none';
			});
			placeAll('deck', true);
		}
	});

	// the Close button hides while the footer is on screen
	if ('IntersectionObserver' in window) {
		new IntersectionObserver(
			function (list) {
				closeBtn.classList.toggle('away', list[0].isIntersecting);
			},
			{ threshold: 0.35 }
		).observe($('ev-footwrap'));
		var io = new IntersectionObserver(
			function (list) {
				list.forEach(function (en) {
					if (en.isIntersecting) en.target.classList.add('vis');
				});
			},
			{ threshold: 0.25 }
		);
		document.querySelectorAll('.ev-fade').forEach(function (n, i) {
			n.style.transitionDelay = i * 0.12 + 's';
			io.observe(n);
		});
	} else {
		document.querySelectorAll('.ev-fade').forEach(function (n) {
			n.classList.add('vis');
		});
	}

	/* ---------- start ---------- */
	var imgs = [S.images.tray, S.images.closed, S.images.slight, S.images.open, S.images.ovSlight, S.images.ovOpen];
	var imagesReady = Promise.all(
		imgs.map(function (s) {
			return loadOne(s).catch(function () {});
		})
	);
	Promise.race([Promise.all([imagesReady, fontsReady]), wait(3500)]).then(function () {
		stage.classList.add('ev-in');
		wait(TM.hintDelay).then(function () {
			hintEl.classList.add('show');
		});
	});
})();
