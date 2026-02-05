"use client";

import Link from "next/link";
import styles from "../page.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLinks}>
          <Link href="/privacy-policy" className={styles.footerLink}>
            Privacy Policy
          </Link>
          <span className={styles.footerSeparator}>|</span>
          <Link href="/terms-and-conditions" className={styles.footerLink}>
            Terms and Conditions
          </Link>
        </div>
        <div className={styles.footerCopyright}>
          © {currentYear} flovex.net
        </div>
      </div>
    </footer>
  );
}
