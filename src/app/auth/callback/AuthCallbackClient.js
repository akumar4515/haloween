"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "../../contexts/UserContext";

export default function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useUser();

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
          window.close();
        } else {
          // Full page redirect - redirect to home with error
          router.push("/?auth=error&message=" + encodeURIComponent(error));
        }
        return;
      }

      if (token && success === "true") {
        try {
          const API_BASE =
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            "http://localhost:5000";

          const res = await fetch(`${API_BASE}/api/auth/me`, {
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

                // Update user context
                login(userData, token);

                if (window.opener) {
                  // Popup window - send message and close
                  window.opener.postMessage(
                    {
                      type: "GOOGLE_AUTH_SUCCESS",
                      user: userData,
                      token: token,
                    },
                    window.location.origin
                  );
                  setTimeout(() => {
                    window.close();
                  }, 500);
                } else {
                  // Full page redirect - redirect to home and refresh
                  router.push("/?auth=success");
                  // Force a page refresh to update all components
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                }
                return;
              }
            }
          }

          // Failed to fetch user data
          if (window.opener) {
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_ERROR",
                error: "Failed to fetch user data",
              },
              window.location.origin
            );
            window.close();
          } else {
            router.push("/?auth=error&message=" + encodeURIComponent("Failed to fetch user data"));
          }
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
            window.close();
          } else {
            router.push("/?auth=error&message=" + encodeURIComponent(err.message || "Unknown error"));
          }
        }
      } else {
        // No token or success
        if (window.opener) {
          window.close();
        } else {
          router.push("/");
        }
      }
    };

    handleAuth();
  }, [searchParams, router, login]);

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

