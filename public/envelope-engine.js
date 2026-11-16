/* InviteHeaven envelope invitation engine.
   Reads the settings and invitation details from <script id="env-config" type="application/json">,
   draws the guest's cards, and runs the welcome > open > cards > close > footer experience.
   You normally never edit this file. Change looks and timings in src/data/haya-envelope.ts. */
(function () {
	'use strict';

	var cfg = JSON.parse(document.getElementById('env-config').textContent);
	var S = cfg.design;
	var T = cfg.template;
	var INV = cfg.invitation;
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

	/* ---------- page settings as CSS variables ---------- */
	document.body.style.background = S.sideBackground;
	var rs = root.style;
	rs.setProperty('--ev-bg', S.background);
	rs.setProperty('--ev-side', S.sideBackground);
	rs.setProperty('--ev-max', S.stageMaxWidth + 'px');
	rs.setProperty('--ev-title-font', "'" + S.welcome.font + "', serif");
	rs.setProperty('--ev-title-color', S.welcome.color);
	rs.setProperty('--ev-title-size', S.welcome.size);
	rs.setProperty('--ev-hint-font', "'" + S.hint.font + "', serif");
	rs.setProperty('--ev-hint-color', S.hint.color);
	rs.setProperty('--ev-hint-size', S.hint.size);
	rs.setProperty('--ev-hf', "'" + S.footer.headingFont + "', serif");
	rs.setProperty('--ev-hc', S.footer.headingColor);
	rs.setProperty('--ev-mf', "'" + S.footer.messageFont + "', serif");
	rs.setProperty('--ev-mc', S.footer.messageColor);
	rs.setProperty('--ev-btn-font', "'" + S.buttons.font + "', serif");
	rs.setProperty('--ev-btn-bg', S.buttons.background);
	rs.setProperty('--ev-btn-text', S.buttons.text);
	rs.setProperty('--ev-link', S.buttons.linkColor);
	rs.setProperty('--ev-tray-w', S.layout.trayWidth + '%');
	rs.setProperty('--ev-tray-b', S.layout.trayBottom + '%');
	rs.setProperty('--ev-env-w', S.layout.envelopeWidth + '%');
	rs.setProperty('--ev-env-lift', String(S.layout.envelopeLift));
	rs.setProperty('--ev-enter', S.timing.entrance + 'ms');
	rs.setProperty('--ev-swap', S.timing.envelopeSwap + 'ms');

	/* ---------- markup ---------- */
	root.innerHTML =
		'<div class="ev-stage" id="ev-stage">' +
		'<h1 class="ev-title ev-rise">' + esc(S.welcome.text) + '</h1>' +
		'<div class="ev-tray ev-rise" style="--d:.12s"><img src="' + esc(S.images.tray) + '" alt="" draggable="false"></div>' +
		'<div class="ev-envbox ev-rise" style="--d:.24s">' +
		'<div class="ev-env" id="ev-env">' +
		'<img class="ev-img ev-closed" src="' + esc(S.images.envelopeClosed) + '" alt="" draggable="false">' +
		'<img class="ev-img ev-open" src="' + esc(S.images.envelopeOpen) + '" alt="" draggable="false">' +
		'<div class="ev-cards" id="ev-cards"></div>' +
		'<img class="ev-img ev-front" src="' + esc(S.images.envelopeFront) + '" alt="" draggable="false">' +
		'<button class="ev-tap" id="ev-tap" type="button" aria-label="Open the invitation"></button>' +
		'</div></div>' +
		'<p class="ev-hint" id="ev-hint">' + esc(S.hint.text) + '</p>' +
		'<button class="ev-down" id="ev-down" type="button" aria-label="Scroll down"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>' +
		'<button class="ev-music" id="ev-music" type="button" aria-label="Music on or off" hidden></button>' +
		'</div>' +
		'<section class="ev-foot" id="ev-foot">' +
		'<h2 class="ev-foot-h ev-fade">' + esc(S.footer.heading) + '</h2>' +
		'<p class="ev-foot-m ev-fade">' + esc(S.footer.message) + '</p>' +
		'<p class="ev-brand ev-fade">' + esc(S.footer.brandStart) + '<span>' + esc(S.footer.brandEnd) + '</span></p>' +
		'<button class="ev-back ev-fade" id="ev-back" type="button">' + esc(S.buttons.goBackLabel) + '</button>' +
		'</section>' +
		'<div class="ev-lb" id="ev-lb" aria-hidden="true">' +
		'<div class="ev-lb-top"><span id="ev-lb-count"></span></div>' +
		'<div class="ev-lb-body"><img id="ev-lb-img" alt="" draggable="false"></div>' +
		'<p class="ev-lb-label" id="ev-lb-label"></p>' +
		'<button class="ev-arrow ev-prev" id="ev-prev" type="button" aria-label="Previous card">&#8249;</button>' +
		'<button class="ev-arrow ev-next" id="ev-next" type="button" aria-label="Next card">&#8250;</button>' +
		'</div>' +
		'<button class="ev-close" id="ev-close" type="button">' + esc(S.buttons.closeLabel) + '</button>';

	var stage = document.getElementById('ev-stage');
	var envEl = document.getElementById('ev-env');
	var cardsEl = document.getElementById('ev-cards');
	var tapBtn = document.getElementById('ev-tap');
	var hintEl = document.getElementById('ev-hint');
	var closeBtn = document.getElementById('ev-close');
	var downBtn = document.getElementById('ev-down');
	var backBtn = document.getElementById('ev-back');
	var lb = document.getElementById('ev-lb');
	var lbImg = document.getElementById('ev-lb-img');
	var lbLabel = document.getElementById('ev-lb-label');
	var lbCount = document.getElementById('ev-lb-count');

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

	// the guest's cards, in date order, with the hosts card last
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

	var cards = []; // { id, label, url, el }
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
			});
		});
	});

	/* ---------- card fan ---------- */
	var stageW = function () {
		return stage.getBoundingClientRect().width;
	};
	var envW = function () {
		return envEl.getBoundingClientRect().width;
	};
	// where each card rests when it is out of the envelope
	var fanTransform = function (i, n) {
		var sw = stageW();
		var ew = envW();
		var cardW = (S.layout.cardWidth / 100) * sw;
		var cardH = (cardW * 16) / 9;
		var envH = ew * S.layout.envelopeRatio;
		var off = i - (n - 1) / 2;
		var step = Math.min(S.layout.fanStep, (100 - S.layout.cardWidth - 4) / Math.max(1, n - 1));
		var dx = (off * step * sw) / 100;
		var rot = off * (n <= 2 ? S.layout.fanTiltFew : S.layout.fanTilt);
		var restTop = S.layout.cardRestTop * envH;
		var bottomAt = S.layout.cardBottomAt * envH;
		var dy = bottomAt - cardH - restTop - off * off * 0.004 * sw;
		return 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), ' + dy.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';
	};
	var restTransform = 'translate(-50%, 0px) rotate(0deg) scale(.9)';

	var placeCards = function (out) {
		var n = cards.length;
		cards.forEach(function (c, i) {
			c.el.style.transform = out ? fanTransform(i, n) : restTransform;
			var off = Math.abs(i - (n - 1) / 2);
			c.el.style.zIndex = String(100 - Math.round(off * 10));
		});
	};
	var sizeCards = function () {
		var pct = (S.layout.cardWidth / S.layout.envelopeWidth) * 100;
		cardsEl.style.setProperty('--ev-card-w', pct + '%');
		cardsEl.style.setProperty('--ev-card-x', S.layout.cardCenterX + '%');
		cardsEl.style.setProperty('--ev-card-y', S.layout.cardRestTop * 100 + '%');
	};

	/* ---------- the experience ---------- */
	var state = 'idle'; // idle > opening > open > closing
	var audio = null;
	var musicBtn = document.getElementById('ev-music');
	var setScrollLock = function (on) {
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
			if (audio.paused) {
				audio.play().catch(function () {});
			} else audio.pause();
		});
		audio.addEventListener('play', function () {
			musicBtn.innerHTML = musicIcon(true);
		});
		audio.addEventListener('pause', function () {
			musicBtn.innerHTML = musicIcon(false);
		});
	}

	var openAll = function () {
		if (state !== 'idle') return;
		state = 'opening';
		hintEl.classList.remove('show');
		if (audio && audio.paused) audio.play().catch(function () {});
		cardsReady.then(function () {
			stage.classList.add('is-open');
			var tm = S.timing;
			wait(tm.titleFadeDelay).then(function () {
				stage.classList.add('title-out');
			});
			wait(tm.cardsDelay).then(function () {
				placeCards(false);
				cards.forEach(function (c) {
					c.el.style.transition = 'none';
				});
				void cardsEl.offsetWidth;
				cards.forEach(function (c, i) {
					c.el.style.transition = 'transform ' + tm.cardRise + 'ms cubic-bezier(.2,.8,.2,1) ' + i * tm.cardStagger + 'ms, opacity 300ms ease ' + i * tm.cardStagger + 'ms';
					c.el.style.opacity = '1';
				});
				placeCards(true);
				closeBtn.classList.add('show');
				wait(tm.cardRise + cards.length * tm.cardStagger).then(function () {
					state = 'open';
				});
			});
		});
	};

	var lbIndex = 0;
	var showLb = function (i, dir) {
		var n = cards.length;
		lbIndex = (i + n) % n;
		var apply = function () {
			lbImg.src = cards[lbIndex].url;
			lbLabel.textContent = cards[lbIndex].label;
			lbCount.textContent = lbIndex + 1 + ' / ' + n;
		};
		if (dir && lb.classList.contains('on')) {
			lbImg.style.transition = 'transform .16s ease, opacity .16s ease';
			lbImg.style.transform = 'translateX(' + -dir * 40 + 'px)';
			lbImg.style.opacity = '0';
			setTimeout(function () {
				apply();
				lbImg.style.transition = 'none';
				lbImg.style.transform = 'translateX(' + dir * 40 + 'px)';
				void lbImg.offsetWidth;
				lbImg.style.transition = 'transform .2s ease, opacity .2s ease';
				lbImg.style.transform = 'translateX(0)';
				lbImg.style.opacity = '1';
			}, 160);
		} else {
			apply();
			lbImg.style.transition = 'none';
			lbImg.style.transform = 'none';
			lbImg.style.opacity = '1';
		}
		lb.classList.add('on');
		lb.setAttribute('aria-hidden', 'false');
	};
	var hideLb = function () {
		lb.classList.remove('on');
		lb.setAttribute('aria-hidden', 'true');
	};

	var closeAll = function () {
		if (state !== 'open') return;
		state = 'closing';
		var tm = S.timing;
		hideLb();
		closeBtn.classList.remove('show');
		var n = cards.length;
		wait(tm.lightboxFade).then(function () {
			cards.forEach(function (c, i) {
				var d = (n - 1 - i) * tm.closeStagger;
				c.el.style.transition = 'transform ' + tm.cardReturn + 'ms cubic-bezier(.5,0,.3,1) ' + d + 'ms, opacity 200ms ease ' + (d + tm.cardReturn - 120) + 'ms';
				c.el.style.transform = restTransform;
				c.el.style.opacity = '0';
			});
			return wait(tm.cardReturn + n * tm.closeStagger + 80);
		}).then(function () {
			stage.classList.remove('is-open');
			stage.classList.remove('title-out');
			return wait(tm.envelopeSwap + 120);
		}).then(function () {
			setScrollLock(false);
			stage.classList.add('was-opened');
			hintEl.classList.add('show');
			state = 'idle';
		});
	};

	var goBack = function () {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		var replay = function () {
			stage.classList.add('ev-reset');
			stage.classList.remove('ev-in', 'was-opened');
			hintEl.classList.remove('show');
			void stage.offsetWidth;
			stage.classList.remove('ev-reset');
			void stage.offsetWidth;
			stage.classList.add('ev-in');
			wait(S.timing.hintDelay).then(function () {
				hintEl.classList.add('show');
			});
		};
		wait(650).then(replay);
	};

	/* ---------- events ---------- */
	tapBtn.addEventListener('click', function () {
		setScrollLock(true);
		openAll();
	});
	cardsEl.addEventListener('click', function (e) {
		if (state !== 'open') return;
		var t = e.target.closest('.ev-card');
		if (t) showLb(Number(t.dataset.i), 0);
	});
	closeBtn.addEventListener('click', closeAll);
	backBtn.addEventListener('click', goBack);
	downBtn.addEventListener('click', function () {
		document.getElementById('ev-foot').scrollIntoView({ behavior: 'smooth' });
	});
	document.getElementById('ev-prev').addEventListener('click', function () {
		showLb(lbIndex - 1, -1);
	});
	document.getElementById('ev-next').addEventListener('click', function () {
		showLb(lbIndex + 1, 1);
	});
	var sx = 0;
	var sy = 0;
	var lbBody = lb.querySelector('.ev-lb-body');
	lbBody.addEventListener('pointerdown', function (e) {
		sx = e.clientX;
		sy = e.clientY;
	});
	lbBody.addEventListener('pointerup', function (e) {
		var dx = e.clientX - sx;
		if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - sy)) showLb(lbIndex + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
	});
	lb.addEventListener('click', function (e) {
		if (e.target === lb || e.target === lbBody) {
			/* tapping the dark area does nothing: only the Close button closes everything */
		}
	});
	document.addEventListener('keydown', function (e) {
		if (!lb.classList.contains('on')) return;
		if (e.key === 'ArrowLeft') showLb(lbIndex - 1, -1);
		if (e.key === 'ArrowRight') showLb(lbIndex + 1, 1);
		if (e.key === 'Escape') closeAll();
	});
	window.addEventListener('resize', function () {
		if (state === 'open') placeCards(true);
	});

	// footer fades in as it scrolls into view
	if ('IntersectionObserver' in window) {
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
	sizeCards();
	var imgs = [S.images.tray, S.images.envelopeClosed, S.images.envelopeOpen, S.images.envelopeFront];
	var imagesReady = Promise.all(
		imgs.map(function (s) {
			return loadOne(s).catch(function () {});
		})
	);
	Promise.race([Promise.all([imagesReady, fontsReady]), wait(3500)]).then(function () {
		stage.classList.add('ev-in');
		wait(S.timing.hintDelay).then(function () {
			hintEl.classList.add('show');
		});
	});
})();
