export type DesignType = 'website' | 'video' | 'ecard';

export interface Design {
	name: string; // shown on the card, keep each name unique
	image: string; // 9:16 thumbnail
	occasion?: string; // Wedding, Mehndi, Walima, Birthday, Hajj/Umrah, Aqeeqah, Baby
	link?: string; // websites: live demo URL | videos: video link or file
	price?: string; // only if this one design has its own price
}

export interface DesignItem extends Design {
	id: string;
	type: DesignType;
	price: string;
}

// Titles, tab names, prices and blurbs for the three categories
export const categories = {
	website: {
		title: 'Website Invitations',
		tab: 'Websites',
		price: 'Rs. 7999',
		blurb:
			'One graceful link holding every detail, from event timings to venue directions. A digital home for your celebration, as beautiful as the occasion itself. ✨',
	},
	video: {
		title: 'Cinematic Invitation Videos',
		tab: 'Videos',
		price: 'Rs. 2499',
		blurb:
			'Let your invitation unfold like a story. With refined animation and soft, soulful music, it becomes a moment your guests will cherish and revisit. 🎬',
	},
	ecard: {
		title: 'Our Signature E-Cards',
		tab: 'E-Cards',
		price: 'Rs. 999',
		blurb:
			'Timeless designs, crafted with elegance and ready within minutes. Choose the one that speaks to you, add your details, and share it on WhatsApp with effortless grace. 💌',
	},
} as const;

// Order shown on the homepage and catalogue
export const categoryOrder: DesignType[] = ['website', 'video', 'ecard'];

const SAMPLE = '/sample-design.jpg';

/* ------------------------------------------------------------------
   YOUR DESIGNS. One design = one line. Newest first.
   The first 7 appear on the homepage, all of them in the catalogue.
   To add a design: upload its image, then add one line at the top.
------------------------------------------------------------------- */

const websites: Design[] = [
	{ name: 'Sample Website 01', image: SAMPLE, occasion: 'Wedding' },
	{ name: 'Sample Website 02', image: SAMPLE, occasion: 'Wedding' },
	{ name: 'Sample Website 03', image: SAMPLE, occasion: 'Mehndi' },
	{ name: 'Sample Website 04', image: SAMPLE, occasion: 'Walima' },
	{ name: 'Sample Website 05', image: SAMPLE, occasion: 'Birthday' },
	{ name: 'Sample Website 06', image: SAMPLE, occasion: 'Aqeeqah' },
	{ name: 'Sample Website 07', image: SAMPLE, occasion: 'Baby' },
	{ name: 'Sample Website 08', image: SAMPLE, occasion: 'Hajj/Umrah' },
];

const videos: Design[] = [
	{ name: 'Sample Video 01', image: SAMPLE, occasion: 'Wedding' },
	{ name: 'Sample Video 02', image: SAMPLE, occasion: 'Wedding' },
	{ name: 'Sample Video 03', image: SAMPLE, occasion: 'Mehndi' },
	{ name: 'Sample Video 04', image: SAMPLE, occasion: 'Walima' },
	{ name: 'Sample Video 05', image: SAMPLE, occasion: 'Birthday' },
	{ name: 'Sample Video 06', image: SAMPLE, occasion: 'Aqeeqah' },
	{ name: 'Sample Video 07', image: SAMPLE, occasion: 'Baby' },
	{ name: 'Sample Video 08', image: SAMPLE, occasion: 'Hajj/Umrah' },
];

const ecards: Design[] = [
	{ name: 'Sample E-Card 01', image: SAMPLE, occasion: 'Wedding' },
	{ name: 'Sample E-Card 02', image: SAMPLE, occasion: 'Wedding' },
	{ name: 'Sample E-Card 03', image: SAMPLE, occasion: 'Mehndi' },
	{ name: 'Sample E-Card 04', image: SAMPLE, occasion: 'Walima' },
	{ name: 'Sample E-Card 05', image: SAMPLE, occasion: 'Birthday' },
	{ name: 'Sample E-Card 06', image: SAMPLE, occasion: 'Aqeeqah' },
	{ name: 'Sample E-Card 07', image: SAMPLE, occasion: 'Baby' },
	{ name: 'Sample E-Card 08', image: SAMPLE, occasion: 'Hajj/Umrah' },
];

/* ---------------- no need to edit below this line ---------------- */

const slug = (text: string) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

const build = (type: DesignType, list: Design[]): DesignItem[] =>
	list.map((d) => ({
		...d,
		type,
		id: `${type}-${slug(d.name)}`,
		price: d.price ?? categories[type].price,
	}));

export const designs: Record<DesignType, DesignItem[]> = {
	website: build('website', websites),
	video: build('video', videos),
	ecard: build('ecard', ecards),
};