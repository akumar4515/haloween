import Link from "next/link";
import styles from "../../page.module.css";
import AdProviderBanner from "../../components/AdProviderBanner";
import { shouldShowAd } from "../../config/ads";
import { buildMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Channels",
  description:
    "Browse free HD adult videos by channel on Flovex. Discover studios and creators with fast streaming and daily updates.",
  path: "/affiliate/channels",
  keywords: ["porn channels", "adult studios", "porn studios", "channel videos"],
});

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

async function fetchChannels() {
  const apiRoot = getApiRoot();
  try {
    const res = await fetch(`${apiRoot}/affiliate/channels`, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching channels:", error);
    return [];
  }
}

export default async function ChannelsPage() {
  const channels = await fetchChannels();

  return (
    <div className={styles.listPage}>
      <div className={styles.listHeader}>
        <div>
          <h1 className={styles.listTitle}>Channels</h1>
          <p className={styles.listSubtitle}>
            Browse videos by channel
          </p>
        </div>
      </div>


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

      {channels.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No channels available.</p>
        </div>
      ) : (
        <div className={styles.categoryGrid}>
          {channels.map((channel) => (
            <Link
              key={channel.id}
              href={`/affiliate/channel/${channel.id}`}
              className={styles.categoryPill}
            >
              {channel.name} {channel.video_count > 0 && `(${channel.video_count})`}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
