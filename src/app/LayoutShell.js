"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./page.module.css";
import SearchBar from "./SearchBar";
import AgeVerification from "./components/AgeVerification";
import AdProviderBanner from "./components/AdProviderBanner";
import { shouldShowAd } from "./config/ads";
import Footer from "./components/Footer";
import SidebarSections from "./components/SidebarSections";
import {
  MenuIcon,
  SearchIcon,
  BackIcon,
  HomeIcon,
  CategoryIcon,
  StarIcon,
  ChannelIcon,
  ShieldIcon,
  DocIcon,
  InfoIcon,
} from "./components/Icons";

const BOTTOM_NAV = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/affiliate/categories", label: "Categories", Icon: CategoryIcon },
  { href: "/affiliate/pornstars", label: "Pornstars", Icon: StarIcon },
  { href: "/affiliate/channels", label: "Channels", Icon: ChannelIcon },
];

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy", Icon: ShieldIcon },
  { href: "/terms-and-conditions", label: "Terms and Conditions", Icon: DocIcon },
  { href: "/disclaimer", label: "Disclaimer", Icon: InfoIcon },
];

export default function LayoutShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInitialQuery(params.get("q") || "");
  }, []);

  // Esc backs out of whichever overlay is open
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setSidebarOpen(false);
      setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lock background scroll while the drawer covers the page on small screens
  useEffect(() => {
    const isOverlay =
      sidebarOpen &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches;

    document.body.style.overflow = isOverlay ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <div className={styles.page}>
      <AgeVerification />

      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>

      <header
        className={`${styles.header} ${searchOpen ? styles.searchOpen : ""}`}
      >
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
          >
            <MenuIcon />
          </button>

          <Link href="/" className={styles.logo} aria-label="Flovex home">
            <img src="/logo.png" alt="Flovex" className={styles.logoImage} />
          </Link>
        </div>

        <button
          type="button"
          className={`${styles.iconButton} ${styles.searchBack}`}
          onClick={() => setSearchOpen(false)}
          aria-label="Close search"
        >
          <BackIcon />
        </button>

        <SearchBar initialQuery={initialQuery} autoFocus={searchOpen} />

        <div className={styles.headerRight}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.searchToggle}`}
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            aria-expanded={searchOpen}
          >
            <SearchIcon />
          </button>
        </div>
      </header>

      {/* Top Banner Ad */}
      {shouldShowAd("HOME_TOP_BANNER") && (
        <div className={styles.topAdContainer}>
          <AdProviderBanner />
        </div>
      )}

      {/* Mobile Banner Ad */}
      {shouldShowAd("HOME_MOBILE_BANNER") && (
        <div className={styles.mobileAdContainer}>
          <AdProviderBanner
            zoneId={
              process.env.NEXT_PUBLIC_ADPROVIDER_MOBILE_BANNER_ZONE_ID ||
              "5846066"
            }
            adClassName={
              process.env.NEXT_PUBLIC_ADPROVIDER_MOBILE_BANNER_CLASS ||
              "eas6a97888e10"
            }
          />
        </div>
      )}

      <div className={styles.main}>
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
          aria-label="Main navigation"
          aria-hidden={!sidebarOpen}
        >
          <nav className={styles.navSection}>
            <ul className={styles.navList}>
              <li>
                <Link
                  href="/"
                  className={`${styles.navLink} ${
                    isActive("/") ? styles.navLinkActive : ""
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <HomeIcon className={styles.navIcon} />
                  Home
                </Link>
              </li>
            </ul>
          </nav>

          <SidebarSections onLinkClick={() => setSidebarOpen(false)} />

          <nav className={styles.navSection}>
            <h3 className={styles.navTitle}>Legal</h3>
            <ul className={styles.navList}>
              {LEGAL_LINKS.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`${styles.navLink} ${
                      isActive(href) ? styles.navLinkActive : ""
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={styles.navIcon} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar Banner Ad */}
          {shouldShowAd("WATCH_SIDEBAR_BANNER") && (
            <div className={styles.sidebarAd}>
              <AdProviderBanner
                zoneId={
                  process.env.NEXT_PUBLIC_ADPROVIDER_SIDEBAR_BANNER_ZONE_ID ||
                  "5846060"
                }
                adClassName={
                  process.env.NEXT_PUBLIC_ADPROVIDER_SIDEBAR_BANNER_CLASS ||
                  "eas6a97888e2"
                }
              />
            </div>
          )}
        </aside>

        <main className={styles.content} id="main-content">
          {children}
        </main>
      </div>

      {/* Bottom Banner Ad — the one in-content slot every page carries,
          including the browse lists and the legal pages. */}
      {shouldShowAd("FOOTER_BANNER") && (
        <div className={styles.bottomAdContainer}>
          <AdProviderBanner
            zoneId={
              process.env.NEXT_PUBLIC_ADPROVIDER_FOOTER_BANNER_ZONE_ID ||
              "5846062"
            }
            adClassName={
              process.env.NEXT_PUBLIC_ADPROVIDER_FOOTER_BANNER_CLASS ||
              "eas6a97888e2"
            }
          />
        </div>
      )}

      <Footer />

      <nav className={styles.bottomNav} aria-label="Quick navigation">
        <div className={styles.bottomNavInner}>
          {BOTTOM_NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.bottomNavItem} ${
                isActive(href) ? styles.bottomNavActive : ""
              }`}
              aria-current={isActive(href) ? "page" : undefined}
              onClick={() => {
                setSidebarOpen(false);
                setSearchOpen(false);
              }}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
