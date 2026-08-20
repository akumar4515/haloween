import { Metadata } from "next";
import Link from "next/link";
import styles from "../../../watch/[id]/watch.module.css";
import AffiliateVideoPlayer from "../../../components/AffiliateVideoPlayer";
import FlovexBarAd from "../../../components/FlovexBarAd";
import { RECOMMENDATIONS_PAGE_SIZE } from "../../../config/feed";
import {
  absoluteUrl,
  jsonLdProps,
  videoObjectJsonLd,
  breadcrumbJsonLd,
} from "../../../lib/seo";
import AffiliateRecommendations from "../../../components/AffiliateRecommendations";
import RecommendationsSection from "../../../watch/[id]/RecommendationsSection";

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

async function fetchAffiliateVideo(id) {
  const apiRoot = getApiRoot();
  const url = `${apiRoot}/affiliate/videos/${id}`;
  
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Failed to fetch affiliate video (${res.status}):`, url);
    }
    return null;
  }
  
  const data = await res.json();
  
  if (data.success && data.data) {
    return data.data;
  }
  
  return null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  
  try {
    const video = await fetchAffiliateVideo(id);
    
    if (!video) {
      return {
        title: "Video Not Found",
        description: "The requested video could not be found.",
      };
    }

    const baseTitle = video.title || "Untitled Video";

    const primaryCategory = Array.isArray(video.categories)
      ? video.categories[0]
      : undefined;
    const primaryPornstar = Array.isArray(video.pornstars)
      ? video.pornstars[0]
      : undefined;
    const primaryChannel = Array.isArray(video.channels)
      ? video.channels[0]
      : undefined;

    const contextParts = [
      primaryCategory,
      primaryPornstar,
      primaryChannel,
    ].filter(Boolean);

    // Bare title: the root layout's "%s | Flovex" template adds the brand.
    const seoTitle = contextParts.length
      ? `${baseTitle} – ${contextParts.join(" • ")}`
      : baseTitle;

    const baseDescription =
      video.description ||
      `Watch ${baseTitle} in full HD on Flovex. Fast streaming and premium scenes.`;

    const extraContext =
      [
        primaryCategory && `Category: ${primaryCategory}`,
        primaryPornstar && `Starring: ${primaryPornstar}`,
        primaryChannel && `Channel: ${primaryChannel}`,
      ]
        .filter(Boolean)
        .join(" · ") || "";

    const description = extraContext
      ? `${baseDescription} ${extraContext}.`
      : baseDescription;

    const thumbnail = video.thumbnail_url || "/logo.png";
    
    const videoUrl = `${siteUrl}/affiliate/watch/${id}`;

    return {
      title: seoTitle,
      description:
        description.length > 160
          ? description.substring(0, 157) + "..."
          : description,
      openGraph: {
        title: `${seoTitle} | Flovex`,
        description: description,
        url: videoUrl,
        siteName: "Flovex",
        images: [
          {
            url: thumbnail,
            width: 1280,
            height: 720,
            alt: baseTitle,
          },
        ],
        type: "video.other",
      },
      twitter: {
        card: "summary_large_image",
        title: `${seoTitle} | Flovex`,
        description:
          description.length > 200
            ? description.substring(0, 197) + "..."
            : description,
        images: thumbnail ? [thumbnail] : ["/logo.png"],
      },
      alternates: {
        canonical: videoUrl,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Video",
      description: "Watch free HD adult videos on Flovex.",
    };
  }
}

async function fetchEpornerRecommendationsFromAffiliate(video, page = 1) {
  if (!video) {
    return { videos: [], pagination: { page: 1, totalPages: 1 }, query: "" };
  }

  const apiRoot = getApiRoot();
  const searchUrl = new URL(`${apiRoot}/eporner/videos/search`);
  let recQuery = "";

  const candidates = [
    ...(Array.isArray(video.categories) ? video.categories : []),
    ...(Array.isArray(video.pornstars) ? video.pornstars : []),
    ...(Array.isArray(video.channels) ? video.channels : []),
  ].map((item) => String(item).trim()).filter(Boolean);

  if (candidates.length > 0) {
    recQuery = candidates[0];
    searchUrl.searchParams.set("query", recQuery);
  }

  searchUrl.searchParams.set("order", "mostviewed");
  searchUrl.searchParams.set("page", String(page));
  searchUrl.searchParams.set("per_page", String(RECOMMENDATIONS_PAGE_SIZE));
  searchUrl.searchParams.set("thumbsize", "big");

  const res = await fetch(searchUrl.toString(), { cache: "no-store" });
  if (!res.ok) {
    return { videos: [], pagination: { page, totalPages: 1 }, query: recQuery };
  }

  const data = await res.json();
  let videos = [];
  let pagination = { page, totalPages: 1 };

  if (data?.success && data?.data) {
    if (Array.isArray(data.data)) {
      videos = data.data;
    } else if (Array.isArray(data.data.videos)) {
      videos = data.data.videos;
      pagination = {
        page: Number(data.data.page) || page,
        totalPages: Number(data.data.total_pages) || 1,
      };
    } else if (Array.isArray(data.data.data)) {
      videos = data.data.data;
    }
  } else if (Array.isArray(data?.data)) {
    videos = data.data;
  } else if (Array.isArray(data)) {
    videos = data;
  }

  return {
    videos: videos.filter((v) => String(v.id) !== String(video.id)),
    pagination,
    query: recQuery,
  };
}

export default async function AffiliateWatchPage({ params }) {
  const { id } = await params;
  const video = await fetchAffiliateVideo(id);

  if (!video) {
    return (
      <div className={styles.main}>
        <p className={styles.notFound}>Video not found.</p>
      </div>
    );
  }

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const buildTagLinks = (items = [], ids = [], basePath = "") =>
    items
      .map((name, idx) => ({
        name,
        id: ids[idx],
        href: ids[idx] ? `${basePath}/${ids[idx]}` : null
      }))
      .filter((tag) => tag.href);

  const categoryTags = buildTagLinks(video.categories, video.category_ids, "/affiliate/category");
  const pornstarTags = buildTagLinks(video.pornstars, video.pornstar_ids, "/affiliate/pornstar");
  const channelTags = buildTagLinks(video.channels, video.channel_ids, "/affiliate/channel");
  const epornerRecommended = await fetchEpornerRecommendationsFromAffiliate(video);

  const canonicalUrl = absoluteUrl(`/affiliate/watch/${video.id}`);
  const videoTitle = video.title || "Untitled";

  return (
    <div className={styles.main}>
      <script
        {...jsonLdProps(
          videoObjectJsonLd({
            title: videoTitle,
            description: video.description,
            thumbnailUrl: video.thumbnail_url || "",
            uploadDate: video.published_at || video.created_at,
            duration: video.duration,
            url: canonicalUrl,
            embedUrl: video.iframe_url || video.video_url || "",
          })
        )}
      />
      <script
        {...jsonLdProps(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: videoTitle, path: `/affiliate/watch/${video.id}` },
          ])
        )}
      />
      <section className={styles.playerSection}>
        <FlovexBarAd snippetPath="/flovex.net_bar_above_player.txt" />
        <AffiliateVideoPlayer video={video} />
        <FlovexBarAd snippetPath="/flovex.net_bar_under_player.txt" />
        <h1 className={styles.title}>{video.title || "Untitled"}</h1>
        <div className={styles.meta}>
          {video.duration && (
            <span>Duration: {formatDuration(video.duration)}</span>
          )}
        </div>

        {(categoryTags.length > 0 || pornstarTags.length > 0 || channelTags.length > 0) && (
          <div className={styles.tagsRow}>
            {categoryTags.map((tag) => (
              <Link key={`cat-${tag.id}`} href={tag.href} className={`${styles.tag} ${styles.tagCategory}`}>
                {tag.name}
              </Link>
            ))}
            {pornstarTags.map((tag) => (
              <Link key={`star-${tag.id}`} href={tag.href} className={`${styles.tag} ${styles.tagPornstar}`}>
                {tag.name}
              </Link>
            ))}
            {channelTags.map((tag) => (
              <Link key={`chan-${tag.id}`} href={tag.href} className={`${styles.tag} ${styles.tagChannel}`}>
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {video.description && (
          <p className={styles.description}>{video.description}</p>
        )}
      </section>

      <AffiliateRecommendations videoId={video.id} title="Affiliate Recommended Videos" />
      {epornerRecommended?.videos?.length > 0 && (
        <RecommendationsSection
          title="Recommended Videos"
          initialVideos={epornerRecommended.videos}
          query={epornerRecommended.query}
          initialPage={epornerRecommended.pagination?.page || 1}
          totalPages={epornerRecommended.pagination?.totalPages || 1}
        />
      )}
    </div>
  );
}
