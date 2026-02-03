import Link from "next/link";
import styles from "../../page.module.css";
import VideoCard from "../../components/VideoCard";

export const dynamic = "force-dynamic";

const normalizeString = (value) =>
  String(value ?? "").trim().toLowerCase();

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

async function fetchCategoryVideos(category, filterType = "newest") {
  if (!category) return [];
  const categoryNormalized = normalizeString(category);
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
  
  const matchesCategory = (video) =>
    normalizeString(video?.category) === categoryNormalized;

  let allVideos = [];

  // Try API filtering first with type filter if specified
  if (filterType === "free" || filterType === "premium") {
    const url = new URL(`${baseUrl}/videos`, "http://localhost");
    url.searchParams.set("category", category);
    url.searchParams.set("type", filterType);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const directVideos = data.data ?? [];
      if (directVideos.length > 0) {
        allVideos = directVideos.filter(matchesCategory);
      }
    }
  }

  // If no filtered results, try without type filter
  if (allVideos.length === 0) {
    const url = new URL(`${baseUrl}/videos`, "http://localhost");
    url.searchParams.set("category", category);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const directVideos = data.data ?? [];
      if (directVideos.length > 0) {
        allVideos = directVideos.filter(matchesCategory);
      }
    }
  }

  // Fallback: fetch all and filter client-side
  if (allVideos.length === 0) {
    const allRes = await fetch(`${baseUrl}/videos`, { cache: "no-store" });
    if (!allRes.ok) throw new Error("Failed to fetch videos");
    const allData = await allRes.json();
    allVideos = allData.data ?? [];
    allVideos = allVideos.filter(matchesCategory);
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

export default async function CategoryDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawCategory = resolvedParams?.category
    ? decodeURIComponent(resolvedParams.category)
    : "";

  const filterType = normalizeQuery(resolvedSearchParams?.q) || "newest";
  const selectedQ = filterType === "newest" || filterType === "free" || filterType === "premium" 
    ? filterType 
    : "newest";

  const videos = await fetchCategoryVideos(rawCategory, selectedQ);

  const buildFilterHref = (filterValue) => {
    const sp = new URLSearchParams();
    if (filterValue) sp.set("q", filterValue);
    return `/categories/${encodeURIComponent(rawCategory)}?${sp.toString()}`;
  };

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailHeader}>
        <span className={styles.detailBadge}>
          {rawCategory || "Category"}
        </span>
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
        <p className={styles.emptyState}>
          No videos found for this category.
        </p>
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
