"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function AdminLogin({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Normalize URL - remove trailing slashes
      const normalizedBase = API_BASE.replace(/\/+$/, '');
      const url = `${normalizedBase}/api/admin/auth`;
      
      console.log('Attempting login to:', url);
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        console.error("Request URL:", url);
        
        if (res.status === 404) {
          setError(`Backend route not found. Please check if the backend server is running at ${normalizedBase}`);
        } else if (res.status === 0 || res.status >= 500) {
          setError("Backend server error or not accessible. Please check the server status.");
        } else {
          setError(`Server error (${res.status}): ${text.substring(0, 100)}`);
        }
        return;
      }

      const data = await res.json();

      if (res.ok && data.success) {
        // Store admin session
        localStorage.setItem("adminAuth", JSON.stringify({
          authenticated: true,
          admin: data.admin,
          timestamp: Date.now(),
        }));

        // Call success callback
        if (onLoginSuccess) {
          onLoginSuccess(data.admin);
        }
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError(`Failed to connect to backend server at ${API_BASE}. Please check if the server is running and accessible.`);
      } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
        setError("Network error: Unable to reach the backend server. Please check your internet connection and server status.");
      } else {
        setError(`Connection error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <h1 className={styles.loginTitle}>Admin Login</h1>
        <p className={styles.loginSubtitle}>Enter your credentials to access the admin panel</p>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="flovex_admin"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

