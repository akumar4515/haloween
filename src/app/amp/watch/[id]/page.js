async function fetchVideo(id) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const url = new URL(`${baseUrl}/eporner/videos/${id}`, "http://localhost");
  url.searchParams.set("thumbsize", "big");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch video");
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(`Server returned non-JSON: ${await res.text()}`);
  }

  const data = await res.json();

  if (data.success && data.data) {
    if (data.data.id || data.data.title) {
      return data.data;
    } else if (data.data.video) {
      return data.data.video;
    }
  } else if (data.data) {
    return data.data;
  }

  return data.video || data || null;
}

async function fetchRecommendedVideos(currentVideo, page = 1) {
  if (!currentVideo) {
    return { videos: [], pagination: { page: 1, totalPages: 1 }, query: "" };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const searchUrl = new URL(`${baseUrl}/eporner/videos/search`, "http://localhost");

  // Use keywords first, then category/tags
  let recQuery = "";
  if (currentVideo.raw?.keywords) {
    const keywords = String(currentVideo.raw.keywords).split(",").map(k => k.trim()).filter(Boolean);
    if (keywords.length > 0) {
      recQuery = keywords[0];
      searchUrl.searchParams.set("query", recQuery);
    }
  } else if (currentVideo.category) {
    recQuery = currentVideo.category;
    searchUrl.searchParams.set("query", recQuery);
  } else if (currentVideo.tags) {
    const tags = String(currentVideo.tags).split(",").map(t => t.trim()).filter(Boolean);
    if (tags.length > 0) {
      recQuery = tags[0];
      searchUrl.searchParams.set("query", recQuery);
    }
  }

  searchUrl.searchParams.set("order", "mostviewed");
  searchUrl.searchParams.set("page", String(page));
  searchUrl.searchParams.set("per_page", "12");
  searchUrl.searchParams.set("thumbsize", "medium");

  const res = await fetch(searchUrl.toString(), { cache: "no-store" });
  if (!res.ok) {
    return { videos: [], pagination: { page, totalPages: 1 }, query: recQuery };
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return { videos: [], pagination: { page, totalPages: 1 }, query: recQuery };
  }

  const data = await res.json();

  let videos = [];
  let pagination = { page, totalPages: 1 };

  if (data.success && data.data) {
    if (Array.isArray(data.data)) {
      videos = data.data;
    } else if (data.data.videos && Array.isArray(data.data.videos)) {
      videos = data.data.videos;
      pagination = {
        page: Number(data.data.page) || page,
        totalPages: Number(data.data.total_pages) || 1,
      };
    } else if (data.data.data && Array.isArray(data.data.data)) {
      videos = data.data.data;
    }
  } else if (data.data && Array.isArray(data.data)) {
    videos = data.data;
  } else if (Array.isArray(data)) {
    videos = data;
  }

  return {
    videos: videos.filter(v => String(v.id) !== String(currentVideo.id)).slice(0, 12),
    pagination,
    query: recQuery,
  };
}

export default async function AMPWatchPage({ params }) {
  const { id } = await params;
  const video = await fetchVideo(id);

  if (!video) {
    return (
      <html amp lang="en">
        <head>
          <meta charSet="utf-8" />
          <script async src="https://cdn.ampproject.org/v0.js"></script>
          <title>Video Not Found | Flovex AMP</title>
        </head>
        <body>
          <div style={{ textAlign: 'center', padding: '40px', color: '#f5f5f7' }}>
            <h1>Video Not Found</h1>
            <p>This video could not be found.</p>
            <a href="/amp" style={{ color: '#ff5f9c' }}>← Back to Home</a>
          </div>
        </body>
      </html>
    );
  }

  const recommended = await fetchRecommendedVideos(video);

  const videoTitle = video.title || "Untitled Video";
  const videoDescription = video.description || video.desc || video.title || "";
  const videoThumbnail = video.thumbnail_url || video.thumbnail || video.default_thumb?.src || "";

  return (
    <html amp lang="en">
      <head>
        <meta charSet="utf-8" />
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-img" src="https://cdn.ampproject.org/v0/amp-img-0.1.js"></script>
        <script async custom-element="amp-video-iframe" src="https://cdn.ampproject.org/v0/amp-video-iframe-0.1.js"></script>
        <script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
        <title>{videoTitle} | Free HD Porn | Flovex AMP</title>
        <meta name="description" content={`${videoDescription.substring(0, 150)}... Watch free HD adult video on Flovex.`} />
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
        <meta name="rating" content="RTA-5042-1996-1400-1577-RTA" />
        <meta name="content-rating" content="adult" />
        <meta property="og:title" content={`${videoTitle} | Flovex`} />
        <meta property="og:description" content={videoDescription.substring(0, 200)} />
        <meta property="og:image" content={videoThumbnail} />
        <meta property="og:type" content="video.other" />
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
            font-size: 20px;
            font-weight: bold;
          }
          .back-link {
            color: #b2adb9;
            text-decoration: none;
            font-size: 14px;
            margin-left: 16px;
          }
          .video-container {
            padding: 16px;
          }
          .video-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
            color: #f5f5f7;
          }
          .video-meta {
            color: #b2adb9;
            font-size: 14px;
            margin-bottom: 16px;
          }
          .video-description {
            color: #f5f5f7;
            line-height: 1.6;
            margin-bottom: 16px;
          }
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 24px;
          }
          .tag {
            background-color: #332b3c;
            color: #f5f5f7;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            text-decoration: none;
          }
          .recommendations {
            padding: 16px;
            border-top: 1px solid #262330;
          }
          .rec-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #f5f5f7;
          }
          .rec-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
          }
          .rec-card {
            text-decoration: none;
            color: inherit;
          }
          .rec-card img {
            width: 100%;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
          }
          .rec-card-title {
            font-size: 12px;
            font-weight: 500;
            margin-top: 8px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </head>
      <body>
        <header className="header">
          <a href="/amp" className="logo">Flovex</a>
          <a href="/amp" className="back-link">← Back</a>
        </header>

        <main>
          <div className="video-container">
            {/* AMP Video Iframe */}
            <amp-video-iframe
              src={video.embed_url || video.video_url || ""}
              width="16"
              height="9"
              layout="responsive"
              autoplay="false"
              controls
              poster={videoThumbnail}
              style={{ marginBottom: '16px' }}
            >
              <div
                placeholder
                style={{
                  backgroundColor: '#15131c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b2adb9',
                  fontSize: '16px',
                  padding: '40px'
                }}
              >
                Loading video...
              </div>
            </amp-video-iframe>

            <h1 className="video-title">{videoTitle}</h1>

            <div className="video-meta">
              {video.views ? `${video.views.toLocaleString()} views` : 'No views yet'}
              {video.duration && ` • ${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}`}
            </div>

            {videoDescription && (
              <p className="video-description">{videoDescription}</p>
            )}

            {/* Tags */}
            {(video.tags || video.category) && (
              <div className="tags">
                {video.category && (
                  <a href={`/amp/?q=${encodeURIComponent(video.category)}`} className="tag">
                    #{video.category}
                  </a>
                )}
                {video.tags && String(video.tags).split(",").slice(0, 5).map((tag, index) => (
                  <a key={index} href={`/amp/?q=${encodeURIComponent(tag.trim())}`} className="tag">
                    #{tag.trim()}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          {recommended.videos.length > 0 && (
            <section className="recommendations">
              <h2 className="rec-title">Recommended Videos</h2>
              <div className="rec-grid">
                {recommended.videos.map((recVideo) => (
                  <a
                    key={recVideo.id}
                    href={`/amp/watch/${recVideo.id}`}
                    className="rec-card"
                  >
                    <amp-img
                      src={recVideo.thumbnail_url || recVideo.thumbnail || ''}
                      alt={recVideo.title || 'Video thumbnail'}
                      width="140"
                      height="100"
                      layout="responsive"
                    />
                    <div className="rec-card-title">
                      {recVideo.title || "Untitled"}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </main>
      </body>
    </html>
  );
}

