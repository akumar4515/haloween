export const dynamic = "force-dynamic";

const getApiRoot = () => {
  const raw = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://halloween-backend-cria.onrender.com";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

// Helper function to fetch videos from eporner API for sitemap
async function fetchEpornerVideosForSitemap(limit = 50000) {
  const apiRoot = getApiRoot();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flovex.net";

  try {
    const videos = [];
    const seen = new Set();
    const pageSize = 100;
    for (let page = 1; videos.length < limit; page += 1) {
      const searchUrl = new URL(`${apiRoot}/eporner/videos`);
      searchUrl.searchParams.set("page", String(page));
      searchUrl.searchParams.set("per_page", String(pageSize));
      searchUrl.searchParams.set("thumbsize", "big");
      const res = await fetch(searchUrl.toString(), { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const payload = await res.json();
      const data = payload?.data ?? payload;
      const batch = Array.isArray(data) ? data : Array.isArray(data?.videos) ? data.videos : Array.isArray(data?.data) ? data.data : [];
      if (!batch.length) break;
      for (const video of batch) {
        if (!video?.id || seen.has(String(video.id))) continue;
        seen.add(String(video.id));
        videos.push({ id: video.id, url: `${siteUrl}/watch/${encodeURIComponent(String(video.id))}`, lastModified: video.added || video.created_at || new Date().toISOString() });
        if (videos.length >= limit) break;
      }
      if (batch.length < pageSize) break;
    }
    return videos;
  } catch (error) {
    console.error('Error fetching Eporner videos for sitemap:', error);
    return [];
  }
}

// Helper function to fetch affiliate videos for sitemap
async function fetchAffiliateVideosForSitemap(limit = 50000) {
  const apiRoot = getApiRoot();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flovex.net";

  try {
    const videos = [];
    const seen = new Set();
    const pageSize = 100;
    for (let page = 1; videos.length < limit; page += 1) {
      const searchUrl = new URL(`${apiRoot}/affiliate/videos`);
      searchUrl.searchParams.set("page", String(page));
      searchUrl.searchParams.set("per_page", String(pageSize));
      const res = await fetch(searchUrl.toString(), { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const payload = await res.json();
      const data = payload?.data ?? payload;
      const batch = Array.isArray(data) ? data : Array.isArray(data?.videos) ? data.videos : Array.isArray(data?.data) ? data.data : [];
      if (!batch.length) break;
      for (const video of batch) {
        if (!video?.id || seen.has(String(video.id))) continue;
        seen.add(String(video.id));
        videos.push({ id: video.id, url: `${siteUrl}/affiliate/watch/${encodeURIComponent(String(video.id))}`, lastModified: video.published_at || video.created_at || new Date().toISOString() });
        if (videos.length >= limit) break;
      }
      if (batch.length < pageSize) break;
    }
    return videos;
  } catch (error) {
    console.error('Error fetching affiliate videos for sitemap:', error);
    return [];
  }
}


// Taxonomy pages (categories, pornstars, channels) are real landing pages and
// often the strongest long-tail entry points, so they belong in the sitemap.
// A sitemap may carry 50,000 URLs; this ceiling only exists to keep one
// runaway table from crowding out the video entries.
async function fetchTaxonomyForSitemap(endpoint, routePrefix, limit = 10000) {
  const apiRoot = getApiRoot();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://flovex.net").replace(/\/+$/, "");

  try {
    const res = await fetch(`${apiRoot}/affiliate/${endpoint}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    if (!data?.success || !Array.isArray(data.data)) return [];

    return data.data
      .filter((entry) => entry?.id !== undefined && entry?.id !== null)
      .slice(0, limit)
      .map((entry) => ({
        url: `${siteUrl}${routePrefix}/${entry.id}`,
        lastModified: new Date().toISOString(),
      }));
  } catch (error) {
    console.error(`Error fetching ${endpoint} for sitemap:`, error);
    return [];
  }
}

export default async function sitemap() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://flovex.net";

  const now = new Date().toISOString();

  // Fetch videos and taxonomy pages from both sources in parallel
  const [
    epornerVideos,
    affiliateVideos,
    categories,
    pornstars,
    channels,
  ] = await Promise.all([
    fetchEpornerVideosForSitemap(5000),
    fetchAffiliateVideosForSitemap(5000),
    fetchTaxonomyForSitemap("categories", "/affiliate/category"),
    fetchTaxonomyForSitemap("pornstars", "/affiliate/pornstar"),
    fetchTaxonomyForSitemap("channels", "/affiliate/channel"),
  ]);

  // Static pages
  const staticPages = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/affiliate/categories`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/affiliate/pornstars`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/affiliate/channels`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms-and-conditions`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Video pages from eporner
  const epornerSitemapEntries = epornerVideos.map(video => ({
    url: video.url,
    lastModified: video.lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Video pages from affiliate
  const affiliateSitemapEntries = affiliateVideos.map(video => ({
    url: video.url,
    lastModified: video.lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const taxonomyEntries = [...categories, ...pornstars, ...channels].map(
    (entry) => ({
      url: entry.url,
      lastModified: entry.lastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );

  return [
    ...staticPages,
    ...taxonomyEntries,
    ...epornerSitemapEntries,
    ...affiliateSitemapEntries,
  ];
}

