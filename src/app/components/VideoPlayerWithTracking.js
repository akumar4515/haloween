"use client";

import { useEffect, useRef, useState } from "react";
import { VideoPreRollAd } from "./PreVideoAd";
import { shouldShowAd, EXOCLICK_ZONES } from "../config/ads";
import styles from "./VideoPlayer.module.css";

function getEmbedUrl(url) {
  if (!url) return null;

  // If url is an iframe HTML string, extract src="..."
  const raw = String(url).trim();
  if (!raw) return null;
  
  const iframeSrcMatch = raw.match(/<iframe[^>]*\s+src=["']([^"']+)["'][^>]*>/i);
  let normalizedUrl = iframeSrcMatch?.[1] ? iframeSrcMatch[1] : raw;
  
  // Remove any query parameters that might interfere
  normalizedUrl = normalizedUrl.split('?')[0];
  
  // Check for eporner embed URLs (various formats)
  // Eporner embed URLs typically look like: https://www.eporner.com/embed/VIDEO_ID
  if (normalizedUrl.includes('eporner.com/embed') || 
      normalizedUrl.includes('eporner.com/embed/') ||
      normalizedUrl.includes('www.eporner.com/embed') ||
      normalizedUrl.match(/eporner\.com\/embed/i)) {
    // Extract the video ID from the embed URL
    const embedMatch = normalizedUrl.match(/eporner\.com\/embed\/([^\/\s"']+)/i);
    if (embedMatch && embedMatch[1]) {
      return `https://www.eporner.com/embed/${embedMatch[1]}`;
    }
    // If already a full URL, return it
    if (normalizedUrl.startsWith('http')) {
      return normalizedUrl;
    }
    // If relative, make it absolute
    if (normalizedUrl.startsWith('/embed')) {
      return `https://www.eporner.com${normalizedUrl}`;
    }
  }
  
  if (normalizedUrl.includes('youtube.com/embed') || normalizedUrl.includes('youtu.be')) {
    const youtubeRegex = /(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([^&\n?#]+)/;
    const match = normalizedUrl.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  if (normalizedUrl.includes('vimeo.com')) {
    const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
    const match = normalizedUrl.match(vimeoRegex);
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }
  
  // Check for pornhub embed URLs
  if (normalizedUrl.includes('pornhub.com/embed')) {
    if (normalizedUrl.startsWith('http')) {
      return normalizedUrl;
    }
    return `https://www.pornhub.com${normalizedUrl}`;
  }
  
  // Check for any embed or player URLs (including eporner, pornhub, etc.)
  // But exclude direct video file extensions
  if (!normalizedUrl.match(/\.(mp4|webm|ogg|mov|m3u8|avi|mkv)(\?|$)/i)) {
    if (normalizedUrl.includes('/embed') || normalizedUrl.includes('/player') || 
        (normalizedUrl.includes('embed') && !normalizedUrl.includes('.mp4')) ||
        (normalizedUrl.includes('player') && !normalizedUrl.includes('.mp4'))) {
      // Ensure it's a full URL
      if (normalizedUrl.startsWith('http')) {
        return normalizedUrl;
      }
      // Try to construct full URL for common embed patterns
      if (normalizedUrl.startsWith('/embed') || normalizedUrl.startsWith('/player')) {
        // Could be from various domains, but eporner is most likely
        return `https://www.eporner.com${normalizedUrl}`;
      }
    }
  }
  
  // Check if it's a direct video file URL (mp4, webm, etc.)
  if (normalizedUrl.match(/\.(mp4|webm|ogg|mov|m3u8|avi|mkv)(\?|$)/i)) {
    return null; // This is a direct video file, not an embed
  }
  
  return null;
}

export default function VideoPlayerWithTracking({ videoUrl, thumbnailUrl, title, videoId }) {
  const videoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [iframeLoadTimeout, setIframeLoadTimeout] = useState(null);

  // Ad-related state
  const [showPreVideoAd, setShowPreVideoAd] = useState(shouldShowAd('WATCH_PREROLL_AD'));
  const [adCompleted, setAdCompleted] = useState(false);
  const [videoReadyToPlay, setVideoReadyToPlay] = useState(false);

  // Ad event handlers
  const handleAdComplete = () => {
    setAdCompleted(true);
    setShowPreVideoAd(false);
    setVideoReadyToPlay(true);
  };

  const handleAdSkip = () => {
    setAdCompleted(true);
    setShowPreVideoAd(false);
    setVideoReadyToPlay(true);
  };
  
  // Log video URL for debugging and check if it should be embed
  useEffect(() => {
    if (videoUrl) {
      const embedUrl = getEmbedUrl(videoUrl);
      if (process.env.NODE_ENV === 'development') {
        console.log('Video Player Debug:', {
          videoUrl: videoUrl,
          videoUrlLength: videoUrl.length,
          isEmbed: !!embedUrl,
          embedUrl: embedUrl,
          videoId: videoId,
          urlType: embedUrl ? 'EMBED (iframe)' : 'DIRECT (video element)'
        });
      }
      
      // If this is an embed URL but we're trying to use video element, warn
      if (embedUrl && !embedUrl.includes(videoUrl)) {
        console.warn('Video URL should be used as embed iframe, not video element:', {
          original: videoUrl,
          embedUrl: embedUrl
        });
      }
    }
  }, [videoUrl, videoId]);


  // Early check: if no video URL, show error
  if (!videoUrl || videoUrl.trim() === "") {
    return (
      <div className={styles.videoContainer}>
        <div className={styles.errorMessage}>
          <p>Video URL not available</p>
          {thumbnailUrl && (
            <img 
              src={thumbnailUrl} 
              alt={title || "Video thumbnail"} 
              className={styles.errorThumbnail}
            />
          )}
        </div>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(videoUrl);
  
  // Handle embed URLs (iframe) - check this FIRST before trying video element
  if (embedUrl) {
    // For eporner, we might need to handle CORS issues
    // If eporner refuses connection, show a message with link to watch on eporner
    const isEporner = embedUrl.includes('eporner.com');
    
    // Use a very lenient approach - only show error if iframe definitively fails
    // Don't use aggressive timeouts that might trigger false positives
    useEffect(() => {
      if (embedUrl && isEporner) {
        // First, set a shorter timeout to hide loading if iframe has dimensions
        // This handles cases where onLoad doesn't fire (cross-origin issues)
        const hideLoadingTimeout = setTimeout(() => {
          const iframe = document.querySelector('iframe[src*="eporner.com"]');
          if (iframe && isLoading) {
            // If iframe has dimensions, assume it loaded even if onLoad didn't fire
            if (iframe.offsetHeight > 0 || iframe.offsetWidth > 0) {
              setIsLoading(false);
            }
          }
        }, 10000); // 10 seconds - if iframe has dimensions, assume it's working
        
        // Set a very long timeout (60 seconds) as a last resort for actual failures
        const errorTimeout = setTimeout(() => {
          const iframe = document.querySelector('iframe[src*="eporner.com"]');
          if (iframe && isLoading) {
            // Check if iframe has any dimensions - if it does, it's likely loading
            const hasDimensions = iframe.offsetHeight > 0 || iframe.offsetWidth > 0;
            
            if (!hasDimensions) {
              // Iframe has no dimensions after 60 seconds, it likely failed
              setHasError(true);
              setErrorMessage("Eporner embed may be blocked. Please watch on eporner.com directly.");
              setIsLoading(false);
            } else {
              // Iframe has dimensions, assume it's working even if onLoad didn't fire
              setIsLoading(false);
            }
          }
        }, 60000); // 60 seconds - very lenient, only for truly failed loads
        
        setIframeLoadTimeout(errorTimeout);
        return () => {
          clearTimeout(hideLoadingTimeout);
          clearTimeout(errorTimeout);
        };
      }
    }, [embedUrl, isEporner, isLoading]);
    
    return (
      <div className={styles.videoContainer}>
        <iframe
          className={styles.videoPlayer}
          src={embedUrl}
          title={title || "Video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => {
            // Iframe loaded successfully - clear loading state immediately
            if (iframeLoadTimeout) {
              clearTimeout(iframeLoadTimeout);
              setIframeLoadTimeout(null);
            }
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            // onError for iframes is unreliable, especially for cross-origin
            // Don't act on it - let the timeout handle actual failures
            // Many iframes will trigger onError even when they load successfully
          }}
        />
        {isLoading && !hasError && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading video...</p>
            <p style={{ fontSize: '0.85rem', color: '#b2adb9', marginTop: '8px' }}>
              This may take a few moments
            </p>
          </div>
        )}
        {hasError && (
          <div className={styles.errorOverlay}>
            <p>{errorMessage || "Failed to load video"}</p>
            {isEporner && embedUrl && (
              <a 
                href={embedUrl.replace('/embed/', '/video/')} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#ff5f9c', 
                  marginTop: '16px', 
                  display: 'inline-block',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  border: '1px solid #ff5f9c',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#ff5f9c';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#ff5f9c';
                }}
              >
                Watch on Eporner →
              </a>
            )}
            {thumbnailUrl && (
              <img 
                src={thumbnailUrl} 
                alt={title || "Video thumbnail"} 
                className={styles.errorThumbnail}
              />
            )}
          </div>
        )}
      </div>
    );
  }
  
  // If video URL doesn't look like a direct video file, try as embed
  // This is a fallback for URLs that might be embeds but weren't detected
  const looksLikeEmbed = videoUrl && (
    !videoUrl.match(/\.(mp4|webm|ogg|mov|m3u8|avi|mkv)(\?|$)/i) &&
    (videoUrl.includes('http') || videoUrl.includes('www.'))
  );
  
  if (looksLikeEmbed && !videoUrl.includes('youtube') && !videoUrl.includes('vimeo')) {
    // Might be an embed URL we didn't detect - try as iframe
    return (
      <div className={styles.videoContainer}>
        <iframe
          className={styles.videoPlayer}
          src={videoUrl}
          title={title || "Video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setHasError(true);
            setErrorMessage("Failed to load video. Trying alternative method...");
            setIsLoading(false);
          }}
        />
        {isLoading && !hasError && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading video...</p>
            <p style={{ fontSize: '0.85rem', color: '#b2adb9', marginTop: '8px' }}>
              Please wait, this may take a moment
            </p>
          </div>
        )}
        {hasError && (
          <div className={styles.errorOverlay}>
            <p>{errorMessage || "Failed to load video"}</p>
            {thumbnailUrl && (
              <img 
                src={thumbnailUrl} 
                alt={title || "Video thumbnail"} 
                className={styles.errorThumbnail}
              />
            )}
          </div>
        )}
      </div>
    );
  }
  

  // If video element failed, try iframe fallback
  if (useIframeFallback) {
    return (
      <div className={styles.videoContainer}>
        <iframe
          className={styles.videoPlayer}
          src={videoUrl}
          title={title || "Video player"}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setHasError(true);
            setErrorMessage("Failed to load video in both video and iframe modes");
            setIsLoading(false);
          }}
        />
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading video (iframe mode)...</p>
          </div>
        )}
        {hasError && (
          <div className={styles.errorOverlay}>
            <p>{errorMessage || "Failed to load video"}</p>
            {thumbnailUrl && (
              <img 
                src={thumbnailUrl} 
                alt={title || "Video thumbnail"} 
                className={styles.errorThumbnail}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.videoContainer}>
      {/* Pre-Video Ad Overlay */}
      {showPreVideoAd && !adCompleted && (
        <VideoPreRollAd
          zoneId={EXOCLICK_ZONES.PREROLL_VIDEO}
          onComplete={handleAdComplete}
          onSkip={handleAdSkip}
        />
      )}

      {/* Video Player - Only show after ad is completed or if no ad */}
      {(!showPreVideoAd || adCompleted) && (
        <>
          {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading video...</p>
        </div>
      )}
      {hasError && (
        <div className={styles.errorOverlay}>
          <p>{errorMessage || "Failed to load video"}</p>
          {thumbnailUrl && (
            <img 
              src={thumbnailUrl} 
              alt={title || "Video thumbnail"} 
              className={styles.errorThumbnail}
            />
          )}
        </div>
      )}
      <video
        ref={videoRef}
        className={styles.videoPlayer}
        src={videoUrl}
        controls
        poster={thumbnailUrl || undefined}
        preload="metadata"
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onLoadedData={() => setIsLoading(false)}
        onError={(e) => {
          const videoEl = e.target;
          const error = videoEl.error;
          let errorMsg = "Failed to load video";
          
          // Log the raw error first
          if (process.env.NODE_ENV === 'development') {
            console.error("Video error event:", {
              error: error,
              errorCode: error?.code,
              errorMessage: error?.message,
              videoUrl: videoUrl,
              videoSrc: videoEl.src,
              networkState: videoEl.networkState,
              readyState: videoEl.readyState
            });
          }
          
          // Try fallback to iframe if video element fails
          // This handles cases where URL is an embed but wasn't detected
          if (!useIframeFallback && (error?.code === error?.MEDIA_ERR_SRC_NOT_SUPPORTED || !error)) {
            console.warn("Video element failed, trying iframe fallback for:", videoUrl);
            setUseIframeFallback(true);
            setIsLoading(true);
            setHasError(false);
            return; // Don't set error state, let it try iframe
          }
          
          if (error) {
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMsg = "Video playback was aborted";
                break;
              case error.MEDIA_ERR_NETWORK:
                errorMsg = "Network error while loading video";
                break;
              case error.MEDIA_ERR_DECODE:
                errorMsg = "Video decoding error";
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMsg = "Video format not supported or source not accessible";
                // Check if this should be an embed URL
                const embedUrl = getEmbedUrl(videoUrl);
                if (embedUrl) {
                  errorMsg = "This appears to be an embed URL. The video should load in embed mode.";
                  console.warn("Video URL should be used as embed:", embedUrl);
                }
                break;
              default:
                errorMsg = `Video error (code: ${error.code || 'unknown'})`;
            }
          } else {
            // No error object, but video failed - likely CORS or invalid URL
            errorMsg = "Video failed to load. This might be an embed URL that needs to be displayed in an iframe.";
            const embedUrl = getEmbedUrl(videoUrl);
            if (embedUrl) {
              errorMsg = "This URL should be displayed as an embed. Please check the video source.";
              console.warn("Detected embed URL that should use iframe:", embedUrl);
            }
          }
          
          setHasError(true);
          setErrorMessage(errorMsg);
          setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />
        </>
      )}
    </div>
  );
}

