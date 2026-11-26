// Shared helpers for orders. Orders are kept in Cloudflare KV (binding name: ORDERS).

export const MAX_GUESTS = 500;
export const STANDARD_EVENTS = ['nikkah', 'mehndi', 'qawaali', 'baraat', 'walima', 'dholki', 'mayun', 'rukhsati', 'shalima', 'shendi', 'bridalshower', 'engagement', 'baatpakki'];
const MAX_EVENTS = 20;
const MAX_HOSTS = 6;
const MAX_LINKS = 120;

export const DEFAULT_TEMPLATE =
	'Assalam-o-Alaikum {name},\n\n{couple} warmly invite you to their celebration. We have prepared a personal invitation for you. Please tap the link below to open it:\n\n{link}\n\nWe would be honoured to have you with us.';

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const rid = (n: number): string => {
	const b = new Uint8Array(n);
	crypto.getRandomValues(b);
	return Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join('');
};

const str = (v: unknown, max: number): string => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const clean = (input: any, existing?: any) => {
	const couple = {
		brideName: str(input?.couple?.brideName, 60),
		brideParents: str(input?.couple?.brideParents, 80),
		groomName: str(input?.couple?.groomName, 60),
		groomParents: str(input?.couple?.groomParents, 80),
	};
	const seenEv = new Set<string>();
	const events = (Array.isArray(input?.events) ? input.events : []).slice(0, MAX_EVENTS).map((e: any) => {
		const prev = existing?.events?.find((x: any) => x.id === e?.id);
		const id = str(e?.id, 40);
		const out: any = {
			id,
			date: /^\d{4}-\d{2}-\d{2}$/.test(String(e?.date)) ? String(e.date) : '',
			time: /^\d{2}:\d{2}$/.test(String(e?.time)) ? String(e.time) : '',
			venue: str(e?.venue, 140),
		};
		const isCustom = prev ? !!prev.custom : !!e?.custom;
		if (isCustom) {
			const label = str(e?.label || e?.title, 24) || (prev ? prev.label : '');
			if (!label) return null;
			out.custom = true;
			out.label = label;
			out.title = label;
		} else if (STANDARD_EVENTS.indexOf(id) < 0) return null;
		return out;
	}).filter((e: any) => {
		if (!e || !e.id || seenEv.has(e.id)) return false;
		seenEv.add(e.id);
		return true;
	});
	const hosts = (Array.isArray(input?.hosts) ? input.hosts : [])
		.slice(0, MAX_HOSTS)
		.map((h: any) => ({ name: str(h?.name, 60), phone: str(h?.phone, 25) }))
		.filter((h: any) => h.name);
	return { couple, events, hosts };
};

