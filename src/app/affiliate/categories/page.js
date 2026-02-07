import Link from "next/link";
import styles from "../../page.module.css";

export const dynamic = "force-dynamic";

const getApiRoot = () => {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

async function fetchCategories() {
  const apiRoot = getApiRoot();
  try {
    const res = await fetch(`${apiRoot}/affiliate/categories`, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

async function fetchEpornerCategories() {
  const apiRoot = getApiRoot();
  try {
    const res = await fetch(`${apiRoot}/eporner/categories`, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (data && data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching eporner categories:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const [categories, epornerCategories] = await Promise.all([
    fetchCategories(),
    fetchEpornerCategories(),
  ]);

  return (
    <div className={styles.listPage}>
      <div className={styles.listHeader}>
        <div>
          <h1 className={styles.listTitle}>Categories</h1>
          <p className={styles.listSubtitle}>Browse videos by category</p>
        </div>
      </div>

      {categories.length === 0 && epornerCategories.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No categories available.</p>
        </div>
      ) : (
        <>
          {categories.length > 0 && (
            <div className={styles.categoryGrid}>
              {categories.map((category) => (
                <Link
                  key={`aff-${category.id}`}
                  href={`/affiliate/category/${category.id}`}
                  className={styles.categoryPill}
                >
                  {category.name} {category.video_count > 0 && `(${category.video_count})`}
                </Link>
              ))}
            </div>
          )}
          {epornerCategories.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Eporner Categories</h2>
              <div className={styles.categoryGrid}>
                {epornerCategories.map((category) => (
                  <Link
                    key={`epo-${category.id || category.name}`}
                    href={`/affiliate/category/${encodeURIComponent(category.name || category.id || "")}?source=eporner`}
                    className={`${styles.categoryPill} ${styles.categoryPillEporner}`}
                  >
                    {category.name} {category.video_count > 0 && `(${category.video_count})`}
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
