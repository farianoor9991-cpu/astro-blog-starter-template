import type { APIRoute } from 'astro';
import { clean, cleanGuests, cleanLinks, DEFAULT_TEMPLATE, json, rid } from '../../lib/orders';

export const prerender = false;

const kvOf = (locals: any) => locals?.runtime?.env?.ORDERS;

// The PIN is never stored: only a salted hash (salt = the order's private token)
const hashPin = async (pin: string, token: string) => {
	const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ih-pin:' + token + ':' + pin));
	return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};
const publicView = (o: any) => {
	const { pinHash, pinFails, pinLockUntil, ...rest } = o;
	return { ...rest, hasPin: !!pinHash };
};

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
	if (!/^\d{4}$/.test(String(body.pin || ''))) return json({ error: 'Please set a 4-digit PIN.' }, 400);
	const base = clean(body);
	if (!base.events.length || !base.couple.brideName || !base.couple.groomName) return json({ error: 'Missing details' }, 400);
	const wantMany = body.mode === 'many';
	let links = cleanLinks(wantMany ? body.links : [], base.events);
	const guests = body.guestsOn ? cleanGuests(body.guests, links) : [];
	const token = rid(24);
	// Order numbers: take the next free number and claim it, so two orders never share one
	let n = Number((await kv.get('counter')) || 1000) + 1;
	for (let tries = 0; tries < 50; tries++) {
		if (!(await kv.get('no:' + n))) {
			await kv.put('no:' + n, token);
			if ((await kv.get('no:' + n)) === token) break;
		}
		n += 1 + Math.floor(Math.random() * 3);
	}
	await kv.put('counter', String(n));
	const pid = rid(10);
	const pinHash = await hashPin(String(body.pin), token);
	const order = {
		pinHash,
		locked: false,
		orderNo: n,
		token,
		pid,
		createdAt: new Date().toISOString(),
		...base,
		mode: links.length > 1 ? 'many' : 'one',
		links,
		hostsOn: base.hosts.length > 0,
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
	return json(publicView(JSON.parse(raw)));
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
	// The link alone can only view. Every change needs the Edit PIN.
	const pin = String(body.pin || '');
	if (order.pinHash) {
		if (order.pinLockUntil && Date.now() < order.pinLockUntil) return json({ error: 'Too many wrong PINs. Please try again in 15 minutes.' }, 429);
		if ((await hashPin(pin, t)) !== order.pinHash) {
			order.pinFails = (order.pinFails || 0) + 1;
			if (order.pinFails >= 5) {
				order.pinFails = 0;
				order.pinLockUntil = Date.now() + 15 * 60 * 1000;
			}
			await kv.put('order:' + t, JSON.stringify(order));
			return json({ error: 'Wrong PIN' }, 403);
		}
		if (order.pinFails) {
			order.pinFails = 0;
			order.pinLockUntil = 0;
		}
	} else {
		// Older orders made before PINs existed: the first PIN set here becomes the Edit PIN
		if (!/^\d{4}$/.test(String(body.newPin || ''))) return json({ error: 'no-pin' }, 403);
		order.pinHash = await hashPin(String(body.newPin), t);
	}
	if (body.action === 'verify') {
		await kv.put('order:' + t, JSON.stringify(order));
		return json(publicView(order));
	}
	if (body.action === 'lock' || body.action === 'unlock') {
		order.locked = body.action === 'lock';
		await kv.put('order:' + t, JSON.stringify(order));
		return json(publicView(order));
	}
	if (order.locked) return json({ error: 'Your design is locked. Please unlock it first.' }, 423);
	// Couple and events are fixed after purchase; only hosts (if that card was bought), groups, guests and message can change
	const hostsOn = order.hostsOn ?? order.hosts.length > 0;
	// Events: same events as bought; only date, time and venue can change
	const sent: any[] = Array.isArray(body.events) ? body.events : [];
	const merged = order.events.map((e: any) => {
		const x = sent.find((y: any) => y && y.id === e.id) || e;
		return { ...e, date: x.date, time: x.time, venue: x.venue };
	});
	const base = clean({ couple: order.couple, events: merged, hosts: hostsOn ? body.hosts : [] }, order);
	base.couple = order.couple;
	const links = cleanLinks(body.links, base.events);
	const empty = links.find((l: any) => !l.cards.length);
	if (empty) return json({ error: 'The group "' + empty.label + '" needs at least one event.' }, 400);
	const guests = order.guestsOn ? cleanGuests(body.guests, links, order.guests) : [];
	const next = {
		...order,
		events: base.events,
		hosts: base.hosts,
		hostsOn,
		mode: links.length > 1 ? 'many' : 'one',
		links,
		guests,
		template: typeof body.template === 'string' && body.template.trim() ? body.template.slice(0, 1500) : order.template,
		updatedAt: new Date().toISOString(),
	};
	await kv.put('order:' + t, JSON.stringify(next));
	return json(publicView(next));
};

