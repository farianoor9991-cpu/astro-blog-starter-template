import type { APIRoute } from 'astro';
import { hayaEnvelope } from '../../data/haya-envelope';
import { clean, cleanFooter, cleanGuests, cleanLinks, coupleSlugOf, DEFAULT_TEMPLATE, expiryOpts, json, loadByToken, rid, saveOrder } from '../../lib/orders';

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
	// groups and guest lists are made later, on the order page; the order starts with the one main link
	// the form only sends the EXTRA links the customer made; the main "all events" link is always added here
	const extra = (Array.isArray(body.links) ? body.links : []).filter((l: any) => {
		const cards = (Array.isArray(l?.cards) ? l.cards : []).filter((c: any) => base.events.some((e: any) => e.id === c));
		return cards.length > 0 && cards.length < base.events.length;
	});
	const links = cleanLinks([{ id: 'all' }, ...extra], base.events);
	const guests: any[] = [];
	// private link = 10 characters that find the order + 14 secret characters
	const pid = rid(10);
	const token = pid + rid(14);
	const createdAt = new Date().toISOString();
	const exp = expiryOpts(createdAt);
	// Order numbers: take the next free number and claim it, so two orders never share one
	let n = Number((await kv.get('counter')) || 1000) + 1;
	for (let tries = 0; tries < 50; tries++) {
		if (!(await kv.get('no:' + n))) {
			await kv.put('no:' + n, token, exp);
			if ((await kv.get('no:' + n)) === token) break;
		}
		n += 1 + Math.floor(Math.random() * 3);
	}
	await kv.put('counter', String(n));
	const pinHash = await hashPin(String(body.pin), token);
	// the readable name used in the guests' links, e.g. maria-weds-ahtesham (-2, -3 ... if taken)
	const baseSlug = coupleSlugOf(base.couple);
	let cslug = baseSlug;
	for (let i = 2; i < 60; i++) {
		if (!(await kv.get('o:' + cslug))) break;
		cslug = baseSlug + '-' + i;
	}
	const order = {
		pinHash,
		locked: false,
		orderNo: n,
		token,
		pid,
		cslug,
		createdAt,
		...base,
		mode: links.length > 1 ? 'many' : 'one',
		links,
		hostsOn: body.hostsOn !== false, // chosen in the form (Yes / No); can be changed later on the dashboard
		guestsOn: !!body.guestsOn, // the personalized greeting cards add-on
		setupTeam: !!body.setupTeam, // the customer asked our team to set everything up (+Rs. 1,999)
		music: '',
		footer: { mode: 'couple', family: '' },
		guests,
		template: DEFAULT_TEMPLATE,
		paid: false,
	};
	await kv.put('o:' + cslug, JSON.stringify(order), exp);
	await kv.put('t:' + pid, cslug, exp);
	return json({ token, orderNo: n });
};

// Read an order (private link): 2 reads (1 for old orders)
export const GET: APIRoute = async ({ url, locals }) => {
	const kv = kvOf(locals);
	if (!kv) return json({ error: 'Storage is not connected yet.' }, 503);
	const t = url.searchParams.get('t') || '';
	if (!/^[a-z0-9]{24}$/.test(t)) return json({ error: 'Not found' }, 404);
	const L = await loadByToken(kv, t);
	if (!L) return json({ error: 'Not found' }, 404);
	return json(publicView(L.o));
};

// Save edits from the order page
export const PUT: APIRoute = async ({ request, url, locals }) => {
	const kv = kvOf(locals);
	if (!kv) return json({ error: 'Storage is not connected yet.' }, 503);
	const t = url.searchParams.get('t') || '';
	if (!/^[a-z0-9]{24}$/.test(t)) return json({ error: 'Not found' }, 404);
	const L = await loadByToken(kv, t);
	if (!L) return json({ error: 'Not found' }, 404);
	const order = L.o;
	let body: any;
	try {
		const txt = await request.text();
		if (txt.length > 400000) return json({ error: 'Too large' }, 413);
		body = JSON.parse(txt);
	} catch (e) {
		return json({ error: 'Invalid data' }, 400);
	}
	let pinChanged = false; // only write when something really changed
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
			await saveOrder(kv, L);
			return json({ error: 'Wrong PIN' }, 403);
		}
		if (order.pinFails || order.pinLockUntil) {
			order.pinFails = 0;
			order.pinLockUntil = 0;
			pinChanged = true;
		}
	} else {
		// Older orders made before PINs existed: the first PIN set here becomes the Edit PIN
		if (!/^\d{4}$/.test(String(body.newPin || ''))) return json({ error: 'no-pin' }, 403);
		order.pinHash = await hashPin(String(body.newPin), t);
		pinChanged = true;
	}
	if (body.action === 'verify') {
		if (pinChanged) await saveOrder(kv, L);
		return json(publicView(order));
	}
	if (body.action === 'lock' || body.action === 'unlock') {
		const want = body.action === 'lock';
		if (order.locked !== want || pinChanged) {
			order.locked = want;
			await saveOrder(kv, L);
		}
		return json(publicView(order));
	}
	if (order.locked) return json({ error: 'Your design is locked. Please unlock it first.' }, 423);
	// Everything on the invitation can be edited here: couple, events (standard or the customer's own), hosts card, groups, guests
	const hostsOn = typeof body.hostsOn === 'boolean' ? body.hostsOn : (order.hostsOn ?? true);
	const base = clean({ couple: body.couple || order.couple, events: Array.isArray(body.events) ? body.events : order.events, hosts: hostsOn ? body.hosts ?? order.hosts : [] }, order);
	if (!base.events.length) return json({ error: 'Please keep at least one event.' }, 400);
	if (!base.couple.brideName || !base.couple.groomName) return json({ error: 'Please keep the bride and groom names.' }, 400);
	const links = cleanLinks(body.links, base.events, order.links);
	const empty = links.find((l: any) => !l.cards.length);
	if (empty) return json({ error: 'The group "' + empty.label + '" needs at least one event.' }, 400);
	const guests = order.guestsOn ? cleanGuests(body.guests, links, order.guests) : [];
	const musicIds = ((hayaEnvelope as any).musicLibrary || []).map((m: any) => m.id);
	const music = typeof body.music === 'string' && (body.music === 'none' || body.music === '' || musicIds.includes(body.music)) ? body.music : order.music || '';
	const next = {
		...order,
		music,
		footer: cleanFooter(body.footer, order.footer),
		couple: base.couple,
		events: base.events,
		hosts: base.hosts,
		hostsOn,
		mode: links.length > 1 ? 'many' : 'one',
		links,
		guests,
		template: typeof body.template === 'string' && body.template.trim() ? body.template.slice(0, 1500) : order.template,
	};
	const part = (o: any) => JSON.stringify([o.couple, o.events, o.hosts, o.hostsOn, o.mode, o.links, o.guests, o.template, o.music, o.footer]);
	if (part(next) === part(order) && !pinChanged) return json(publicView(order)); // nothing changed: no write
	L.o = { ...next, updatedAt: new Date().toISOString() };
	await saveOrder(kv, L);
	return json(publicView(L.o));
};
