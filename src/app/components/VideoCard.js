"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Image from "next/image";
import styles from "../page.module.css";

export default function VideoCard({ video }) {
  const router = useRouter();
  const videoRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // Handle different field names from API
  const {
    id,
    slug,
    title,
    thumbnail_url,
    thumbnail,
    thumb,
    default_thumb,
    video_url,
    embed_url,
    duration,
    channel_name,
    channel_slug,
    channel,
    channel_id,
    views,
    view_count,
    created_at,
    added,
    category,
    categories,
    actors,
    stars,
    performers,
  } = video;

  // Map API fields to expected fields
  // Backend now formats videos to have video_url, embed_url, and thumbnail_url
  const videoThumbnail = thumbnail_url || thumbnail || thumb || default_thumb || 
                         (video.raw && (video.raw.thumb || video.raw.default_thumb || video.raw.thumbnail)) || "";
  const videoTitle = title || "";
  const videoDuration = duration || 0;
  const videoViews = views || view_count || 0;
  const videoCreatedAt = created_at || added || null;
  const videoCategory = category || (categories && Array.isArray(categories) ? categories[0] : null) || null;
  const videoActors = actors || stars || performers || [];

  // Extract video URL for preview - need direct video file URL, not embed
  // Backend formats video_url (for embed) and embed_url, but we need direct video file for preview
  // Eporner typically doesn't provide direct video file URLs, so we'll use thumbnail for preview
  const getVideoPreviewUrl = () => {
    // Check for direct video file URLs first
    const directUrl = video_url || 
                      (video.raw && (video.raw.mp4 || video.raw.webm || video.raw.url || video.raw.src)) || "";
    
    if (directUrl) {
      const urlStr = String(directUrl);
      
      // Check if it's a direct video file URL (mp4, webm, etc.)
      if (urlStr.match(/\.(mp4|webm|ogg|mov|m3u8)(\?|$)/i)) {
        return urlStr;
      }
      
      // If it's not an embed URL and starts with http, might be a direct video
      if (urlStr.startsWith("http") && !urlStr.includes("embed") && !urlStr.includes("<iframe")) {
        return urlStr;
      }
    }
    
    // Eporner embed URLs won't work with <video> tag for preview
    // Return null to use thumbnail instead
    return null;
  };
  
  const videoPreviewUrl = getVideoPreviewUrl();

  const watchParam = (() => {
    const idStr = String(id ?? "");
    if (/^\\d+$/.test(idStr)) return idStr;
    if (slug) return encodeURIComponent(String(slug));
    return encodeURIComponent(idStr);
  })();

  const minutes = videoDuration ? Math.floor(videoDuration / 60) : null;
  const seconds = videoDuration ? videoDuration % 60 : null;

  // Get channel name for display (no linking)
  let displayChannelName = "";
  
  if (channel) {
    if (typeof channel === "string") {
      displayChannelName = channel;
    } else if (typeof channel === "object") {
      displayChannelName = channel?.name || channel?.slug || channel?.title || "";
    }
  }
  
  if (!displayChannelName) {
    displayChannelName = channel_name || channel_slug || "";
  }

  // Format date consistently to avoid hydration mismatches
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${month}/${day}/${year}`;
    } catch {
      return "";
    }
  };

  // Format number consistently to avoid hydration mismatches
  // Use manual formatting instead of toLocaleString to ensure server/client consistency
  const formatNumber = (num) => {
    if (typeof num !== "number" || num <= 0) return "0";
    // Manual formatting to avoid locale differences between server and client
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleCardClick = () => {
    router.push(`/watch/${watchParam}`);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && videoPreviewUrl) {
      // Small delay to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {
            // Ignore play errors (autoplay restrictions, etc.)
            setIsHovering(false); // Fall back to thumbnail if play fails
          });
        }
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset to beginning
    }
  };

  // Create a data URI placeholder for missing thumbnails
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect fill='%2315131c' width='400' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23b2adb9' font-family='system-ui' font-size='14'%3ENo thumbnail%3C/text%3E%3C/svg%3E";

  return (
    <div 
      onClick={handleCardClick} 
      className={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.thumbnailWrapper}>
        {/* Show video preview on hover if available, thumbnail otherwise */}
        {videoPreviewUrl && isHovering ? (
          <video
            ref={videoRef}
            src={videoPreviewUrl}
            className={styles.videoPreview}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => {
              // If video fails to load, fall back to thumbnail
              setIsHovering(false);
            }}
          />
        ) : (
        <Image
            src={videoThumbnail || placeholderImage}
            alt={videoTitle}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={styles.thumbnail}
            onError={(e) => {
              // Prevent infinite loop by checking if already using placeholder
              if (!e.target.src.includes("data:image/svg+xml")) {
                // Try raw data thumbnail as fallback
                if (video.raw && video.raw.thumb) {
                  e.target.src = video.raw.thumb;
                } else {
                  e.target.src = placeholderImage;
                }
              }
            }}
            priority={false}
            loading="lazy"
        />
        )}
        {duration ? (
          <span className={styles.duration}>
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{videoTitle || "Untitled"}</h3>
        <p className={styles.cardMeta}>
          {displayChannelName ? `${displayChannelName} • ` : ""}
          {typeof videoViews === "number" && videoViews > 0 ? `${formatNumber(videoViews)} views` : "No views yet"}
        </p>
        {videoCreatedAt ? (
          <p className={styles.cardDate}>
            {formatDate(videoCreatedAt)}
          </p>
        ) : null}
        {(videoCategory || (videoActors && Array.isArray(videoActors) && videoActors.length > 0)) && (
          <div className={styles.cardTags}>
            {videoCategory && (
              <span className={styles.cardTag}>
                {videoCategory}
              </span>
            )}
            {videoActors && Array.isArray(videoActors) && videoActors.length > 0 && (
              <span className={styles.cardActors}>
                {videoActors.slice(0, 2).map((actor, index) => {
                  // Handle actor as string or object
                  let actorName = "Actor";
                  
                  if (typeof actor === "string") {
                    actorName = actor;
                  } else if (typeof actor === "object") {
                    actorName = actor?.name || actor?.slug || actor?.title || "Actor";
                  }
                  
                  return (
                    <span key={actor?.id || actor?.slug || actor?.name || index}>
                      <span>{actorName}</span>
                      {index < Math.min(videoActors.length, 2) - 1 && <span>, </span>}
                    </span>
                  );
                })}
                {videoActors.length > 2 && (
                  <span className={styles.cardMoreActors}> +{videoActors.length - 2}</span>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
