"use client";

import { useState, useCallback } from "react";
import { useUser } from "../contexts/UserContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export function useWatchHistory() {
  const { getAuthHeaders, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addWatchHistory = useCallback(async (videoId, progressSeconds = 0, completed = false) => {
    if (!isAuthenticated) {
      return { success: false, error: "Not authenticated" };
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/user/watch-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          video_id: videoId,
          progress_seconds: progressSeconds,
          completed: completed,
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add watch history");
      }

      return { success: true, data: data.data };
    } catch (err) {
      const errorMessage = err.message || "Failed to add watch history";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders]);

  const getWatchHistory = useCallback(async (page = 1, limit = 50) => {
    if (!isAuthenticated) {
      return { success: false, error: "Not authenticated" };
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/user/watch-history?page=${page}&limit=${limit}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch watch history");
      }

      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch watch history";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders]);

  const getVideoWatchHistory = useCallback(async (videoId) => {
    if (!isAuthenticated) {
      return { success: false, error: "Not authenticated" };
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/user/watch-history/${videoId}`, {
        headers: getAuthHeaders(),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text}`);
      }

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          return { success: true, data: null };
        }
        throw new Error(data.error || "Failed to fetch watch history");
      }

      return { success: true, data: data.data };
    } catch (err) {
      const errorMessage = err.message || "Failed to fetch watch history";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders]);

  const deleteWatchHistory = useCallback(async (videoId) => {
    if (!isAuthenticated) {
      return { success: false, error: "Not authenticated" };
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/user/watch-history/${videoId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete watch history");
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || "Failed to delete watch history";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getAuthHeaders]);

  return {
    addWatchHistory,
    getWatchHistory,
    getVideoWatchHistory,
    deleteWatchHistory,
    loading,
    error,
  };
}

