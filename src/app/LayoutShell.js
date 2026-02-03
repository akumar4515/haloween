"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import SearchBar from "./SearchBar";

export default function LayoutShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  return (
    <div className={styles.page}>
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

      <main className={styles.main}>
        <aside
          className={`${styles.sidebar} ${
            sidebarOpen ? styles.sidebarVisible : styles.sidebarHidden
          }`}
        >
          <div className={styles.authBox}>
            <h2 className={styles.sidebarTitle}>Welcome</h2>
            <p className={styles.sidebarText}>
              Sign in to like videos, comment, and subscribe to channels.
            </p>
            <div className={styles.authActions}>
              <button className={styles.primaryButton}>Log in</button>
              <button className={styles.secondaryButton}>Sign up</button>
            </div>
          </div>

          <nav className={styles.navSection}>
            <h3 className={styles.navTitle}>Browse</h3>
            <ul className={styles.navList}>
              <li>
                <Link href="/channels" className={styles.navLink}>
                  Channels
                </Link>
              </li>
              <li>
                <Link href="/categories" className={styles.navLink}>
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/actors" className={styles.navLink}>
                  Actors
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

