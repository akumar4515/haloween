"use client";

import { useFollow } from "../hooks/useFollow";
import { useUser } from "../contexts/UserContext";
import styles from "./FollowButton.module.css";

export default function FollowButton({ type, id, className = "" }) {
  const { isAuthenticated } = useUser();
  const { isFollowing, toggleFollow, loading, checking } = useFollow(type, id);

  if (!isAuthenticated) {
    return null; // Don't show button if not logged in
  }

  if (checking) {
    return (
      <button className={`${styles.followButton} ${styles.loading} ${className}`} disabled>
        ...
      </button>
    );
  }

  return (
    <button
      className={`${styles.followButton} ${
        isFollowing ? styles.following : styles.notFollowing
      } ${className}`}
      onClick={toggleFollow}
      disabled={loading}
    >
      {loading ? (
        "..."
      ) : isFollowing ? (
        <>
          <span className={styles.checkmark}>✓</span> Following
        </>
      ) : (
        "+ Follow"
      )}
    </button>
  );
}

