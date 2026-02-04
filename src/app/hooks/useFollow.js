"use client";

import { useState, useCallback, useEffect } from "react";
import { useUser } from "../contexts/UserContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export function useFollow(type, id) {
  const { getAuthHeaders, isAuthenticated } = useUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  // Check follow status on mount and when id changes
  useEffect(() => {
    if (isAuthenticated && type && id) {
      checkFollowStatus();
    } else {
      setIsFollowing(false);
    }
  }, [isAuthenticated, type, id]);

  const checkFollowStatus = useCallback(async () => {
    if (!isAuthenticated || !type || !id) {
      setIsFollowing(false);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`${API_BASE}/user/following/${type}/${id}`, {
        headers: getAuthHeaders(),
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          setIsFollowing(data.is_following);
        }
      }
    } catch (err) {
      console.error("Error checking follow status:", err);
    } finally {
      setChecking(false);
    }
  }, [isAuthenticated, type, id, getAuthHeaders]);

  const follow = useCallback(async () => {
    if (!isAuthenticated) {
      return { success: false, error: "Please login to follow" };
    }

    if (!type || !id) {
      return { success: false, error: "Type and ID are required" };
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/user/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ type, id }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to follow");
      }

      setIsFollowing(true);
      return { success: true, data: data.data };
    } catch (err) {
      const errorMessage = err.message || "Failed to follow";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, type, id, getAuthHeaders]);

  const unfollow = useCallback(async () => {
    if (!isAuthenticated) {
      return { success: false, error: "Please login to unfollow" };
    }

    if (!type || !id) {
      return { success: false, error: "Type and ID are required" };
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/user/follow`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ type, id }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to unfollow");
      }

      setIsFollowing(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || "Failed to unfollow";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, type, id, getAuthHeaders]);

  const toggleFollow = useCallback(async () => {
    if (isFollowing) {
      return await unfollow();
    } else {
      return await follow();
    }
  }, [isFollowing, follow, unfollow]);

  return {
    isFollowing,
    follow,
    unfollow,
    toggleFollow,
    loading,
    checking,
    error,
  };
}

