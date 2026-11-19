import type { APIRoute } from 'astro';
import { clean, cleanGuests, cleanLinks, DEFAULT_TEMPLATE, json, rid } from '../../lib/orders';

export const prerender = false;

const kvOf = (locals: any) => locals?.runtime?.env?.ORDERS;

// Create an order (called from the customize form)
export const POST: APIRoute = async ({ request, locals }) => {
	const kv = kvOf(locals);
	if (!kv) return json({ error: 'Storage is not connected yet.' }, 503);
	let body: any;
	try {
		const raw = await request.text();
		if (raw.length > 200000) return json({ error: 'Too large' }, 413);
		body = JSON.parse(raw);
	} catch (e) {
		return json({ error: 'Invalid data' }, 400);
	}
	const base = clean(body);
	if (!base.events.length || !base.couple.brideName || !base.couple.groomName) return json({ error: 'Missing details' }, 400);
	const mode = body.mode === 'many' ? 'many' : 'one';
	let links = cleanLinks(body.links);
	if (mode === 'one' || !links.length) links = [{ id: 'all', label: 'All events', cards: base.events.map((e: any) => e.id) }];
	const guests = body.guestsOn ? cleanGuests(body.guests, links) : [];
	const n = Number((await kv.get('counter')) || 1000) + 1;
	await kv.put('counter', String(n));
	const token = rid(24);
	const pid = rid(10);
	const order = {
		orderNo: n,
		token,
		pid,
		createdAt: new Date().toISOString(),
		...base,
		mode,
		links,
		guestsOn: !!body.guestsOn,
		guests,
		template: DEFAULT_TEMPLATE,
		paid: false,
	};
	await kv.put('order:' + token, JSON.stringify(order));
	await kv.put('pid:' + pid, token);
	return json({ token, orderNo: n });
};

// Read an order (private link)
export const GET: APIRoute = async ({ url, locals }) => {
	const kv = kvOf(locals);
	if (!kv) return json({ error: 'Storage is not connected yet.' }, 503);
	const t = url.searchParams.get('t') || '';
	if (!/^[a-z0-9]{24}$/.test(t)) return json({ error: 'Not found' }, 404);
	const raw = await kv.get('order:' + t);
	if (!raw) return json({ error: 'Not found' }, 404);
	return json(JSON.parse(raw));
};

// Save edits from the order page
export const PUT: APIRoute = async ({ request, url, locals }) => {
	const kv = kvOf(locals);
	if (!kv) return json({ error: 'Storage is not connected yet.' }, 503);
	const t = url.searchParams.get('t') || '';
	if (!/^[a-z0-9]{24}$/.test(t)) return json({ error: 'Not found' }, 404);
	const raw = await kv.get('order:' + t);
	if (!raw) return json({ error: 'Not found' }, 404);
	const order = JSON.parse(raw);
	let body: any;
	try {
		const txt = await request.text();
		if (txt.length > 400000) return json({ error: 'Too large' }, 413);
		body = JSON.parse(txt);
	} catch (e) {
		return json({ error: 'Invalid data' }, 400);
	}
	const base = clean(body, order);
	// events cannot be added or removed here, only edited
	const events = order.events.map((e: any) => {
		const upd = base.events.find((x: any) => x.id === e.id);
		return upd ? { ...e, date: upd.date, time: upd.time, venue: upd.venue } : e;
	});
	const links = cleanLinks(body.links, order.links);
	const guests = order.guestsOn || (Array.isArray(body.guests) && body.guests.length) ? cleanGuests(body.guests, links, order.guests) : [];
	const next = {
		...order,
		couple: base.couple,
		events,
		hosts: base.hosts,
		links: order.mode === 'many' ? links : order.links,
		guestsOn: order.guestsOn || guests.length > 0,
		guests,
		template: typeof body.template === 'string' && body.template.trim() ? body.template.slice(0, 1500) : order.template,
		updatedAt: new Date().toISOString(),
	};
	await kv.put('order:' + t, JSON.stringify(next));
	return json(next);
};

