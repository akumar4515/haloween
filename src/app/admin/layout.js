import AdminLayoutShell from "./AdminLayoutShell";

export const metadata = {
  title: "Admin Panel - Flovex",
  description: "Admin dashboard for Flovex",
};

export default function AdminLayout({ children }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

