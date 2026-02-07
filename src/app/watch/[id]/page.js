import { Metadata } from "next";
import styles from "./watch.module.css";
import RecommendationsSection from "./RecommendationsSection";
import AffiliateRecommendationsByQuery from "../../components/AffiliateRecommendationsByQuery";
import VideoPlayerWithTracking from "../../components/VideoPlayerWithTracking";
import AdProviderBanner from "../../components/AdProviderBanner";
import { shouldShowAd } from "../../config/ads";

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

// Helper function to detect and convert embedded URLs
function getEmbedUrl(url) {
  if (!url) return null;

  // If url is an iframe HTML string, extract src="..."
  const raw = String(url);
  const iframeSrcMatch = raw.match(/<iframe[^>]*\s+src=["']([^"']+)["'][^>]*>/i);
  const normalizedUrl = iframeSrcMatch?.[1] ? iframeSrcMatch[1] : raw;
  
  // Check if it's already an iframe embed URL
  if (normalizedUrl.includes('youtube.com/embed') || normalizedUrl.includes('youtu.be')) {
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/;
    const match = normalizedUrl.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // Check for Vimeo
  if (normalizedUrl.includes('vimeo.com')) {
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const match = normalizedUrl.match(vimeoRegex);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }
  
  // Check if it's already a full iframe embed URL
  if (normalizedUrl.includes('embed') || normalizedUrl.includes('player')) {
    return normalizedUrl;
  }
  
  // If it's a direct video URL, return null to use video tag
  return null;
}


async function fetchVideo(id) {
  const apiRoot = getApiRoot();

  // Use eporner API to fetch video by ID
  const url = new URL(`${apiRoot}/eporner/videos/${id}`);
  url.searchParams.set("thumbsize", "big");
  
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Failed to fetch video (${res.status}):`, url.toString());
    }
    return null;
  }
  
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    if (process.env.NODE_ENV === "development") {
      const text = await res.text();
      console.error("Server returned non-JSON:", text.substring(0, 200));
    }
    return null;
  }
  
  const data = await res.json();
  
  // Backend returns { success: true, data: ... }
  // The backend now formats the video to have video_url and thumbnail_url
  if (data.success && data.data) {
    // Check if data.data is the video object directly (formatted by backend)
    if (data.data.id || data.data.title) {
      // Log for debugging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Video data:', {
          id: data.data.id,
          title: data.data.title,
          video_url: data.data.video_url,
          thumbnail_url: data.data.thumbnail_url,
          hasRaw: !!data.data.raw
        });
      }
      return data.data;
    }
    // Check if data.data has nested video
    else if (data.data.video) {
      return data.data.video;
    }
  } else if (data.data) {
    // Fallback: if no success field but data exists
    return data.data;
  }
  
  return data.video || data || null;
}

async function fetchRecommendedVideos(currentVideo, page = 1) {
  if (!currentVideo) {
    return { videos: [], pagination: { page: 1, totalPages: 1 }, query: "" };
  }

  const apiRoot = getApiRoot();

  // Use eporner API for recommendations
  const searchUrl = new URL(`${apiRoot}/eporner/videos/search`);
  
  // Use keywords (preferred) or category/tags for recommendations
  let recQuery = "";
  const rawKeywords = currentVideo.keywords || currentVideo.raw?.keywords || "";
  const keywordList = String(rawKeywords)
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keywordList.length > 0) {
    recQuery = keywordList[0];
    searchUrl.searchParams.set("query", recQuery);
  } else if (currentVideo.category) {
    recQuery = currentVideo.category;
    searchUrl.searchParams.set("query", recQuery);
  } else if (currentVideo.tags) {
    const tags = String(currentVideo.tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length > 0) {
      recQuery = tags[0];
      searchUrl.searchParams.set("query", recQuery);
    }
  }
  
  searchUrl.searchParams.set("order", "mostviewed");
  searchUrl.searchParams.set("page", String(page));
  searchUrl.searchParams.set("per_page", "20");
  searchUrl.searchParams.set("thumbsize", "big");

  const res = await fetch(searchUrl.toString(), { cache: "no-store" });
  if (!res.ok) {
    return { videos: [], pagination: { page, totalPages: 1 }, query: recQuery };
  }

  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return { videos: [], pagination: { page, totalPages: 1 }, query: recQuery };
  }

  const data = await res.json();
  
  // Backend returns { success: true, data: ... }
  // The data field from eporner API might be an array or an object with videos array
  let videos = [];
  let pagination = { page, totalPages: 1 };
  
  if (data.success && data.data) {
    // Check if data.data is directly an array (from video/search)
    if (Array.isArray(data.data)) {
      videos = data.data;
    } 
    // Check if data.data has a videos property
    else if (data.data.videos && Array.isArray(data.data.videos)) {
      videos = data.data.videos;
      pagination = {
        page: Number(data.data.page) || page,
        totalPages: Number(data.data.total_pages) || 1,
      };
    }
    // Check if data.data has nested data
    else if (data.data.data && Array.isArray(data.data.data)) {
      videos = data.data.data;
    }
  } else if (data.data && Array.isArray(data.data)) {
    // Fallback: if no success field but data exists
    videos = data.data;
  } else if (Array.isArray(data)) {
    // Fallback: if response is directly an array
    videos = data;
  }
  
  // Exclude current video and limit to 20
  return {
    videos: videos.filter(v => String(v.id) !== String(currentVideo.id)),
    pagination,
    query: recQuery,
  };
}

async function fetchAffiliateRecommendationsByQuery(currentVideo, page = 1) {
  if (!currentVideo) {
    return { videos: [], pagination: { page: 1, totalPages: 1 }, query: "" };
  }

  const apiRoot = getApiRoot();
  const searchUrl = new URL(`${apiRoot}/affiliate/search`);
  let recQuery = "";

  const rawKeywords = currentVideo.keywords || currentVideo.raw?.keywords || "";
  const keywordList = String(rawKeywords)
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keywordList.length > 0) {
    recQuery = keywordList[0];
  } else if (currentVideo.category) {
    recQuery = currentVideo.category;
  } else if (currentVideo.tags) {
    const tags = String(currentVideo.tags)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length > 0) {
      recQuery = tags[0];
    }
  }

  if (recQuery) {
    searchUrl.searchParams.set("query", recQuery);
  }
  searchUrl.searchParams.set("page", String(page));
  searchUrl.searchParams.set("per_page", "20");

  const res = await fetch(searchUrl.toString(), { cache: "no-store" });
  if (!res.ok) {
    return { videos: [], pagination: { page, totalPages: 1 }, query: recQuery };
  }

  const data = await res.json();
  if (data && data.success) {
    return {
      videos: Array.isArray(data.data) ? data.data : [],
      pagination: data.pagination || { page, totalPages: 1 },
      query: recQuery
    };
  }

  return { videos: [], pagination: { page, totalPages: 1 }, query: recQuery };
}

// Generate SEO metadata from eporner video data
export async function generateMetadata({ params }) {
  const { id } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  try {
    const video = await fetchVideo(id);
    
    if (!video) {
      return {
        title: "Video Not Found | Flovex",
        description: "The requested video could not be found.",
      };
    }

    const title = video.title || video.title_clean || "Untitled Video";
    const description = video.description || video.desc || `Watch ${title} on Flovex. Free HD adult videos with fast streaming.`;
    const thumbnail = video.thumbnail_url || video.thumbnail || video.thumb || video.default_thumb || "/logo.png";
    const views = video.views || video.view || 0;
    const duration = video.duration || video.length_sec || 0;
    
    // Format duration
    const formatDuration = (seconds) => {
      if (!seconds) return "";
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const videoUrl = `${siteUrl}/watch/${id}`;
    const formattedDuration = formatDuration(duration);
    const viewsText = typeof views === "number" 
      ? `${views.toLocaleString()} views` 
      : views || "0 views";

    return {
      title: `${title} | Flovex`,
      description: description.length > 160 ? description.substring(0, 157) + "..." : description,
      keywords: video.keywords || video.tags || video.category || undefined,
      openGraph: {
        title: title,
        description: description,
        url: videoUrl,
        siteName: "Flovex",
        images: [
          {
            url: thumbnail,
            width: 1280,
            height: 720,
            alt: title,
          },
        ],
        type: "video.other",
        videos: [
          {
            url: video.video_url || video.embed_url || videoUrl,
            width: 1280,
            height: 720,
            type: "video/mp4",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description.length > 200 ? description.substring(0, 197) + "..." : description,
        images: thumbnail ? [thumbnail] : ["/logo.png"],
      },
      other: {
        "video:duration": duration ? String(duration) : undefined,
        "video:release_date": video.added || video.created_at || undefined,
        "video:view_count": String(views),
        "og:video:duration": formattedDuration,
      },
      alternates: {
        canonical: videoUrl,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Video | Flovex",
      description: "Watch free HD adult videos on Flovex.",
    };
  }
}

export default async function WatchPage({ params }) {
  const { id } = await params;
  const video = await fetchVideo(id);

  if (!video) {
    return (
      <div className={styles.main}>
        <p className={styles.notFound}>Video not found.</p>
      </div>
    );
  }

  const [recommended, affiliateRecommended] = await Promise.all([
    fetchRecommendedVideos(video),
    fetchAffiliateRecommendationsByQuery(video),
  ]);

  return (
    <div className={styles.main}>
      <section className={styles.playerSection}>
          <VideoPlayerWithTracking
            videoUrl={video.embed_url || video.video_url || video.url || video.embed || video.raw?.url || video.raw?.embed || ""}
            thumbnailUrl={video.thumbnail_url || video.thumbnail || video.thumb || video.default_thumb || video.raw?.thumb || video.raw?.default_thumb || ""}
            title={video.title || video.title_clean || "Untitled"}
            videoId={video.id}
          />
          <h1 className={styles.title}>{video.title || video.title_clean || "Untitled"}</h1>
          <div className={styles.meta}>
            {video.views || video.view ? (
              <span>{typeof (video.views || video.view) === "number"
                ? `${(video.views || video.view).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} views`
                : "No views yet"}</span>
            ) : (
              <span>No views yet</span>
            )}
          </div>
          {video.description || video.desc ? (
            <p className={styles.description}>{video.description || video.desc}</p>
          ) : null}
        </section>

        {/* Top Banner Ad - Shown after video player and info */}
        {shouldShowAd('WATCH_TOP_BANNER') && (
          <div className={styles.topBannerAdContainer}>
            <AdProviderBanner
              zoneId={
                process.env.NEXT_PUBLIC_ADPROVIDER_TOP_BANNER_ZONE_ID ||
                "5846058"
              }
              adClassName={
                process.env.NEXT_PUBLIC_ADPROVIDER_TOP_BANNER_CLASS ||
                "eas6a97888e2"
              }
            />
          </div>
        )}

        {/* Content Banner Ad */}
        {shouldShowAd('HOME_CONTENT_BANNER_2') && (
          <AdProviderBanner
            zoneId={
              process.env.NEXT_PUBLIC_ADPROVIDER_CONTENT_BANNER_2_ZONE_ID ||
              "5846064"
            }
            adClassName={
              process.env.NEXT_PUBLIC_ADPROVIDER_CONTENT_BANNER_2_CLASS ||
              "eas6a97888e2"
            }
          />
        )}

        {/* Recommended Videos */}
        {recommended?.videos?.length > 0 && (
          <RecommendationsSection
            title="Recommended Videos"
            initialVideos={recommended.videos}
            query={recommended.query}
            initialPage={recommended.pagination?.page || 1}
            totalPages={recommended.pagination?.totalPages || 1}
          />
        )}
        {affiliateRecommended?.videos?.length > 0 && (
          <AffiliateRecommendationsByQuery
            title="Affiliate Recommended Videos"
            initialVideos={affiliateRecommended.videos}
            query={affiliateRecommended.query}
            initialPage={affiliateRecommended.pagination?.page || 1}
            totalPages={affiliateRecommended.pagination?.totalPages || 1}
          />
        )}
    </div>
  );
}

