import styles from "../page.module.css";

export const dynamic = "force-dynamic";

export default function NewestPage() {
  return (
    <div className={styles.listPage}>
      <div className={styles.listHeader}>
        <div>
          <h1 className={styles.listTitle}>Newest</h1>
          <p className={styles.listSubtitle}>
            Newest videos page coming soon. Here you can highlight the latest
            uploads from your platform.
          </p>
        </div>
      </div>
    </div>
  );
}

