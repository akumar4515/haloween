// Home-feed data layer.
//
// Lives apart from the page so the first render (server component) and every
// "Show more" request (route handler) build the feed through exactly the same
// code, instead of two implementations that can drift.

import {
  FEATURED_TERMS,
  FEATURED_PER_TERM,
  FEATURED_MAX,
  FEATURED_MATCHES_PER_TERM,
  FEATURED_TIMEOUT_MS,
  FEATURED_REVALIDATE_SECONDS,
  FEATURED_DIRECTORY_REVALIDATE_SECONDS,
} from "../config/featured";
import { FEED_PAGE_SIZE } from "../config/feed";

export { FEED_PAGE_SIZE } from "../config/feed";

function getApiBaseUrl() {
  const configured =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://halloween-backend-cria.onrender.com";
  const normalized = configured.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized.slice(0, -4) : normalized;
}

const NEWEST_KEYS = ["new", "newest", "latest", "recent"];

// Quick filters across the top of the feed, the way YouTube surfaces topics.
const normalizeParam = (value) => {
  if (Array.isArray(value)) {
    return normalizeParam(value[0]);
  }
  return value;
};

export const normalizeQuery = (value) => {
  if (Array.isArray(value)) {
    return normalizeQuery(value[0]);
  }
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  return NEWEST_KEYS.includes(trimmed.toLowerCase()) ? "newest" : value;
};



