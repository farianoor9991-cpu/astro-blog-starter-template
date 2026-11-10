export interface Review {
	name: string; // short form, like "Ayesha K."
	rating: number; // 1 to 5
	text: string; // the review, in the customer's own words
	design: string; // the design they received
	photo?: string; // optional, like '/reviews/ayesha.jpg' (upload it to the public folder)
	verified?: boolean; // true only if they really received a design from you
}

// "Share your review" button. Replace 920000000000 with your WhatsApp number (no + or spaces)
export const reviewLink =
	'https://wa.me/920000000000?text=Hi%2C%20I%20would%20like%20to%20share%20my%20review.';

/* ------------------------------------------------------------------
   YOUR REVIEWS. One review = one line. Newest first.
   Leave the list empty until you have real reviews.
   Example of one line:
   { name: 'Ayesha K.', rating: 5, text: 'Your review text here.', design: 'Design name', verified: true },
------------------------------------------------------------------- */

export const reviews: Review[] = [];
