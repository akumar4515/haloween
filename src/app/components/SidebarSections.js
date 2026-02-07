import Link from "next/link";
import styles from "../page.module.css";

export default function SidebarSections({ onLinkClick }) {
  return (
    <>
      <nav className={styles.navSection}>
        <h3 className={styles.navTitle}>Browse</h3>
        <ul className={styles.navList}>
          <li>
            <Link
              href="/affiliate/categories"
              className={styles.navLink}
              onClick={onLinkClick}
            >
              Categories
            </Link>
          </li>
          <li>
            <Link
              href="/affiliate/pornstars"
              className={styles.navLink}
              onClick={onLinkClick}
            >
              Pornstars
            </Link>
          </li>
          <li>
            <Link
              href="/affiliate/channels"
              className={styles.navLink}
              onClick={onLinkClick}
            >
              Channels
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
