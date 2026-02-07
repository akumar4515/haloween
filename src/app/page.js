import { Suspense, Fragment } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import VideoCard from "./components/VideoCard";
import AffiliateVideoCard from "./components/AffiliateVideoCard";
import { ContentBanner } from "./components/BannerAd";
import AdProviderBanner from "./components/AdProviderBanner";
import { shouldShowAd, EXOCLICK_ZONES } from "./config/ads";

export const metadata = {
  title: "Flovex - Free HD Adult Videos",
  description: "Watch free HD adult videos on Flovex. Browse thousands of high-quality porn videos with fast streaming, mobile optimization, and regular updates. Discover trending videos, newest releases, and popular content.",
  keywords: ["free porn", "adult videos", "HD porn", "porn streaming", "adult entertainment", "free adult videos", "porn videos", "adult content"],
  openGraph: {
    title: "Flovex - Free HD Adult Videos",
    description: "Watch free HD adult videos on Flovex. Browse thousands of high-quality porn videos with fast streaming.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "Flovex",
    images: [{
      url: "/logo.png",
      width: 400,
      height: 400,
      alt: "Flovex Logo"
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flovex - Free HD Adult Videos",
    description: "Watch free HD adult videos on Flovex. Browse thousands of high-quality porn videos.",
    images: ["/logo.png"]
  },
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



async function fetchAffiliateVideos(searchParams = {}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 50;
  let { q } = searchParams;
  q = normalizeQuery(q);
  const hasSearchQuery = q && q !== "newest" && q !== "free" && q !== "premium";

  try {
    // Construct URL properly
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    const apiUrl = hasSearchQuery
      ? `${normalizedBaseUrl}/api/affiliate/search`
      : `${normalizedBaseUrl}/api/affiliate/videos`;
    const url = new URL(apiUrl);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    if (hasSearchQuery) {
      url.searchParams.set("query", String(q));
    }

    const res = await fetch(url.toString(), { 
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unable to read error');
      console.error(`API Error (${res.status}):`, errorText);
      console.error(`Failed URL: ${url.toString()}`);
      
      // If it's a 404, the backend might not be running or route not found
      if (res.status === 404) {
        console.warn('Backend server may not be running. Please start the backend server on port 5000.');
      }
      
      return { videos: [], pagination: { page, perPage, totalPages: 1, totalCount: null } };
    }
    
    const data = await res.json();
    
    if (data && data.success && data.data) {
      return {
        videos: Array.isArray(data.data) ? data.data : [],
        pagination: data.pagination || { page, perPage, totalPages: 1, totalCount: null }
      };
    }
    
    return { videos: [], pagination: { page, perPage, totalPages: 1, totalCount: null } };
  } catch (error) {
    console.error("Error fetching affiliate videos:", error);
    return { videos: [], pagination: { page, perPage, totalPages: 1, totalCount: null } };
  }
}

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


const shuffleArray = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

async function VideoGrid({ searchParams }) {
  const currentPage = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 50;
  const q = normalizeQuery(searchParams?.q);
  const hasSearchQuery = q && q !== "newest" && q !== "free" && q !== "premium";
  const affiliatePerPage = Math.max(1, Math.ceil(perPage / 2));
  const epornerPerPage = Math.max(1, perPage - affiliatePerPage);
  const affiliateParams = { ...searchParams, per_page: affiliatePerPage };
  const epornerParams = { ...searchParams, per_page: epornerPerPage };

  const [affiliateResponse, epornerResponse] = await Promise.all([
    fetchAffiliateVideos(affiliateParams),
    fetchVideos(epornerParams),
  ]);

  const affiliateVideos = (affiliateResponse?.videos || []).map((video) => ({
    ...video,
    __source: "affiliate",
  }));
  const epornerVideos = (epornerResponse?.videos || []).map((video) => ({
    ...video,
    __source: "eporner",
  }));

  const videos = shuffleArray([...affiliateVideos, ...epornerVideos]);
  const pagination = {
    page: currentPage,
    perPage,
    totalPages: Math.max(
      affiliateResponse?.pagination?.totalPages || 1,
      epornerResponse?.pagination?.totalPages || 1
    ),
    totalCount:
      (affiliateResponse?.pagination?.totalCount || 0) +
      (epornerResponse?.pagination?.totalCount || 0),
  };

  const buildPageHref = (nextPage) => {
    const sp = new URLSearchParams();
    sp.set("page", String(nextPage));
    if (hasSearchQuery) {
      sp.set("q", String(q));
    }
    return `/?${sp.toString()}`;
  };

  if (!videos.length) {
    return (
      <div className={styles.emptyState}>
        <p>{hasSearchQuery ? "No videos found for your search." : "No videos found."}</p>
      </div>
    );
  }

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

      <div className={styles.grid}>
        {videos.map((video, index) => {
          // Insert Content Banner Ad 2 in the middle of the videos (after ~50% of videos)
          const midPoint = Math.floor(videos.length / 2);
          const shouldInsertAd = shouldShowAd('HOME_CONTENT_BANNER_2') && 
                                 index === midPoint &&
                                 videos.length > 6; // Only insert if there are enough videos
          
          return (
            <Fragment key={`video-${video.id}`}>
              {video.__source === "eporner" ? (
                <VideoCard video={video} />
              ) : (
                <AffiliateVideoCard video={video} />
              )}
              {shouldInsertAd && (
                <div key="ad-banner-2" className={styles.gridAdItem}>
                  <AdProviderBanner
                    zoneId={
                      process.env.NEXT_PUBLIC_ADPROVIDER_CONTENT_BANNER_2_ZONE_ID ||
                      "5846064"
                    }
                    adClassName={
                      process.env.NEXT_PUBLIC_ADPROVIDER_CONTENT_BANNER_2_CLASS ||
                      "eas6a97888e2"
                    }
                  />
                </div>
              )}
            </Fragment>
          );
        })}
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
