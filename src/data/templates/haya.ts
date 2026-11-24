// Haya: Interactive Envelope Invitation template.
// x, maxW and size are fractions of the card WIDTH. y and lh are fractions of the card HEIGHT.
// To move a text: bigger y = lower, bigger x = further right. Bigger size = larger text.
export const haya = {
	id: 'envelope-haya',
	name: 'Haya',
	color: '#276041',
	maxHosts: 6,
	sample: {
		brideName: 'Maria Rehman',
		brideParents: 'Muhammad Rehman Asghar',
		groomName: 'Ahtesham Mughal',
		groomParents: 'Muhammad Sahil Mughal',
	},
	sampleVenue: 'Paradise Marquee, Rawalpindi',
	sampleHosts: [
		{ name: 'Ahmed Raza Khan', phone: '03xxxxxxxxx' },
		{ name: 'Bilal Ahmed Sheikh', phone: '03xxxxxxxxx' },
		{ name: 'Usman Ghani Malik', phone: '03xxxxxxxxx' },
		{ name: 'Hassan Ali Javed', phone: '03xxxxxxxxx' },
		{ name: 'Kamran Shahid Mirza', phone: '03xxxxxxxxx' },
	],
	events: [
		{ id: 'nikkah', label: 'Nikah', title: 'Nikah Ceremony', sample: { date: '2026-12-09', time: '22:30' } },
		{ id: 'mehndi', label: 'Mehndi', title: 'Mehndi Ceremony', sample: { date: '2026-12-12', time: '20:00' } },
		{ id: 'qawaali', label: 'Qawali Night', title: 'Qawali Night', sample: { date: '2026-12-11', time: '21:00' } },
		{ id: 'baraat', label: 'Baraat', title: 'Baraat Ceremony', sample: { date: '2026-12-13', time: '22:30' } },
		{ id: 'walima', label: 'Walima', title: 'Walima Ceremony', sample: { date: '2026-12-14', time: '22:30' } },
		{ id: 'dholki', label: 'Dholki', title: 'Dholki Ceremony', sample: { date: '2026-12-10', time: '22:00' } },
		{ id: 'mayun', label: 'Mayun', title: 'Mayun Ceremony', sample: { date: '2026-12-08', time: '20:00' } },
		{ id: 'rukhsati', label: 'Rukhsati', title: 'Rukhsati', sample: { date: '2026-12-13', time: '23:30' } },
		{ id: 'shalima', label: 'Shalima', title: 'Shalima', sample: { date: '2026-12-14', time: '20:00' } },
		{ id: 'shendi', label: 'Shendi', title: 'Shendi Ceremony', sample: { date: '2026-12-07', time: '20:00' } },
		{ id: 'bridalshower', label: 'Bridal Shower', title: 'Bridal Shower', sample: { date: '2026-12-06', time: '16:00' } },
		{ id: 'engagement', label: 'Engagement', title: 'Engagement Ceremony', sample: { date: '2026-12-05', time: '20:00' } },
		{ id: 'baatpakki', label: 'Baat Pakki', title: 'Baat Pakki', sample: { date: '2026-12-04', time: '18:00' } },
	],
	eventLayout: {
		// The first file that exists is used. A small preview copy is faster on phones.
		bg: ['/haya-event-bg-preview.jpg', '/haya-event-bg.png'],
		fields: {
						title: { x: 0.509, y: 0.4115, size: 0.0416, maxW: 0.36, font: 'Berkshire Swash', weight: 400 },
			groomName: { x: 0.505, y: 0.493, size: 0.0618, maxW: 0.66, font: 'Unna', weight: 700 },
			groomParents: { x: 0.505, y: 0.521, size: 0.0228, maxW: 0.62, font: 'Unna', weight: 700 },
			brideName: { x: 0.505, y: 0.572, size: 0.0618, maxW: 0.66, font: 'Unna', weight: 700 },
			brideParents: { x: 0.505, y: 0.601, size: 0.0228, maxW: 0.62, font: 'Unna', weight: 700 },
			month: { x: 0.5, y: 0.642, size: 0.0325, maxW: 0.4, font: 'Unna', weight: 700 },
			dayName: { x: 0.337, y: 0.682, size: 0.0311, maxW: 0.17, font: 'Unna', weight: 700 },
			date: { x: 0.497, y: 0.680, size: 0.051, maxW: 0.12, font: 'Unna', weight: 700 },
			time: { x: 0.640, y: 0.681, size: 0.0311, maxW: 0.175, font: 'Unna', weight: 700 },
			year: { x: 0.5, y: 0.717, size: 0.0325, maxW: 0.2, font: 'Unna', weight: 700 },
			venue: { x: 0.511, y: 0.765, size: 0.0298, maxW: 0.6, lh: 0.0241, font: 'Unna', weight: 700 },
		},
	},
	// The greeting card: the blank card already has the fixed greeting, only "Dear <Name>" is added.
	guestLayout: {
		bg: ['/haya-guest-bg.jpg'],
		field: { x: 0.5135, y: 0.421, wrapY: 0.4182, gap: 0.0806, size: 0.058, maxW: 0.62, font: 'Berkshire Swash', weight: 400 },
	},
	hostsLayout: {
		bg: ['/haya-hosts-bg-preview.jpg', '/haya-hosts-bg.png'],
		field: { x: 0.511, centerY: 0.559, size: 0.0273, maxW: 0.66, font: 'Unna', weight: 700 },
	},
};
