"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import SearchBar from "./SearchBar";
import AgeVerification from "./components/AgeVerification";
import UserAuth from "./components/UserAuth";
import { TopBanner, MobileBanner, ContentBanner } from "./components/BannerAd";
import { shouldShowAd, EXOCLICK_ZONES } from "./config/ads";

export default function LayoutShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInitialQuery(params.get("q") || "");
  }, []);

  return (
    <div className={styles.page}>
      <AgeVerification />
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <img
            src="/logo.png"
            alt="VidStream logo"
            className={styles.logoImage}
          />
        </Link>

        <SearchBar initialQuery={initialQuery} />

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? (
            <span className={styles.menuClose}>×</span>
          ) : (
            <>
              <span className={styles.menuIconLine} />
              <span className={styles.menuIconLine} />
              <span className={styles.menuIconLine} />
            </>
          )}
        </button>
      </header>

      {/* Top Banner Ad */}
      {shouldShowAd('HOME_TOP_BANNER') && (
        <div className={styles.topAdContainer}>
          <TopBanner zoneId={EXOCLICK_ZONES.TOP_BANNER} />
        </div>
      )}

      {/* Mobile Banner Ad */}
      {shouldShowAd('HOME_MOBILE_BANNER') && (
        <div className={styles.mobileAdContainer}>
          <MobileBanner zoneId={EXOCLICK_ZONES.MOBILE_BANNER} />
        </div>
      )}

      <main className={styles.main}>
        {sidebarOpen && (
          <div
            className={styles.sidebarBackdrop}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`${styles.sidebar} ${
            sidebarOpen ? styles.sidebarVisible : styles.sidebarHidden
          }`}
        >
          <button
            type="button"
            className={styles.sidebarCloseButton}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <span className={styles.sidebarCloseIcon}>×</span>
          </button>

          <UserAuth />

          {/* Sidebar Banner Ad */}
          {shouldShowAd('WATCH_SIDEBAR_BANNER') && (
            <div className={styles.sidebarAd}>
              <ContentBanner zoneId={EXOCLICK_ZONES.CONTENT_BANNER_1} />
            </div>
          )}

          <nav className={styles.navSection}>
            <h3 className={styles.navTitle}>Browse</h3>
            <ul className={styles.navList}>
              <li>
                <Link href="/" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
                  Home
                </Link>
              </li>
            </ul>
          </nav>

          <nav className={styles.navSection}>
            <h3 className={styles.navTitle}>Library</h3>
            <ul className={styles.navList}>
              <li>
                <Link href="/library" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
                  My Library
                </Link>
              </li>
            </ul>
          </nav>

          <nav className={styles.navSection}>
            <h3 className={styles.navTitle}>Legal</h3>
            <ul className={styles.navList}>
              <li>
                <Link href="/privacy-policy" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className={styles.navLink} onClick={() => setSidebarOpen(false)}>
                  Disclaimer
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}

