import Link from "next/link";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

async function fetchCategories() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  const res = await fetch(`${baseUrl}/categories`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load categories");
  }
  const data = await res.json();
  return data.data ?? [];
}

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className={styles.listPage}>
      <div className={styles.listHeader}>
        <div>
          <h1 className={styles.listTitle}>Categories</h1>
          <p className={styles.listSubtitle}>
            Browse all categories. Click one to see videos in that category.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <p className={styles.emptyState}>No categories available yet.</p>
      ) : (
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/categories/${encodeURIComponent(category)}`}
              className={styles.categoryPill}
            >
              {category}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

