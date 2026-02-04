import { NextResponse } from 'next/server';

// Helper function to fetch videos for sitemap
async function fetchVideosForSitemap(limit = 1000) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // Fetch videos from the API (limit to recent/popular ones for sitemap)
    const searchUrl = new URL(`${baseUrl}/eporner/videos`, "http://localhost");
    searchUrl.searchParams.set("page", "1");
    searchUrl.searchParams.set("per_page", String(limit));
    searchUrl.searchParams.set("thumbsize", "big");

    const res = await fetch(searchUrl.toString(), { cache: "no-store" });

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
      title: video.title || 'Untitled Video',
      description: video.description || video.desc || video.title || '',
      thumbnail_url: video.thumbnail_url || video.thumbnail || video.default_thumb?.src || '',
      video_url: video.video_url || video.embed_url || '',
      duration: video.duration || video.length_sec || 0,
      views: video.views || video.view_count || 0,
      rating: video.rating || video.rate || 0,
      tags: video.tags || video.keywords || '',
      added: video.added || video.created_at || '',
      url: `${siteUrl}/watch/${video.id}`
    }));

  } catch (error) {
    console.error('Error fetching videos for sitemap:', error);
    return [];
  }
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    // Fetch videos for sitemap (limit to 1000 for performance)
    const videos = await fetchVideosForSitemap(1000);

    // Generate video sitemap XML
    const videoEntries = videos.map(video => {
      // Format duration in ISO 8601 (PT#H#M#S)
      const formatDuration = (seconds) => {
        if (!seconds || seconds <= 0) return '';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        let duration = 'PT';
        if (hours > 0) duration += `${hours}H`;
        if (minutes > 0) duration += `${minutes}M`;
        if (secs > 0) duration += `${secs}S`;
        return duration || '';
      };

      // Format publication date
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toISOString();
        } catch {
          return '';
        }
      };

      return `
  <url>
    <loc>${video.url}</loc>
    <lastmod>${formatDate(video.added) || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <video:video>
      <video:thumbnail_loc>${video.thumbnail_url}</video:thumbnail_loc>
      <video:title><![CDATA[${video.title}]]></video:title>
      <video:description><![CDATA[${video.description || video.title}]]></video:description>
      ${video.duration ? `<video:duration>${Math.floor(video.duration)}</video:duration>` : ''}
      ${video.views ? `<video:view_count>${video.views}</video:view_count>` : ''}
      ${video.rating ? `<video:rating>${parseFloat(video.rating)}</video:rating>` : ''}
      ${video.tags ? `<video:tag><![CDATA[${video.tags}]]></video:tag>` : ''}
      <video:publication_date>${formatDate(video.added) || new Date().toISOString()}</video:publication_date>
      <video:family_friendly>no</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
    </video:video>
  </url>`;
    }).join('');

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
        http://www.google.com/schemas/sitemap-video/1.1
        http://www.google.com/schemas/sitemap-video/1.1/sitemap-video.xsd">${videoEntries}
</urlset>`;

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating video sitemap:', error);

    // Return a minimal sitemap on error
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new NextResponse(errorXml, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
