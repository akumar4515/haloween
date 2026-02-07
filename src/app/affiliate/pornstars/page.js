import Link from "next/link";
import styles from "../../page.module.css";

export const dynamic = "force-dynamic";

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

async function fetchPornstars() {
  const apiRoot = getApiRoot();
  try {
    const res = await fetch(`${apiRoot}/affiliate/pornstars`, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching pornstars:", error);
    return [];
  }
}

export default async function PornstarsPage() {
  const pornstars = await fetchPornstars();

  return (
    <div className={styles.listPage}>
      <div className={styles.listHeader}>
        <div>
          <h1 className={styles.listTitle}>Pornstars</h1>
          <p className={styles.listSubtitle}>Browse videos by pornstar</p>
        </div>
      </div>

      {pornstars.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No pornstars available.</p>
        </div>
      ) : (
        <div className={styles.categoryGrid}>
          {pornstars.map((pornstar) => (
            <Link
              key={pornstar.id}
              href={`/affiliate/pornstar/${pornstar.id}`}
              className={styles.categoryPill}
            >
              {pornstar.name} {pornstar.video_count > 0 && `(${pornstar.video_count})`}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
