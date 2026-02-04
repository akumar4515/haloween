"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "../../../contexts/UserContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useUser();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    const handleAuth = async () => {
      if (error) {
        // Handle error
        console.error("Google auth error:", error);
        router.push("/?auth=error&message=" + encodeURIComponent(error));
        return;
      }

      if (code) {
        try {
          // Forward the code to backend's callback endpoint
          // The backend will exchange the code for tokens and redirect back
          const backendCallbackUrl = `${API_BASE}/auth/google/callback?code=${encodeURIComponent(code)}`;
          
          // Use window.location to follow redirects properly
          // The backend will redirect to /auth/callback?token=...&success=true
          window.location.href = backendCallbackUrl;
        } catch (error) {
          console.error("Error handling Google callback:", error);
          router.push("/?auth=error");
        }
      } else {
        // No code, redirect to home
        router.push("/");
      }
    };

    handleAuth();
  }, [searchParams, router]);

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

