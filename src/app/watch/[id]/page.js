import Link from "next/link";
import styles from "./watch.module.css";
import RecommendationsSection from "./RecommendationsSection";
import VideoPlayerWithTracking from "../../components/VideoPlayerWithTracking";
import { ContentBanner } from "../../components/BannerAd";
import AdProviderBanner from "../../components/AdProviderBanner";
import { shouldShowAd, EXOCLICK_ZONES } from "../../config/ads";

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

  const recommended = await fetchRecommendedVideos(video);

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
            {video.channel_name || video.channel?.name ? (
              <span>{video.channel_name || video.channel?.name}</span>
            ) : null}
            {video.views || video.view ? (
              <span> • {typeof (video.views || video.view) === "number"
                ? `${(video.views || video.view).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} views`
                : "No views yet"}</span>
            ) : null}
          </div>
          {video.description || video.desc ? (
            <p className={styles.description}>{video.description || video.desc}</p>
          ) : null}
          
          {/* Actors */}
          {video.actors && Array.isArray(video.actors) && video.actors.length > 0 ? (
            <div className={styles.actorsSection}>
              <span className={styles.sectionLabel}>Actors: </span>
              <div className={styles.actorsList}>
                {video.actors.map((actor, index) => {
                  const actorName = actor?.name || actor?.slug || "Actor";
                  return (
                    <span key={actor?.id || index}>
                      <span>{actorName}</span>
                      {index < video.actors.length - 1 && <span>, </span>}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Category and Tags */}
          <div className={styles.tagsRow}>
            {video.category ? (
              <span className={styles.tag}>
                #{video.category}
              </span>
            ) : null}
            {video.tags
              ? String(video.tags)
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <Link
                      key={tag}
                      href={`/?q=${encodeURIComponent(tag)}`}
                      className={styles.tag}
                    >
                      #{tag}
                    </Link>
                  ))
              : null}
          </div>
        </section>

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
            initialVideos={recommended.videos}
            query={recommended.query}
            initialPage={recommended.pagination?.page || 1}
            totalPages={recommended.pagination?.totalPages || 1}
          />
        )}
    </div>
  );
}

