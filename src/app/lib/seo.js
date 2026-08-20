// Shared SEO helpers.
//
// Every page builds its metadata through here so canonicals, Open Graph, and
// Twitter cards stay consistent and cannot drift apart page by page.

export const SITE_NAME = "Flovex";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const DEFAULT_OG_IMAGE = "/web-logo.png";

/** Turn a site-relative path into the absolute URL search engines want. */
export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Trim to a length that survives a search result snippet intact. */
export function clampDescription(text, max = 160) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 3).trimEnd()}...`;
}

/**
 * Build a page's metadata object.
 *
 * `title` stays bare — the root layout's "%s | Flovex" template adds the brand,
 * so passing a pre-branded title here would double it up.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  keywords,
  type = "website",
  noIndex = false,
  publishedTime,
} = {}) {
  const url = absoluteUrl(path);
  const desc = clampDescription(description);
  // A title that already carries the brand must not have it appended again —
  // the home page sets its own full title because Next's title.template only
  // applies to child segments, never to the segment that declares it.
  const socialTitle = !title
    ? SITE_NAME
    : title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`;
  const images = [
    {
      url: absoluteUrl(image),
      width: 1280,
      height: 720,
      alt: title ? `${title} — ${SITE_NAME}` : SITE_NAME,
    },
  ];

  return {
    title,
    description: desc,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: url },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : {}),
    openGraph: {
      title: socialTitle,
      description: desc,
      url,
      siteName: SITE_NAME,
      images,
      type,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: desc,
      images: [absoluteUrl(image)],
    },
  };
}

/** Seconds -> ISO 8601 duration, the only format schema.org accepts. */
export function toIsoDuration(seconds) {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return undefined;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);

  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${
    secs ? `${secs}S` : ""
  }`;
}

function toIsoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * VideoObject markup — what earns video rich results and lets Google surface
 * the page in the Videos tab with a thumbnail and duration.
 */
export function videoObjectJsonLd({
  title,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  url,
  embedUrl,
  contentUrl,
  views,
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: title || "Untitled",
    description: clampDescription(
      description || `Watch ${title || "this video"} on ${SITE_NAME}.`,
      300
    ),
    thumbnailUrl: thumbnailUrl ? [thumbnailUrl] : undefined,
    uploadDate: toIsoDate(uploadDate) || undefined,
    duration: toIsoDuration(duration),
    contentUrl: contentUrl || undefined,
    embedUrl: embedUrl || undefined,
    url,
    isFamilyFriendly: false,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/web-logo.png"),
      },
    },
  };

  if (Number(views) > 0) {
    data.interactionStatistic = {
      "@type": "InteractionCounter",
      interactionType: { "@type": "https://schema.org/WatchAction" },
      userInteractionCount: Number(views),
    };
  }

  return stripUndefined(data);
}

/** WebSite markup with the search action that enables a sitelinks searchbox. */
export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Breadcrumbs give search results a readable path instead of a bare URL. */
export function breadcrumbJsonLd(crumbs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Undefined keys would serialise as nothing useful; drop them entirely. */
function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return value;
}

/** Props for a JSON-LD <script>, ready to spread onto the tag. */
export function jsonLdProps(data) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(stripUndefined(data)) },
  };
}
