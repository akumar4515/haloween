import Link from "next/link";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

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

export default async function ChannelsPage() {
  const channels = await fetchChannels();

  return (
    <div className={styles.listPage}>
      <div className={styles.listHeader}>
        <div>
          <h1 className={styles.listTitle}>Channels</h1>
          <p className={styles.listSubtitle}>
            Browse all channels. Click one to see videos from that channel.
          </p>
        </div>
      </div>

      {channels.length === 0 ? (
        <p className={styles.emptyState}>No channels available yet.</p>
      ) : (
        <div className={styles.actorGrid}>
          {channels.map((channel) => {
            const channelName = channel?.name || channel?.slug || "Channel";
            const channelSlug = channel?.slug || channel?.name || "";
            const channelKey = channel?.id || channel?.slug || channel?.name;

            return (
              <Link
                key={channelKey}
                href={`/channels/${encodeURIComponent(channelSlug)}`}
                className={styles.actorCard}
              >
                <div className={styles.actorAvatar}>
                  {channel?.profile_pic ? (
                    <img
                      src={channel.profile_pic}
                      alt={channelName}
                      className={styles.actorAvatarImage}
                    />
                  ) : (
                    <span>
                      {String(channelName).trim().charAt(0).toUpperCase() || "C"}
                    </span>
                  )}
                </div>
                <div className={styles.actorInfo}>
                  <p className={styles.actorName}>{channelName}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
