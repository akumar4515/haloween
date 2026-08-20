// Batch sizes for the feed and the recommendation rails.
//
// Kept in their own module (rather than in lib/feed.js) so the client
// components can import them without dragging the server-side fetching code
// into the browser bundle.

/** Videos in the home feed's first load, and in every "Show more" after it. */
export const FEED_PAGE_SIZE = 100;

/** Videos in a watch page's recommendations, per "Load more". */
export const RECOMMENDATIONS_PAGE_SIZE = 100;
