// Helper function to fetch videos from eporner API for sitemap
async function fetchVideosForSitemap(limit = 500) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  try {
    // Fetch recent/popular videos for sitemap
    const searchUrl = new URL(`${baseUrl}/api/eporner/videos`, "http://localhost");
    searchUrl.searchParams.set("page", "1");
    searchUrl.searchParams.set("per_page", String(limit));
    searchUrl.searchParams.set("thumbsize", "big");

    const res = await fetch(searchUrl.toString(), { 
      cache: "no-store",
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!res.ok) {
      console.error('Failed to fetch videos for sitemap:', res.status);
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
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/watch/${video.id}`,
      lastModified: video.added || video.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching videos for sitemap:', error);
    return [];
  }
}

export default async function sitemap() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const now = new Date().toISOString();

  // Fetch videos from eporner
  const videoPages = await fetchVideosForSitemap(500);

  // Static pages
  const staticPages = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
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
  const videoSitemapEntries = videoPages.map(video => ({
    url: video.url,
    lastModified: video.lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...videoSitemapEntries];
}

