import Link from "next/link";
import styles from "./watch.module.css";
import RecommendationsSection from "./RecommendationsSection";

// Helper function to detect and convert embedded URLs
function getEmbedUrl(url) {
  if (!url) return null;
  
  // Check if it's already an iframe embed URL
  if (url.includes('youtube.com/embed') || url.includes('youtu.be')) {
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // Check for Vimeo
  if (url.includes('vimeo.com')) {
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const match = url.match(vimeoRegex);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }
  
  // Check if it's already a full iframe embed URL
  if (url.includes('embed') || url.includes('player')) {
    return url;
  }
  
  // If it's a direct video URL, return null to use video tag
  return null;
}

function VideoPlayer({ videoUrl, thumbnailUrl, title }) {
  const embedUrl = getEmbedUrl(videoUrl);
  
  if (embedUrl) {
    // Use iframe for embedded videos
    return (
      <iframe
        className={styles.video}
        src={embedUrl}
        title={title || "Video player"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  
  // Use video tag for direct video URLs
  return (
    <video
      className={styles.video}
      src={videoUrl}
      controls
      poster={thumbnailUrl || undefined}
    />
  );
}

async function fetchVideo(id) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  // Reuse /videos list and filter client-side for simplicity; in a real app
  // you'd probably expose /videos/:id from your Express router.
  const url = new URL(`${baseUrl}/videos`, "http://localhost");
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "200");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch video");
  const data = await res.json();
  const videos = data.data ?? [];

  const numericId = Number(id);
  return videos.find((v) => v.id === numericId) ?? null;
}

async function fetchRecommendedVideos(currentVideo) {
  if (!currentVideo) return [];

  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  // Fetch all videos
  const url = new URL(`${baseUrl}/videos`, "http://localhost");
  url.searchParams.set("page", "1");
  url.searchParams.set("limit", "200");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const data = await res.json();
  const allVideos = data.data ?? [];

  // Get matching criteria
  const currentChannelSlug = currentVideo.channel?.slug || currentVideo.channel_slug || currentVideo.channel?.name || currentVideo.channel_name || "";
  const currentChannelName = currentVideo.channel_name || currentVideo.channel?.name || "";
  const currentCategory = currentVideo.category || "";
  const currentTags = currentVideo.tags ? String(currentVideo.tags).split(",").map(t => t.trim()).filter(Boolean) : [];
  const currentActorIds = currentVideo.actors && Array.isArray(currentVideo.actors) 
    ? currentVideo.actors.map(a => a?.id || a?.slug || a?.name).filter(Boolean)
    : [];

  const normalizeString = (value) => String(value ?? "").trim().toLowerCase();

  // Filter and score videos
  const scoredVideos = allVideos
    .filter(v => v.id !== currentVideo.id) // Exclude current video
    .map(video => {
      let score = 0;

      // Check channel match
      const videoChannelSlug = video.channel?.slug || video.channel_slug || video.channel?.name || video.channel_name || "";
      const videoChannelName = video.channel_name || video.channel?.name || "";
      if (currentChannelSlug && (
        normalizeString(videoChannelSlug) === normalizeString(currentChannelSlug) ||
        normalizeString(videoChannelName) === normalizeString(currentChannelName)
      )) {
        score += 3; // Channel match gets highest priority
      }

      // Check category match
      if (currentCategory && normalizeString(video.category) === normalizeString(currentCategory)) {
        score += 2;
      }

      // Check tag matches
      const videoTags = video.tags ? String(video.tags).split(",").map(t => t.trim()).filter(Boolean) : [];
      const matchingTags = currentTags.filter(tag => 
        videoTags.some(vTag => normalizeString(vTag) === normalizeString(tag))
      );
      score += matchingTags.length; // 1 point per matching tag

      // Check actor matches
      const videoActorIds = video.actors && Array.isArray(video.actors)
        ? video.actors.map(a => a?.id || a?.slug || a?.name).filter(Boolean)
        : [];
      const matchingActors = currentActorIds.filter(actorId =>
        videoActorIds.some(vActorId => normalizeString(String(vActorId)) === normalizeString(String(actorId)))
      );
      score += matchingActors.length; // 1 point per matching actor

      return { video, score };
    })
    .filter(item => item.score > 0) // Only include videos with at least one match
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .map(item => item.video); // Return all scored videos, not limited

  return scoredVideos;
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

  const recommendedVideos = await fetchRecommendedVideos(video);

  return (
    <div className={styles.main}>
      <section className={styles.playerSection}>
          <div className={styles.playerWrapper}>
            <VideoPlayer
              videoUrl={video.video_url}
              thumbnailUrl={video.thumbnail_url}
              title={video.title}
            />
          </div>
          <h1 className={styles.title}>{video.title}</h1>
          <div className={styles.meta}>
            {video.channel?.slug || video.channel_slug || video.channel?.name || video.channel_name ? (
              <Link
                href={`/channels/${encodeURIComponent(
                  video.channel?.slug || video.channel_slug || video.channel?.name || video.channel_name
                )}`}
                className={styles.channelLink}
              >
                {video.channel_name || video.channel?.name || "Unknown channel"}
              </Link>
            ) : (
              <span>{video.channel_name || "Unknown channel"}</span>
            )}{" "}
            • {typeof video.views === "number"
              ? `${video.views} views`
              : "No views yet"}
          </div>
          {video.description ? (
            <p className={styles.description}>{video.description}</p>
          ) : null}
          
          {/* Actors */}
          {video.actors && Array.isArray(video.actors) && video.actors.length > 0 ? (
            <div className={styles.actorsSection}>
              <span className={styles.sectionLabel}>Actors: </span>
              <div className={styles.actorsList}>
                {video.actors.map((actor, index) => {
                  const actorSlug = actor?.slug || actor?.name || "";
                  const actorName = actor?.name || actor?.slug || "Actor";
                  return (
                    <span key={actor?.id || index}>
                      {actorSlug ? (
                        <Link
                          href={`/actors/${encodeURIComponent(actorSlug)}`}
                          className={styles.actorLink}
                        >
                          {actorName}
                        </Link>
                      ) : (
                        <span>{actorName}</span>
                      )}
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
              <Link
                href={`/categories/${encodeURIComponent(video.category)}`}
                className={styles.tag}
              >
                #{video.category}
              </Link>
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

        {/* Recommended Videos */}
        {recommendedVideos.length > 0 && (
          <RecommendationsSection videos={recommendedVideos} />
        )}
    </div>
  );
}

