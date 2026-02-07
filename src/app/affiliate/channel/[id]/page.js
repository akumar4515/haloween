import { Suspense, Fragment } from "react";
import Link from "next/link";
import styles from "../../../page.module.css";
import AffiliateVideoCard from "../../../components/AffiliateVideoCard";
import VideoCard from "../../../components/VideoCard";
import AdProviderBanner from "../../../components/AdProviderBanner";
import { shouldShowAd } from "../../../config/ads";

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

async function fetchChannelVideos(channelId, searchParams = {}) {
  const apiRoot = getApiRoot();
  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 50;

  try {
    const url = new URL(`${apiRoot}/affiliate/videos/channel/${channelId}`, "http://localhost");
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      return { videos: [], pagination: { page, perPage, totalPages: 1 }, channel: null };
    }

    const data = await res.json();
    if (data && data.success) {
      return {
        videos: Array.isArray(data.data) ? data.data : [],
        pagination: data.pagination || { page, perPage, totalPages: 1 },
        channel: data.channel
      };
    }

    return { videos: [], pagination: { page, perPage, totalPages: 1 }, channel: null };
  } catch (error) {
    console.error("Error fetching channel videos:", error);
    return { videos: [], pagination: { page, perPage, totalPages: 1 }, channel: null };
  }
}

async function fetchEpornerChannelVideos(channelName, searchParams = {}) {
  const apiRoot = getApiRoot();
  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 50;

  if (!channelName) {
    return { videos: [], pagination: { page, perPage, totalPages: 1 } };
  }

  try {
    const url = new URL(`${apiRoot}/eporner/videos/search`, "http://localhost");
    url.searchParams.set("query", String(channelName));
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("thumbsize", "big");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      return { videos: [], pagination: { page, perPage, totalPages: 1 } };
    }

    const data = await res.json();
    if (data && data.success && data.data?.videos && Array.isArray(data.data.videos)) {
      return {
        videos: data.data.videos,
        pagination: {
          page: Number(data.data.page) || page,
          perPage: Number(data.data.per_page) || perPage,
          totalPages: Number(data.data.total_pages) || 1,
        }
      };
    }
    return { videos: [], pagination: { page, perPage, totalPages: 1 } };
  } catch (error) {
    console.error("Error fetching eporner channel videos:", error);
    return { videos: [], pagination: { page, perPage, totalPages: 1 } };
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

async function ChannelVideoGrid({ channelId, searchParams }) {
  const currentPage = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 50;
  const affiliatePerPage = Math.max(1, Math.ceil(perPage / 2));
  const epornerPerPage = Math.max(1, perPage - affiliatePerPage);

  const affiliateResponse = await fetchChannelVideos(channelId, { ...searchParams, per_page: affiliatePerPage });
  const epornerResponse = await fetchEpornerChannelVideos(affiliateResponse?.channel?.name, {
    ...searchParams,
    per_page: epornerPerPage,
  });

  const channelName = affiliateResponse?.channel?.name || null;
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
  };

  const buildPageHref = (nextPage) => {
    const sp = new URLSearchParams();
    sp.set("page", String(nextPage));
    return `/affiliate/channel/${channelId}?${sp.toString()}`;
  };

  if (!videos.length) {
    return (
      <div className={styles.emptyState}>
        <p>No videos found in this channel.</p>
      </div>
    );
  }

  return (
    <>
      {channelName && (
        <h1 className={styles.pageTitle}>{channelName} Videos</h1>
      )}

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
          const midPoint = Math.floor(videos.length / 2);
          const shouldInsertAd = shouldShowAd('HOME_CONTENT_BANNER_2') &&
                                 index === midPoint &&
                                 videos.length > 6;

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

export default async function ChannelPage({ params, searchParams }) {
  const { id } = await params;
  const channelId = parseInt(id);
  const searchParamsObj = await searchParams;

  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <ChannelVideoGrid channelId={channelId} searchParams={searchParamsObj || {}} />
    </Suspense>
  );
}
