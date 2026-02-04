"use client";

import Link from "next/link";
import styles from "../page.module.css";

export default function ActorCard({ actor }) {
  const actorName =
    typeof actor === "string" ? actor : actor?.name || actor?.slug;
  const actorLabel = actorName || "Actor";
  const actorQuery =
    typeof actor === "string" ? actor : actor?.slug || actor?.name;
  const actorKey =
    typeof actor === "string"
      ? actor
      : actor?.id || actor?.slug || actor?.name;

  return (
    <Link
      href={`/actors/${encodeURIComponent(actorQuery || "")}`}
      className={styles.actorCard}
    >
      <div className={styles.actorAvatar}>
        {actor?.profile_pic || actor?.profile_picture || actor?.avatar || actor?.image ? (
          <img
            src={actor?.profile_pic || actor?.profile_picture || actor?.avatar || actor?.image}
            alt={actorLabel}
            className={styles.actorAvatarImage}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <span style={{ display: actor?.profile_pic || actor?.profile_picture || actor?.avatar || actor?.image ? "none" : "flex" }}>
          {String(actorLabel).trim().charAt(0).toUpperCase() || "A"}
        </span>
      </div>
      <div className={styles.actorInfo}>
        <p className={styles.actorName}>{actorLabel}</p>
      </div>
    </Link>
  );
}