export async function fetchAffiliateVideos({ q, page = 1, perPage = 50 } = {}) {
  const baseUrl = getApiBaseUrl();

  q = normalizeQuery(q);
  const hasSearchQuery = q && q !== "newest" && q !== "free" && q !== "premium";

  try {
    // Construct URL properly
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    const apiUrl = hasSearchQuery
      ? `${normalizedBaseUrl}/api/affiliate/search`
      : `${normalizedBaseUrl}/api/affiliate/videos`;
    const url = new URL(apiUrl);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    if (hasSearchQuery) {
      url.searchParams.set("query", String(q));
    }

    const res = await fetch(url.toString(), { 
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read error');
      console.error(`API Error (${res.status}):`, errorText);
      console.error(`Failed URL: ${url.toString()}`);
      
      // If it's a 404, the backend might not be running or route not found
      if (res.status === 404) {
        console.warn('Backend server may not be running. Please start the backend server on port 5000.');
      }
      
      return { videos: [], pagination: { page, perPage, totalPages: 1, totalCount: null } };
    }
    
    const data = await res.json();
    
    if (data && data.success && data.data) {
      return {
        videos: Array.isArray(data.data) ? data.data : [],
        pagination: data.pagination || { page, perPage, totalPages: 1, totalCount: null }
      };
    }
    
    return { videos: [], pagination: { page, perPage, totalPages: 1, totalCount: null } };
  } catch (error) {
    console.error("Error fetching affiliate videos:", error);
    return { videos: [], pagination: { page, perPage, totalPages: 1, totalCount: null } };
  }
}

function normalizeDirectEpornerVideo(video) {
  if (!video || !(video.id || video.video_id)) return null;

  const id = String(video.id || video.video_id);
  const thumb =
    video.thumbnail_url ||
    video.thumb ||
    video.default_thumb?.src ||
    video.default_thumb ||
    video.thumbs?.[0]?.src ||
    video.thumbnail ||
    "";

  const embed =
    typeof video.embed_url === "string" && video.embed_url.includes("eporner.com")
      ? video.embed_url
      : typeof video.embed === "string" && video.embed.includes("eporner.com")
        ? video.embed
        : `https://www.eporner.com/embed/${encodeURIComponent(id)}/`;

  return {
    ...video,
    id,
    title: video.title || video.name || "Untitled",
    duration: Number(video.duration || video.length_sec || video.length) || 0,
    views: Number(video.views || video.view_count) || 0,
    video_url: video.video_url || video.url || embed,
    embed_url: embed,
    thumbnail_url: typeof thumb === "string" ? thumb : thumb?.src || "",
    raw: video.raw || video,
    __source: "eporner",
  };
}

async function fetchDirectEpornerVideos({ q, page, perPage }) {
  const query = q && q !== "newest" && q !== "free" && q !== "premium" ? q : "all";
  const url = new URL("https://www.eporner.com/api/v2/video/search/");
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(Math.min(100, perPage)));
  url.searchParams.set("thumbsize", "big");
  url.searchParams.set("order", q === "newest" ? "latest" : "most-popular");
  url.searchParams.set("format", "json");
  url.searchParams.set("gay", "0");
  url.searchParams.set("lq", "1");

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    throw new Error(`Direct Eporner request failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  return extractList(payload).map(normalizeDirectEpornerVideo).filter(Boolean);
}

export async function fetchVideos({ q, page = 1, perPage = 50 } = {}) {
  const baseUrl = getApiBaseUrl();
  q = normalizeQuery(q);

  try {
    const hasSearchQuery = q && q !== "newest" && q !== "free" && q !== "premium";
    const endpoint = hasSearchQuery ? "videos/search" : "videos";
    const searchUrl = new URL(`${baseUrl}/api/eporner/${endpoint}`);
    if (hasSearchQuery) {
      searchUrl.searchParams.set("query", String(q));
      searchUrl.searchParams.set("order", "mostviewed");
    }
    searchUrl.searchParams.set("page", String(page));
    searchUrl.searchParams.set("per_page", String(perPage));
    searchUrl.searchParams.set("thumbsize", "big");

    const response = await fetch(searchUrl.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (response.ok && (response.headers.get("content-type") || "").includes("application/json")) {
      const payload = await response.json();
      const videos = extractList(payload).map((video) => ({
        ...video,
        __source: "eporner",
      }));

      if (videos.length > 0) {
        const data = payload?.data ?? payload;
        return {
          videos,
          pagination: {
            page: Number(data?.page) || page,
            perPage: Number(data?.per_page) || perPage,
            totalPages: Number(data?.total_pages) || 1,
            totalCount: Number(data?.total_count ?? data?.count) || null,
          },
        };
      }
    }
  } catch (error) {
    console.warn("Halloween backend Eporner feed failed; trying direct Eporner API:", error?.message || error);
  }

  // Match the working Maal implementation: if the backend is unavailable or
  // returns an empty list, fall back to Eporner's JSON API from the server.
  try {
    const videos = await fetchDirectEpornerVideos({ q, page, perPage });
    return {
      videos,
      pagination: {
        page,
        perPage,
        totalPages: videos.length >= perPage ? page + 1 : page,
        totalCount: null,
      },
    };
  } catch (error) {
    console.error("Direct Eporner fallback failed:", error?.message || error);
    return {
      videos: [],
      pagination: { page, perPage, totalPages: 1, totalCount: null },
    };
  }
}

// Affiliate and eporner ids are both plain numbers and do overlap, so identity
// has to carry the source.
export const videoKey = (video) => `${video.__source || "unknown"}:${video.id}`;

const shuffleArray = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// A source that hangs must not hold up the home page, so every featured
// request is given its own deadline and is allowed to come back empty.
async function fetchJsonWithDeadline(url, revalidateSeconds) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEATURED_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: revalidateSeconds },
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    return await res.json();
  } catch {
    // Timeout, network failure, or malformed body — the line-up degrades to
    // whatever the other sources returned.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Both back ends wrap their payload differently; pull the array out of
// whichever shape came back.
function extractList(payload) {
  if (!payload) return [];
  const data = payload.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.videos)) return data.videos;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

const featuredApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

/**
 * Pornstar and channel name -> id directories.
 *
 * Names are resolved against these rather than through /affiliate/search on
 * purpose: that endpoint LIKE-scans five columns across a six-table join and
 * costs seconds per term, while an id lookup is indexed and returns in
 * milliseconds. The directories themselves change rarely, so they are cached
 * for much longer than the line-up.
 */
async function fetchAffiliateDirectory() {
  const apiRoot = featuredApiRoot();

  const [pornstars, channels] = await Promise.all([
    fetchJsonWithDeadline(
      `${apiRoot}/affiliate/pornstars`,
      FEATURED_DIRECTORY_REVALIDATE_SECONDS
    ),
    fetchJsonWithDeadline(
      `${apiRoot}/affiliate/channels`,
      FEATURED_DIRECTORY_REVALIDATE_SECONDS
    ),
  ]);

  return { pornstars: extractList(pornstars), channels: extractList(channels) };
}

// Prefer an exact name, and fall back to substring matches so a short handle
// like "BBC" still reaches "My BBC Addiction".
function resolveDirectoryIds(term, entries) {
  const wanted = term.trim().toLowerCase();
  if (!wanted) return [];

  const named = entries.filter((entry) => typeof entry?.name === "string");

  const exact = named.filter((entry) => entry.name.toLowerCase() === wanted);
  if (exact.length > 0) return exact.slice(0, 1).map((entry) => entry.id);

  return named
    .filter((entry) => entry.name.toLowerCase().includes(wanted))
    .slice(0, FEATURED_MATCHES_PER_TERM)
    .map((entry) => entry.id);
}

async function fetchFeaturedForTerm(term, directory) {
  const apiRoot = featuredApiRoot();

  const pornstarIds = resolveDirectoryIds(term, directory.pornstars);
  const channelIds = resolveDirectoryIds(term, directory.channels);

  const byId = [
    ...pornstarIds.map((id) => `${apiRoot}/affiliate/videos/pornstar/${id}`),
    ...channelIds.map((id) => `${apiRoot}/affiliate/videos/channel/${id}`),
  ].map((base) => {
    const url = new URL(base);
    url.searchParams.set("page", "1");
    url.searchParams.set("per_page", String(FEATURED_PER_TERM));
    return url.toString();
  });

  // Eporner has no id directory to consult, so it is searched by name.
  const epornerUrl = new URL(`${apiRoot}/eporner/videos/search`);
  epornerUrl.searchParams.set("query", term);
  epornerUrl.searchParams.set("order", "mostviewed");
  epornerUrl.searchParams.set("page", "1");
  epornerUrl.searchParams.set("per_page", String(FEATURED_PER_TERM));
  epornerUrl.searchParams.set("thumbsize", "big");

  const [affiliatePayloads, epornerPayload] = await Promise.all([
    Promise.all(
      byId.map((url) =>
        fetchJsonWithDeadline(url, FEATURED_REVALIDATE_SECONDS)
      )
    ),
    fetchJsonWithDeadline(
      epornerUrl.toString(),
      FEATURED_REVALIDATE_SECONDS
    ),
  ]);

  return [
    ...affiliatePayloads.flatMap((payload) =>
      extractList(payload).map((video) => ({ ...video, __source: "affiliate" }))
    ),
    ...extractList(epornerPayload).map((video) => ({
      ...video,
      __source: "eporner",
    })),
  ];
}

/**
 * The featured line-up: videos for each configured pornstar and channel,
 * interleaved a term at a time so every name in the list gets a spot near the
 * top rather than the first name filling the whole block.
 */
export async function fetchFeaturedVideos() {
  if (FEATURED_TERMS.length === 0) return [];

  let directory = { pornstars: [], channels: [] };
  try {
    directory = await fetchAffiliateDirectory();
  } catch {
    // Without the directory only eporner can contribute; still worth trying.
  }

  const perTerm = await Promise.all(
    FEATURED_TERMS.map(async (term) => {
      try {
        return await fetchFeaturedForTerm(term, directory);
      } catch {
        return [];
      }
    })
  );

  const featured = [];
  const seen = new Set();
  const depth = Math.max(0, ...perTerm.map((videos) => videos.length));

  // Round-robin: one video per name, then the next from each, and so on.
  for (let rank = 0; rank < depth && featured.length < FEATURED_MAX; rank += 1) {
    for (const videos of perTerm) {
      if (featured.length >= FEATURED_MAX) break;

      const video = videos[rank];
      if (!video) continue;

      const key = videoKey(video);
      if (seen.has(key)) continue;

      seen.add(key);
      featured.push({ ...video, __featured: true });
    }
  }

  return featured;
}

export const hasRealQuery = (q) => {
  const normalized = normalizeQuery(q);
  return Boolean(
    normalized &&
      normalized !== "newest" &&
      normalized !== "free" &&
      normalized !== "premium"
  );
};

/**
 * One batch of the home feed.
 *
 * The two sources paginate independently, so the cursor carries a page number
 * for each rather than a single feed-wide page. That keeps "Show more" exact:
 * a source is only advanced when it actually returned rows, so nothing is
 * skipped and nothing repeats — and if one source is empty or down, the other
 * is asked for more to still fill the batch.
 */
export async function fetchFeedPage({
  q,
  perPage = FEED_PAGE_SIZE,
  affiliatePage = 1,
  epornerPage = 1,
  includeFeatured = false,
} = {}) {
  const collected = [];
  const seen = new Set();

  let affPage = Number(affiliatePage) || 1;
  let epoPage = Number(epornerPage) || 1;
  let affiliateDone = false;
  let epornerDone = false;

  const push = (videos, source) => {
    let added = 0;
    for (const video of videos) {
      const tagged = { ...video, __source: source };
      const key = videoKey(tagged);
      if (seen.has(key)) continue;
      seen.add(key);
      collected.push(tagged);
      added += 1;
    }
    return added;
  };

  // Each source is always asked for the same number of rows per request, and
  // only its page number moves. Varying per_page between requests would make
  // "page 3" mean a different offset each time, which silently re-serves rows
  // that were already shown.
  const sourcePageSize = Math.max(1, Math.ceil(perPage / 2));

  // One balanced pass, then top-ups from whichever source still has rows —
  // so a dead or empty source does not halve the batch. Bounded so a thin
  // catalogue cannot spin.
  // Loop on rows *fetched*, not rows kept. Dedupe can shave a few rows off a
  // batch (the affiliate list endpoint overlaps between pages), and using the
  // kept count would spend a whole extra page chasing those few — turning a
  // 100-video batch into 150.
  let fetchedRows = 0;

  for (let round = 0; round < 4; round += 1) {
    if (fetchedRows >= perPage || (affiliateDone && epornerDone)) break;

    const wantAffiliate = !affiliateDone;
    const wantEporner = !epornerDone;

    const [affiliateResponse, epornerResponse] = await Promise.all([
      wantAffiliate
        ? fetchAffiliateVideos({ q, page: affPage, perPage: sourcePageSize })
        : Promise.resolve({ videos: [] }),
      wantEporner
        ? fetchVideos({ q, page: epoPage, perPage: sourcePageSize })
        : Promise.resolve({ videos: [] }),
    ]);

    const affiliateVideos = affiliateResponse?.videos || [];
    const epornerVideos = epornerResponse?.videos || [];

    if (wantAffiliate) {
      if (affiliateVideos.length === 0) affiliateDone = true;
      else affPage += 1;
    }
    if (wantEporner) {
      if (epornerVideos.length === 0) epornerDone = true;
      else epoPage += 1;
    }

    fetchedRows += affiliateVideos.length + epornerVideos.length;

    push(affiliateVideos, "affiliate");
    push(epornerVideos, "eporner");
  }

  // Deliberately not trimmed to perPage: the cursor points at the next unread
  // page of each source, so discarding rows here would skip them for good. A
  // batch is therefore "about perPage", occasionally a little over.
  let videos = shuffleArray(collected);

  // The featured line-up leads the very first batch. Its keys are excluded
  // from *every* batch — not just the first — so a pinned video never turns up
  // again further down the feed. The lookup is cached, so later batches pay
  // almost nothing for it.
  const featured = await fetchFeaturedVideos();
  const featuredKeys = new Set(featured.map(videoKey));
  videos = videos.filter((video) => !featuredKeys.has(videoKey(video)));

  return {
    videos,
    featured: includeFeatured ? featured : [],
    cursor: { affiliatePage: affPage, epornerPage: epoPage },
    hasMore: !(affiliateDone && epornerDone),
  };
}
