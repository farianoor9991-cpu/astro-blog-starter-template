/* InviteHeaven envelope invitation engine (version 3).
   Reads the settings and invitation details from <script id="env-config" type="application/json">,
   draws the guest's cards and runs: welcome > ring of light > flap turns over (GSAP) > cards rise like a deck
   > tap to read (swipe, full screen) > Close > the same animation backwards > footer.
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
	if (!cfg.cardsOnly) document.body.style.background = S.background;
	var rs = root.style;
	var setv = function (k, v) {
		rs.setProperty(k, v);
	};
	setv('--ev-bg', S.background);
	if (S.backgroundImage) setv('--ev-bgimg', 'url(' + S.backgroundImage + ')');
	if (S.backgroundImageWide) setv('--ev-bgimg-w', 'url(' + S.backgroundImageWide + ')');
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
	var ENV = S.envelope; // picture sizes in design pixels: w, h, flap {x, y, w, h}, holeBottom
	var pc = function (v, tot) {
		return ((v / tot) * 100).toFixed(4) + '%';
	};
	var img = function (cls, src) {
		return '<img class="' + cls + '" src="' + esc(src) + '" alt="" draggable="false">';
	};
	root.innerHTML =
		'<div class="ev-stage" id="ev-stage">' +
		'<div class="ev-col">' +
		'<h1 class="ev-title ev-rise" id="ev-title">' + esc(S.welcome.text) + '</h1>' +
		'<p class="ev-hint2" id="ev-hint2">' + esc(S.hint.openText) + '</p>' +
		(S.images.tray ? '<div class="ev-tray ev-rise ev-trayrise" style="--d:0s;--dur:' + (TM.trayRise || 1900) + 'ms"><img id="ev-trayimg" src="' + esc(S.images.trayPhone || S.images.tray) + '" alt="" draggable="false"></div>' : '') +
		'<div class="ev-envbox ev-rise" style="--d:' + (TM.envDelay || 0.24) + 's">' +
		'<div class="ev-env" id="ev-env">' +
		'<div class="ev-lift" id="ev-lift">' +
		img('ev-img ev-closed', S.images.closed) +
		'<div class="ev-stack" id="ev-stack">' +
		img('ev-img ev-body', S.images.body) +
		'<div class="ev-cards" id="ev-cards"></div>' +
		img('ev-img ev-front', S.images.front) +
		'<div class="ev-cards ev-cards-top" id="ev-cards-top"></div>' +
		'<div class="ev-flap" id="ev-flap" style="left:' + pc(ENV.flap.x, ENV.w) + ';top:' + pc(ENV.flap.y, ENV.h) + ';width:' + pc(ENV.flap.w, ENV.w) + ';height:' + pc(ENV.flap.h, ENV.h) + '">' +
		img('ev-face ev-ff', S.images.flap) +
		img('ev-face ev-fb', S.images.flapBack) +
		'</div>' +
		'</div>' +
		'<div class="ev-ringwrap"><span class="ev-glow"></span><span class="ev-ring"></span></div>' +
		'<button class="ev-tap" id="ev-tap" type="button" aria-label="Open the invitation"></button>' +
		'</div></div></div>' +
		'<p class="ev-hint" id="ev-hint">' + esc(S.hint.text) + '</p>' +
		'<button class="ev-music" id="ev-music" type="button" aria-label="Music on or off" hidden></button>' +
		'<button class="ev-scroll" id="ev-scroll" type="button" aria-label="Scroll down for more"><span>Scroll down, there is more</span><svg viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3l7 6 7-6"/></svg></button>' +
		'</div>' +
		'</div>' +
		(window.IHFooter && !cfg.cardsOnly
			? '<section class="ev-foot" id="ev-foot">' + window.IHFooter.html({ bride: INV.couple && INV.couple.brideName, groom: INV.couple && INV.couple.groomName, mode: INV.footer && INV.footer.mode, family: INV.footer && INV.footer.family, seatRows: (INV.seatRows || []).map(function (r) { var d = (T.events || []).filter(function (x) { return x.id === r.id; })[0] || (INV.events || []).filter(function (x) { return x.id === r.id; })[0] || {}; return { label: d.label || d.title || '', n: r.n }; }) }) + '</section>'
			: '') +
		'<div class="ev-flyers" id="ev-flyers"></div>' +
		'<div class="ev-vw" id="ev-vw" aria-hidden="true">' +
		'<div class="ev-vw-track" id="ev-vw-track"></div>' +
		'<p class="ev-vw-label" id="ev-vw-label"></p>' +
		'<div class="ev-dots" id="ev-dots"></div>' +
		'<button class="ev-arrow ev-prev" id="ev-prev" type="button" aria-label="Previous card">&#8249;</button>' +
		'<button class="ev-arrow ev-next" id="ev-next" type="button" aria-label="Next card">&#8250;</button>' +
		'</div>' +
		'<div class="ev-zoom" id="ev-zoom" aria-hidden="true">' +
		'<div class="ev-zoom-track" id="ev-zoom-track"></div>' +
		'<button class="ev-zoom-x" id="ev-zoom-x" type="button" aria-label="Back to the cards"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
		'<button class="ev-arrow ev-zprev" id="ev-zprev" type="button" aria-label="Previous card">&#8249;</button>' +
		'<button class="ev-arrow ev-znext" id="ev-znext" type="button" aria-label="Next card">&#8250;</button>' +
		'</div>' +
		'<button class="ev-close" id="ev-close" type="button">' + esc(S.buttons.closeLabel) + '</button>';

	var $ = function (id) {
		return document.getElementById(id);
	};
	var stage = $('ev-stage');
	var envEl = $('ev-env');
	var liftEl = $('ev-lift');
	var stackEl = $('ev-stack');
	var flapEl = $('ev-flap');
	var closedEl = envEl.querySelector('.ev-closed');
	var cardsEl = $('ev-cards');
	var cardsTop = $('ev-cards-top');
	var tapBtn = $('ev-tap');
	var hintEl = $('ev-hint');
	var closeBtn = $('ev-close');
	var backBtn = $('ev-back');

	/* The tray is part of the silk background picture. Work out where it is on screen and put the envelope exactly in the middle of it. */
	var trayLive = null;
	// the welcome line sits just above the raised flap (the flap, once open, reaches this far above the envelope)
	var placeTitle = function (H, envH, envBottom) {
		var envTop = H - envBottom - envH;
		var flapTop = envTop - envH * (S.envelope.openFlapRise || 0.74);
		rs.setProperty('--ev-title-b', Math.round(H - flapTop + (S.welcome.gap || 14)) + 'px');
		var im = document.getElementById('ev-trayimg');
		var want = wide0() ? S.images.tray : S.images.trayPhone || S.images.tray;
		if (im && want && im.getAttribute('src') !== want) im.setAttribute('src', want);
	};
	var wide0 = function () { return window.matchMedia('(min-width: 700px) and (orientation: landscape)').matches; };
	var fitTray = function () {
		var T = S.trayInBg;
		if (!T || cfg.cardsOnly) return;
		var st = stage.getBoundingClientRect();
		var W = st.width, H = st.height;
		var wide = window.matchMedia('(min-width: 700px) and (orientation: landscape)').matches;
		var g = T.port;
		if (wide) {
			// laptop: the tray is its own picture; the invitation is laid out like on a phone, in the middle of the screen
			var Lp = T.lap;
			var colL = Math.min(W, H * Lp.colByH);
			var trW = colL * Lp.trayByCol, trH = trW * Lp.ratio;
			var cyL = H * Lp.cy;
			var envHL = (L.envelopeWidth / 100) * colL * S.envelope.ratio;
			rs.setProperty('--ev-max', Math.round(colL) + 'px');
			rs.setProperty('--ev-tray-w', Math.round(trW) + 'px');
			rs.setProperty('--ev-trayimg-b', Math.round(H - (cyL + trH / 2)) + 'px');
			rs.setProperty('--ev-tray-b', Math.round(H - (cyL + envHL / 2) - colL * L.envelopeLift) + 'px');
			trayLive = { cx: W / 2, cy: cyL, rx: (trW / 2) * 0.96, ry: (trH / 2) * 0.96 };
			placeTitle(H, envHL, H - (cyL + envHL / 2));
			return;
		}
		var Wv = W;
		var sc = Math.max(Wv / g.iw, H / g.ih); // background-size: cover
		var ox = (W - Wv) / 2 + (Wv - g.iw * sc) / 2, oy = (H - g.ih * sc) / 2;
		var tw = g.w * g.iw * sc, th = g.h * g.ih * sc;
		var cx = ox + g.cx * g.iw * sc, cy = oy + g.cy * g.ih * sc;
		var colW = Math.min(Wv, tw); // the invitation column
		var envW = (L.envelopeWidth / 100) * colW;
		var envH = envW * S.envelope.ratio;
		var bottom = H - (cy + envH / 2); // envelope bottom edge, measured from the bottom of the screen
		rs.setProperty('--ev-max', Math.round(colW) + 'px');
		rs.setProperty('--ev-tray-b', Math.round(bottom - colW * L.envelopeLift) + 'px');
		trayLive = { cx: cx, cy: cy, rx: Math.min(tw / 2, Wv / 2 - 6) * 0.97, ry: Math.min(th / 2, H / 2 - 6) * 0.97 };
		// phone: the tray is its own picture, placed exactly where it used to be inside the background
		rs.setProperty('--ev-tray-w', Math.round(tw) + 'px');
		rs.setProperty('--ev-trayimg-b', Math.round(H - (cy + th / 2)) + 'px');
		placeTitle(H, envH, bottom);
	};
	fitTray();
	var vw = $('ev-vw');
	var track = $('ev-vw-track');
	var dotsEl = $('ev-dots');
	var vwLabel = $('ev-vw-label');
	var zoomEl = $('ev-zoom');
	var zoomTrack = $('ev-zoom-track');
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
	var putGuest = function (ctx, t, f, W, H) {
		var full = f.size * W;
		var max = f.maxW * W;
		var setF = function (sz) {
			ctx.font = f.weight + ' ' + sz + 'px "' + f.font + '", serif';
		};
		ctx.fillStyle = T.color;
		ctx.textAlign = 'center';
		setF(full);
		// Short name: one line at the fixed spot
		if (ctx.measureText(t).width <= max) {
			ctx.textBaseline = 'middle';
			ctx.fillText(t, f.x * W, f.y * H);
			return;
		}
		// Long name: two lines, the first line filled as far as it fits (like the sample card)
		var lines = wrapWords(ctx, t, max);
		if (lines.length > 2) lines = [lines[0], lines.slice(1).join(' ')];
		var widest = function () {
			return Math.max.apply(null, lines.map(function (l) { return ctx.measureText(l).width; }));
		};
		var sc = 1;
		var sx = 1;
		var wd = widest();
		if (wd > max) {
			sc = Math.max(max / wd, 0.5);
			setF(full * sc);
			wd = widest();
			if (wd > max) sx = max / wd;
		}
		var gap = f.gap * W * sc;
		var mid = f.wrapY * H + (f.gap * W) / 2;
		var base = lines.length === 1 ? mid : mid - gap / 2;
		ctx.textBaseline = 'alphabetic';
		lines.forEach(function (l, i) {
			ctx.save();
			ctx.translate(f.x * W, base + i * gap);
			ctx.scale(sx, 1);
			ctx.fillText(l, 0, 0);
			ctx.restore();
		});
	};
	var watermark = function (ctx, W, H) {
		ctx.save();
		ctx.translate(W / 2, H / 2);
		ctx.rotate(-Math.PI / 6);
		var size = W * 0.032;
		ctx.font = '700 ' + size + 'px "Playfair Display", Georgia, serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.lineWidth = size * 0.07;
		ctx.strokeStyle = 'rgba(39,96,65,0.34)';
		ctx.fillStyle = 'rgba(255,255,255,0.5)';
		var stepX = W * 0.31;
		var stepY = W * 0.13;
		var row = 0;
		for (var y = -H; y <= H; y += stepY) {
			var off = row % 2 ? stepX / 2 : 0;
			for (var x = -W * 1.2; x <= W * 1.2; x += stepX) {
				ctx.strokeText('InviteHeaven', x + off, y);
				ctx.fillText('InviteHeaven', x + off, y);
			}
			row++;
		}
		ctx.restore();
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
		var isGuest = id === 'guest';
		var lay = isHosts ? T.hostsLayout : isGuest ? T.guestLayout : T.eventLayout;
		return loadBg(lay.bg).then(function (img) {
			var W = Math.min(img.naturalWidth, 900);
			var H = Math.round((W * img.naturalHeight) / img.naturalWidth);
			cardRatio = H / W;
			var cv = document.createElement('canvas');
			cv.width = W;
			cv.height = H;
			var ctx = cv.getContext('2d');
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(img, 0, 0, W, H);
			if (isGuest) {
				putGuest(ctx, 'Dear ' + tc(INV.guest), T.guestLayout.field, W, H);
			} else if (isHosts) {
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
			if (cfg.watermark) watermark(ctx, W, H);
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

	(INV.events || []).forEach(function (ev) {
		if (ev.custom && !evDef(ev.id)) T.events.push({ id: ev.id, label: ev.label || ev.title, title: ev.title || ev.label });
	});
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
	if (INV.guest) order.unshift('guest'); // personalized greeting card always comes first
	var labelOf = function (id) {
		return id === 'hosts' ? 'Reception Hosts' : id === 'guest' ? 'Greeting' : evDef(id).label;
	};

	// Cards-only mode (used by the order page preview): no envelope, just draws the cards on request
	if (cfg.cardsOnly) {
		var fontsOnly = Promise.all([
			document.fonts.load('700 40px "Unna"'),
			document.fonts.load('400 40px "Berkshire Swash"'),
		]).catch(function () {});
		window.__ihCards = function (inv) {
			INV = inv;
			(INV.events || []).forEach(function (ev) {
				if (ev.custom && !evDef(ev.id)) T.events.push({ id: ev.id, label: ev.label || ev.title, title: ev.title || ev.label });
			});
			var ids = INV.events
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
			if (INV.hosts && INV.hosts.length) ids.push('hosts');
			if (INV.guest) ids.unshift('guest');
			return fontsOnly.then(function () {
				return Promise.all(
					ids.map(function (id) {
						return drawCard(id).then(function (url) {
							return { id: id, label: labelOf(id), url: url };
						});
					})
				);
			});
		};
		if (window.__ihCardsReady) window.__ihCardsReady();
		return;
	}

	var cards = [];
	var cardRatio = 16 / 9; // height / width of a card, read from the first card drawn
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
				var zs = document.createElement('figure');
				zs.className = 'ev-zoom-slide';
				zs.innerHTML = '<img src="' + c.url + '" alt="' + esc(c.label) + '" draggable="false">';
				zoomTrack.appendChild(zs);
				var dot = document.createElement('i');
				dotsEl.appendChild(dot);
			});
			buildTimeline();
		});
	});


	/* ---------- the experience ---------- */
	var state = 'idle'; // idle > opening > open > closing
	var vwOpen = false;
	var audio = null;
	var musicBtn = $('ev-music');
	var lockScroll = function (on) {
		document.documentElement.style.overflow = on ? 'hidden' : '';
		document.body.style.overflow = on ? 'hidden' : '';
	};

	var musicIcon = function (on) {
		return on
			? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>'
			: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>';
	};
	var MU = INV && INV.musicSrc ? (INV.musicSrc === 'none' ? null : { src: INV.musicSrc, volume: (S.music && S.music.volume) || 0.6 }) : S.music;
	if (MU && MU.src) {
		audio = new Audio(MU.src);
		audio.loop = true;
		audio.volume = MU.volume || 0.6;
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

	/* ----- magic effects: confetti on arrival, luminous rings from the wax seal, fairy dust while the cards come out ----- */
	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var tick = function (fn) {
		// one animation loop per effect, driven by the GSAP ticker (falls back to requestAnimationFrame)
		if (typeof gsap !== 'undefined' && gsap.ticker) {
			gsap.ticker.add(fn);
			return function () {
				gsap.ticker.remove(fn);
			};
		}
		var on = true;
		var last = performance.now();
		var loop = function (now) {
			if (!on) return;
			fn(now / 1000, (now - last) * 1000);
			last = now;
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);
		return function () {
			on = false;
		};
	};
	var fxDpr = 1;
	var fxCanvas = function () {
		var c = document.createElement('canvas');
		c.className = 'ev-fx';
		c.setAttribute('aria-hidden', 'true');
		// exact pixel size (100vh is taller than the visible screen on phones, which pushed the ring off the seal)
		c.style.width = window.innerWidth + 'px';
		c.style.height = window.innerHeight + 'px';
		var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		fxDpr = dpr;
		c.width = Math.round(window.innerWidth * dpr);
		c.height = Math.round(window.innerHeight * dpr);
		var x = c.getContext('2d');
		x.scale(dpr, dpr);
		document.body.appendChild(c);
		return { c: c, x: x, w: window.innerWidth, h: window.innerHeight };
	};
	var rnd = function (a, b) {
		return a + Math.random() * (b - a);
	};
	var smooth = function (a, b, v) {
		var k = Math.max(0, Math.min(1, (v - a) / (b - a)));
		return k * k * (3 - 2 * k);
	};
	var sealPoint = function () {
		var r = closedEl.getBoundingClientRect();
		return { x: r.left + (r.width * ENV.sealX) / 100, y: r.top + (r.height * ENV.sealY) / 100 };
	};
	// a soft round glow, drawn once and re-used by every sparkle
	var glowSprite = (function () {
		var c = document.createElement('canvas');
		c.width = c.height = 64;
		var x = c.getContext('2d');
		var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
		g.addColorStop(0, 'rgba(252,249,241,1)');
		g.addColorStop(0.18, 'rgba(240,215,160,0.85)');
		g.addColorStop(0.45, 'rgba(212,162,118,0.28)');
		g.addColorStop(1, 'rgba(212,162,118,0)');
		x.fillStyle = g;
		x.fillRect(0, 0, 64, 64);
		return c;
	})();
	var drawStar = function (x, px, py, r, rot) {
		// four-point glint
		x.save();
		x.translate(px, py);
		x.rotate(rot);
		x.beginPath();
		x.moveTo(0, -r);
		x.quadraticCurveTo(r * 0.13, -r * 0.13, r, 0);
		x.quadraticCurveTo(r * 0.13, r * 0.13, 0, r);
		x.quadraticCurveTo(-r * 0.13, r * 0.13, -r, 0);
		x.quadraticCurveTo(-r * 0.13, -r * 0.13, 0, -r);
		x.closePath();
		x.fill();
		x.restore();
	};

	/* --- 1. confetti: starts as soon as the page opens (once) --- */
	var confettiDone = false;
	var fireConfetti = function () {
		var C = S.confetti;
		if (confettiDone || reduceMotion || !C || !C.enabled) return;
		confettiDone = true;
		var f = fxCanvas();
		var small = f.w < 700;
		var total = Math.round(C.count * (small ? 0.8 : 1.25));
		var kinds = [
			{ col: '#D4A276', foil: true },
			{ col: '#C9A25E', foil: true },
			{ col: '#D8C7A7', foil: false },
			{ col: '#FCF9F1', foil: false, paper: true },
			{ col: '#E3C88F', foil: true },
		];
		var ps = [];
		var t0 = null;
		var spawned = 0;
		var spawn = function () {
			var k = kinds[Math.floor(Math.random() * kinds.length)];
			ps.push({
				x: rnd(-10, f.w + 10),
				y: rnd(-40, -8),
				w: k.paper ? rnd(7, 11) : rnd(6, 11),
				h: k.paper ? rnd(4, 6.5) : rnd(3.4, 6),
				vy: rnd(60, 120),
				drift: rnd(14, 38),
				ph: rnd(0, 6.28),
				sp: rnd(0.7, 1.6),
				rot: rnd(0, 6.28),
				vr: rnd(-2.2, 2.2),
				flip: rnd(1.5, 4),
				al: rnd(0.75, 1),
				k: k,
			});
		};
		var stop = null;
		var finish = function () {
			if (stop) stop();
			if (f.c.parentNode) f.c.parentNode.removeChild(f.c);
		};
		stop = tick(function (time, dt) {
			var now = performance.now();
			if (t0 === null) t0 = now;
			var el = now - t0;
			var d = Math.min(0.05, (dt || 16) / 1000);
			// graceful emission: a lively start, then fewer and fewer pieces
			var share = 1 - Math.pow(1 - Math.min(1, el / C.spawnMs), 1.8);
			var want = Math.floor(total * share);
			while (spawned < want) {
				spawn();
				spawned++;
			}
			var x = f.x;
			x.clearRect(0, 0, f.w, f.h);
			var alive = 0;
			for (var i = 0; i < ps.length; i++) {
				var p = ps[i];
				if (p.y > f.h + 14) continue;
				alive++;
				p.y += p.vy * d;
				p.ph += p.sp * d;
				p.x += Math.sin(p.ph) * p.drift * d;
				p.rot += p.vr * d;
				var sy = Math.abs(Math.cos(p.rot * p.flip * 0.5)) * 0.85 + 0.15; // paper turning over
				x.save();
				x.globalAlpha = p.al * (p.y < 40 ? Math.max(0, p.y + 40) / 80 : 1);
				x.translate(p.x, p.y);
				x.rotate(p.rot);
				x.scale(1, sy);
				if (p.k.paper) {
					x.shadowColor = 'rgba(120,88,46,0.45)';
					x.shadowBlur = 2.5;
				}
				x.fillStyle = p.k.col;
				x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
				if (p.k.foil) {
					// a thin bright edge makes the piece look like gold foil
					x.fillStyle = 'rgba(255,244,214,' + 0.55 * sy + ')';
					x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * 0.32);
				}
				x.restore();
			}
			if (spawned >= total && alive === 0) finish();
		});
	};

	/* --- 2. luminous rings from the centre of the wax seal --- */
	// warm = a silent rehearsal (invisible) done while the envelope waits, so the real one on the first tap is already "warmed up"
	var fireRipple = function (warm) {
		var Rp = S.ripple;
		if (reduceMotion || !Rp || !Rp.enabled) return;
		var f = fxCanvas();
		if (warm) f.c.style.opacity = '0';
		var o = sealPoint();
		// the ring stops at the edge of the tray (an oval), nothing beyond it
		var TL = trayLive || (function () { var e = envEl.getBoundingClientRect(); return { cx: o.x, cy: o.y, rx: e.width * 0.7, ry: e.height * 0.9 }; })();
		var R = TL.rx;
		var r0 = Math.max(8, closedEl.getBoundingClientRect().width * ENV.sealR / 100 * 0.8); // starts inside the wax seal
		var yk = TL.ry / TL.rx;
		var dur = warm ? 450 : Rp.duration;
		var t0 = null;
		var rings = [
			{ d: 0, k: 1, ang: rnd(0, 6.28), dots: [] },
		];
		rings.forEach(function (rg) {
			// shimmering specks on a few stretches of each ring
			var arcs = 2 + Math.floor(Math.random() * 2);
			for (var a = 0; a < arcs; a++) {
				var c0 = rnd(0, 6.28);
				var span = rnd(0.5, 1.1);
				var n = 5 + Math.floor(Math.random() * 4);
				for (var i = 0; i < n; i++) rg.dots.push({ a: c0 + rnd(-span, span) / 2, o: rnd(-9, 9), s: rnd(0.9, 2.2), ph: rnd(0, 6.28), sp: rnd(5, 11) });
			}
		});
		var stop = null;
		var finish = function () {
			if (stop) stop();
			if (f.c.parentNode) f.c.parentNode.removeChild(f.c);
		};
		stop = tick(function () {
			var now = performance.now();
			if (t0 === null) t0 = now;
			var t = (now - t0) / dur;
			if (t >= 1) return finish();
			var x = f.x;
			x.clearRect(0, 0, f.w, f.h);
			x.globalCompositeOperation = 'screen';
			// the glow at the seal swells for a moment, then fades gently
			var cg = smooth(0, 0.16, t) * (1 - smooth(0.16, 0.6, t));
			if (cg > 0.002) {
				var cr = 70 + 90 * smooth(0, 0.3, t);
				var g = x.createRadialGradient(o.x, o.y, 0, o.x, o.y, cr);
				g.addColorStop(0, 'rgba(252,249,241,' + 0.62 * cg + ')');
				g.addColorStop(0.35, 'rgba(232,194,122,' + 0.34 * cg + ')');
				g.addColorStop(1, 'rgba(212,162,118,0)');
				x.fillStyle = g;
				x.fillRect(o.x - cr, o.y - cr, cr * 2, cr * 2);
			}
			rings.forEach(function (rg) {
				var u = (t - rg.d) / (1 - rg.d);
				if (u <= 0) return;
				var e = 1 - Math.pow(1 - u, 1.9); // quick start, long soft finish
				// the ring starts at the seal and ends as the outline of the tray, reaching all its sides and corners
				// (round and centred on the seal at first; the centre and the oval shape settle onto the tray only as it grows)
				var ec = Math.pow(e, 2.4);
				var oo = { x: o.x + (TL.cx - o.x) * ec, y: o.y + (TL.cy - o.y) * ec };
				var ykt = 1 + (yk - 1) * ec;
				x.setTransform(fxDpr, 0, 0, fxDpr * ykt, 0, fxDpr * oo.y * (1 - ykt));
				var r = r0 + (R - r0) * e;
				var a = rg.k * smooth(0, 0.08, u) * Math.pow(1 - smooth(0.5, 1, u), 1.2);
				if (a < 0.004) return;
				var wd = 10 + r * 0.045; // rings grow softer as they travel
				// soft wash just inside the ring
				var tr = x.createRadialGradient(oo.x, oo.y, Math.max(0, r - wd * 5), oo.x, oo.y, r);
				tr.addColorStop(0, 'rgba(232,194,122,0)');
				tr.addColorStop(1, 'rgba(232,194,122,' + 0.12 * a + ')');
				x.fillStyle = tr;
				x.beginPath();
				x.arc(oo.x, oo.y, r, 0, 6.2832);
				x.fill();
				// feathered body of the ring (champagne gold), brightness varies around it
				var lg = x.createRadialGradient(oo.x, oo.y, Math.max(0, r - wd * 1.8), oo.x, oo.y, r + wd * 1.8);
				lg.addColorStop(0, 'rgba(212,162,118,0)');
				lg.addColorStop(0.42, 'rgba(212,162,118,' + 0.38 * a + ')');
				lg.addColorStop(0.5, 'rgba(238,208,150,' + 0.62 * a + ')');
				lg.addColorStop(0.58, 'rgba(212,162,118,' + 0.38 * a + ')');
				lg.addColorStop(1, 'rgba(212,162,118,0)');
				x.fillStyle = lg;
				x.beginPath();
				x.arc(oo.x, oo.y, r + wd * 1.8, 0, 6.2832);
				x.fill();
				// ivory highlight on some stretches of the ring only (organic, not uniform)
				if (x.createConicGradient) {
					var cg2 = x.createConicGradient(rg.ang + u * 0.9, oo.x, oo.y);
					cg2.addColorStop(0, 'rgba(252,249,241,0)');
					cg2.addColorStop(0.12, 'rgba(252,249,241,' + 0.75 * a + ')');
					cg2.addColorStop(0.3, 'rgba(252,249,241,0)');
					cg2.addColorStop(0.58, 'rgba(252,249,241,' + 0.45 * a + ')');
					cg2.addColorStop(0.72, 'rgba(252,249,241,0)');
					cg2.addColorStop(1, 'rgba(252,249,241,0)');
					x.strokeStyle = cg2;
					x.lineWidth = Math.max(1.2, wd * 0.22);
					x.beginPath();
					x.arc(oo.x, oo.y, r, 0, 6.2832);
					x.stroke();
				}
				// shimmering specks
				rg.dots.forEach(function (d) {
					var tw = 0.5 + 0.5 * Math.sin(d.ph + t * d.sp * 6);
					var aa = a * tw * 0.95;
					if (aa < 0.02) return;
					var ang = d.a + u * 0.35;
					var px = oo.x + Math.cos(ang) * (r + d.o);
					var py = oo.y + Math.sin(ang) * (r + d.o);
					var sz = d.s * 7;
					x.globalAlpha = Math.min(1, aa);
					x.drawImage(glowSprite, px - sz, py - sz, sz * 2, sz * 2);
				});
				x.globalAlpha = 1;
			});
			x.setTransform(fxDpr, 0, 0, fxDpr, 0, 0);
			x.globalCompositeOperation = 'source-over';
		});
	};

	/* --- 3. fairy dust and twinkling stars while the flap opens and the cards come out --- */
	var dust = null;
	var startDust = function () {
		var Sp = S.sparkle;
		if (reduceMotion || !Sp || !Sp.enabled) return;
		stopDust(true);
		var f = fxCanvas();
		var ps = [];
		var rate = 0; // new particles per second
		var carry = 0;
		var fading = false;
		var fadeT = 0;
		var last = performance.now();
		var stop = null;
		var spawn = function () {
			var r = envEl.getBoundingClientRect();
			var star = Math.random() < Sp.starShare;
			// from inside the envelope, and (once the cards rise) around the envelope and the cards
			var wide = dust.mode === 2;
			var fr = flapEl.getBoundingClientRect();
			var px = wide ? rnd(r.left - r.width * 0.12, r.right + r.width * 0.12) : rnd(fr.left + fr.width * 0.2, fr.right - fr.width * 0.185);
			var py = wide ? rnd(r.top - r.height * 0.55, r.bottom - r.height * 0.15) : rnd(fr.top + fr.height * 0.15, fr.bottom - fr.height * 0.15);
			ps.push({
				x: px,
				y: py,
				vx: rnd(-9, 9) + (px - (r.left + r.width / 2)) * 0.05,
				vy: rnd(-26, -8),
				s: star ? rnd(3.2, 6.2) : rnd(0.9, 2.1),
				star: star,
				life: 0,
				max: rnd(2.2, 4.2),
				ph: rnd(0, 6.28),
				rot: rnd(-0.4, 0.4),
				al: rnd(0.5, 1),
			});
		};
		dust = {
			c: f.c,
			mode: 1,
			setRate: function (r) {
				rate = r;
			},
			fade: function () {
				fading = true;
				fadeT = performance.now();
				rate = 0;
			},
			kill: function () {
				if (stop) stop();
				if (f.c.parentNode) f.c.parentNode.removeChild(f.c);
			},
		};
		stop = tick(function () {
			var now = performance.now();
			var d = Math.min(0.05, (now - last) / 1000);
			last = now;
			carry += rate * d;
			while (carry >= 1 && ps.length < Sp.max) {
				spawn();
				carry -= 1;
			}
			if (carry > 3) carry = 0;
			var x = f.x;
			x.clearRect(0, 0, f.w, f.h);
			x.globalCompositeOperation = 'screen';
			var g = fading ? 1 - smooth(0, Sp.fadeMs, now - fadeT) : 1;
			var alive = 0;
			for (var i = 0; i < ps.length; i++) {
				var p = ps[i];
				if (p.life >= p.max) continue;
				alive++;
				p.life += d;
				p.x += p.vx * d;
				p.y += p.vy * d;
				p.vx += Math.sin(p.ph + p.life * 2) * 5 * d;
				var u = p.life / p.max;
				var a = p.al * g * smooth(0, 0.18, u) * (1 - smooth(0.6, 1, u));
				if (a < 0.01) continue;
				if (p.star) {
					var tw = 0.35 + 0.65 * Math.abs(Math.sin(p.life * 5 + p.ph)); // brief twinkle
					x.globalAlpha = a * tw * 0.55;
					var gs = p.s * 5;
					x.drawImage(glowSprite, p.x - gs, p.y - gs, gs * 2, gs * 2);
					x.globalAlpha = a * tw;
					x.fillStyle = '#FCF9F1';
					drawStar(x, p.x, p.y, p.s * (0.7 + 0.5 * tw), p.rot);
				} else {
					x.globalAlpha = a;
					var ds = p.s * 4.2;
					x.drawImage(glowSprite, p.x - ds, p.y - ds, ds * 2, ds * 2);
				}
			}
			x.globalAlpha = 1;
			x.globalCompositeOperation = 'source-over';
			if (fading && g <= 0.001 && alive === 0) stopDust(false);
			else if (fading && g <= 0.001) stopDust(false);
		});
	};
	var stopDust = function (silent) {
		if (!dust) return;
		dust.kill();
		dust = null;
	};

	var fireRing = function () {
		if (!S.ring.enabled) return;
		ringWrap.classList.remove('fire');
		void ringWrap.offsetWidth;
		ringWrap.classList.add('fire');
		setTimeout(function () {
			ringWrap.classList.remove('fire');
		}, S.ring.duration + 200);
	};

	/* ----- the opening / closing animation (GSAP): one timeline, played forward to open, backwards to close ----- */
	var D = S.anim;
	// CSS-style cubic-bezier as a GSAP ease (no plugin needed)
	var bez = function (x1, y1, x2, y2) {
		var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
		var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
		var X = function (t) { return ((ax * t + bx) * t + cx) * t; };
		var Y = function (t) { return ((ay * t + by) * t + cy) * t; };
		var dX = function (t) { return (3 * ax * t + 2 * bx) * t + cx; };
		return function (p) {
			if (p <= 0) return 0;
			if (p >= 1) return 1;
			var t = p;
			for (var i = 0; i < 8; i++) {
				var e = X(t) - p;
				if (Math.abs(e) < 1e-5) return Y(t);
				var d = dX(t);
				if (Math.abs(d) < 1e-6) break;
				t -= e / d;
			}
			var lo = 0, hi = 1;
			t = p;
			for (var k = 0; k < 24; k++) {
				var xv = X(t);
				if (Math.abs(xv - p) < 1e-5) break;
				if (xv < p) lo = t; else hi = t;
				t = (lo + hi) / 2;
			}
			return Y(t);
		};
	};
	var easeUp = bez(0.42, 0.04, 0.22, 1); // opening: soft start, long gentle finish
	var easeDown = bez(0.4, 0, 0.2, 1); // closing and settling: smooth in and out
	var tl = null;
	var cardW = 0; // px, set in buildTimeline
	var tLiftEnd = 0;
	var ctl = null;
	var cardPoses = function (k, nv, w, sc, ch, tgt, from) {
		// k = 0 is the front card. Only nv cards are shown as a stack, the others wait behind the last one.
		var kk = Math.min(k, nv - 1);
		// resting place: a straight stack inside the pocket, nothing above the envelope while the flap is closed
		var y0 = (ENV.holeBottom * L.restDepth + 2) * sc;
		var rest = { y: y0, x: 0, rot: 0, s: 1 };
		// after the flap is open the whole stack lifts a little (at most 30% of a card shows above the envelope)
		var lift = { y: y0 - ch * 0.15 - kk * 0.035 * ch };
		// stepping out: straight up until the card has fully left the pocket
		var out = rest.y - ch * 1.03 - kk * 0.02 * ch;
		// the stack forms in front of the envelope, right where the swipe row will be; the back cards only show as a line behind the first card
		var s = tgt.w / (ch / cardRatio);
		var pile = { y: tgt.cy - from.cy - kk * 0.02 * tgt.h, x: tgt.cx - from.cx, rot: 0, s: s, out: out };
		return { rest: rest, lift: lift, pile: pile, kk: kk, k: k };
	};
	var firstSlot = function () {
		var hold = !vwOpen;
		if (hold) vw.classList.add('vw-hold');
		track.scrollLeft = 0;
		var r = track.children[0].getBoundingClientRect();
		if (hold) vw.classList.remove('vw-hold');
		return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
	};
	function buildTimeline() {
		if (typeof gsap === 'undefined') return;
		if (tl) {
			tl.pause(0);
			tl.kill();
		}
		var n = cards.length;
		if (!n) return;
		var nv = Math.max(1, Math.min(n, L.maxVisible));
		var w = envEl.offsetWidth || 300;
		var sc = w / ENV.w;
		var cw = (L.cardWidth / 100) * w;
		var ch = cw * cardRatio;
		cardW = cw;
		var tf0 = D.lift + D.cross; // when the flap starts
		var persp = w * D.perspective;

		gsap.set(liftEl, { scale: 1, y: 0 });
		gsap.set(stackEl, { opacity: 0 });
		gsap.set(closedEl, { opacity: 1 });
		gsap.set(flapEl, { rotationX: 0, scale: 1, zIndex: 4, transformOrigin: '50% 0%', transformPerspective: persp });
		var tgt = firstSlot();
		cards.forEach(function (c, k) {
			cardsEl.appendChild(c.el);
			gsap.set(c.el, { xPercent: -50, x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, visibility: 'visible', zIndex: 100 - k, width: cw, transformOrigin: '50% 50%' });
			var r0 = c.el.getBoundingClientRect(); // card at y 0: its centre
			var p = cardPoses(k, nv, w, sc, ch, tgt, { cx: r0.left + r0.width / 2, cy: r0.top + r0.height / 2 });
			c.pose = p;
			gsap.set(c.el, { x: p.rest.x, y: p.rest.y, rotation: p.rest.rot });
		});

		tl = gsap.timeline({
			paused: true,
			onComplete: function () {
				toRow();
			},
			onReverseComplete: function () {
				if (state !== 'closing') return;
				cards.forEach(function (c) {
					cardsEl.appendChild(c.el);
				});
				stage.classList.remove('is-open', 'peek-on');
				stage.classList.add('was-opened');
				hintEl.classList.add('show');
				state = 'idle';
			},
		});
		// 1. a small lift
		tl.to(liftEl, { scale: 1.03, y: -6 * sc, duration: D.lift, ease: 'power1.out' }, 0);
		// 2. cross-fade from the closed picture to the layered one
		tl.to(stackEl, { opacity: 1, duration: D.cross, ease: 'none' }, D.lift);
		tl.set(closedEl, { opacity: 0 }, tf0);
		// 3. only the flap turns over; halfway it slips behind the cards (which rest in the pocket)
		tl.to(flapEl, { rotationX: -180, duration: D.flap, ease: 'power2.inOut' }, tf0);
		tl.to(flapEl, { scale: 0.98, duration: D.flap / 2, ease: 'sine.inOut' }, tf0);
		tl.to(flapEl, { scale: 1, duration: D.flap / 2, ease: 'sine.inOut' }, tf0 + D.flap / 2);
		tl.set(flapEl, { zIndex: 1 }, tf0 + D.flap / 2);
		// 4. when the flap is open, the whole stack lifts a little together
		var tLift = tf0 + D.flap * 0.7;
		tLiftEnd = tLift + 0.9;
		cards.forEach(function (c) {
			tl.to(c.el, { y: c.pose.lift.y, duration: 0.9, ease: 'sine.inOut' }, tLift);
		});
		// 5. then the first card steps out and stops in front; the others follow one by one and line up behind it
		var step = D.cardStagger;
		var tc = tf0 + D.flap + 0.1;
		var up = D.cardUp;
		cards.forEach(function (c) {
			var d = c.pose.k * step;
			tl.to(c.el, { y: c.pose.pile.out, duration: up, ease: easeUp }, tc + d);
			tl.call(
				function () {
					cardsTop.appendChild(c.el);
				},
				null,
				tc + d + up * 0.8
			);
			tl.to(c.el, { y: c.pose.pile.y, x: c.pose.pile.x, scale: c.pose.pile.s, duration: D.cardSettle, ease: easeDown }, tc + d + up);
		});
		// fairy dust follows the opening: a few specks from inside as the flap lifts, more as the cards rise, fading as they settle
		var lastD = cards[cards.length - 1].pose.k * step;
		tl.call(function () {
			if (state === 'opening' && dust) {
				dust.mode = 1;
				dust.setRate(17);
			}
		}, null, tf0 + 0.05);
		tl.call(function () {
			if (state === 'opening' && dust) {
				dust.mode = 2;
				dust.setRate(24);
			}
		}, null, tc);
		tl.call(function () {
			if (state === 'opening' && dust) dust.fade();
		}, null, tc + lastD + up + D.cardSettle * 0.35);
		// the envelope settles back before the first card steps out
		tl.to(liftEl, { scale: 1, y: 0, duration: 1.0, ease: 'power1.inOut' }, tf0 + D.flap * 0.35);
	}

	var tlReadySig = ''; // the screen size the waiting (not yet played) timeline was built for
	var sigNow = function () { return window.innerWidth + 'x' + window.innerHeight; };
	var openAll = function () {
		if (state !== 'idle') return;
		// the timeline was already built while the envelope was waiting, so the first tap has nothing to prepare
		if (!(tl && tlReadySig === sigNow())) buildTimeline();
		tlReadySig = '';
		if (!tl) return;
		state = 'opening';
		hintEl.classList.remove('show');
		if (audio && audio.paused) audio.play().catch(function () {});
		stage.classList.add('is-open');
		fireRing();
		fireRipple();
		startDust();
		wait(TM.peekDelay).then(function () {
			if (state !== 'idle') stage.classList.add('peek-on'); // (no strip any more)
		});
		tl.timeScale(D.openSpeed).play(0);
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
	/* ----- the cards leave the envelope as a pile and arrange themselves into the row (and back again) ----- */
	var flyersEl = $('ev-flyers');
	var flyTl = null;
	var centreOf = function (r) {
		return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
	};
	var makeFlyer = function (c, k, cx, cy, scale, rot) {
		var im = document.createElement('img');
		im.className = 'ev-fly';
		im.src = c.url;
		im.alt = '';
		im.draggable = false;
		im.style.width = cardW + 'px';
		im.style.left = cx - cardW / 2 + 'px';
		im.style.top = cy - (cardW * cardRatio) / 2 + 'px';
		im.style.zIndex = String(100 - k);
		flyersEl.appendChild(im);
		gsap.set(im, { scale: scale, rotation: rot, x: 0, y: 0, transformOrigin: '50% 50%' });
		return { el: im, cx: cx, cy: cy };
	};
	var clearFlyers = function () {
		flyersEl.innerHTML = '';
		flyersEl.style.clipPath = '';
	};
	var clipFlyers = function () {
		var r = track.getBoundingClientRect();
		flyersEl.style.clipPath = 'inset(0 ' + Math.max(0, window.innerWidth - r.right) + 'px 0 ' + Math.max(0, r.left) + 'px)';
	};
	var slotRects = function () {
		return Array.prototype.map.call(track.children, function (s) {
			var r = s.getBoundingClientRect();
			var c = centreOf(r);
			return { cx: c.cx, cy: c.cy, s: r.width / cardW };
		});
	};
	var fly = function (flyers, targets, done) {
		if (flyTl) flyTl.kill();
		flyTl = gsap.timeline({ onComplete: done });
		flyers.forEach(function (f, i) {
			var t = targets[i];
			flyTl.to(f.el, { x: t.cx - f.cx, y: t.cy - f.cy, scale: t.s, rotation: t.rot || 0, duration: D.row, ease: easeDown }, i * D.rowStagger);
		});
	};

	// open: pile > row
	function toRow() {
		if (typeof gsap === 'undefined') return;
		state = 'arranging';
		vwOpen = true;
		lockScroll(true);
		vw.style.setProperty('--vw-in', TM.viewerIn + 'ms');
		vw.style.setProperty('--vw-out', TM.viewerOut + 'ms');
		vw.classList.add('vw-hold');
		stage.classList.add('vw-on');
		vw.setAttribute('aria-hidden', 'false');
		goTo(0, false);
		markDots();
		var piles = cards.map(function (c) {
			return centreOf(c.el.getBoundingClientRect());
		});
		vw.classList.add('on');
		var slots = slotRects();
		clipFlyers();
		var flyers = cards.map(function (c, k) {
			return makeFlyer(c, k, piles[k].cx, piles[k].cy, c.pose.pile.s, c.pose.pile.rot);
		});
		cards.forEach(function (c) {
			c.el.style.visibility = 'hidden';
		});
		fly(flyers, slots, function () {
			clearFlyers();
			vw.classList.remove('vw-hold');
			state = 'open';
			closeBtn.classList.add('show');
		});
	}
	// close: row > pile
	function fromRow() {
		var slots = slotRects();
		clipFlyers();
		var flyers = cards.map(function (c, k) {
			return makeFlyer(c, k, slots[k].cx, slots[k].cy, slots[k].s, 0);
		});
		vw.classList.add('vw-hold');
		vw.classList.remove('on');
		var targets = cards.map(function (c) {
			var p = centreOf(c.el.getBoundingClientRect());
			return { cx: p.cx, cy: p.cy, s: c.pose.pile.s, rot: c.pose.pile.rot };
		});
		fly(flyers, targets, function () {
			clearFlyers();
			cards.forEach(function (c) {
				c.el.style.visibility = 'visible';
			});
			vw.classList.remove('vw-hold');
			vw.setAttribute('aria-hidden', 'true');
			stage.classList.remove('vw-on');
			vwOpen = false;
			lockScroll(false);
			closeCards();
		});
	}

	// close, part 2: the stack lifts above the envelope together, then the cards go back in one by one (first card first)
	function closeCards() {
		if (ctl) ctl.kill();
		var step = D.cardStagger;
		ctl = gsap.timeline({
			onComplete: function () {
				tl.time(tLiftEnd, true);
				tl.timeScale(D.closeSpeed).reverse();
			},
		});
		cards.forEach(function (c) {
			ctl.to(c.el, { y: c.pose.pile.out, x: 0, scale: 1, rotation: 0, duration: D.cardDown, ease: easeDown }, 0);
		});
		ctl.call(
			function () {
				cards.forEach(function (c) {
					cardsEl.appendChild(c.el);
				});
			},
			null,
			D.cardDown
		);
		cards.forEach(function (c) {
			ctl.to(c.el, { y: c.pose.lift.y, duration: D.cardDown, ease: easeDown }, D.cardDown + c.pose.k * step);
		});
	}

	var closeAll = function () {
		if (state !== 'open') return;
		stopDust();
		state = 'closing';
		closeBtn.classList.remove('show');
		closeZoom();
		fromRow();
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

	/* ----- swipe / drag helper (a finger swipes natively; the mouse drags) ----- */
	var makeDrag = function (tr, slideWidth, snapTo) {
		var st = { drag: null, was: false };
		tr.addEventListener('pointerdown', function (e) {
			if (e.pointerType !== 'mouse' || e.button !== 0) return;
			st.drag = { x: e.clientX, s: tr.scrollLeft, dx: 0, moved: false, from: Math.round(tr.scrollLeft / slideWidth()) };
			tr.style.scrollSnapType = 'none';
			tr.classList.add('grab');
		});
		window.addEventListener('pointermove', function (e) {
			if (!st.drag) return;
			var dx = e.clientX - st.drag.x;
			st.drag.dx = dx;
			if (Math.abs(dx) > 5) st.drag.moved = true;
			tr.scrollLeft = st.drag.s - dx;
		});
		window.addEventListener('pointerup', function () {
			if (!st.drag) return;
			var d = st.drag;
			st.was = d.moved;
			st.drag = null;
			tr.classList.remove('grab');
			tr.style.scrollSnapType = '';
			// a short drag is enough to move to the next or previous card
			var to = d.from + (d.dx < -40 ? 1 : d.dx > 40 ? -1 : 0);
			snapTo(to);
			setTimeout(function () {
				st.was = false;
			}, 50);
		});
		return st;
	};
	var vwDrag = makeDrag(track, slideW, function (i) {
		goTo(i, true);
	});
	track.addEventListener('click', function (e) {
		if (vwDrag.was || state !== 'open') return;
		var slide = e.target.closest('.ev-vw-slide');
		if (!slide) return;
		var idx = Array.prototype.indexOf.call(track.children, slide);
		if (idx === vwIndex) openZoom(idx);
		else goTo(idx, true);
	});

	/* ----- full-screen cards: swipe here too; the cross goes back to the row of cards ----- */
	var zoomOpen = false;
	var zIndex = 0;
	var zslideW = function () {
		return zoomTrack.clientWidth || 1;
	};
	var zGoTo = function (i, smooth) {
		i = Math.max(0, Math.min(cards.length - 1, i));
		zoomTrack.scrollTo({ left: i * zslideW(), behavior: smooth ? 'smooth' : 'auto' });
	};
	var zDrag = makeDrag(zoomTrack, zslideW, function (i) {
		zGoTo(i, true);
	});
	zoomTrack.addEventListener('scroll', function () {
		zIndex = Math.max(0, Math.min(cards.length - 1, Math.round(zoomTrack.scrollLeft / zslideW())));
	});
	function openZoom(i) {
		if (!cards[i] || state !== 'open') return;
		zoomEl.classList.add('on');
		zoomEl.setAttribute('aria-hidden', 'false');
		zoomOpen = true;
		zIndex = i;
		zGoTo(i, false);
	}
	function closeZoom() {
		if (!zoomOpen) return;
		zoomEl.classList.remove('on');
		zoomEl.setAttribute('aria-hidden', 'true');
		zoomOpen = false;
		goTo(zIndex, false); // the row of cards shows the card you were looking at
		markDots();
	}
	$('ev-zoom-x').addEventListener('click', closeZoom);
	$('ev-zprev').addEventListener('click', function () {
		zGoTo(zIndex - 1, true);
	});
	$('ev-znext').addEventListener('click', function () {
		zGoTo(zIndex + 1, true);
	});

	/* ---------- events ---------- */
	tapBtn.addEventListener('click', openAll);
	closeBtn.addEventListener('click', closeAll);
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
		if (!vwOpen || state !== 'open') return;
		if (zoomOpen) {
			if (e.key === 'ArrowLeft') zGoTo(zIndex - 1, true);
			if (e.key === 'ArrowRight') zGoTo(zIndex + 1, true);
			if (e.key === 'Escape') closeZoom();
			return;
		}
		if (e.key === 'ArrowLeft') goTo(vwIndex - 1, true);
		if (e.key === 'ArrowRight') goTo(vwIndex + 1, true);
		if (e.key === 'Escape') closeAll();
	});
	var rsz = 0;
	window.addEventListener('resize', function () {
		clearTimeout(rsz);
		rsz = setTimeout(function () {
			fitTray();
			if (!cards.length || typeof gsap === 'undefined') return;
			if (state === 'idle') buildTimeline();
			else if (state === 'open') {
				buildTimeline();
				tl.progress(1, true);
				cards.forEach(function (c) {
					cardsTop.appendChild(c.el);
					c.el.style.visibility = 'hidden';
				});
			}
		}, 150);
	});

	document.querySelectorAll('.ev-fade').forEach(function (n) {
		n.classList.add('vis');
	});

	/* ---------- footer: the hint to scroll, and the fade-in ---------- */
	(function () {
		var sc = document.getElementById('ev-scroll');
		var ft = document.getElementById('ev-foot');
		if (!ft) {
			if (sc) sc.remove();
			return;
		}
		// the top of the green footer peeks above the bottom edge, so the guest knows there is more below
		stage.style.height = 'calc(100vh - 92px)';
		stage.style.height = 'calc(100svh - 92px)';
		var onScroll = function () {
			if (sc) sc.classList.toggle('gone', (window.pageYOffset || document.documentElement.scrollTop) > 40);
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		if (sc) sc.addEventListener('click', function () {
			ft.scrollIntoView({ behavior: 'smooth', block: 'end' });
		});
		if ('IntersectionObserver' in window) {
			var io = new IntersectionObserver(function (en) {
				en.forEach(function (e) {
					if (e.isIntersecting) {
						ft.classList.add('vis');
						io.disconnect();
					}
				});
			}, { threshold: 0.25 });
			io.observe(ft);
		} else ft.classList.add('vis');
		window.__evShowScroll = function () {
			if (sc) sc.classList.add('on');
		};
	})();

	/* ---------- start ---------- */
	var imgs = [S.images.tray, S.images.closed, S.images.body, S.images.front, S.images.flap, S.images.flapBack].filter(Boolean);
	var imagesReady = Promise.all(
		imgs.map(function (s) {
			return loadOne(s).catch(function () {});
		})
	);
	// the tray and envelope rise as soon as THEIR pictures are here (not after every picture and font)
	var firstImgs = Promise.all(
		[S.images.trayPhone && !wide0() ? S.images.trayPhone : S.images.tray, S.images.closed, S.images.body].filter(Boolean).map(function (s) {
			return loadOne(s)
				.then(function (im) {
					return im && im.decode ? im.decode().catch(function () {}) : im;
				})
				.catch(function () {});
		})
	);
	// First visit: the phone is busy downloading, drawing and decoding the big cards. We do all of that BEFORE the
	// entrance starts (behind a quiet "preparing" line), so the tray, envelope and cards then move without stuttering.
	var cardsDecoded = cardsReady
		.then(function () {
			return Promise.all(
				cards.map(function (c) {
					return c.el && c.el.decode ? c.el.decode().catch(function () {}) : null;
				})
			);
		})
		.catch(function () {});
	var loadEl = document.createElement('div');
	loadEl.className = 'ev-loading';
	loadEl.textContent = 'Preparing your invitation\u2026';
	document.body.appendChild(loadEl);
	Promise.race([Promise.all([firstImgs, cardsDecoded]), wait(6000)]).then(function () {
		return wait(150);
	}).then(function () {
		loadEl.classList.add('gone');
		setTimeout(function () {
			if (loadEl.parentNode) loadEl.parentNode.removeChild(loadEl);
		}, 500);
		stage.classList.add('ev-in');
		fireConfetti(); // confetti falls as soon as the invitation opens, once
		wait((TM.hintDelay || 0) + 900).then(function () {
			if (window.__evShowScroll) window.__evShowScroll();
		});
		// once the entrance has settled, build the opening timeline now (not at the tap)
		wait((TM.hintDelay || 0) + 1200).then(function () {
			if (state === 'idle') { buildTimeline(); tlReadySig = sigNow(); }
		});
		// while the envelope waits for the first tap, rehearse the ring invisibly (twice) so nothing has to be prepared at the tap
		wait((TM.hintDelay || 0) + 1600).then(function () {
			if (state === 'idle') fireRipple(true);
		});
		wait((TM.hintDelay || 0) + 2600).then(function () {
			if (state === 'idle') fireRipple(true);
		});
		wait(TM.hintDelay).then(function () {
			hintEl.classList.add('show');
		});
	});
})();
