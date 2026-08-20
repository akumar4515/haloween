"use client";

import { useEffect, useRef } from "react";

let flovexBarScriptPromise;

function loadBarLibrary(src) {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.banner) {
    return Promise.resolve();
  }

  if (flovexBarScriptPromise) {
    return flovexBarScriptPromise;
  }

  flovexBarScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Flovex bar library"));
    document.head.appendChild(script);
  });

  return flovexBarScriptPromise;
}

function parseScriptParts(snippetHtml) {
  if (typeof window === "undefined") {
    return { libSrc: null, inlineScript: null };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(snippetHtml, "text/html");
  const scripts = Array.from(doc.querySelectorAll("script"));

  const libScript = scripts.find((script) => script.src);
  const inlineScript = scripts.find((script) => !script.src);

  return {
    libSrc: libScript?.src || null,
    inlineScript: inlineScript?.textContent?.trim() || null,
  };
}

export default function FlovexBarAd({ snippetPath, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    const mountBar = async () => {
      try {
        const response = await fetch(snippetPath, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to fetch Flovex snippet: ${snippetPath}`);
        }

        const snippetHtml = await response.text();
        const { libSrc, inlineScript } = parseScriptParts(snippetHtml);

        if (!libSrc || !inlineScript) {
          throw new Error(`Invalid Flovex snippet format: ${snippetPath}`);
        }

        await loadBarLibrary(libSrc);
        if (isCancelled || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = "";
        const inlineScriptTag = document.createElement("script");
        inlineScriptTag.type = "text/javascript";
        inlineScriptTag.text = inlineScript;
        containerRef.current.appendChild(inlineScriptTag);
      } catch (error) {
        // Keep failure silent in production; log details in development only.
        if (process.env.NODE_ENV === "development") {
          console.error("Flovex bar mount error:", error);
        }
      }
    };

    mountBar();

    return () => {
      isCancelled = true;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [snippetPath]);

  return (
    <div
      ref={containerRef}
      className={className}
      // Own stacking context so the bar library cannot paint over the sidebar
      style={{ position: "relative", zIndex: 0, isolation: "isolate" }}
    />
  );
}

