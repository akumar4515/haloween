"use client";

import ActorCard from "./ActorCard";
import styles from "../page.module.css";

export default function ActorList({ actors }) {
  if (actors.length === 0) {
    return <p className={styles.emptyState}>No actors available yet.</p>;
  }

  return (
    <div className={styles.actorGrid}>
      {actors.map((actor) => {
        const actorKey =
          typeof actor === "string"
            ? actor
            : actor?.id || actor?.slug || actor?.name;
        return <ActorCard key={actorKey} actor={actor} />;
      })}
    </div>
  );
}

