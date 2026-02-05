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

                // Check if we're in a popup window
                const isPopup = window.opener && !window.opener.closed;
                
                if (isPopup) {
                  // Popup window - send message and close
                  try {
                    window.opener.postMessage(
                      {
                        type: "GOOGLE_AUTH_SUCCESS",
                        user: userData,
                        token: token,
                      },
                      window.location.origin
                    );
                    // Close popup after a short delay
                    setTimeout(() => {
                      window.close();
                    }, 300);
                  } catch (postMessageError) {
                    console.error("Error sending message to opener:", postMessageError);
                    // Fallback: try to close and let parent check auth
                    window.close();
                  }
                } else {
                  // Full page redirect - redirect to home and refresh
                  router.push("/?auth=success");
                  // Force a page refresh to update all components
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                }
                return;
              } else {
                console.error("User data not found in response:", data);
              }
            } else {
              console.error("Invalid content type:", contentType);
            }
          } else {
            const errorText = await res.text().catch(() => "Unknown error");
            console.error("Failed to fetch user data:", res.status, errorText);
          }

          // Failed to fetch user data
          const isPopup = window.opener && !window.opener.closed;
          if (isPopup) {
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_ERROR",
                error: "Failed to fetch user data",
              },
              window.location.origin
            );
            setTimeout(() => {
              window.close();
            }, 300);
          } else {
            router.push("/?auth=error&message=" + encodeURIComponent("Failed to fetch user data"));
          }
        } catch (err) {
          console.error("Error handling auth callback:", err);
          const isPopup = window.opener && !window.opener.closed;
          if (isPopup) {
            window.opener.postMessage(
              {
                type: "GOOGLE_AUTH_ERROR",
                error: err.message || "Unknown error",
              },
              window.location.origin
            );
            setTimeout(() => {
              window.close();
            }, 300);
          } else {
            router.push("/?auth=error&message=" + encodeURIComponent(err.message || "Unknown error"));
          }
        }
      } else {
        // No token or success
        console.warn("No token or success parameter found", { token, success });
        const isPopup = window.opener && !window.opener.closed;
        if (isPopup) {
          window.opener.postMessage(
            {
              type: "GOOGLE_AUTH_ERROR",
              error: "Authentication failed: No token received",
            },
            window.location.origin
          );
          setTimeout(() => {
            window.close();
          }, 300);
        } else {
          router.push("/?auth=error&message=" + encodeURIComponent("No token received"));
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

