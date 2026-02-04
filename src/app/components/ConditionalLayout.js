"use client";

import { usePathname } from "next/navigation";
import LayoutShell from "../LayoutShell";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  // Don't wrap admin routes with main LayoutShell
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Use main LayoutShell for all other routes
  return <LayoutShell>{children}</LayoutShell>;
}


