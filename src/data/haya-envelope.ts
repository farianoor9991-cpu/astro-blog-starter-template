// Haya envelope invitation: every look and timing setting lives here.
// Edit a value, commit, and the demo page updates. Sizes marked % are of the phone-width column unless stated.

export const hayaEnvelope = {
	background: '#fbf3e4', // page colour (cream), shown until the silk pictures load
	backgroundImage: '/haya-bg.jpg?v=4', // silk background on phones (9:16)
	backgroundImageWide: '/haya-bg-wd.jpg?v=3', // silk background on laptops (16:9)
	footerBackground: '#1d4a30', // closing section and the strip that rises after the tap
	stageMaxWidth: 430, // widest the invitation column gets on a laptop (px)

	welcome: { text: 'We\u2019re Honoured To Have You \u2665\uFE0F', font: 'Berkshire Swash', color: '#276041', size: 'clamp(1.7rem, 7.6vw, 2.3rem)', gap: 14 },
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
		brandStartColor: '#1a1a1a',
		brandEndColor: '#9a6a36',
		brandUrl: '/', // "Created by InviteHeaven" links to the main page
		createdBy: 'Created by',
		createdByColor: '#6b5a3e',
	},

	buttons: { closeLabel: 'Close', goBackLabel: 'Go Back', font: 'Unna', background: '#b1232c', text: '#ffffff', linkColor: '#e7c27d' },

	viewer: { background: 'rgba(40, 16, 10, 0.88)', text: '#fff3e0' }, // the card reading screen

	images: {
		tray: '/haya-tray.webp', // the tray on laptops
		trayPhone: '/haya-tray-m.webp', // the tray on phones
		closed: '/haya3-closed.webp?v=2', // the full closed envelope
		body: '/haya3-body.webp', // the open envelope without its flap
		front: '/haya3-front.webp', // the front of the pocket (cut-out where the cards show)
		flap: '/haya3-flap.webp?v=2', // the flap, outside (with the wax seal)
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
	ring: { enabled: false, color: '255, 236, 170', duration: 2000, scale: 7 },

	// The golden ripple from the wax seal (runs across the whole screen) and the slow gold confetti
	ripple: { enabled: true, duration: 2600 }, // luminous rings from the wax seal (ms)
	sparkle: { enabled: true, max: 96, starShare: 0.22, fadeMs: 1800 }, // fairy dust and twinkling stars while the cards come out
	confetti: { enabled: true, count: 130, spawnMs: 3400 }, // starts when the page opens

	// Optional background music. Put the file in the public folder and write its name, e.g. '/haya-music.mp3'. Empty = no music.
	music: { src: '', volume: 0.6 },

	// Where the tray is inside the background pictures (fractions of the picture): centre x/y and size. maxColByH limits how big the invitation gets on a laptop.
	trayInBg: {
		port: { iw: 1440, ih: 2560, cx: 0.5, cy: 0.5164, w: 0.9736, h: 0.373 },
		lap: { colByH: 0.66, trayByCol: 1.12, ratio: 0.674, cy: 0.52 }, // laptop: invitation width (x screen height), tray width (x invitation width), tray height/width, tray centre (x screen height)
	},

	layout: {
		trayWidth: 100, // tray width (% of column)
		trayBottom: 21, // gap under the tray (% of screen height)
		envelopeWidth: 66, // envelope width (% of column)
		envelopeLift: 0.145, // how far the envelope sits above the tray bottom (x column width)
		cardWidth: 74, // card width (% of envelope width)
		maxVisible: 4, // at most this many cards show as a stack (2 to 4 look best)
		restDepth: 0.02, // where the cards rest inside the envelope (0 = tops show a lot, 1 = hidden)
		pileScale: 0.86, // size of the pile of cards once it is out of the envelope
		pileGap: 0.03, // how far above the envelope the pile floats (x card height)
		pileStep: 0.035, // each card behind sits a little higher in the pile
	},

	// Opening and closing animation. All times in seconds.
	anim: {
		lift: 0.5, // the envelope lifts a little
		cross: 0.35, // closed picture melts into the layered one
		flap: 1.9, // the flap turning over
		perspective: 1.3, // depth of the turn (x envelope width). Smaller = stronger 3D
		cardsAfter: 1.2, // cards start coming out this long after the flap starts turning
		cards: 1.3,
		cardUp: 1.5, // each card gliding up out of the envelope (s)
		cardSettle: 1.0, // then settling into the stack in front (s)
		cardDown: 1.5, // each card gliding back into the envelope when closing (s)
		cardStagger: 0.1, // gap between cards, opening and closing (s)
		cardStaggerTotal: 1.2,
		settle: 0.6,
		row: 1.0, // the pile spreading into the row of cards (and back)
		rowStagger: 0.1,
		openSpeed: 1, // 1 = as written, 0.8 = slower
		closeSpeed: 1,
	},

	// Other times in milliseconds
	timing: {
		entrance: 1100, trayRise: 1900, envDelay: 1.15, // text, tray and envelope rising in
		hintDelay: 3000, // when the "tap" hint appears
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
