"use client";

import { useState } from "react";
import styles from "./watch.module.css";
import VideoCard from "../../components/VideoCard";

const PAGE_SIZE = 20;

export default function RecommendationsSection({
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
      const baseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
      const nextPage = page + 1;
      const url = new URL(`${baseUrl}/eporner/videos/search`, "http://localhost");
      if (query) {
        url.searchParams.set("query", query);
      }
      url.searchParams.set("order", "mostviewed");
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("per_page", String(PAGE_SIZE));
      url.searchParams.set("thumbsize", "big");

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      let newVideos = [];
      let nextTotalPages = totalPages || 1;

      if (data?.success && data?.data) {
        if (Array.isArray(data.data)) {
          newVideos = data.data;
        } else if (Array.isArray(data.data.videos)) {
          newVideos = data.data.videos;
          nextTotalPages = Number(data.data.total_pages) || nextTotalPages;
        } else if (Array.isArray(data.data.data)) {
          newVideos = data.data.data;
        }
      }

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
      <h2 className={styles.recommendationsTitle}>Recommended Videos</h2>
      <div className={styles.recommendationsGrid}>
        {videos.map((recVideo) => (
          <VideoCard key={recVideo.id} video={recVideo} />
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
