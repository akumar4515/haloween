"use client";

import { useEffect, useRef, useState } from "react";

// ExoClick Pre-Video Ad Component (Pre-roll or Overlay)
export default function PreVideoAd({
  zoneId,
  onAdComplete,
  onAdSkip,
  type = "preroll", // "preroll" or "overlay"
  className = ""
}) {
  const adRef = useRef(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const skipTimeoutRef = useRef(null);

  useEffect(() => {
    if (!adRef.current || adLoaded) return;

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

    // Show skip button after 5 seconds
    skipTimeoutRef.current = setTimeout(() => {
      setShowSkipButton(true);
    }, 5000);

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
      if (skipTimeoutRef.current) {
        clearTimeout(skipTimeoutRef.current);
      }
      window.removeEventListener('exoclick_ad_complete', handleAdComplete);
    };
  }, [zoneId, type, adLoaded, onAdComplete]);

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
      {showSkipButton && (
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(255, 95, 156, 0.9)',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            zIndex: 1001,
            pointerEvents: 'auto'
          }}
        >
          Skip Ad
        </button>
      )}

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
      type="overlay"
      onAdComplete={onComplete}
      onAdSkip={onSkip}
      className="overlay-ad"
    />
  );
}
