"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../page.module.css";
import { formatDuration } from "./formatters";

export default function AffiliateVideoCard({ video }) {
  const videoRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  const {
    id,
    title,
    thumbnail_url,
    trailer_url,
    duration,
    categories,
    pornstars,
    channels
  } = video;

  const videoThumbnail = thumbnail_url || "";
  const videoTitle = title || "";
  const videoDuration = duration || 0;

  // Two supporting lines at most, so cards stay the same height across the grid
  const castLine = pornstars && pornstars.length > 0 ? pornstars.join(", ") : "";
  const contextLine = [
    channels && channels.length > 0 ? channels.join(", ") : "",
    categories && categories.length > 0 ? categories.join(", ") : "",
  ]
    .filter(Boolean)
    .join(" • ");

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current && trailer_url) {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {
            setIsHovering(false);
          });
        }
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect fill='%23212121' width='400' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23aaaaaa' font-family='system-ui' font-size='14'%3ENo thumbnail%3C/text%3E%3C/svg%3E";

  return (
    <Link
      href={`/affiliate/watch/${id}`}
      className={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.thumbnailWrapper}>
        {trailer_url && isHovering ? (
          <video
            ref={videoRef}
            src={trailer_url}
            className={styles.videoPreview}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => {
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
              if (!e.target.src.includes("data:image/svg+xml")) {
                e.target.src = placeholderImage;
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
        <h3 className={`${styles.cardTitle} ${styles.affiliateTitle}`}>
          {videoTitle || "Untitled"}
        </h3>
        {castLine && <p className={styles.cardMeta}>{castLine}</p>}
        {contextLine && <p className={styles.cardChannel}>{contextLine}</p>}
      </div>
    </Link>
  );
}
