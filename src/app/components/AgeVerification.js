"use client";

import { useState, useEffect } from "react";
import styles from "./AgeVerification.module.css";

export default function AgeVerification() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age
    const ageVerified = localStorage.getItem("ageVerified");
    if (!ageVerified) {
      setShowModal(true);
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem("ageVerified", "true");
    setShowModal(false);
  };

  const handleExit = () => {
    // Redirect to a safe page or close the window
    window.location.href = "https://www.google.com";
  };

  if (!showModal) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.content}>
          <div className={styles.warningIcon}>⚠️</div>
          <h1 className={styles.title}>18+ Content Warning</h1>
          <p className={styles.message}>
            This website contains explicit adult content, including pornographic material.
            You must be at least 18 years of age (or the age of majority in your jurisdiction)
            to access this site.
          </p>
          <p className={styles.subMessage}>
            By clicking "Enter", you confirm that you are of legal age to view adult content
            and that you are not accessing this site from a location where such content is prohibited.
          </p>
          <div className={styles.buttons}>
            <button onClick={handleExit} className={styles.exitButton}>
              Exit
            </button>
            <button onClick={handleEnter} className={styles.enterButton}>
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

