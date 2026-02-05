"use client";

import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://a.magsrv.com/ad-provider.js";
const DEFAULT_ZONE_ID =
  process.env.NEXT_PUBLIC_ADPROVIDER_TOP_BANNER_ZONE_ID || "5846058";
const DEFAULT_CLASS_NAME =
  process.env.NEXT_PUBLIC_ADPROVIDER_TOP_BANNER_CLASS || "eas6a97888e2";

export default function AdProviderBanner({
  className = "",
  zoneId = DEFAULT_ZONE_ID,
  adClassName = DEFAULT_CLASS_NAME,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.async = true;
      script.type = "application/javascript";
      script.src = SCRIPT_SRC;
      document.body.appendChild(script);
    }

    if (!containerRef.current.querySelector("ins")) {
      const ins = document.createElement("ins");
      ins.className = adClassName;
      ins.setAttribute("data-zoneid", zoneId);
      containerRef.current.appendChild(ins);
    }

    window.AdProvider = window.AdProvider || [];
    window.AdProvider.push({ serve: {} });
  }, [adClassName, zoneId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "90px",
        margin: "16px 0",
      }}
    />
  );
}
