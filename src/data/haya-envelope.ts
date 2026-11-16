// Haya envelope invitation: every look and timing setting lives here.
// Edit a value, commit, and the demo page updates. Sizes marked % are of the phone-width column.

export const hayaEnvelope = {
	background: '#c8914d', // page colour
	sideBackground: '#bb843f', // slightly darker strip on both sides on a laptop
	stageMaxWidth: 430, // widest the invitation column gets on a laptop (px)

	welcome: { text: 'A Little Something, For You', font: 'Berkshire Swash', color: '#b1232c', size: 'clamp(2rem, 9.5vw, 2.7rem)' },
	hint: { text: 'Tap the envelope to open', font: 'Unna', color: '#5a1016', size: '1.1rem' },

	footer: {
		heading: 'With Love',
		headingFont: 'Berkshire Swash',
		headingColor: '#b1232c',
		message: 'Your presence will make our celebration even more special !',
		messageFont: 'Unna',
		messageColor: '#5a1016',
		brandStart: 'Invite',
		brandEnd: 'Heaven',
	},

	buttons: { closeLabel: 'Close', goBackLabel: 'Go Back', font: 'Unna', background: '#b1232c', text: '#ffffff', linkColor: '#5a1016' },

	images: {
		tray: '/haya-tray.webp',
		envelopeClosed: '/haya-envelope-closed.webp',
		envelopeOpen: '/haya-envelope-open.webp',
		envelopeFront: '/haya-envelope-front.webp',
	},

	// Optional background music. Put the file in the public folder and write its name, e.g. '/haya-music.mp3'. Empty = no music.
	music: { src: '', volume: 0.6 },

	layout: {
		trayWidth: 104, // tray width (% of column)
		trayBottom: 15, // gap under the tray (% of screen height)
		envelopeWidth: 70, // envelope width (% of column)
		envelopeLift: 0.13, // how far the envelope sits above the tray bottom (x column width)
		envelopeRatio: 1.1733, // envelope picture height / width (do not change unless the pictures change)
		cardWidth: 46, // card width (% of column)
		cardCenterX: 54.4, // where cards come out, left to right (% of envelope width)
		cardRestTop: 0.447, // where cards wait inside the envelope (x envelope height)
		cardBottomAt: 0.7, // where the bottom of each card ends up, behind the front pocket (x envelope height)
		fanStep: 6.5, // sideways gap between cards (% of column)
		fanTilt: 2.6, // tilt per card, in degrees (3 or more cards)
		fanTiltFew: 5, // tilt per card, in degrees (2 cards)
	},

	timing: {
		entrance: 1100, // text, tray and envelope rising in (ms)
		hintDelay: 1700, // when the "tap" hint appears
		envelopeSwap: 450, // envelope closed <> open fade
		titleFadeDelay: 250, // welcome text fades after the tap
		cardsDelay: 450, // cards start rising after the tap
		cardRise: 900, // each card's rise (ms)
		cardStagger: 90, // gap between cards rising
		closeStagger: 55, // gap between cards returning
		cardReturn: 600, // each card sliding back into the envelope
		lightboxFade: 250,
	},
};

// Sample details for the demo page. A real customer's details will replace this later.
export const hayaDemoInvitation = {
	couple: { brideName: 'Maria Rehman', brideParents: 'Muhammad Rehman Asghar', groomName: 'Ahtesham Mughal', groomParents: 'Muhammad Sahil Mughal' },
	events: [
		{ id: 'nikkah', date: '2026-12-09', time: '22:30', venue: 'Paradise Marquee, Rawalpindi' },
		{ id: 'dholki', date: '2026-12-10', time: '22:00', venue: 'Paradise Marquee, Rawalpindi' },
		{ id: 'qawaali', date: '2026-12-11', time: '21:00', venue: 'Paradise Marquee, Rawalpindi' },
		{ id: 'mehndi', date: '2026-12-12', time: '20:00', venue: 'Paradise Marquee, Rawalpindi' },
		{ id: 'baraat', date: '2026-12-13', time: '22:30', venue: 'Paradise Marquee, Rawalpindi' },
		{ id: 'walima', date: '2026-12-14', time: '22:30', venue: 'Paradise Marquee, Rawalpindi' },
	],
	hosts: [
		{ name: 'Ahmed Raza Khan', phone: '0300 1111111' },
		{ name: 'Bilal Ahmed Sheikh', phone: '0300 2222222' },
		{ name: 'Usman Ghani Malik', phone: '0300 3333333' },
	],
};
