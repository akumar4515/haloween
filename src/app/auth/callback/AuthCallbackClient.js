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

    const sendError = (message) => {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "GOOGLE_AUTH_ERROR", error: message },
          window.location.origin
        );
        window.close();
      }
    };

    const handleAuth = async () => {
      if (error) {
        setStatus(`Authentication failed: ${error}`);
        sendError(error);
        return;
      }

      if (!token) {
        setStatus("Authentication failed: Missing token");
        sendError("Missing token");
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

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: "GOOGLE_AUTH_SUCCESS", token, user },
            window.location.origin
          );
          window.close();
          return;
        }

        window.location.replace("/");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Authentication failed";
        setStatus(`Authentication failed: ${message}`);
        sendError(message);
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
