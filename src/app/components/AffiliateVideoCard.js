"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Image from "next/image";
import styles from "../page.module.css";

export default function AffiliateVideoCard({ video }) {
  const router = useRouter();
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

  const watchParam = String(id ?? "");

  const minutes = videoDuration ? Math.floor(videoDuration / 60) : null;
  const seconds = videoDuration ? videoDuration % 60 : null;

  const handleCardClick = () => {
    router.push(`/affiliate/watch/${id}`);
  };

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

  const placeholderImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect fill='%2315131c' width='400' height='225'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23b2adb9' font-family='system-ui' font-size='14'%3ENo thumbnail%3C/text%3E%3C/svg%3E";

  return (
    <div 
      onClick={handleCardClick} 
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
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
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
        {duration ? (
          <span className={styles.duration}>
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <div className={styles.cardBody}>
        <h3 className={`${styles.cardTitle} ${styles.affiliateTitle}`}>
          {videoTitle || "Untitled"}
        </h3>
        {pornstars && pornstars.length > 0 && (
          <p className={styles.cardMeta}>
            {pornstars.join(", ")}
          </p>
        )}
        {channels && channels.length > 0 && (
          <p className={styles.cardChannel}>
            Channels: {channels.join(", ")}
          </p>
        )}
        {categories && categories.length > 0 && (
          <p className={styles.cardDate}>
            {categories.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
