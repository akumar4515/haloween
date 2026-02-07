"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";
import AdminLogin from "./components/AdminLogin";
import TablesManager from "./components/TablesManager";
import FileUpload from "./components/FileUpload";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tables");
  const [tables, setTables] = useState([]);
  const router = useRouter();

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

  const fetchTables = async () => {
    try {
      const authData = localStorage.getItem("adminAuth");
      if (!authData) return;

      const credentials = btoa("flovex_admin:flovex.admin@00");
      const res = await fetch(`${API_BASE}/api/admin/tables`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTables(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  // All hooks must be called before any conditional returns
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTables();
    }
  }, [isAuthenticated]);

  const tabs = [
    { id: "tables", label: "Tables" },
    { id: "upload", label: "Upload File" },
  ];

  // Debug: Log to verify correct components are loaded
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Admin page loaded with tabs:', tabs.map(t => t.label));
      console.log('Active tab:', activeTab);
      console.log('Tables count:', tables.length);
    }
  }, [activeTab, tables, isAuthenticated]);

  const handleLoginSuccess = async (adminData) => {
    setIsAuthenticated(true);
    setAdmin(adminData);
    // Fetch tables for file upload
    await fetchTables();
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setAdmin(null);
    router.push("/");
  };

  // Conditional returns after all hooks
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

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.adminTitle}>Admin Panel</h1>
          <p className={styles.adminSubtitle}>Manage your content database</p>
          {admin?.username && (
            <p className={styles.adminEmail}>Logged in as: {admin.username}</p>
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
            onClick={() => {
              console.log('Tab clicked:', tab.id);
              setActiveTab(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === "tables" && <TablesManager />}
        {activeTab === "upload" && <FileUpload />}
      </div>
    </div>
  );
}

