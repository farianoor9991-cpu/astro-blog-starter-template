// Shared helpers for orders. Orders are kept in Cloudflare KV (binding name: ORDERS).

export const MAX_GUESTS = 500;
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
	const events = (Array.isArray(input?.events) ? input.events : []).slice(0, MAX_EVENTS).map((e: any) => {
		const prev = existing?.events?.find((x: any) => x.id === e?.id);
		const out: any = {
			id: str(e?.id, 40),
			date: /^\d{4}-\d{2}-\d{2}$/.test(String(e?.date)) ? String(e.date) : '',
			time: /^\d{2}:\d{2}$/.test(String(e?.time)) ? String(e.time) : '',
			venue: str(e?.venue, 140),
		};
		const custom = prev ? prev.custom : e?.custom;
		if (custom) {
			out.custom = true;
			out.label = prev ? prev.label : str(e?.label, 24);
			out.title = prev ? prev.title : str(e?.title || e?.label, 24);
		}
		return out;
	}).filter((e: any) => e.id);
	const hosts = (Array.isArray(input?.hosts) ? input.hosts : [])
		.slice(0, MAX_HOSTS)
		.map((h: any) => ({ name: str(h?.name, 60), phone: str(h?.phone, 25) }))
		.filter((h: any) => h.name);
	return { couple, events, hosts };
};

export const cleanLinks = (input: any, existing?: any[]) => {
	const list = (Array.isArray(input) ? input : []).slice(0, MAX_LINKS).map((l: any, i: number) => {
		const prev = existing?.find((x: any) => x.id === l?.id);
		return {
			id: prev ? prev.id : str(l?.id, 20) || rid(5),
			label: str(l?.label, 40) || 'Link ' + (i + 1),
			cards: prev ? prev.cards : (Array.isArray(l?.cards) ? l.cards : []).map((c: any) => str(c, 40)).filter(Boolean),
		};
	});
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
		return { id, name: str(g?.name, 60), linkId };
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
