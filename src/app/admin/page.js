"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";
import AdminLogin from "./components/AdminLogin";
import VideosManager from "./components/VideosManager";
import ChannelsManager from "./components/ChannelsManager";
import CategoriesManager from "./components/CategoriesManager";
import ActorsManager from "./components/ActorsManager";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const authData = localStorage.getItem("adminAuth");
      if (authData) {
        const parsed = JSON.parse(authData);
        // Check if session is still valid (24 hours)
        const sessionAge = Date.now() - parsed.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (parsed.authenticated && sessionAge < maxAge) {
          setIsAuthenticated(true);
          setAdmin(parsed.admin);
        } else {
          // Session expired
          localStorage.removeItem("adminAuth");
        }
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      localStorage.removeItem("adminAuth");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (adminData) => {
    setIsAuthenticated(true);
    setAdmin(adminData);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setAdmin(null);
    router.push("/");
  };

  if (loading) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const tabs = [
    { id: "videos", label: "Videos" },
    { id: "channels", label: "Channels" },
    { id: "categories", label: "Categories" },
    { id: "actors", label: "Actors" },
  ];

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.adminTitle}>Admin Panel</h1>
          <p className={styles.adminSubtitle}>Manage your content database</p>
          {admin?.email && (
            <p className={styles.adminEmail}>Logged in as: {admin.email}</p>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${
              activeTab === tab.id ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === "videos" && <VideosManager />}
        {activeTab === "channels" && <ChannelsManager />}
        {activeTab === "categories" && <CategoriesManager />}
        {activeTab === "actors" && <ActorsManager />}
      </div>
    </div>
  );
}

