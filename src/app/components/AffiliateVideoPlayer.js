"use client";

import { useState, useEffect, useRef } from "react";
import { VideoPreRollAd } from "./PreVideoAd";
import { shouldShowAd, EXOCLICK_ZONES } from "../config/ads";
import styles from "./VideoPlayer.module.css";

export default function AffiliateVideoPlayer({ video }) {
  const [showFullVideoPrompt, setShowFullVideoPrompt] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const embedDuration = video.embed_duration || 60; // Default to 60 seconds if not set
  const hasIframe = video.iframe_url || video.video_url;
  const [showPreVideoAd, setShowPreVideoAd] = useState(shouldShowAd('WATCH_PREROLL_AD'));
  const [adCompleted, setAdCompleted] = useState(false);

  const handleAdComplete = () => {
    setAdCompleted(true);
    setShowPreVideoAd(false);
  };

  const handleAdSkip = () => {
    setAdCompleted(true);
    setShowPreVideoAd(false);
  };

  useEffect(() => {
    let interval;
    let iframeTimeout;

    if (videoRef.current) {
      // For video elements, track currentTime
      interval = setInterval(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
          if (videoRef.current.currentTime >= embedDuration) {
            setShowFullVideoPrompt(true);
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        }
      }, 1000);
    } else if (iframeRef.current) {
      // For iframes, we can't track time, so show prompt after embed_duration
      iframeTimeout = setTimeout(() => {
        setShowFullVideoPrompt(true);
      }, embedDuration * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (iframeTimeout) clearTimeout(iframeTimeout);
    };
  }, [embedDuration]);

  const handleFullVideoClick = () => {
    // Track click
    if (video.id) {
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/affiliate/track-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          video_id: video.id,
          utm_content: 'watch_page_full_video_button'
        })
      }).catch(err => console.error('Failed to track click:', err));
    }

    // Open affiliate URL in new tab
    window.open(video.affiliate_url, '_blank');
  };

  // If we have an iframe URL, use iframe
  if (hasIframe && (video.iframe_url || video.video_url.includes('embed') || video.video_url.includes('<iframe'))) {
    let iframeSrc = video.iframe_url || video.video_url;
    
    // Extract src from iframe HTML if needed
    if (iframeSrc.includes('<iframe')) {
      const match = iframeSrc.match(/src=["']([^"']+)["']/i);
      if (match) {
        iframeSrc = match[1];
      }
    }

    return (
      <div className={styles.playerContainer}>
        <div className={styles.videoWrapper}>
          {showPreVideoAd && !adCompleted && (
            <VideoPreRollAd
              zoneId={EXOCLICK_ZONES.PREROLL_VIDEO}
              onComplete={handleAdComplete}
              onSkip={handleAdSkip}
            />
          )}
          {(!showPreVideoAd || adCompleted) && (
            <>
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                className={styles.videoPlayer}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ display: showFullVideoPrompt ? 'none' : 'block' }}
              />
              {showFullVideoPrompt && (
                <div className={styles.fullVideoPrompt}>
                  <div className={styles.promptContent}>
                    <h2>Watch Full Video at Faphouse</h2>
                    <p>You've reached the preview limit. Click below to watch the full video.</p>
                    <button 
                      onClick={handleFullVideoClick}
                      className={styles.fullVideoButton}
                    >
                      Watch Full Video at Faphouse
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Otherwise use video tag
  return (
    <div className={styles.playerContainer}>
      <div className={styles.videoWrapper}>
        {showPreVideoAd && !adCompleted && (
          <VideoPreRollAd
            zoneId={EXOCLICK_ZONES.PREROLL_VIDEO}
            onComplete={handleAdComplete}
            onSkip={handleAdSkip}
          />
        )}
        {(!showPreVideoAd || adCompleted) && (
          <>
            <video
              ref={videoRef}
              src={video.video_url}
              className={styles.videoPlayer}
              controls
              style={{ display: showFullVideoPrompt ? 'none' : 'block' }}
              onTimeUpdate={(e) => {
                setCurrentTime(e.target.currentTime);
                if (e.target.currentTime >= embedDuration) {
                  setShowFullVideoPrompt(true);
                  e.target.pause();
                }
              }}
            />
            {showFullVideoPrompt && (
              <div className={styles.fullVideoPrompt}>
                <div className={styles.promptContent}>
                  <h2>Watch Full Video at Faphouse</h2>
                  <p>You've reached the preview limit ({embedDuration} seconds). Click below to watch the full video.</p>
                  <button 
                    onClick={handleFullVideoClick}
                    className={styles.fullVideoButton}
                  >
                    Watch Full Video at Faphouse
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
