"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../../contexts/UserContext";

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    const handleAuth = async () => {
      if (error) {
        // Handle error - notify parent and close
        if (window.opener) {
          window.opener.postMessage({
            type: "GOOGLE_AUTH_ERROR",
            error: error,
          }, window.location.origin);
        }
        window.close();
        return;
      }

      if (token && success === "true") {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
          
          // Fetch user data from backend
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
                
                // Store in localStorage (will be accessible to parent after popup closes)
                localStorage.setItem("userAuth", JSON.stringify({
                  authenticated: true,
                  token: token,
                  user: userData,
                  timestamp: Date.now(),
                }));
                
                // Notify parent window with login function
                if (window.opener) {
                  window.opener.postMessage({
                    type: "GOOGLE_AUTH_SUCCESS",
                    user: userData,
                    token: token,
                  }, window.location.origin);
                }
                
                // Close popup
                setTimeout(() => {
                  window.close();
                }, 500);
                return;
              }
            }
          }
          
          // If we get here, something went wrong
          if (window.opener) {
            window.opener.postMessage({
              type: "GOOGLE_AUTH_ERROR",
              error: "Failed to fetch user data",
            }, window.location.origin);
          }
          window.close();
        } catch (error) {
          console.error("Error handling auth callback:", error);
          if (window.opener) {
            window.opener.postMessage({
              type: "GOOGLE_AUTH_ERROR",
              error: error.message || "Unknown error",
            }, window.location.origin);
          }
          window.close();
        }
      } else {
        // No token, close popup
        window.close();
      }
    };

    handleAuth();
  }, [searchParams]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#050507",
      color: "#f5f5f7",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <p>Completing authentication...</p>
      </div>
    </div>
  );
}

