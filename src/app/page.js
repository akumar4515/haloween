import { Suspense } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import VideoFeed from "./components/VideoFeed";
import AdProviderBanner from "./components/AdProviderBanner";
import { shouldShowAd } from "./config/ads";
import { buildMetadata, jsonLdProps, webSiteJsonLd } from "./lib/seo";
import { fetchFeedPage, FEED_PAGE_SIZE, hasRealQuery, normalizeQuery } from "./lib/feed";

export const metadata = buildMetadata({
  title: "Flovex - Free HD Adult Videos",
  description:
    "Watch free HD adult videos on Flovex. Thousands of high-quality videos with fast streaming, mobile-friendly playback, and daily updates.",
  path: "/",
  keywords: [
    "free porn",
    "adult videos",
    "HD porn",
    "porn streaming",
    "free adult videos",
    "porn videos",
  ],
});

const FILTER_CHIPS = [
  "Amateur",
  "MILF",
  "Teen",
  "Anal",
  "Asian",
  "Latina",
  "Big Tits",
  "Lesbian",
  "POV",
  "Threesome",
  "Compilation",
  "HD",
];

function FilterChips({ activeQuery }) {
  const active = String(activeQuery || "").toLowerCase();

  return (
    <div className={styles.chipsRow} role="navigation" aria-label="Filter videos">
      <Link
        href="/"
        className={`${styles.chip} ${!active ? styles.chipActive : ""}`}
      >
        All
      </Link>
      {FILTER_CHIPS.map((label) => (
        <Link
          key={label}
          href={`/?q=${encodeURIComponent(label)}`}
          className={`${styles.chip} ${
            active === label.toLowerCase() ? styles.chipActive : ""
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

async function VideoGrid({ searchParams }) {
  const q = normalizeQuery(searchParams?.q);
  const searching = hasRealQuery(q);

  // First batch is rendered on the server so a cold load and any crawler get
  // real markup; VideoFeed appends the rest from /api/feed.
  const batch = await fetchFeedPage({
    q,
    perPage: FEED_PAGE_SIZE,
    includeFeatured: !searching,
  });

  const videos = [...batch.featured, ...batch.videos];

  return (
    <>
      {/* Content Banner Ad 1 - Before videos */}
      {shouldShowAd('HOME_CONTENT_BANNER_1') && (
        <div className={styles.contentAdContainer}>
          <AdProviderBanner
            zoneId={
              process.env.NEXT_PUBLIC_ADPROVIDER_CONTENT_BANNER_1_ZONE_ID ||
              "5846062"
            }
            adClassName={
              process.env.NEXT_PUBLIC_ADPROVIDER_CONTENT_BANNER_1_CLASS ||
              "eas6a97888e2"
            }
          />
        </div>
      )}

      <VideoFeed
        initialVideos={videos}
        initialCursor={batch.cursor}
        initialHasMore={batch.hasMore}
        query={searching ? String(q) : ""}
        perPage={FEED_PAGE_SIZE}
        showMidGridAd={shouldShowAd('HOME_CONTENT_BANNER_2')}
        midGridAdZoneId={
          process.env.NEXT_PUBLIC_ADPROVIDER_CONTENT_BANNER_2_ZONE_ID ||
          "5846064"
        }
        midGridAdClassName={
          process.env.NEXT_PUBLIC_ADPROVIDER_CONTENT_BANNER_2_CLASS ||
          "eas6a97888e2"
        }
      />
    </>
  );
}

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const q = normalizeQuery(params?.q);

  return (
    <>
      {/* WebSite markup: makes the site eligible for a sitelinks search box. */}
      <script {...jsonLdProps(webSiteJsonLd())} />
      <FilterChips activeQuery={hasRealQuery(q) ? q : ""} />
      <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
        <VideoGrid searchParams={params || {}} />
      </Suspense>
    </>
  );
}
