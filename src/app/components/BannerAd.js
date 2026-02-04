"use client";

import { useEffect, useRef } from "react";

// ExoClick Banner Ad Component
export default function BannerAd({ zoneId, size = "300x250", className = "" }) {
  const adRef = useRef(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current || !adRef.current) return;

    // ExoClick ad script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = `//a.exoclick.com/ads.php?type=banner&zoneid=${zoneId}&size=${size}`;

    // Create ad container
    const adContainer = document.createElement('div');
    adContainer.id = `exoclick-banner-${zoneId}`;
    adContainer.style.cssText = 'display: inline-block;';

    // Clear existing content
    adRef.current.innerHTML = '';
    adRef.current.appendChild(adContainer);

    // Load the ad script
    document.head.appendChild(script);

    hasLoaded.current = true;

    // Cleanup function
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      hasLoaded.current = false;
    };
  }, [zoneId, size]);

  return (
    <div
      ref={adRef}
      className={`banner-ad ${className}`}
      style={{
        minHeight: size === '300x250' ? '250px' :
                   size === '728x90' ? '90px' :
                   size === '160x600' ? '600px' : '250px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 95, 156, 0.2)',
        borderRadius: '8px',
        margin: '16px 0'
      }}
    >
      {/* Loading placeholder */}
      <div style={{
        color: '#b2adb9',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '8px' }}>📢</div>
        Advertisement
      </div>
    </div>
  );
}

// Pre-configured banner sizes for common use
export const TopBanner = ({ zoneId }) => (
  <BannerAd zoneId={zoneId} size="728x90" className="top-banner" />
);

export const SidebarBanner = ({ zoneId }) => (
  <BannerAd zoneId={zoneId} size="160x600" className="sidebar-banner" />
);

export const ContentBanner = ({ zoneId }) => (
  <BannerAd zoneId={zoneId} size="300x250" className="content-banner" />
);

export const MobileBanner = ({ zoneId }) => (
  <BannerAd zoneId={zoneId} size="320x50" className="mobile-banner" />
);
