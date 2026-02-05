"use client";

import { useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import styles from "./UserAuth.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function UserAuth({ onAuthChange }) {
  const { user, loading, logout } = useUser();

  useEffect(() => {
    if (onAuthChange) {
      onAuthChange(user);
    }
  }, [user, onAuthChange]);

  const handleGoogleLogin = () => {
    // Get Google OAuth URL from backend
    const googleAuthUrl = `${API_BASE}/api/auth/google`;
    localStorage.setItem("authReturnTo", window.location.href);

    // Use full-page redirect to avoid popup/COOP issues
    window.location.href = googleAuthUrl;
  };

  const handleLogout = () => {
    logout();
    if (onAuthChange) onAuthChange(null);
  };

  if (loading) {
    return (
      <div className={styles.authBox}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className={styles.authBox}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user.profile_pic ? (
              <img src={user.profile_pic} alt={user.name} />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase() || "U"}</span>
            )}
          </div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>{user.name || user.email}</p>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className={styles.authBox}>
      <h2 className={styles.authTitle}>Welcome</h2>
      <p className={styles.authText}>
        Sign in to like videos, comment, and subscribe to channels.
      </p>
      <div className={styles.authActions}>
        <button
          className={styles.googleButton}
          onClick={handleGoogleLogin}
        >
          <svg
            className={styles.googleIcon}
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

