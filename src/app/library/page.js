"use client";

import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useWatchHistory } from "../hooks/useWatchHistory";
import Link from "next/link";
import styles from "./library.module.css";
import VideoCard from "../components/VideoCard";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function LibraryPage() {
  const { isAuthenticated, loading: authLoading, getAuthHeaders } = useUser();
  const { getWatchHistory, deleteWatchHistory } = useWatchHistory();
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadData();
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getWatchHistory(page, 20);
      if (result.success) {
        setWatchHistory(result.data || []);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (videoId) => {
    const result = await deleteWatchHistory(videoId);
    if (result.success) {
      setWatchHistory((prev) => prev.filter((item) => item.video.id !== videoId));
    }
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.notAuthenticated}>
          <h2>Please login to view your library</h2>
          <p>Sign in to see your watch history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Library</h1>
      </div>

      <div className={styles.content}>
        {watchHistory.length === 0 ? (
          <p className={styles.emptyState}>No watch history yet.</p>
        ) : (
          <>
            <div className={styles.grid}>
              {watchHistory.map((item) => (
                <div key={item.id} className={styles.historyItem}>
                  <VideoCard video={item.video} />
                  <div className={styles.historyMeta}>
                    <span className={styles.progress}>
                      {item.completed
                        ? "Completed"
                        : `Watched ${Math.floor(item.progress_seconds / 60)}m`}
                    </span>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteHistory(item.video.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

