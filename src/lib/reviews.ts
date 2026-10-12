// Central config for parent reviews / testimonials.
//
// 1) Paste the official Google Business Profile links below once available.
// 2) Add real parent testimonials to PARENT_TESTIMONIALS (only quotes you have
//    permission to publish). Leave the array empty until then — the site will
//    show an honest "no reviews yet" invite instead of placeholder text.

/**
 * Paste the Google Business Profile place ID here (looks like "ChIJ...") to get
 * exact deep links straight to the reviews list and the review composer.
 * Until then we fall back to a Google search that opens the listing's reviews.
 */
export const GOOGLE_PLACE_ID = "";

/** Google Business Profile feature ID (FID) for the Teach Nation listing. */
const GOOGLE_FID = "0x390d1b75c39270c3:0xf3356826049923a5";

/** Opens the listing scrolled to its reviews. */
export const GOOGLE_REVIEWS_URL = `https://www.google.com/search?q=${encodeURIComponent(
  "teach nation",
)}#lrd=${GOOGLE_FID},1,,,,`;

/** Opens the "write a review" composer for the listing. */
export const GOOGLE_WRITE_REVIEW_URL = `https://www.google.com/search?q=${encodeURIComponent(
  "teach nation",
)}#lrd=${GOOGLE_FID},3,,,,`;

export type ParentTestimonial = {
  quote: string;
  /** Parent name or initials, e.g. "R. Sharma" */
  author: string;
  /** Student class or batch, e.g. "Class 10" / "Class 12 Commerce" */
  group: string;
  /** Optional display date, e.g. "March 2026" */
  date?: string;
};

export const PARENT_TESTIMONIALS: ParentTestimonial[] = [
  // {
  //   quote: "Real parent quote here.",
  //   author: "R. Sharma",
  //   group: "Class 12 Commerce",
  //   date: "March 2026",
  // },
];
