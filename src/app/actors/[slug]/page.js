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

async function fetchActorSource() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const tryFetch = async (path) => {
    const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.data) ? data.data : [];
  };

  const actors = await tryFetch("/actors");
  if (actors && actors.length > 0) {
    return { items: actors, source: "actors" };
  }

  const channels = await tryFetch("/channels");
  if (channels && channels.length > 0) {
    return { items: channels, source: "channels" };
  }

  return { items: [], source: "actors" };
}

const matchesActor = (video, term) => {
  if (!term) return true;
  const actors = Array.isArray(video?.actors) ? video.actors : [];
  return actors.some((actor) => {
    const name = normalizeString(actor?.name);
    const slug = normalizeString(actor?.slug);
    return (name && name === term) || (slug && slug === term);
  });
};

const matchesChannel = (video, term) => {
  if (!term) return true;
  const candidates = [
    video?.channel_name,
    video?.channel?.name,
    video?.channel_slug,
    video?.channel?.slug,
  ];
  return candidates.some(
    (value) => normalizeString(value) === term
  );
};

async function fetchActorVideos(termRaw, source, actorItem, filterType = "newest") {
  if (!termRaw) return [];
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  // Try to fetch with filter type if specified
  let allVideos = [];
  if (filterType === "free" || filterType === "premium") {
    const url = new URL(`${baseUrl}/videos`, "http://localhost");
    url.searchParams.set("type", filterType);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      allVideos = data.data ?? [];
    }
  }
  
  // If no filtered results or newest, fetch all
  if (allVideos.length === 0 || filterType === "newest") {
    const allRes = await fetch(`${baseUrl}/videos`, { cache: "no-store" });
    if (!allRes.ok) throw new Error("Failed to fetch videos");
    const allData = await allRes.json();
    allVideos = allData.data ?? [];
  }

  // Build list of possible matching terms (slug, name, and variations)
  const possibleTerms = new Set();
  if (actorItem) {
    if (actorItem.slug) possibleTerms.add(normalizeString(actorItem.slug));
    if (actorItem.name) possibleTerms.add(normalizeString(actorItem.name));
  }
  possibleTerms.add(normalizeString(termRaw));

  // Filter by actor or channel depending on source
  if (source === "channels") {
    return allVideos.filter((video) => {
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
    });
  }
  
  // For actors, check if any actor in the video matches any of our terms
  const filtered = allVideos.filter((video) => {
    const actors = Array.isArray(video?.actors) ? video.actors : [];
    if (actors.length === 0) return false;
    return actors.some((actor) => {
      const name = normalizeString(actor?.name);
      const slug = normalizeString(actor?.slug);
      return possibleTerms.has(name) || possibleTerms.has(slug);
    });
  });
  
  // If no matches found, try partial matching as fallback
  if (filtered.length === 0 && allVideos.length > 0) {
    const firstTerm = Array.from(possibleTerms)[0];
    return allVideos.filter((video) => {
      const actors = Array.isArray(video?.actors) ? video.actors : [];
      return actors.some((actor) => {
        const name = normalizeString(actor?.name || "");
        const slug = normalizeString(actor?.slug || "");
        return name.includes(firstTerm) || firstTerm.includes(name) ||
               slug.includes(firstTerm) || firstTerm.includes(slug);
      });
    });
  }
  
  // Apply premium/free filter if needed
  if (filterType === "free") {
    return filtered.filter((video) => !video?.is_premium);
  }
  if (filterType === "premium") {
    return filtered.filter((video) => video?.is_premium);
  }
  
  // Sort by newest if requested
  if (filterType === "newest") {
    return sortByNewest(filtered);
  }
  
  return filtered;
}

export default async function ActorDetailPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const rawSlug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug) : "";
  const slug = normalizeString(rawSlug);
  const { items, source } = await fetchActorSource();

  const actor = items.find((item) => {
    const slugValue = normalizeString(item?.slug);
    const nameValue = normalizeString(item?.name);
    return slugValue === slug || nameValue === slug;
  });

  const actorName =
    actor?.name || actor?.slug || rawSlug || "Actor";
  const actorBio = actor?.bio || actor?.description || "";
  const actorProfile = actor?.profile_pic || "";

  const filterType = normalizeQuery(resolvedSearchParams?.q) || "newest";
  const selectedQ = filterType === "newest" || filterType === "free" || filterType === "premium" 
    ? filterType 
    : "newest";

  const videos = await fetchActorVideos(
    actor?.slug || actor?.name || rawSlug,
    source,
    actor,
    selectedQ
  );

  const buildFilterHref = (filterValue) => {
    const sp = new URLSearchParams();
    if (filterValue) sp.set("q", filterValue);
    return `/actors/${encodeURIComponent(rawSlug)}?${sp.toString()}`;
  };

  return (
    <div className={styles.detailPage}>
      <div className={styles.detailHeader}>
        <div className={styles.detailAvatar}>
          {actorProfile ? (
            <img
              src={actorProfile}
              alt={actorName}
              className={styles.detailAvatarImage}
            />
          ) : (
            <span className={styles.detailAvatarFallback}>
              {String(actorName).trim().charAt(0).toUpperCase() || "A"}
            </span>
          )}
        </div>
        <div className={styles.detailInfo}>
          <h1 className={styles.detailTitle}>{actorName}</h1>
          {actorBio ? (
            <p className={styles.detailSubtitle}>{actorBio}</p>
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
        <p className={styles.emptyState}>No videos found for this actor.</p>
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
