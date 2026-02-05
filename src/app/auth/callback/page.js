"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "../../contexts/UserContext";

export const dynamic = "force-dynamic";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useUser();
  const [message, setMessage] = useState("Completing login...");

  useEffect(() => {
    const success = searchParams.get("success");
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    const notifyAndClose = (payload) => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(payload, window.location.origin);
        window.close();
        return true;
      }
      return false;
    };

    if (success !== "true" || !token) {
      const msg = error || "Authentication failed";
      setMessage(msg);
      notifyAndClose({ type: "GOOGLE_AUTH_ERROR", error: msg });
      return;
    }

    const fetchUser = async () => {
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
        if (!data.success || !data.user) {
          throw new Error("Invalid user payload");
        }

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          profile_pic: data.user.picture,
        };

        login(userData, token);

        if (!notifyAndClose({ type: "GOOGLE_AUTH_SUCCESS", user: userData, token })) {
          router.replace("/");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        const msg = err?.message || "Authentication failed";
        setMessage(msg);
        notifyAndClose({ type: "GOOGLE_AUTH_ERROR", error: msg });
      }
    };

    fetchUser();
  }, [searchParams, login, router]);

  return (
    <div style={{ padding: "2rem", color: "#fff" }}>
      <h2>Google Login</h2>
      <p>{message}</p>
    </div>
  );
}
