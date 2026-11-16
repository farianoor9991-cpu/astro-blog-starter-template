// Haya envelope invitation: every look and timing setting lives here.
// Edit a value, commit, and the demo page updates. Sizes marked % are of the phone-width column unless stated.

export const hayaEnvelope = {
	background: '#fbf3e4', // page colour (cream)
	footerBackground: '#1d4a30', // closing section and the strip that rises after the tap
	stageMaxWidth: 430, // widest the invitation column gets on a laptop (px)

	welcome: { text: 'A Little Something, For You', font: 'Berkshire Swash', color: '#b1232c', size: 'clamp(2rem, 9.5vw, 2.7rem)' },
	hint: { text: 'Tap the envelope to open', openText: 'Tap the cards to read', font: 'Unna', color: '#5a1016', size: '1.1rem' },

	footer: {
		heading: 'With Love',
		headingFont: 'Berkshire Swash',
		headingColor: '#e7c27d',
		message: 'Your presence will make our celebration even more special !',
		messageFont: 'Unna',
		messageColor: '#fbf3e4',
		brandStart: 'Invite',
		brandEnd: 'Heaven',
		brandStartColor: '#fbf3e4',
		brandEndColor: '#e7c27d',
		createdBy: 'Created by',
		createdByColor: '#e7c27d',
	},

	buttons: { closeLabel: 'Close', goBackLabel: 'Go Back', font: 'Unna', background: '#b1232c', text: '#ffffff', linkColor: '#e7c27d' },

	viewer: { background: 'rgba(40, 16, 10, 0.88)', text: '#fff3e0' }, // the card reading screen

	images: {
		tray: '/haya2-tray.webp',
		closed: '/haya2-env-closed.webp',
		slight: '/haya2-env-slight.webp',
		open: '/haya2-env-open.webp',
		ovSlight: '/haya2-env-ovslight.webp',
		ovOpen: '/haya2-env-ovopen.webp',
	},

	// Where the wax seal is on the envelope picture (% of envelope width / height). Do not change unless the pictures change.
	envelope: { ratio: 1.0403, sealX: 50.5, sealY: 60.8, sealR: 6 },

	// The ring of light from the wax seal
	ring: { enabled: true, color: '255, 236, 170', duration: 2000, scale: 9 },

	// Optional background music. Put the file in the public folder and write its name, e.g. '/haya-music.mp3'. Empty = no music.
	music: { src: '', volume: 0.6 },

	layout: {
		trayWidth: 92, // tray width (% of column)
		trayBottom: 21, // gap under the tray (% of screen height)
		envelopeWidth: 72, // envelope width (% of column)
		envelopeLift: 0.1, // how far the envelope sits above the tray bottom (x column width)
		cardWidth: 66, // card width (% of envelope width)
		cardCenterX: 50.5, // where cards come out, left to right (% of envelope width)
		insideTop: 0.4, // where cards wait inside the envelope (x envelope height)
		deckTop: -0.03, // top of the front card when out (x envelope height)
		deckSpread: 3, // sideways gap between cards in the deck (% of envelope width)
		deckDrop: 1.2, // each back card sits a little lower (% of envelope height)
		deckTilt: 2.4, // tilt per card, in degrees
	},

	// All times in milliseconds
	timing: {
		entrance: 1100, // text, tray and envelope rising in
		hintDelay: 1700, // when the "tap" hint appears
		titleFadeDelay: 300, // welcome text fades after the tap
		peek: 900, // the strip rising from the bottom
		peekDelay: 1200, // when it starts after the tap
		toSlightDelay: 700, // flap starts lifting this long after the tap (ring starts at once)
		toSlight: 1500, // closed > slightly open
		slightPause: 250, // short rest in the slightly open position
		toOpen: 1400, // slightly open > fully open
		cardRise: 1400, // each card's rise
		cardStagger: 200, // gap between cards rising
		cardStaggerTotal: 1500, // the whole rise never takes longer than this
		viewerIn: 450, // reading screen opening
		viewerOut: 380, // reading screen closing
		tidy: 600, // cards gathering into one stack
		sink: 1300, // each card sinking into the envelope
		sinkStagger: 150,
		sinkStaggerTotal: 900,
		closeToSlight: 1300, // open > slightly open
		closeToClosed: 1300, // slightly open > closed
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
