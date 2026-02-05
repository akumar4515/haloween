"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Completing login...");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    const returnTo = localStorage.getItem("authReturnTo") || "/";

    const handleAuth = async () => {
      if (error) {
        setStatus(`Authentication failed: ${error}`);
        localStorage.removeItem("authReturnTo");
        window.location.replace(returnTo);
        return;
      }

      if (!token) {
        setStatus("Authentication failed: Missing token");
        localStorage.removeItem("authReturnTo");
        window.location.replace(returnTo);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const data = await res.json();
        const user = data?.user
          ? {
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              profile_pic: null,
            }
          : null;

        if (!user) {
          throw new Error("User profile missing");
        }

        localStorage.setItem(
          "userAuth",
          JSON.stringify({
            authenticated: true,
            token,
            user,
            timestamp: Date.now(),
          })
        );

        localStorage.removeItem("authReturnTo");
        window.location.replace(returnTo);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Authentication failed";
        setStatus(`Authentication failed: ${message}`);
        localStorage.removeItem("authReturnTo");
        window.location.replace(returnTo);
      }
    };

    handleAuth();
  }, [searchParams]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Authentication</h1>
      <p>{status}</p>
    </div>
  );
}
