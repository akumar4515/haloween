"use client";

import { RECOMMENDATIONS_PAGE_SIZE } from "../config/feed";

import { useEffect, useState } from "react";
import AffiliateVideoCard from "./AffiliateVideoCard";
import styles from "../watch/[id]/watch.module.css";

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

export default function AffiliateRecommendations({ videoId, title = "Recommended Videos" }) {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async (pageToLoad) => {
    try {
      setLoading(true);
      const apiRoot = getApiRoot();
      const url = new URL(`${apiRoot}/affiliate/videos/${videoId}/recommendations`, "http://localhost");
      url.searchParams.set("page", String(pageToLoad));
      url.searchParams.set("per_page", String(RECOMMENDATIONS_PAGE_SIZE));

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      if (data && data.success) {
        const nextVideos = Array.isArray(data.data) ? data.data : [];
        setVideos((prev) => (pageToLoad === 1 ? nextVideos : [...prev, ...nextVideos]));
        setTotalPages(data.pagination?.totalPages || 1);
        setPage(pageToLoad);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchRecommendations(1);
    }
  }, [videoId]);

  return (
    <section className={styles.recommendationsSection}>
      <h2 className={styles.recommendationsTitle}>{title}</h2>
      {!videos.length && !loading ? (
        <div className={styles.emptyState}>
          <p>No recommendations yet.</p>
        </div>
      ) : (
        <>
          <div className={styles.recommendationsGrid}>
            {videos.map((video) => (
              <AffiliateVideoCard key={`rec-${video.id}`} video={video} />
            ))}
          </div>
          {page < totalPages && (
            <div className={styles.loadMoreContainer}>
              <button
                className={styles.loadMoreButton}
                onClick={() => fetchRecommendations(page + 1)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
