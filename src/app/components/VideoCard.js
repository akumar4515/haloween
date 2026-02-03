"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../page.module.css";

export default function VideoCard({ video }) {
  const router = useRouter();
  const {
    id,
    title,
    thumbnail_url,
    duration,
    channel_name,
    channel_slug,
    channel,
    views,
    created_at,
  } = video;

  const minutes = duration ? Math.floor(duration / 60) : null;
  const seconds = duration ? duration % 60 : null;

  // Get channel slug for linking - try multiple possible fields
  const channelSlug = channel?.slug || channel_slug || channel?.name || channel_name || "";
  const displayChannelName = channel_name || channel?.name || "Unknown channel";

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

  const handleCardClick = () => {
    router.push(`/watch/${id}`);
  };

  const handleChannelClick = (e) => {
    e.stopPropagation(); // Prevent navigation to video page
    if (channelSlug) {
      router.push(`/channels/${encodeURIComponent(channelSlug)}`);
    }
  };

  return (
    <div onClick={handleCardClick} className={styles.card}>
      <div className={styles.thumbnailWrapper}>
        {/* Use img instead of next/image to avoid extra config */}
        <img
          src={thumbnail_url || "/placeholder-thumbnail.jpg"}
          alt={title}
          className={styles.thumbnail}
        />
        {duration ? (
          <span className={styles.duration}>
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <p className={styles.cardMeta}>
          {channelSlug ? (
            <button
              type="button"
              onClick={handleChannelClick}
              className={styles.channelLink}
            >
              {displayChannelName}
            </button>
          ) : (
            displayChannelName
          )}{" "}
          • {typeof views === "number" ? `${views} views` : "No views yet"}
        </p>
        {created_at ? (
          <p className={styles.cardDate}>
            {formatDate(created_at)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
