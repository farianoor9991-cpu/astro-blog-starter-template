import type { APIRoute } from 'astro';
import { eventsForLink, expiresAt, json } from '../../lib/orders';

export const prerender = false;

// What a guest's invitation page needs (never includes the private order token)
export const GET: APIRoute = async ({ url, locals }) => {
	const kv = (locals as any)?.runtime?.env?.ORDERS;
	if (!kv) return json({ error: 'Storage is not connected yet.' }, 503);
	const p = url.searchParams.get('p') || '';
	if (!/^[a-z0-9]{10}$/.test(p)) return json({ error: 'Not found' }, 404);
	const token = await kv.get('pid:' + p);
	if (!token) return json({ error: 'Not found' }, 404);
	const raw = await kv.get('order:' + token);
	if (!raw) return json({ error: 'Not found' }, 404);
	const o = JSON.parse(raw);
	// Links are live for 3 months from the day the order was created
	if (Date.now() > expiresAt(o.createdAt)) return json({ error: 'expired' }, 410);
	const gid = url.searchParams.get('g');
	const lid = url.searchParams.get('l') || undefined;
	let guest = null as any;
	if (gid) {
		guest = o.guests.find((g: any) => g.id === gid);
		if (!guest) return json({ error: 'Not found' }, 404);
	}
	const events = eventsForLink(o, guest ? guest.linkId : lid);
	return json({
		couple: o.couple,
		events: events.map((e: any) => {
			const out: any = { id: e.id, date: e.date, time: e.time, venue: e.venue };
			if (e.custom) Object.assign(out, { custom: true, label: e.label, title: e.title });
			return out;
		}),
		hosts: o.hosts,
		guest: guest ? guest.name : '',
	});
};
