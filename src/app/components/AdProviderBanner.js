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

    // Check if ad loaded after a delay and hide container if no ad content
    const checkAdLoaded = setTimeout(() => {
      if (containerRef.current) {
        const ins = containerRef.current.querySelector("ins");
        if (ins) {
          const hasAdContent = ins.offsetHeight > 0 || 
                               ins.innerHTML.trim() !== "" ||
                               ins.querySelector("iframe") ||
                               ins.querySelector("img") ||
                               ins.querySelector("a");
          
          // Hide container if no ad content loaded
          if (!hasAdContent) {
            containerRef.current.style.display = "none";
          }
        } else {
          // No ins element, hide container
          containerRef.current.style.display = "none";
        }
      }
    }, 5000); // Check after 5 seconds to allow ad to load

    return () => clearTimeout(checkAdLoaded);
  }, [adClassName, zoneId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "16px 0",
        minHeight: 0, // No minimum height - let ad determine size
      }}
    />
  );
}
