import AdminLayoutShell from "./AdminLayoutShell";

export const metadata = {
  title: "Admin Panel - Flovex",
  description: "Admin dashboard for Flovex",
  // robots.txt already disallows /admin; this keeps it out of the index even
  // if the URL is reached some other way.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

