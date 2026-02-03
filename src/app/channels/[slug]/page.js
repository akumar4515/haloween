import Link from "next/link";
import styles from "../../page.module.css";
import VideoCard from "../../components/VideoCard";

export const dynamic = "force-dynamic";

const normalizeString = (value) => String(value ?? "").trim().toLowerCase();

const NEWEST_KEYS = ["new", "newest", "latest", "recent"];

const normalizeQuery = (value) => {
  if (Array.isArray(value)) {
    return normalizeQuery(value[0]);
  }
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  return NEWEST_KEYS.includes(trimmed.toLowerCase()) ? "newest" : value;
};

const getVideoTimestamp = (video) => {
  const raw =
    video?.created_at ??
    video?.createdAt ??
    video?.uploaded_at ??
    video?.uploadedAt;

  if (raw) {
    const ts = new Date(raw).getTime();
    if (!Number.isNaN(ts)) return ts;
  }

  if (typeof video?.id === "number") return video.id;
  const numericId = Number(video?.id);
  return Number.isNaN(numericId) ? -Infinity : numericId;
};

const sortByNewest = (videos = []) => {
  if (!videos.length) return [];
  return [...videos].sort(
    (a, b) => getVideoTimestamp(b) - getVideoTimestamp(a)
  );
};

async function fetchChannels() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const res = await fetch(`${baseUrl}/channels`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load channels");
  }
  const data = await res.json();
  return data.data ?? [];
}

async function fetchChannelVideos(term, channelItem, filterType = "newest") {
  if (!term) return [];
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
  
  // Build list of possible matching terms (slug, name, and variations)
  const possibleTerms = new Set();
  if (channelItem) {
    if (channelItem.slug) possibleTerms.add(normalizeString(channelItem.slug));
    if (channelItem.name) possibleTerms.add(normalizeString(channelItem.name));
  }
  possibleTerms.add(normalizeString(term));

  const matchesChannel = (video) => {
    const candidates = [
      video?.channel_name,
      video?.channel?.name,
      video?.channel_slug,
      video?.channel?.slug,
    ];
    return candidates.some((value) => {
      const normalized = normalizeString(value);
      return possibleTerms.has(normalized);
    });
  };

  // Try API filtering first with both slug and name
  const termsToTry = channelItem 
    ? [channelItem.slug, channelItem.name, term].filter(Boolean)
    : [term];
  
  let allVideos = [];
  
  // Try fetching with filter type if specified
  if (filterType === "free" || filterType === "premium") {
    for (const tryTerm of termsToTry) {
      const url = new URL(`${baseUrl}/videos`, "http://localhost");
      url.searchParams.set("channel", tryTerm);
      url.searchParams.set("type", filterType);

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const directVideos = data.data ?? [];
        if (directVideos.length > 0) {
          allVideos = directVideos.filter(matchesChannel);
          if (allVideos.length > 0) break;
        }
      }
    }
  }
  
  // If no filtered results, try without type filter
  if (allVideos.length === 0) {
    for (const tryTerm of termsToTry) {
      const url = new URL(`${baseUrl}/videos`, "http://localhost");
      url.searchParams.set("channel", tryTerm);

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const directVideos = data.data ?? [];
        if (directVideos.length > 0) {
          allVideos = directVideos.filter(matchesChannel);
          if (allVideos.length > 0) break;
        }
      }
    }
  }

  // Fallback: fetch all and filter client-side
  if (allVideos.length === 0) {
    const allRes = await fetch(`${baseUrl}/videos`, { cache: "no-store" });
    if (!allRes.ok) throw new Error("Failed to fetch videos");
    const allData = await allRes.json();
    allVideos = allData.data ?? [];
    allVideos = allVideos.filter(matchesChannel);
  }
  
  // Apply premium/free filter if needed
  if (filterType === "free") {
    allVideos = allVideos.filter((video) => !video?.is_premium);
  }
  if (filterType === "premium") {
    allVideos = allVideos.filter((video) => video?.is_premium);
  }
  
  // Sort by newest if requested
  if (filterType === "newest") {
    return sortByNewest(allVideos);
  }
  
  return allVideos;
}

export default async function ChannelDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawSlug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug) : "";
  const slug = normalizeString(rawSlug);
  const channels = await fetchChannels();

  const channel = channels.find((item) => {
    const slugValue = normalizeString(item?.slug);
    const nameValue = normalizeString(item?.name);
    return slugValue === slug || nameValue === slug;
  });

  const channelName =
    channel?.name || channel?.slug || rawSlug || "Channel";
  const channelDescription = channel?.description || "";
  const channelProfile = channel?.profile_pic || "";

  const filterType = normalizeQuery(resolvedSearchParams?.q) || "newest";
  const selectedQ = filterType === "newest" || filterType === "free" || filterType === "premium" 
    ? filterType 
    : "newest";

  const videos = await fetchChannelVideos(
    channel?.slug || channel?.name || rawSlug,
    channel,
    selectedQ
  );

  const buildFilterHref = (filterValue) => {
    const sp = new URLSearchParams();
    if (filterValue) sp.set("q", filterValue);
    return `/channels/${encodeURIComponent(rawSlug)}?${sp.toString()}`;
  };

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailHeader}>
        <div className={styles.detailAvatar}>
          {channelProfile ? (
            <img
              src={channelProfile}
              alt={channelName}
              className={styles.detailAvatarImage}
            />
          ) : (
            <span className={styles.detailAvatarFallback}>
              {String(channelName).trim().charAt(0).toUpperCase() || "C"}
            </span>
          )}
        </div>
        <div className={styles.detailInfo}>
          <h1 className={styles.detailTitle}>{channelName}</h1>
          {channelDescription ? (
            <p className={styles.detailSubtitle}>{channelDescription}</p>
          ) : null}
        </div>
      </div>

      <div className={styles.tagBar}>
        {["newest", "free", "premium"].map((tag) => (
          <Link
            key={tag}
            href={buildFilterHref(tag)}
            className={`${styles.tagChip} ${
              selectedQ === tag ? styles.tagChipActive : ""
            }`}
          >
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </Link>
        ))}
      </div>

      {videos.length === 0 ? (
        <p className={styles.emptyState}>No videos found for this channel.</p>
      ) : (
        <div className={styles.grid}>
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
