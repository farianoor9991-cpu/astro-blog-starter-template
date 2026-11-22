import type { APIRoute } from 'astro';
import { hayaEnvelope } from '../../data/haya-envelope';
import { eventsForLink, expiresAt, guestSlugOf, json } from '../../lib/orders';

export const prerender = false;

// What a guest's invitation page needs (never includes the private order token or PIN).
// New links:   ?c=<couple slug>&g=<guest slug>   or   ?c=<couple slug>&l=<group slug>   or just ?c=<couple slug>
// Older links: ?p=<id>&g=<guest id>  /  ?p=<id>&l=<group id>   (still work)
// Cost: ONE KV read (the whole order is one key), and the answer is cached for a minute at the edge.
const build = async (kv: any, q: URLSearchParams): Promise<Response> => {
	const c = (q.get('c') || '').toLowerCase();
	const p = q.get('p') || '';
	let raw: string | null = null;
	const useSlug = /^[a-z0-9-]{3,90}$/.test(c);
	if (useSlug) {
		raw = await kv.get('o:' + c, { cacheTtl: 60 });
	} else if (/^[a-z0-9]{10}$/.test(p)) {
		const slug = await kv.get('t:' + p, { cacheTtl: 60 });
		if (slug) raw = await kv.get('o:' + slug, { cacheTtl: 60 });
		else {
			const token = await kv.get('pid:' + p, { cacheTtl: 60 });
			if (token) raw = await kv.get('order:' + token, { cacheTtl: 60 });
		}
	}
	if (!raw) return json({ error: 'Not found' }, 404);
	const o = JSON.parse(raw);
	// Links are live for 3 months from the day the order was created
	if (Date.now() > expiresAt(o.createdAt)) return json({ error: 'expired' }, 410);
	const g = q.get('g');
	const l = q.get('l') || undefined;
	let guest = null as any;
	let linkId = l;
	if (l && useSlug && !(o.links || []).some((x: any) => x.id === l)) {
		const bySlug = (o.links || []).find((x: any) => x.slug === l.toLowerCase());
		if (!bySlug) return json({ error: 'Not found' }, 404);
		linkId = bySlug.id;
	}
	if (g) {
		guest = useSlug ? o.guests.find((x: any) => (x.slug || guestSlugOf(x.name)) === g.toLowerCase()) : o.guests.find((x: any) => x.id === g);
		if (!guest) return json({ error: 'Not found' }, 404);
	}
	const events = eventsForLink(o, guest ? guest.linkId : linkId);
	return json({
		couple: o.couple,
		events: events.map((e: any) => {
			const out: any = { id: e.id, date: e.date, time: e.time, venue: e.venue };
			if (e.custom) Object.assign(out, { custom: true, label: e.label, title: e.title });
			return out;
		}),
		hosts: o.hosts,
		guest: guest ? guest.name : '',
		seats: guest && guest.seats ? guest.seats : 0,
		footer: o.footer || { mode: 'couple', family: '' },
		musicSrc: o.music === 'none' ? 'none' : (((hayaEnvelope as any).musicLibrary || []).find((m: any) => m.id === o.music) || {}).src || '',
	});
};

export const GET: APIRoute = async ({ url, locals }) => {
	const rt = (locals as any)?.runtime;
	const kv = rt?.env?.ORDERS;
	if (!kv) return json({ error: 'Storage is not connected yet.' }, 503);
	// Popular links: answer from the edge cache for 60 seconds, so KV is not read at all
	let cache: any = null;
	try {
		cache = typeof caches !== 'undefined' ? (caches as any).default : null;
	} catch (e) {}
	const key = new Request(url.origin + '/api/invite?' + url.searchParams.toString());
	if (cache) {
		try {
			const hit = await cache.match(key);
			if (hit) return hit;
		} catch (e) {}
	}
	const res = await build(kv, url.searchParams);
	const out = new Response(res.body, res);
	out.headers.set('cache-control', res.status === 200 || res.status === 410 ? 'public, max-age=60, s-maxage=60' : 'no-store');
	if (cache && (res.status === 200 || res.status === 410)) {
		try {
			const put = cache.put(key, out.clone());
			if (rt?.ctx?.waitUntil) rt.ctx.waitUntil(put);
		} catch (e) {}
	}
	return out;
};
