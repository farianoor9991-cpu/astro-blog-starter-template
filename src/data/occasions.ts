import type { DesignType } from './designs';

// Occasion buttons for each product. A design's "occasion" in designs.ts must match one of these exactly.
// To change the list for a product, edit only that product's list below.
export const occasions: Record<DesignType, string[]> = {
	website: [
		'Wedding',
		'Nikkah',
		'Mayun',
		'Mehndi',
		'Baraat',
		'Walima',
		'Bridal Shower',
		'Baat Pakki',
		'Engagement',
	],
	video: [
		'Wedding',
		'Nikkah',
		'Mayun',
		'Mehndi',
		'Baraat',
		'Walima',
		'Birthday',
		'Baby announcements',
		'Aqeeqah',
		'Hajj/Umrah',
	],
	ecard: [
		'Wedding',
		'Nikkah',
		'Mayun',
		'Mehndi',
		'Baraat',
		'Walima',
		'Birthday',
    'Baat Pakki',
		'Engagement',
		'Baby announcements',
		'Aqeeqah',
		'Hajj/Umrah',
	],
};
