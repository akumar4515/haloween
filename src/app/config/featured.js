// Featured line-up for the home feed.
//
// Videos matching these names are pulled to the top of the default home feed
// (no search query), in the order listed here. Everything else follows.
//
// Each name is resolved against the affiliate pornstar and channel directories
// (exact match first, then substring) and searched for on eporner. A name that
// matches nothing in either source simply contributes no videos, so entries can
// be added ahead of the catalogue catching up with them.

export const FEATURED_PORNSTARS = [
  "Emily Willis",
  "Lana Rhoades",
  "Mia Khalifa",
  "Dani Daniels",
  "Comatoeze",
  "Carolina Guerrero",
  "Leah Gotti",
  "Lena Paul",
];

export const FEATURED_CHANNELS = [
  "PornForce",
  "BBC",
];

// Pornstars lead, then channels — the order videos appear in the block.
export const FEATURED_TERMS = [...FEATURED_PORNSTARS, ...FEATURED_CHANNELS];

// Most videos taken from any single name, so one prolific name cannot crowd
// out the rest of the line-up.
export const FEATURED_PER_TERM = 4;

// Ceiling on the whole featured block. Matches beyond this stay in the normal
// feed rather than being dropped.
export const FEATURED_MAX = 40;

// When a name is not spelled exactly as the source spells it, at most this
// many near-matches are pulled in (e.g. "BBC" -> "My BBC Addiction").
export const FEATURED_MATCHES_PER_TERM = 2;

// A source that stops responding must not hold up the home page.
export const FEATURED_TIMEOUT_MS = 6000;

// The line-up changes rarely, so it is cached rather than refetched per request.
export const FEATURED_REVALIDATE_SECONDS = 300;

// The pornstar/channel name -> id directories change far more rarely still.
export const FEATURED_DIRECTORY_REVALIDATE_SECONDS = 3600;
