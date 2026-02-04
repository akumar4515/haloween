"use client";

import { useEffect, useRef, useState } from "react";
import { useWatchHistory } from "../hooks/useWatchHistory";
import { useUser } from "../contexts/UserContext";
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
  const { isAuthenticated } = useUser();
  const { addWatchHistory } = useWatchHistory();
  const progressIntervalRef = useRef(null);
  const lastProgressRef = useRef(0);
  const hasTrackedRef = useRef(false);
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

  useEffect(() => {
    // Track video view even if not authenticated (optional)
    if (!videoId) return;

    // Track initial view
    const trackInitialView = async () => {
      if (!hasTrackedRef.current) {
        hasTrackedRef.current = true;
        await addWatchHistory(videoId, 0, false);
      }
    };

    // Small delay to ensure video is loading
    const timer = setTimeout(() => {
      trackInitialView();
    }, 2000);

    // For iframe videos (YouTube, Vimeo), we can't track progress accurately
    // So we just track the view
    const embedUrl = getEmbedUrl(videoUrl);
    if (embedUrl) {
      // For embedded videos, track view after 5 seconds
      const viewTimer = setTimeout(() => {
        trackInitialView();
      }, 5000);
      return () => {
        clearTimeout(timer);
        clearTimeout(viewTimer);
      };
    }

    // For native video elements, track progress
    const videoElement = videoRef.current || document.querySelector('video');
    if (videoElement) {
      const updateProgress = async () => {
        if (videoElement.readyState >= 2) {
          const currentTime = Math.floor(videoElement.currentTime);
          const duration = Math.floor(videoElement.duration);
          
          if (currentTime > lastProgressRef.current) {
            lastProgressRef.current = currentTime;
            
            // Update watch history every 10 seconds
            if (currentTime % 10 === 0 || currentTime === duration) {
              const completed = currentTime >= duration * 0.9; // 90% watched = completed
              await addWatchHistory(videoId, currentTime, completed);
            }
          }
        }
      };

      videoElement.addEventListener('timeupdate', updateProgress);
      videoElement.addEventListener('ended', async () => {
        await addWatchHistory(videoId, Math.floor(videoElement.duration), true);
      });

      return () => {
        videoElement.removeEventListener('timeupdate', updateProgress);
        clearTimeout(timer);
      };
    }

    return () => {
      clearTimeout(timer);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isAuthenticated, videoId, videoUrl, addWatchHistory]);

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
    
    // Set up timeout to detect connection failures (especially for eporner)
    useEffect(() => {
      if (embedUrl && isEporner) {
        const timeout = setTimeout(() => {
          // If still loading after 5 seconds, likely connection refused
          if (isLoading) {
            setHasError(true);
            setErrorMessage("Eporner embed blocked. Please watch on eporner.com directly.");
            setIsLoading(false);
          }
        }, 5000);
        setIframeLoadTimeout(timeout);
        return () => {
          if (timeout) clearTimeout(timeout);
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
            if (iframeLoadTimeout) {
              clearTimeout(iframeLoadTimeout);
              setIframeLoadTimeout(null);
            }
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            if (iframeLoadTimeout) {
              clearTimeout(iframeLoadTimeout);
              setIframeLoadTimeout(null);
            }
            setHasError(true);
            if (isEporner) {
              setErrorMessage("Eporner embed blocked. Video may need to be viewed on eporner.com directly.");
            } else {
              setErrorMessage("Failed to load embedded video");
            }
            setIsLoading(false);
          }}
        />
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading video...</p>
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

