"use client";

import ChannelCard from "./ChannelCard";
import styles from "../page.module.css";

export default function ChannelList({ channels }) {
  if (channels.length === 0) {
    return <p className={styles.emptyState}>No channels available yet.</p>;
  }

  return (
    <div className={styles.actorGrid}>
      {channels.map((channel) => {
        const channelKey = channel?.id || channel?.slug || channel?.name;
        return <ChannelCard key={channelKey} channel={channel} />;
      })}
    </div>
  );
}

