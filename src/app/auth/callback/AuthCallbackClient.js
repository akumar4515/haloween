"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../contexts/UserContext";

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    const handleAuth = async () => {
      if (error) {
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "GOOGLE_AUTH_ERROR",
              error: error,
            },
            window.location.origin
          );
        }
        window.close();
        return;
      }

      if (token && success === "true") {
        try {
          const API_BASE =
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            "http://localhost:5000";

          const res = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const data = await res.json();
              if (data.success && data.user) {
                const userData = {
                  id: data.user.id,
                  email: data.user.email,
                  name: data.user.name,
                  profile_pic: data.user.picture,
                };

                localStorage.setItem(
                  "userAuth",
                  JSON.stringify({
                    authenticated: true,
                    token: token,
                    user: userData,
                    timestamp: Date.now(),
                  })
                );

                if (window.opener) {
                  window.opener.postMessage(
                    {
                      type: "GOOGLE_AUTH_SUCCESS",
                      user: userData,
                      token: token,
                    },
                    window.location.origin
                  );
                }

                setTimeout(() => {
                  window.close();
                }, 500);
                return;
              }
            }
          }

          if (window.opener) {
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_ERROR",
                error: "Failed to fetch user data",
              },
              window.location.origin
            );
          }
          window.close();
        } catch (err) {
          console.error("Error handling auth callback:", err);
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_ERROR",
                error: err.message || "Unknown error",
              },
              window.location.origin
            );
          }
          window.close();
        }
      } else {
        window.close();
      }
    };

    handleAuth();
  }, [searchParams]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#050507",
        color: "#f5f5f7",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p>Completing authentication...</p>
      </div>
    </div>
  );
}

