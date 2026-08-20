"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../page.module.css";
import { CategoryIcon, StarIcon, ChannelIcon } from "./Icons";

const BROWSE_LINKS = [
  { href: "/affiliate/categories", label: "Categories", Icon: CategoryIcon },
  { href: "/affiliate/pornstars", label: "Pornstars", Icon: StarIcon },
  { href: "/affiliate/channels", label: "Channels", Icon: ChannelIcon },
];

export default function SidebarSections({ onLinkClick }) {
  const pathname = usePathname();

  return (
    <nav className={styles.navSection}>
      <h3 className={styles.navTitle}>Browse</h3>
      <ul className={styles.navList}>
        {BROWSE_LINKS.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`${styles.navLink} ${
                pathname?.startsWith(href) ? styles.navLinkActive : ""
              }`}
              onClick={onLinkClick}
            >
              <Icon className={styles.navIcon} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
