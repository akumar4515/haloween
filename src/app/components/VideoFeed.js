"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import styles from "../page.module.css";
import VideoCard from "./VideoCard";
import AffiliateVideoCard from "./AffiliateVideoCard";
import AdProviderBanner from "./AdProviderBanner";

const keyOf = (video) => `${video.__source || "unknown"}:${video.id}`;

/**
 * The home feed.
 *
 * The first batch arrives server-rendered (so crawlers and a cold load get real
 * markup); "Show more" appends further batches from /api/feed.
 */
export default function VideoFeed({
  initialVideos = [],
  initialCursor,
  initialHasMore = false,
  query = "",
  perPage = 100,
  showMidGridAd = false,
  midGridAdZoneId,
  midGridAdClassName,
}) {
  const [videos, setVideos] = useState(initialVideos);
  const [cursor, setCursor] = useState(
    initialCursor || { affiliatePage: 1, epornerPage: 1 }
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Everything already on screen, so an appended batch cannot duplicate it.
  // The backend's list pagination is not perfectly stable, so this is load
  // bearing rather than belt-and-braces.
  const seenKeys = useMemo(
    () => new Set(videos.map(keyOf)),
    [videos]
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("per_page", String(perPage));
      params.set("affiliate_page", String(cursor.affiliatePage || 1));
      params.set("eporner_page", String(cursor.epornerPage || 1));
      if (query) params.set("q", query);

      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      const incoming = Array.isArray(data?.videos) ? data.videos : [];
      const fresh = incoming.filter((video) => !seenKeys.has(keyOf(video)));

      setVideos((prev) => [...prev, ...fresh]);
      if (data?.cursor) setCursor(data.cursor);

      // A batch that yields nothing new means the sources have nothing left to
      // give, whatever the server reported.
      setHasMore(Boolean(data?.hasMore) && fresh.length > 0);
    } catch (err) {
      console.error("Failed to load more videos:", err);
      setError("Could not load more videos. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, perPage, query, seenKeys]);

  if (videos.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{query ? "No videos found for your search." : "No videos found."}</p>
      </div>
    );
  }

  const midPoint = Math.floor(videos.length / 2);

  return (
    <>
      <div className={styles.grid}>
        {videos.map((video, index) => {
          const insertAd =
            showMidGridAd && index === midPoint && videos.length > 6;

          return (
            <Fragment key={keyOf(video)}>
              {video.__source === "eporner" ? (
                <VideoCard video={video} />
              ) : (
                <AffiliateVideoCard video={video} />
              )}
              {insertAd && (
                <div className={styles.gridAdItem}>
                  <AdProviderBanner
                    zoneId={midGridAdZoneId}
                    adClassName={midGridAdClassName}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      {error && (
        <p className={styles.feedError} role="alert">
          {error}
        </p>
      )}

      {hasMore && (
        <div className={styles.loadMoreContainer}>
          <button
            type="button"
            className={styles.loadMoreButton}
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Show more"}
          </button>
        </div>
      )}

      {!hasMore && videos.length > 0 && (
        <p className={styles.feedEnd}>You have reached the end.</p>
      )}
    </>
  );
}
