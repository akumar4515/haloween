import { Suspense } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import VideoCard from "./components/VideoCard";

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

const normalizeString = (value) => String(value ?? "").trim().toLowerCase();

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

const matchesCategory = (video, term) => {
  if (!term) return true;
  return normalizeString(video?.category) === term;
};

const matchesActor = (video, term) => {
  if (!term) return true;
  const actors = Array.isArray(video?.actors) ? video.actors : [];
  return actors.some((actor) => {
    const name = normalizeString(actor?.name);
    const slug = normalizeString(actor?.slug);
    return (name && name === term) || (slug && slug === term);
  });
};

const filterVideos = (videos = [], { category, channel, actor }) => {
  const categoryTerm = normalizeString(category);
  const channelTerm = normalizeString(channel);
  const actorTerm = normalizeString(actor);

  if (!categoryTerm && !channelTerm && !actorTerm) return videos;

  return videos.filter(
    (video) =>
      matchesCategory(video, categoryTerm) &&
      matchesChannel(video, channelTerm) &&
      matchesActor(video, actorTerm)
  );
};

async function fetchVideos(searchParams = {}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  let { q, category, channel, actor } = searchParams;
  q = normalizeQuery(q);
  const isNewestQuery = q === "newest";
  const actorValue = normalizeParam(actor);
  const hasActor = typeof actorValue === "string" && actorValue.trim() !== "";
  const filters = { category, channel, actor: actorValue };

  // ---- CASE 1: FREE / PREMIUM / NEWEST ----
  if (q === "free" || q === "premium" || q === "newest") {
    const url = new URL(`${baseUrl}/videos`, "http://localhost");

    if (q === "free") url.searchParams.set("type", "free");
    if (q === "premium") url.searchParams.set("type", "premium");

    if (category) url.searchParams.set("category", category);
    if (channel) url.searchParams.set("channel", channel);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch videos");

    const data = await res.json();
    const videos = filterVideos(data.data ?? [], filters);
    return isNewestQuery ? sortByNewest(videos) : videos;
  }

  // ---- CASE 2: REAL TEXT SEARCH ----
  if ((q && String(q).trim() !== "") || hasActor) {
    const searchUrl = new URL(`${baseUrl}/videos/search`, "http://localhost");
    searchUrl.searchParams.set("q", q || actorValue);

    const res = await fetch(searchUrl.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch videos");

    const data = await res.json();
    return filterVideos(data.data ?? [], filters);
  }

  // ---- CASE 3: DEFAULT (NEWEST) ----
  const url = new URL(`${baseUrl}/videos`, "http://localhost");
  if (category) url.searchParams.set("category", category);
  if (channel) url.searchParams.set("channel", channel);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch videos");

  const data = await res.json();
  const videos = filterVideos(data.data ?? [], filters);
  return isNewestQuery ? sortByNewest(videos) : videos;
}


async function VideoGrid({ searchParams }) {
  const videos = await fetchVideos(searchParams);
  const selectedQ = normalizeQuery(searchParams?.q) || "newest";
  const actorValue = normalizeParam(searchParams?.actor);

  const buildTagHref = (value) => {
    const sp = new URLSearchParams();
    if (value) sp.set("q", value);
    if (searchParams?.category) sp.set("category", searchParams.category);
    if (searchParams?.channel) sp.set("channel", searchParams.channel);
    if (actorValue) sp.set("actor", actorValue);
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
      <div className={styles.grid}>
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
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
