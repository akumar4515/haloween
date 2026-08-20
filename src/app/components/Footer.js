"use client";

import Link from "next/link";
import styles from "../page.module.css";

const FOOTER_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms and Conditions" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLinks}>
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.footerLink}>
              {label}
            </Link>
          ))}
        </div>
        <div className={styles.footerCopyright}>© {currentYear} flovex.net</div>
      </div>
    </footer>
  );
}
