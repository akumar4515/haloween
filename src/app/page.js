import { Suspense } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import VideoCard from "./components/VideoCard";
import { ContentBanner } from "./components/BannerAd";
import { shouldShowAd, EXOCLICK_ZONES } from "./config/ads";

export const metadata = {
  title: "Home",
  description: "Browse the latest trending videos on Flovex.",
};

const NEWEST_KEYS = ["new", "newest", "latest", "recent"];

const normalizeParam = (value) => {
  if (Array.isArray(value)) {
    return normalizeParam(value[0]);
  }
  return value;
};

const normalizeQuery = (value) => {
  if (Array.isArray(value)) {
    return normalizeQuery(value[0]);
  }
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  return NEWEST_KEYS.includes(trimmed.toLowerCase()) ? "newest" : value;
};



async function fetchVideos(searchParams = {}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  let { q } = searchParams;
  q = normalizeQuery(q);
  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 50;

  try {
    // Determine which endpoint to use
    // If no query or query is "newest"/"free"/"premium", use the list endpoint
    // Otherwise use search endpoint
    const hasSearchQuery = q && q !== "newest" && q !== "free" && q !== "premium";
    const endpoint = hasSearchQuery ? "videos/search" : "videos";
    const searchUrl = new URL(`${baseUrl}/api/eporner/${endpoint}`, "http://localhost");
    
    // Map query parameters to eporner API
    if (hasSearchQuery) {
      searchUrl.searchParams.set("query", q);
      // Set order for search endpoint
      searchUrl.searchParams.set("order", "mostviewed");
    }
    // For list endpoint, don't set order parameter as it might not be supported
    
    // Set pagination
    searchUrl.searchParams.set("page", String(page));
    searchUrl.searchParams.set("per_page", String(perPage));
    searchUrl.searchParams.set("thumbsize", "big");

    const res = await fetch(searchUrl.toString(), { cache: "no-store" });
    
    // Try to parse response even if status is not ok
    let data = null;
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    
    if (isJson) {
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        if (!res.ok) {
          console.error(`API Error (${res.status}):`, await res.text().catch(() => 'Unable to read error'));
          console.error(`Failed URL: ${searchUrl.toString()}`);
        }
        return [];
      }
    } else {
      const text = await res.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      if (!res.ok) {
        console.error(`API Error (${res.status}):`, text.substring(0, 200));
        console.error(`Failed URL: ${searchUrl.toString()}`);
      }
      return [];
    }
    
    // Backend returns { success: true, data: ... }
    // The backend now formats videos to have video_url and thumbnail_url
    let videos = [];
    let pagination = {
      page,
      perPage,
      totalPages: 1,
      totalCount: null,
    };
    
    if (data && data.success && data.data) {
      // Check if data.data is directly an array (from video/list or video/search)
      if (Array.isArray(data.data)) {
        videos = data.data;
      } 
      // Check if data.data has a videos property (when API fails, backend returns { videos: [] })
      else if (data.data.videos && Array.isArray(data.data.videos)) {
        videos = data.data.videos;
        pagination.page = Number(data.data.page) || page;
        pagination.perPage = Number(data.data.per_page) || perPage;
        pagination.totalPages = Number(data.data.total_pages) || 1;
        pagination.totalCount = Number(data.data.total_count) || Number(data.data.count) || null;
      }
      // Check if data.data has nested data
      else if (data.data.data && Array.isArray(data.data.data)) {
        videos = data.data.data;
      }
      // If data.data is a single object, wrap it in an array
      else if (data.data && typeof data.data === 'object' && data.data.id) {
        videos = [data.data];
      }
    } else if (data && data.data && Array.isArray(data.data)) {
      // Fallback: if no success field but data exists
      videos = data.data;
    } else if (data && Array.isArray(data)) {
      // Fallback: if response is directly an array
      videos = data;
    } else if (!res.ok) {
      // If response was not ok and we couldn't parse videos, return empty
      console.error(`API Error (${res.status}):`, data);
      console.error(`Failed URL: ${searchUrl.toString()}`);
      return [];
    }
    
    // Log first video for debugging (remove in production)
    if (videos.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('Sample video data:', {
        id: videos[0].id,
        title: videos[0].title,
        video_url: videos[0].video_url,
        embed_url: videos[0].embed_url,
        thumbnail_url: videos[0].thumbnail_url,
        hasRaw: !!videos[0].raw
      });
    }
    
    return { videos, pagination };
  } catch (error) {
    console.error("Error fetching videos:", error);
    return { videos: [], pagination: { page, perPage, totalPages: 1, totalCount: null } };
  }
}


async function VideoGrid({ searchParams }) {
  const { videos, pagination } = await fetchVideos(searchParams);
  const selectedQ = normalizeQuery(searchParams?.q) || "newest";
  const currentPage = Number(searchParams?.page) || 1;

  const buildTagHref = (value) => {
    const sp = new URLSearchParams();
    if (value) sp.set("q", value);
    return `/?${sp.toString()}`;
  };

  const buildPageHref = (nextPage) => {
    const sp = new URLSearchParams();
    if (selectedQ) sp.set("q", selectedQ);
    sp.set("page", String(nextPage));
    return `/?${sp.toString()}`;
  };

  if (!videos.length) {
    return (
      <>
        <div className={styles.tagBar}>
          {["newest", "free", "premium"].map((tag) => (
            <Link
              key={tag}
              href={buildTagHref(tag)}
              className={`${styles.tagChip} ${
                selectedQ === tag ? styles.tagChipActive : ""
              }`}
            >
              {tag.charAt(0).toUpperCase() + tag.slice(1)}
            </Link>
          ))}
        </div>
        <div className={styles.emptyState}>
          <p>No videos found. Try adjusting your search.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.tagBar}>
        {["newest", "free", "premium"].map((tag) => (
          <Link
            key={tag}
            href={buildTagHref(tag)}
            className={`${styles.tagChip} ${
              selectedQ === tag ? styles.tagChipActive : ""
            }`}
          >
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </Link>
        ))}
      </div>

      {/* Content Banner Ad */}
      {shouldShowAd('HOME_CONTENT_BANNER_1') && (
        <ContentBanner zoneId={EXOCLICK_ZONES.CONTENT_BANNER_1} />
      )}

      <div className={styles.grid}>
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      {pagination?.totalPages > 1 && (
        <div className={styles.pagination}>
          <Link
            href={buildPageHref(Math.max(1, currentPage - 1))}
            className={`${styles.pageButton} ${currentPage <= 1 ? styles.pageButtonDisabled : ""}`}
            aria-disabled={currentPage <= 1}
          >
            Previous
          </Link>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Link
            href={buildPageHref(Math.min(pagination.totalPages, currentPage + 1))}
            className={`${styles.pageButton} ${currentPage >= pagination.totalPages ? styles.pageButtonDisabled : ""}`}
            aria-disabled={currentPage >= pagination.totalPages}
          >
            Next
          </Link>
        </div>
      )}
    </>
  );
}

export default async function Home({ searchParams }) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <VideoGrid searchParams={params || {}} />
    </Suspense>
  );
}
