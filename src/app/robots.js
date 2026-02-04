export default function robots() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/auth", "/api"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/auth", "/api"],
      },
      {
        userAgent: "Googlebot-Video",
        allow: ["/", "/watch/"],
        disallow: ["/admin", "/auth", "/api"],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/video-sitemap.xml`],
  };
}

