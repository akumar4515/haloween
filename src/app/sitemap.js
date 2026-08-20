export const dynamic = "force-dynamic";

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

// Helper function to fetch videos from eporner API for sitemap
async function fetchEpornerVideosForSitemap(limit = 500) {
  const apiRoot = getApiRoot();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // Fetch recent/popular videos for sitemap
    const searchUrl = new URL(`${apiRoot}/eporner/videos`, "http://localhost");
    searchUrl.searchParams.set("page", "1");
    searchUrl.searchParams.set("per_page", String(limit));
    searchUrl.searchParams.set("thumbsize", "big");

    const res = await fetch(searchUrl.toString(), { 
      cache: "no-store",
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!res.ok) {
      console.error('Failed to fetch Eporner videos for sitemap:', res.status);
      return [];
    }

    const data = await res.json();

    if (!data.success || !data.data) {
      return [];
    }

    // Extract videos array
    let videos = [];
    if (Array.isArray(data.data)) {
      videos = data.data;
    } else if (data.data.videos && Array.isArray(data.data.videos)) {
      videos = data.data.videos;
    }

    return videos.map(video => ({
      id: video.id,
      url: `${siteUrl}/watch/${video.id}`,
      lastModified: video.added || video.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching Eporner videos for sitemap:', error);
    return [];
  }
}

// Helper function to fetch affiliate videos for sitemap
async function fetchAffiliateVideosForSitemap(limit = 500) {
  const apiRoot = getApiRoot();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // Fetch affiliate videos for sitemap
    const searchUrl = new URL(`${apiRoot}/affiliate/videos`, "http://localhost");
    searchUrl.searchParams.set("page", "1");
    searchUrl.searchParams.set("per_page", String(limit));

    const res = await fetch(searchUrl.toString(), { 
      cache: "no-store",
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!res.ok) {
      console.error('Failed to fetch affiliate videos for sitemap:', res.status);
      return [];
    }

    const data = await res.json();

    if (!data.success || !data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map(video => ({
      id: video.id,
      url: `${siteUrl}/affiliate/watch/${video.id}`,
      lastModified: video.published_at || video.created_at || new Date().toISOString(),
    }));
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
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

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
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const now = new Date().toISOString();

  // Fetch videos and taxonomy pages from both sources in parallel
  const [
    epornerVideos,
    affiliateVideos,
    categories,
    pornstars,
    channels,
  ] = await Promise.all([
    fetchEpornerVideosForSitemap(500),
    fetchAffiliateVideosForSitemap(500),
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

