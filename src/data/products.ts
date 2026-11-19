// Product pages. One entry per product. The key (slug) becomes the page address: /products/<slug>
// To add a new product page later, copy the Haya block, change the text, and add the slug here.

export interface Product {
	slug: string;
	name: string;
	category: string;
	tagline: string;
	image: string; // cover image
	demo: string; // live demo link
	designId: string; // id from designs.ts, used by the Customize button
	priceRange: string;
	priceNote: string;
	about: string;
	features: { title: string; text: string }[];
	events: string[];
	steps: { title: string; text: string }[];
	linkOptions: { title: string; text: string }[];
	prices: { item: string; price: string; note?: string }[];
	faqs: { q: string; a: string }[];
}

export const products: Record<string, Product> = {
	haya: {
		slug: 'haya',
		name: 'Haya',
		category: 'Interactive Envelope Invitation',
		tagline: 'An elegant envelope your guests open with a tap. Your event cards slide out inside, all in one link.',
		image: '/haya-cover.jpg',
		demo: '/demo-haya',
		designId: 'envelope-haya',
		priceRange: 'Rs. 3,999 - Rs. 10,999+',
		priceNote: 'Starts with 1 event + up to 50 personalized guest invitations',
		about:
			'Haya turns your invitation into a small moment of joy. Your guest taps the envelope, the flap opens, and your event cards rise out and line up, ready to swipe through. Everything lives in a single link that is easy to share on WhatsApp.',
		features: [
			{
				title: 'A real envelope experience',
				text: 'The envelope opens with a smooth animation, and your cards slide out one by one. Guests can swipe through them and tap a card to see it in full.',
			},
			{
				title: 'Cards for every event',
				text: 'Choose only the events you need. Each event gets its own beautifully lettered card with your names, parents, date, day, time and venue.',
			},
			{
				title: 'Add your own event',
				text: 'Do not see your ceremony in the list? Add it by name, and it appears on its card exactly as you write it.',
			},
			{
				title: 'Reception hosts card',
				text: 'Add a card with the names and phone numbers of your reception hosts, so guests know who to ask for on the day.',
			},
			{
				title: 'Personalized for each guest',
				text: 'With the personalized add-on, up to 50 guests each get their own link. Their first card is a warm greeting with their name: "Dear Shaheer Aslam".',
			},
			{
				title: 'Made for phones',
				text: 'Everything is designed for mobile screens. No app is needed, guests simply open the link.',
			},
		],
		events: ['Nikkah', 'Dholki', 'Qawali Night', 'Mehndi', 'Baraat', 'Walima', 'Your own event'],
		steps: [
			{ title: 'Add your details', text: 'Fill in the names, events, dates, times and venues in a simple step-by-step form.' },
			{ title: 'Choose how to share', text: 'One link for everyone, or different links for different groups of guests. Add personalized greetings if you like.' },
			{ title: 'Preview everything', text: 'See your cards and the envelope exactly as your guests will, before you decide.' },
			{ title: 'Receive and share your links', text: 'Your invitation links are ready to send on WhatsApp.' },
		],
		linkOptions: [
			{ title: 'One link for everyone', text: 'All your chosen cards in a single link. The simplest way to invite everyone.' },
			{ title: 'Different links for different groups', text: 'For example, close family see all your events, and friends see only a few chosen cards.' },
			{ title: 'Personalized links (add-on)', text: 'A separate link for each guest you list, up to 50. Each opens with a greeting card carrying that guest\'s name.' },
		],
		prices: [
			{ item: 'Envelope', price: 'Rs. 1,000' },
			{ item: 'Each event card', price: 'Rs. 1,000', note: 'Pick only the events you need' },
			{ item: 'Reception hosts card', price: 'Rs. 1,000', note: 'Optional' },
			{ item: 'Personalized links add-on', price: 'Rs. 1,999', note: 'Up to 50 guests' },
			{ item: 'Greeting card with the add-on', price: 'Rs. 1,000', note: 'Priced once, even though each guest gets their own' },
		],
		faqs: [
			{ q: 'Can I see my invitation before I pay?', a: 'Yes. You can preview all your cards and watch the envelope open with your own details. The preview carries a watermark that is not on your final cards.' },
			{ q: 'Do my guests need to install anything?', a: 'No. They just tap your link and the envelope opens in their phone browser.' },
			{ q: 'How many events can I include?', a: 'Choose any of the six ready events, and add your own events too.' },
			{ q: 'How many guests can get a personalized link?', a: 'Up to 50 guests with the personalized add-on. Each guest sees only their own greeting card.' },
			{ q: 'Can I send different cards to different people?', a: 'Yes. Create separate links, each with the cards you choose for that group.' },
		],
	},
};
