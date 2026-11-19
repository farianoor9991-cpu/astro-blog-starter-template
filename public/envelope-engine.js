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
		'<h1 class="ev-title ev-rise">' + esc(S.welcome.text) + '</h1>' +
		'<p class="ev-hint2" id="ev-hint2">' + esc(S.hint.openText) + '</p>' +
		'<div class="ev-tray ev-rise" style="--d:.12s"><img src="' + esc(S.images.tray) + '" alt="" draggable="false"></div>' +
		'<div class="ev-envbox ev-rise" style="--d:.24s">' +
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
		'</div>' +
		'<button class="ev-peek" id="ev-peek" type="button" aria-label="Scroll down"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
		'</div>' +
		'<div class="ev-footwrap" id="ev-footwrap"><section class="ev-foot">' +
		'<h2 class="ev-foot-h ev-fade">' + esc(S.footer.heading) + '</h2>' +
		'<p class="ev-foot-m ev-fade">' + esc(S.footer.message) + '</p>' +
		'<div class="ev-brandbox ev-fade"><span class="ev-by">' + esc(S.footer.createdBy) + '</span><span class="ev-brand">' + esc(S.footer.brandStart) + '<span>' + esc(S.footer.brandEnd) + '</span></span></div>' +
		'<div><button class="ev-back ev-fade" id="ev-back" type="button">' + esc(S.buttons.goBackLabel) + '</button></div>' +
		'</section></div>' +
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

	/* ----- the opening / closing animation (GSAP): one timeline, played forward to open, backwards to close ----- */
	var D = S.anim;
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
		return { rest: rest, lift: lift, pile: pile, kk: kk };
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
		tLiftEnd = tLift + 0.55;
		cards.forEach(function (c) {
			tl.to(c.el, { y: c.pose.lift.y, duration: 0.55, ease: 'power2.out' }, tLift);
		});
		// 5. then the first card steps out and stops in front; the others follow one by one and line up behind it
		var step = D.cardStagger;
		var tc = tf0 + D.flap + 0.1;
		var up = D.cards * 0.55;
		cards.forEach(function (c) {
			var d = c.pose.kk * step;
			tl.to(c.el, { y: c.pose.pile.out, duration: up, ease: 'power2.out' }, tc + d);
			tl.call(
				function () {
					cardsTop.appendChild(c.el);
				},
				null,
				tc + d + up
			);
			tl.to(c.el, { y: c.pose.pile.y, x: c.pose.pile.x, scale: c.pose.pile.s, duration: D.cards * 0.75, ease: 'power2.inOut' }, tc + d + up);
		});
		// the envelope settles back before the first card steps out
		tl.to(liftEl, { scale: 1, y: 0, duration: 1.0, ease: 'power1.inOut' }, tf0 + D.flap * 0.35);
	}

	var openAll = function () {
		if (state !== 'idle') return;
		buildTimeline();
		if (!tl) return;
		state = 'opening';
		hintEl.classList.remove('show');
		if (audio && audio.paused) audio.play().catch(function () {});
		stage.classList.add('is-open');
		fireRing();
		wait(TM.peekDelay).then(function () {
			if (state !== 'idle') stage.classList.add('peek-on');
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
			flyTl.to(f.el, { x: t.cx - f.cx, y: t.cy - f.cy, scale: t.s, rotation: t.rot || 0, duration: D.row, ease: 'power3.inOut' }, i * D.rowStagger);
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
			ctl.to(c.el, { y: c.pose.pile.out, x: 0, scale: 1, rotation: 0, duration: 0.8, ease: 'power2.inOut' }, 0);
		});
		ctl.call(
			function () {
				cards.forEach(function (c) {
					cardsEl.appendChild(c.el);
				});
			},
			null,
			0.8
		);
		cards.forEach(function (c) {
			ctl.to(c.el, { y: c.pose.lift.y, duration: 0.85, ease: 'power2.inOut' }, 0.8 + c.pose.kk * step);
		});
	}

	var closeAll = function () {
		if (state !== 'open') return;
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
	var imgs = [S.images.tray, S.images.closed, S.images.body, S.images.front, S.images.flap, S.images.flapBack];
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
