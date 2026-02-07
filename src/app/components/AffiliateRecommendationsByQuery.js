"use client";

import { useState } from "react";
import AffiliateVideoCard from "./AffiliateVideoCard";
import styles from "../watch/[id]/watch.module.css";

const PAGE_SIZE = 20;

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export default function AffiliateRecommendationsByQuery({
  title = "Recommended Videos",
  initialVideos,
  query,
  initialPage,
  totalPages,
}) {
  const [videos, setVideos] = useState(initialVideos || []);
  const [page, setPage] = useState(initialPage || 1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    (totalPages || 1) > (initialPage || 1)
  );

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const apiRoot = getApiRoot();
      const nextPage = page + 1;
      const url = new URL(`${apiRoot}/affiliate/search`);
      if (query) {
        url.searchParams.set("query", query);
      }
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("per_page", String(PAGE_SIZE));

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      const newVideos = data?.success && Array.isArray(data.data) ? data.data : [];
      const nextTotalPages = data?.pagination?.totalPages || totalPages || 1;

      if (newVideos.length > 0) {
        setVideos((prev) => [...prev, ...newVideos]);
        setPage(nextPage);
        setHasMore(nextPage < nextTotalPages);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!videos.length) return null;

  return (
    <section className={styles.recommendationsSection}>
      <h2 className={styles.recommendationsTitle}>{title}</h2>
      <div className={styles.recommendationsGrid}>
        {videos.map((recVideo) => (
          <AffiliateVideoCard key={recVideo.id} video={recVideo} />
        ))}
      </div>
      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button
            onClick={loadMore}
            className={styles.loadMoreButton}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </section>
  );
}
