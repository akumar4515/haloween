"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../page.module.css";
import { formatCount, formatDuration, formatRelativeDate } from "./formatters";

export default function VideoCard({ video }) {
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
    views,
    view_count,
    created_at,
    added,
  } = video;

  // Map API fields to expected fields
  // Backend now formats videos to have video_url, embed_url, and thumbnail_url
  const videoThumbnail = thumbnail_url || thumbnail || thumb || default_thumb ||
                         (video.raw && (video.raw.thumb || video.raw.default_thumb || video.raw.thumbnail)) || "";
  const videoTitle = title || "";
  const videoDuration = duration || 0;
  const videoViews = views || view_count || 0;
  const videoCreatedAt = created_at || added || null;

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

  // "1.2M views • 3 days ago", the way a viewer scans a shelf
  const metaParts = [
    videoViews > 0 ? `${formatCount(videoViews)} views` : "No views yet",
    formatRelativeDate(videoCreatedAt),
  ].filter(Boolean);

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
  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect fill='%23212121' width='400' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23aaaaaa' font-family='system-ui' font-size='14'%3ENo thumbnail%3C/text%3E%3C/svg%3E";

  return (
    <Link
      href={`/watch/${watchParam}`}
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
        {videoDuration ? (
          <span className={styles.duration}>
            {formatDuration(videoDuration)}
          </span>
        ) : null}
      </div>
      <div className={styles.cardBody}>
        <h3 className={`${styles.cardTitle} ${styles.epornerTitle}`}>
          {videoTitle || "Untitled"}
        </h3>
        <p className={styles.cardMeta}>{metaParts.join(" • ")}</p>
      </div>
    </Link>
  );
}
