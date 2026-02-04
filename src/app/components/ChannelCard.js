"use client";

import Link from "next/link";
import styles from "../page.module.css";

export default function ChannelCard({ channel }) {
  const channelName = channel?.name || channel?.slug || "Channel";
  const channelSlug = channel?.slug || channel?.name || "";

  return (
    <Link
      href={`/channels/${encodeURIComponent(channelSlug)}`}
      className={styles.actorCard}
    >
      <div className={styles.actorAvatar}>
        {channel?.profile_pic || channel?.profile_picture || channel?.avatar || channel?.image ? (
          <img
            src={channel?.profile_pic || channel?.profile_picture || channel?.avatar || channel?.image}
            alt={channelName}
            className={styles.actorAvatarImage}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <span style={{ display: channel?.profile_pic || channel?.profile_picture || channel?.avatar || channel?.image ? "none" : "flex" }}>
          {String(channelName).trim().charAt(0).toUpperCase() || "C"}
        </span>
      </div>
      <div className={styles.actorInfo}>
        <p className={styles.actorName}>{channelName}</p>
      </div>
    </Link>
  );
}

