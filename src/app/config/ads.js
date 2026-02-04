// ExoClick Ad Configuration
// Replace these zone IDs with your actual ExoClick zone IDs

export const EXOCLICK_ZONES = {
  // Banner Ads
  TOP_BANNER: process.env.NEXT_PUBLIC_EXOCLICK_TOP_BANNER || '1234567', // 728x90
  SIDEBAR_BANNER: process.env.NEXT_PUBLIC_EXOCLICK_SIDEBAR_BANNER || '1234568', // 160x600
  CONTENT_BANNER_1: process.env.NEXT_PUBLIC_EXOCLICK_CONTENT_BANNER_1 || '1234569', // 300x250
  CONTENT_BANNER_2: process.env.NEXT_PUBLIC_EXOCLICK_CONTENT_BANNER_2 || '1234570', // 300x250
  MOBILE_BANNER: process.env.NEXT_PUBLIC_EXOCLICK_MOBILE_BANNER || '1234571', // 320x50

  // Video Ads
  PREROLL_VIDEO: process.env.NEXT_PUBLIC_EXOCLICK_PREROLL_VIDEO || '1234572',
  OVERLAY_VIDEO: process.env.NEXT_PUBLIC_EXOCLICK_OVERLAY_VIDEO || '1234573',

  // Popunder/Click Ads
  POPUNDER: process.env.NEXT_PUBLIC_EXOCLICK_POPUNDER || '1234574',
  NATIVE_AD: process.env.NEXT_PUBLIC_EXOCLICK_NATIVE_AD || '1234575',
};

// Ad placement configuration
export const AD_PLACEMENTS = {
  // Home page ads
  HOME_TOP_BANNER: true,
  HOME_CONTENT_BANNER_1: true,
  HOME_CONTENT_BANNER_2: true,
  HOME_MOBILE_BANNER: true,

  // Watch page ads
  WATCH_PREROLL_AD: true,
  WATCH_OVERLAY_AD: true,
  WATCH_SIDEBAR_BANNER: true,

  // Global ads
  HEADER_BANNER: false, // Enable if you want header banner
  FOOTER_BANNER: false, // Enable if you want footer banner

  // Library page ads
  LIBRARY_CONTENT_BANNER: true,

  // Admin pages (should be false)
  ADMIN_ADS_ENABLED: false,
};

// Ad display logic
export const shouldShowAd = (placement) => {
  // Don't show ads in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_ADS_DEV) {
    return false;
  }

  // Don't show ads on admin pages
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return false;
  }

  return AD_PLACEMENTS[placement] === true;
};

// Helper function to get responsive banner size
export const getResponsiveBannerSize = () => {
  if (typeof window === 'undefined') return '300x250';

  const width = window.innerWidth;
  if (width >= 728) return '728x90'; // Desktop
  if (width >= 320) return '320x50'; // Mobile
  return '300x250'; // Fallback
};

// Ad loading utilities
export const loadExoClickScript = (zoneId, type = 'banner') => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');

    if (type === 'banner') {
      script.src = `//a.exoclick.com/ads.php?type=banner&zoneid=${zoneId}`;
    } else if (type === 'video') {
      script.src = `//a.exoclick.com/ads.php?type=video&zoneid=${zoneId}`;
    } else if (type === 'popunder') {
      script.src = `//a.exoclick.com/ads.php?type=popunder&zoneid=${zoneId}`;
    }

    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error('Failed to load ExoClick script'));

    document.head.appendChild(script);
  });
};

// GDPR and ad consent utilities
export const checkAdConsent = () => {
  // Check for GDPR consent or other ad targeting requirements
  if (typeof window === 'undefined') return true;

  // You can integrate with consent management platforms here
  // For now, just check if user has accepted cookies/ads
  const consent = localStorage.getItem('adConsent');
  return consent === 'accepted';
};

export const requestAdConsent = () => {
  // Show consent dialog for GDPR compliance
  // This is a basic implementation - you should use a proper CMP
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true);
      return;
    }

    const consent = confirm(
      'This site uses advertising to support our content. By continuing to use this site, you agree to our use of cookies and advertising. Click OK to continue or Cancel to leave.'
    );

    if (consent) {
      localStorage.setItem('adConsent', 'accepted');
      resolve(true);
    } else {
      resolve(false);
    }
  });
};

// Ad performance tracking
export const trackAdImpression = (zoneId, adType) => {
  // Track ad impressions for analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ad_impression', {
      ad_zone: zoneId,
      ad_type: adType,
    });
  }
};

export const trackAdClick = (zoneId, adType) => {
  // Track ad clicks for analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'ad_click', {
      ad_zone: zoneId,
      ad_type: adType,
    });
  }
};