// ---------- readable link parts ----------
// "Shaheer Aslam & Family" -> "shaheer-aslam-&-family" (the & stays, as in the shared link)
export const guestSlugOf = (name: string): string =>
	String(name || '')
		.toLowerCase()
		.replace(/[^a-z0-9&\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-{2,}/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60) || 'guest';
export const plainSlugOf = (name: string): string =>
	String(name || '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 40);
export const coupleSlugOf = (couple: any): string => {
	const f = (n: string) => plainSlugOf(String(n || '').trim().split(/\s+/)[0]);
	// groom first, then bride
	return (f(couple?.groomName) || 'groom') + '-weds-' + (f(couple?.brideName) || 'bride');
};
const uniqueSlug = (base: string, used: Set<string>): string => {
	let s = base;
	for (let i = 2; used.has(s); i++) s = base + '-' + i;
	used.add(s);
	return s;
};
export const BRAND = 'inviteheaven';

export const cleanLinks = (input: any, events: any[], existing?: any[]) => {
	const valid = new Set(events.map((e) => e.id));
	const allIds = events.map((e) => e.id);
	const used = new Set<string>();
	const raw = (Array.isArray(input) ? input : []).slice(0, MAX_LINKS);
	// the main link ("Everyone", all cards) always exists and always shows every card
	const given = raw.find((l: any) => l?.id === 'all') || (raw.length === 1 ? raw[0] : null);
	const mainId = given ? String(given.id).slice(0, 20) || 'all' : 'all';
	const main: any = { id: mainId, label: 'Everyone', cards: allIds, main: true };
	used.add(mainId);
	const groups = raw
		.filter((l: any) => l && l.id !== mainId)
		.map((l: any, i: number) => {
			let id = /^[a-z0-9]{1,20}$/.test(String(l?.id)) ? String(l.id) : rid(5);
			while (used.has(id)) id = rid(5);
			used.add(id);
			return {
				id,
				label: str(l?.label, 120) || 'Combo ' + (i + 2),
				cards: (Array.isArray(l?.cards) ? l.cards : []).map((c: any) => str(c, 40)).filter((c: string) => valid.has(c)),
			};
		});
	const list: any[] = [main, ...groups];
	// every group gets a short readable name for its link; it stays the same even if the group is renamed later
	const usedS = new Set<string>();
	const kept = new Map<string, string>();
	(existing || []).forEach((x: any) => x?.slug && kept.set(x.id, x.slug));
	list.forEach((l: any) => {
		const k = kept.get(l.id);
		if (k && !usedS.has(k)) usedS.add(k), (l.slug = k);
	});
	list.forEach((l: any) => {
		if (!l.slug) l.slug = uniqueSlug(plainSlugOf(l.label) || 'group', usedS);
	});
	return list;
};

export const cleanGuests = (input: any, links: any[], existing?: any[]) => {
	const ok = new Set(links.map((l) => l.id));
	const seen = new Set<string>();
	const usedS = new Set<string>();
	const kept = new Map<string, string>();
	(existing || []).forEach((x: any) => x?.slug && kept.set(x.id, x.slug));
	// names that already have a link keep their slug first, so nobody's shared link changes
	(Array.isArray(input) ? input : []).forEach((g: any) => {
		const k = g?.id ? kept.get(g.id) : '';
		if (k) usedS.add(k);
	});
	return (Array.isArray(input) ? input : []).slice(0, MAX_GUESTS).map((g: any) => {
		const prev = g?.id ? existing?.find((x: any) => x.id === g.id) : null;
		let id = prev ? prev.id : rid(6);
		while (seen.has(id)) id = rid(6);
		seen.add(id);
		const linkId = ok.has(g?.linkId) ? g.linkId : links[0]?.id;
		const name = str(g?.name, 45);
		const slug = prev && kept.get(prev.id) ? kept.get(prev.id) : name ? uniqueSlug(guestSlugOf(name), usedS) : '';
		const phone = String(g?.phone ?? prev?.phone ?? '').replace(/[^0-9+]/g, '').slice(0, 16);
		// seats: 0 = the full family is invited (nothing is written on the invitation); 1 or more = that many seats are reserved
		const rawSeats = g?.seats !== undefined ? g.seats : prev?.seats;
		const sn = Math.floor(Number(rawSeats));
		const seats = sn >= 1 && sn <= 50 ? sn : 0;
		// seatMap: event id -> 0 (full family) or 1..50 seats, one entry per event of the guest's group
		const rawMap = g?.seatMap !== undefined ? g.seatMap : prev?.seatMap;
		const seatMap: Record<string, number> = {};
		if (rawMap && typeof rawMap === 'object') {
			Object.keys(rawMap).slice(0, 30).forEach((k) => {
				if (!/^[a-z0-9_-]{1,40}$/i.test(k)) return;
				const v = Math.floor(Number(rawMap[k]));
				seatMap[k] = v >= 1 && v <= 50 ? v : 0;
			});
		}
		// a message the customer rewrote for this one guest ('' = the standard message is used)
		const msg = String(g?.msg !== undefined ? g.msg : prev?.msg ?? '').replace(/\r/g, '').slice(0, 1500);
		return { id, name, linkId, slug, phone, seats, seatMap, ...(msg.trim() ? { msg } : {}) };
	}).filter((g: any) => g.name);
};

export const eventsForLink = (order: any, linkId?: string) => {
	if (order.mode !== 'many') return order.events;
	const link = order.links.find((l: any) => l.id === linkId) || order.links[0];
	if (!link) return order.events;
	return order.events.filter((e: any) => link.cards.indexOf(e.id) >= 0);
};

// ---------- storage (Cloudflare KV): as few reads and writes as possible ----------
//   o:<couple-slug>  the whole order (one key, so a guest opening a link costs ONE read)
//   t:<token start>  -> couple slug (so the private order link finds its order)
//   no:<n>, counter  order numbers
// Everything expires by itself 6 months after the order was made (no cleanup jobs, no deletes, no lists).
// Orders made by earlier versions (order:<token>, pid:<pid>) still open, and are saved back where they are.
export const expiryOpts = (createdAt: string) => {
	const d = new Date(createdAt);
	d.setUTCMonth(d.getUTCMonth() + 6);
	return { expiration: Math.max(Math.floor(d.getTime() / 1000), Math.floor(Date.now() / 1000) + 3600) };
};
export type Loaded = { o: any; key: string; legacy: boolean };
export const loadByToken = async (kv: any, t: string): Promise<Loaded | null> => {
	const slug = await kv.get('t:' + t.slice(0, 10));
	if (slug) {
		const raw = await kv.get('o:' + slug);
		if (!raw) return null;
		const o = JSON.parse(raw);
		return o.token === t ? { o, key: 'o:' + slug, legacy: false } : null;
	}
	const raw = await kv.get('order:' + t);
	return raw ? { o: JSON.parse(raw), key: 'order:' + t, legacy: true } : null;
};
export const saveOrder = (kv: any, L: Loaded) => kv.put(L.key, JSON.stringify(L.o), expiryOpts(L.o.createdAt));

export const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
	});

// Invitation links stop working 3 months after the order was created
export const expiresAt = (createdAt: string): number => {
	const d = new Date(createdAt);
	d.setUTCMonth(d.getUTCMonth() + 3);
	return d.getTime();
};


// The footer of the invitation page: whose names it shows
export const cleanFooter = (input: any, prev?: any) => {
	const src = input && typeof input === 'object' ? input : prev || {};
	const mode = ['couple', 'family', 'none'].includes(src.mode) ? src.mode : 'couple';
	const family = String(src.family ?? '').replace(/[<>]/g, '').trim().slice(0, 40);
	return { mode, family };
};

// Seats of one guest, event by event (only the events of the guest's own group).
// An event without its own entry uses the older single "seats" number. 0 = the full family.
export const seatRowsOf = (guest: any, events: any[]) =>
	(events || []).map((e: any) => {
		const m = guest && guest.seatMap && guest.seatMap[e.id] !== undefined ? guest.seatMap[e.id] : guest && guest.seats ? guest.seats : 0;
		return { id: e.id, n: Math.floor(Number(m)) || 0 };
	});
