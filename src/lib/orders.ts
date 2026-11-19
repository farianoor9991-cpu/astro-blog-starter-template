// Shared helpers for orders. Orders are kept in Cloudflare KV (binding name: ORDERS).

export const MAX_GUESTS = 500;
export const STANDARD_EVENTS = ['nikkah', 'dholki', 'qawaali', 'mehndi', 'baraat', 'walima'];
const MAX_EVENTS = 20;
const MAX_HOSTS = 6;
const MAX_LINKS = 10;

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

export const cleanLinks = (input: any, events: any[]) => {
	const valid = new Set(events.map((e) => e.id));
	const used = new Set<string>();
	let list = (Array.isArray(input) ? input : []).slice(0, MAX_LINKS).map((l: any, i: number) => {
		let id = /^[a-z0-9]{1,20}$/.test(String(l?.id)) ? String(l.id) : rid(5);
		while (used.has(id)) id = rid(5);
		used.add(id);
		return {
			id,
			label: str(l?.label, 40) || 'Link ' + (i + 1),
			cards: (Array.isArray(l?.cards) ? l.cards : []).map((c: any) => str(c, 40)).filter((c: string) => valid.has(c)),
		};
	});
	if (list.length <= 1) {
		const only = list[0] || { id: 'all', label: 'All events' };
		list = [{ id: only.id, label: only.label || 'All events', cards: events.map((e) => e.id) }];
	}
	return list;
};

export const cleanGuests = (input: any, links: any[], existing?: any[]) => {
	const ok = new Set(links.map((l) => l.id));
	const seen = new Set<string>();
	return (Array.isArray(input) ? input : []).slice(0, MAX_GUESTS).map((g: any) => {
		const prev = g?.id ? existing?.find((x: any) => x.id === g.id) : null;
		let id = prev ? prev.id : rid(6);
		while (seen.has(id)) id = rid(6);
		seen.add(id);
		const linkId = ok.has(g?.linkId) ? g.linkId : links[0]?.id;
		return { id, name: str(g?.name, 45), linkId };
	}).filter((g: any) => g.name);
};

export const eventsForLink = (order: any, linkId?: string) => {
	if (order.mode !== 'many') return order.events;
	const link = order.links.find((l: any) => l.id === linkId) || order.links[0];
	if (!link) return order.events;
	return order.events.filter((e: any) => link.cards.indexOf(e.id) >= 0);
};

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
