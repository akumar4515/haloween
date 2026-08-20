// Resolves a category / pornstar / channel id to its display name.
//
// Used by the taxonomy pages' generateMetadata so titles read "Lingerie Videos"
// rather than "Category 8919". The directory endpoints are indexed and change
// rarely, so they are cached for an hour instead of fetched per request.

const DIRECTORY_REVALIDATE_SECONDS = 3600;
const DIRECTORY_TIMEOUT_MS = 5000;

const ENDPOINTS = {
  category: "categories",
  pornstar: "pornstars",
  channel: "channels",
};

const apiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

/**
 * @param {"category"|"pornstar"|"channel"} kind
 * @param {string|number} id
 * @returns {Promise<string|null>} the display name, or null if it cannot be resolved
 */
export async function resolveTaxonomyName(kind, id) {
  const endpoint = ENDPOINTS[kind];
  if (!endpoint || id === undefined || id === null || id === "") return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DIRECTORY_TIMEOUT_MS);

  try {
    const res = await fetch(`${apiRoot()}/affiliate/${endpoint}`, {
      signal: controller.signal,
      next: { revalidate: DIRECTORY_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;

    const payload = await res.json();
    const entries = Array.isArray(payload?.data) ? payload.data : [];
    const match = entries.find((entry) => String(entry?.id) === String(id));

    return match?.name || null;
  } catch {
    // Metadata must never be the reason a page fails to render.
    return null;
  } finally {
    clearTimeout(timer);
  }
}
