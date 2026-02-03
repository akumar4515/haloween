"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./admin.module.css";

export default function AdminLayoutShell({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    router.push("/");
  };

  return (
    <div className={styles.adminLayout}>
      <header className={styles.adminHeaderBar}>
        <Link href="/admin" className={styles.adminLogo}>
          <img
            src="/logo.png"
            alt="Flovex logo"
            className={styles.adminLogoImage}
          />
        </Link>
        <button
          className={styles.adminLogoutBtn}
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>
      <main className={styles.adminMain}>
        {children}
      </main>
    </div>
  );
}

