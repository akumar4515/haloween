"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "../../../contexts/UserContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

export default function GoogleCallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useUser();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    const handleAuth = async () => {
      if (error) {
        console.error("Google auth error:", error);
        router.push("/?auth=error&message=" + encodeURIComponent(error));
        return;
      }

      if (code) {
        try {
          const backendCallbackUrl = `${API_BASE}/auth/google/callback?code=${encodeURIComponent(
            code
          )}`;
          window.location.href = backendCallbackUrl;
        } catch (err) {
          console.error("Error handling Google callback:", err);
          router.push("/?auth=error");
        }
      } else {
        router.push("/");
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

