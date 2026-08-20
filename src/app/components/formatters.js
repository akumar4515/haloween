// Display helpers shared by the video cards and the watch page.
//
// Everything here is deterministic string math — no `toLocaleString`, no
// locale-dependent output — so the server render and the client hydration
// always agree.

/** 1234 -> "1.2K", 3400000 -> "3.4M" */
export function formatCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0";

  const units = [
    { limit: 1e9, suffix: "B" },
    { limit: 1e6, suffix: "M" },
    { limit: 1e3, suffix: "K" },
  ];

  for (const { limit, suffix } of units) {
    if (num >= limit) {
      const scaled = num / limit;
      // One decimal below 10 ("1.2M"), none above it ("12M")
      const text =
        scaled < 10 ? (Math.floor(scaled * 10) / 10).toFixed(1) : String(Math.floor(scaled));
      return `${text.replace(/\.0$/, "")}${suffix}`;
    }
  }

  return String(Math.floor(num));
}

/** Full thousands separators, for places that show the exact number. */
export function formatExactCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "0";
  return String(Math.floor(num)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Seconds -> "4:07" or "1:02:33". Passes through strings already formatted. */
export function formatDuration(value) {
  if (typeof value === "string" && value.includes(":")) return value;

  const total = Math.floor(Number(value));
  if (!Number.isFinite(total) || total <= 0) return "";

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}

/**
 * "3 days ago", "2 months ago". Bucketed at day granularity so a server render
 * and a client hydration a moment later produce the same text.
 */
export function formatRelativeDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 0) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;
  if (days < 30) return plural(Math.floor(days / 7), "week");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}
