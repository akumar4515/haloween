import { fetchVideos, fetchAffiliateVideos } from "./lib/feed";

export const dynamic = "force-dynamic";

const DEFAULT_SITE_URL = "https://flovex.net";
const VIDEO_LIMIT = 500;
const PAGE_SIZE = 50;
const MAX_PAGES = 10;

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/+$/, "");
}

/**
 * Follow the same bounded pagination pattern as Maal's sitemap:
 * use the site's shared feed helper, normalize/dedupe IDs, and stop when
 * the source says there are no more results or returns a short page.
 */
async function fetchAllVideos(fetchPage, limit = VIDEO_LIMIT) {
  const videos = [];
  const seen = new Set();
  const maxPages = Math.min(MAX_PAGES, Math.ceil(limit / PAGE_SIZE));

  for (let page = 1; page <= maxPages && videos.length < limit; page += 1) {
    try {
      const result = await fetchPage(page);
      const batch = Array.isArray(result?.videos) ? result.videos : [];
      if (!batch.length) break;

      for (const video of batch) {
        const id = video?.id ?? video?.video_id ?? video?.raw?.id;
        if (id == null || String(id).trim() === "" || seen.has(String(id))) continue;

        seen.add(String(id));
        videos.push({ ...video, id: String(id) });
        if (videos.length >= limit) break;
      }

      const totalPages = Number(result?.pagination?.totalPages);
      if (
        batch.length < PAGE_SIZE ||
        (Number.isFinite(totalPages) && totalPages > 1 && page >= totalPages)
      ) {
        break;
      }
    } catch (error) {
      console.error("Sitemap video page fetch failed:", error);
      break;
    }
  }

  return videos;
}

function parseDate(value) {
  if (!value) return new Date();
  const date = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap() {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const [epornerVideos, affiliateVideos] = await Promise.all([
    fetchAllVideos((page) =>
      fetchVideos({ q: "", page, perPage: PAGE_SIZE })
    ),
    fetchAllVideos((page) =>
      fetchAffiliateVideos({ q: "", page, perPage: PAGE_SIZE })
    ),
  ]);

  const staticPages = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/affiliate/categories`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/affiliate/pornstars`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/affiliate/channels`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms-and-conditions`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/disclaimer`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const epornerEntries = epornerVideos.map((video) => ({
    url: `${siteUrl}/watch/${encodeURIComponent(String(video.id))}`,
    lastModified: parseDate(video.added || video.created_at || video.raw?.added),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const affiliateEntries = affiliateVideos.map((video) => ({
    url: `${siteUrl}/affiliate/watch/${encodeURIComponent(String(video.id))}`,
    lastModified: parseDate(video.published_at || video.created_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...epornerEntries, ...affiliateEntries];
}
