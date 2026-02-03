import Link from "next/link";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

async function fetchActors() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const tryFetch = async (path) => {
    const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? [];
  };

  const actors = await tryFetch("/actors");
  if (actors) return actors;

  // Fallback for APIs that expose only channels.
  const channels = await tryFetch("/channels");
  return channels ?? [];
}

export default async function ActorsPage() {
  const actors = await fetchActors();

  return (
    <div className={styles.listPage}>
      <div className={styles.listHeader}>
        <div>
          <h1 className={styles.listTitle}>Actors</h1>
          <p className={styles.listSubtitle}>
            Choose an actor to see videos featuring them.
          </p>
        </div>
      </div>

      {actors.length === 0 ? (
        <p className={styles.emptyState}>No actors available yet.</p>
      ) : (
        <div className={styles.actorGrid}>
          {actors.map((actor) => {
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
                key={actorKey}
                href={`/actors/${encodeURIComponent(actorQuery || "")}`}
                className={styles.actorCard}
              >
                <div className={styles.actorAvatar}>
                  {actor?.profile_pic ? (
                    <img
                      src={actor.profile_pic}
                      alt={actorLabel}
                      className={styles.actorAvatarImage}
                    />
                  ) : (
                    <span>
                      {String(actorLabel).trim().charAt(0).toUpperCase() || "A"}
                    </span>
                  )}
                </div>
                <div className={styles.actorInfo}>
                  <p className={styles.actorName}>{actorLabel}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

