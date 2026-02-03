"use client";

import { useState } from "react";
import styles from "./watch.module.css";
import VideoCard from "../../components/VideoCard";

const INITIAL_COUNT = 12;
const LOAD_MORE_COUNT = 12;

export default function RecommendationsSection({ videos }) {
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT);

  const displayedVideos = videos.slice(0, displayCount);
  const hasMore = videos.length > displayCount;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + LOAD_MORE_COUNT);
  };

  if (videos.length === 0) return null;

  return (
    <section className={styles.recommendationsSection}>
      <h2 className={styles.recommendationsTitle}>Recommended Videos</h2>
      <div className={styles.recommendationsGrid}>
        {displayedVideos.map((recVideo) => (
          <VideoCard key={recVideo.id} video={recVideo} />
        ))}
      </div>
      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button
            onClick={handleLoadMore}
            className={styles.loadMoreButton}
          >
            Load More
          </button>
        </div>
      )}
    </section>
  );
}
