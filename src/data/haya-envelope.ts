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
		closed: '/haya3-closed.webp', // the full closed envelope
		body: '/haya3-body.webp', // the open envelope without its flap
		front: '/haya3-front.webp', // the front of the pocket (cut-out where the cards show)
		flap: '/haya3-flap.webp', // the flap, outside (with the wax seal)
		flapBack: '/haya3-flapback.webp', // the flap, inside (what you see once it is open)
	},

	// Sizes of the envelope pictures in pixels, and where the wax seal is (% of envelope width / height).
	// Do not change unless the pictures change.
	envelope: {
		w: 789,
		h: 519,
		ratio: 0.6578, // height / width
		flap: { x: 5, y: 0, w: 780, h: 388 }, // where the flap picture sits on the envelope
		holeBottom: 228, // the lowest point of the pocket opening
		sealX: 49.9,
		sealY: 63.1,
		sealR: 7.4,
	},

	// The ring of light from the wax seal
	ring: { enabled: true, color: '255, 236, 170', duration: 2000, scale: 7 },

	// Optional background music. Put the file in the public folder and write its name, e.g. '/haya-music.mp3'. Empty = no music.
	music: { src: '', volume: 0.6 },

	layout: {
		trayWidth: 100, // tray width (% of column)
		trayBottom: 21, // gap under the tray (% of screen height)
		envelopeWidth: 66, // envelope width (% of column)
		envelopeLift: 0.1, // how far the envelope sits above the tray bottom (x column width)
		cardWidth: 62, // card width (% of envelope width)
		maxVisible: 4, // at most this many cards show as a stack (2 to 4 look best)
		peekMax: 0.3, // how much of a card may stick out above the envelope (0.3 = 30% of the card height)
		peekStep: 0.03, // each card behind sticks out a little more than the one in front
	},

	// Opening and closing animation. All times in seconds.
	anim: {
		lift: 0.5, // the envelope lifts a little
		cross: 0.35, // closed picture melts into the layered one
		flap: 1.9, // the flap turning over
		perspective: 1.3, // depth of the turn (x envelope width). Smaller = stronger 3D
		cardsAfter: 0.9, // cards start rising this long after the flap starts turning
		cards: 1.5, // each card's rise
		cardStagger: 0.22, // gap between cards rising
		cardStaggerTotal: 0.9,
		settle: 0.6,
		openSpeed: 1, // 1 = as written, 0.8 = slower
		closeSpeed: 1,
	},

	// Other times in milliseconds
	timing: {
		entrance: 1100, // text, tray and envelope rising in
		hintDelay: 1700, // when the "tap" hint appears
		peek: 900, // the strip rising from the bottom
		peekDelay: 1200, // when it starts after the tap
		viewerIn: 450, // reading screen opening
		viewerOut: 380, // reading screen closing
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
