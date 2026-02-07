"use client";

import { useEffect, useRef, useState } from "react";

// ExoClick Pre-Video Ad Component (Pre-roll or Overlay)
export default function PreVideoAd({
  zoneId,
  vastUrl,
  onAdComplete,
  onAdSkip,
  type = "preroll", // "preroll" or "overlay"
  className = ""
}) {
  const skipDelaySeconds = 15;
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [vastMediaUrl, setVastMediaUrl] = useState(null);
  const [vastError, setVastError] = useState(null);
  const skipTimeoutRef = useRef(null);
  const [remainingSeconds, setRemainingSeconds] = useState(skipDelaySeconds);

  useEffect(() => {
    if (!adRef.current || adLoaded) return;

    if (vastUrl) {
      const loadVast = async () => {
        try {
          const res = await fetch(vastUrl);
          if (!res.ok) {
            throw new Error("Failed to load VAST");
          }
          const text = await res.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, "text/xml");
          const mediaFiles = Array.from(xml.getElementsByTagName("MediaFile"));
          const mediaNode = mediaFiles.find((node) => {
            const typeAttr = node.getAttribute("type") || "";
            return typeAttr.includes("video");
          }) || mediaFiles[0];
          const url = mediaNode?.textContent?.trim();
          if (!url) {
            throw new Error("No media file in VAST");
          }
          setVastMediaUrl(url);
          setAdLoaded(true);
        } catch (error) {
          setVastError(error?.message || "Failed to load VAST");
          setAdLoaded(true);
        }
      };

      loadVast();
    } else {
      // ExoClick video ad script
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');

      if (type === "preroll") {
        script.src = `//a.exoclick.com/ads.php?type=video&zoneid=${zoneId}&size=preroll`;
      } else {
        script.src = `//a.exoclick.com/ads.php?type=video&zoneid=${zoneId}&size=overlay`;
      }

      // Create ad container
      const adContainer = document.createElement('div');
      adContainer.id = `exoclick-video-${zoneId}`;
      adContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
      `;

      // Ad content wrapper
      const adWrapper = document.createElement('div');
      adWrapper.style.cssText = 'width: 100%; height: 100%; position: relative;';
      adWrapper.innerHTML = `
        <div style="
          position: absolute;
          top: 10px;
          right: 10px;
          color: white;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.7);
          padding: 5px 10px;
          border-radius: 4px;
          z-index: 1001;
        ">
          Ad
        </div>
      `;

      adContainer.appendChild(adWrapper);
      adRef.current.appendChild(adContainer);
      document.head.appendChild(script);

      setAdLoaded(true);

      // Listen for ad completion
      const handleAdComplete = () => {
        setAdCompleted(true);
        onAdComplete && onAdComplete();
      };

      // ExoClick typically fires custom events
      window.addEventListener('exoclick_ad_complete', handleAdComplete);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        window.removeEventListener('exoclick_ad_complete', handleAdComplete);
      };
    }

    // Enable skip after 15 seconds
    skipTimeoutRef.current = setTimeout(() => {
      // timer only
    }, skipDelaySeconds * 1000);

    return () => {
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
    };
  }, [zoneId, type, adLoaded, onAdComplete, vastUrl, skipDelaySeconds]);

  useEffect(() => {
    if (adCompleted) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(skipDelaySeconds - elapsed, 0);
      setRemainingSeconds(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [adCompleted, skipDelaySeconds]);

  const handleSkip = () => {
    setAdCompleted(true);
    onAdSkip && onAdSkip();
  };

  if (adCompleted) {
    return null; // Hide ad when completed
  }

  return (
    <div
      ref={adRef}
      className={`pre-video-ad ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    >
      {vastUrl && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            pointerEvents: "auto",
          }}
        >
          {vastMediaUrl ? (
            <video
              src={vastMediaUrl}
              autoPlay
              muted
              playsInline
              onEnded={() => {
                setAdCompleted(true);
                onAdComplete && onAdComplete();
              }}
              onError={() => {
                setVastError("Failed to play ad");
              }}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div style={{ color: "white", textAlign: "center" }}>
              {vastError ? vastError : "Loading ad..."}
            </div>
          )}
        </div>
      )}
      <button
        onClick={handleSkip}
        disabled={remainingSeconds > 0}
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          background: remainingSeconds > 0 ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 95, 156, 0.9)",
          color: "#fff",
          border: "none",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "bold",
          zIndex: 1001,
          pointerEvents: "auto",
          cursor: remainingSeconds > 0 ? "default" : "pointer"
        }}
      >
        {remainingSeconds > 0 ? `Skip in ${remainingSeconds}s` : "Skip Ad"}
      </button>

      {/* Loading overlay */}
      {!adLoaded && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            zIndex: 999
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
            Loading Ad...
          </div>
          <div style={{ fontSize: '14px', color: '#b2adb9' }}>
            Your video will start after this short ad
          </div>
        </div>
      )}
    </div>
  );
}

// Pre-roll ad that shows before video starts
export function VideoPreRollAd({ zoneId, onComplete, onSkip }) {
  return (
    <PreVideoAd
      zoneId={zoneId}
      vastUrl={
        process.env.NEXT_PUBLIC_ADPROVIDER_PREROLL_VAST_URL ||
        "https://s.magsrv.com/v1/vast.php?idzone=5846074"
      }
      type="preroll"
      onAdComplete={onComplete}
      onAdSkip={onSkip}
      className="preroll-ad"
    />
  );
}

// Overlay ad that can show during video
export function VideoOverlayAd({ zoneId, onComplete, onSkip }) {
  return (
    <PreVideoAd
      zoneId={zoneId}
      vastUrl={
        process.env.NEXT_PUBLIC_ADPROVIDER_OVERLAY_VAST_URL ||
        "https://s.magsrv.com/v1/vast.php?idzone=5846076"
      }
      type="overlay"
      onAdComplete={onComplete}
      onAdSkip={onSkip}
      className="overlay-ad"
    />
  );
}
