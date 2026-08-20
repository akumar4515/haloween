"use client";

import { useState } from "react";
import styles from "./watch.module.css";
import VideoCard from "../../components/VideoCard";

import { RECOMMENDATIONS_PAGE_SIZE } from "../../config/feed";

const PAGE_SIZE = RECOMMENDATIONS_PAGE_SIZE;

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export default function RecommendationsSection({
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
      const url = new URL(`${apiRoot}/eporner/videos/search`);
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
      <h2 className={styles.recommendationsTitle}>{title}</h2>
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
