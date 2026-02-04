import { Suspense } from "react";
import Link from "next/link";

// Reuse the same fetch function from the main page
const NEWEST_KEYS = ["new", "newest", "latest", "recent"];

const normalizeParam = (value) => {
  if (Array.isArray(value)) {
    return normalizeParam(value[0]);
  }
  return value;
};

const normalizeQuery = (value) => {
  if (Array.isArray(value)) {
    return normalizeQuery(value[0]);
  }
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  return NEWEST_KEYS.includes(trimmed.toLowerCase()) ? "newest" : value;
};

async function fetchVideos(searchParams = {}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  let { q } = searchParams;
  q = normalizeQuery(q);
  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 30; // Reduced for AMP performance

  try {
    const hasSearchQuery = q && q !== "newest" && q !== "free" && q !== "premium";
    const endpoint = hasSearchQuery ? "videos/search" : "videos";
    const searchUrl = new URL(`${baseUrl}/eporner/${endpoint}`, "http://localhost");

    if (hasSearchQuery) {
      searchUrl.searchParams.set("query", q);
      searchUrl.searchParams.set("order", "mostviewed");
    }

    searchUrl.searchParams.set("page", String(page));
    searchUrl.searchParams.set("per_page", String(perPage));
    searchUrl.searchParams.set("thumbsize", "medium"); // Smaller images for mobile

    const res = await fetch(searchUrl.toString(), { cache: "no-store" });

    let data = null;
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (isJson) {
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        if (!res.ok) {
          console.error(`API Error (${res.status}):`, await res.text().catch(() => 'Unable to read error'));
        }
        return [];
      }
    } else {
      console.error("Non-JSON response:", await res.text());
      return [];
    }

    let videos = [];

    if (data && data.success && data.data) {
      if (Array.isArray(data.data)) {
        videos = data.data;
      } else if (data.data.videos && Array.isArray(data.data.videos)) {
        videos = data.data.videos;
      } else if (data.data.data && Array.isArray(data.data.data)) {
        videos = data.data.data;
      } else if (data.data && typeof data.data === 'object' && data.data.id) {
        videos = [data.data];
      }
    } else if (data && data.data && Array.isArray(data.data)) {
      videos = data.data;
    } else if (data && Array.isArray(data)) {
      videos = data;
    }

    return videos;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
}

async function AMPVideoGrid({ searchParams }) {
  const videos = await fetchVideos(searchParams);
  const selectedQ = normalizeQuery(searchParams?.q) || "newest";

  const buildTagHref = (value) => {
    const sp = new URLSearchParams();
    if (value) sp.set("q", value);
    return `/?${sp.toString()}`;
  };

  if (!videos.length) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>No videos found. Try adjusting your search.</p>
      </div>
    );
  }

  return (
    <>
      {/* AMP-optimized tag bar */}
      <amp-selector
        class="tag-selector"
        layout="container"
        on="select:AMP.navigateTo(url=event.targetOption)"
      >
        {["newest", "free", "premium"].map((tag) => (
          <a
            key={tag}
            option={`/?q=${tag}`}
            className={`tag-chip ${selectedQ === tag ? 'active' : ''}`}
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              margin: '4px',
              borderRadius: '20px',
              backgroundColor: selectedQ === tag ? '#ff5f9c' : '#332b3c',
              color: '#f5f5f7',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </a>
        ))}
      </amp-selector>

      {/* AMP-optimized video grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '16px',
          padding: '16px'
        }}
      >
        {videos.map((video) => (
          <a
            key={video.id}
            href={`/amp/watch/${video.id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block'
            }}
          >
            <div
              style={{
                backgroundColor: '#1a141f',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'transform 0.2s'
              }}
            >
              {/* AMP Image with lazy loading */}
              <amp-img
                src={video.thumbnail_url || video.thumbnail || video.default_thumb?.src || ''}
                alt={video.title || 'Video thumbnail'}
                width="160"
                height="120"
                layout="responsive"
                style={{ display: 'block' }}
              >
                <div
                  placeholder
                  style={{
                    backgroundColor: '#15131c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#b2adb9',
                    fontSize: '14px'
                  }}
                >
                  Loading...
                </div>
              </amp-img>

              <div style={{ padding: '12px' }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    color: '#f5f5f7',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {video.title || "Untitled"}
                </h3>

                <div
                  style={{
                    fontSize: '12px',
                    color: '#b2adb9',
                    marginBottom: '4px'
                  }}
                >
                  {video.views ? `${video.views.toLocaleString()} views` : 'No views yet'}
                </div>

                {video.duration && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#7b7586',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginTop: '4px'
                    }}
                  >
                    {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

export default async function AMPHome({ searchParams }) {
  const params = await searchParams;

  return (
    <html amp lang="en">
      <head>
        <meta charSet="utf-8" />
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-img" src="https://cdn.ampproject.org/v0/amp-img-0.1.js"></script>
        <script async custom-element="amp-selector" src="https://cdn.ampproject.org/v0/amp-selector-0.1.js"></script>
        <title>Flovex - Free HD Adult Videos | AMP</title>
        <meta name="description" content="Watch free HD adult videos on Flovex. High-quality porn videos optimized for mobile." />
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
        <meta name="rating" content="RTA-5042-1996-1400-1577-RTA" />
        <meta name="content-rating" content="adult" />
        <style amp-boilerplate>{`body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`}</style>
        <noscript><style amp-boilerplate>{`body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`}</style></noscript>
        <style amp-custom>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #050507;
            color: #f5f5f7;
            line-height: 1.4;
          }
          .header {
            background-color: #050507;
            padding: 16px;
            border-bottom: 1px solid #262330;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          .logo {
            color: #ff5f9c;
            text-decoration: none;
            font-size: 24px;
            font-weight: bold;
          }
          .search-form {
            margin-top: 16px;
          }
          .search-input {
            width: 100%;
            padding: 12px;
            border: 1px solid #332b3c;
            border-radius: 8px;
            background-color: #09080b;
            color: #f5f5f7;
            font-size: 16px;
          }
          .search-input:focus {
            outline: none;
            border-color: #ff5f9c;
          }
        `}</style>
      </head>
      <body>
        <header className="header">
          <a href="/" className="logo">Flovex</a>
          <form action="/" method="get" className="search-form">
            <input
              type="text"
              name="q"
              placeholder="Search videos..."
              className="search-input"
            />
          </form>
        </header>

        <main>
          <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading videos...</div>}>
            <AMPVideoGrid searchParams={params || {}} />
          </Suspense>
        </main>
      </body>
    </html>
  );
}

// Force AMP validation
export const config = {
  amp: true,
};
