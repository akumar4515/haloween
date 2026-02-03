"use client";

import { useRef } from "react";
import styles from "./page.module.css";

export default function SearchBar({ initialQuery = "" }) {
  const inputRef = useRef(null);
  const formRef = useRef(null);

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    // submit empty query so backend returns all videos again
    if (formRef.current) {
      formRef.current.submit();
    }
  };

  return (
    <form ref={formRef} className={styles.searchForm} method="get" action="/">
      <div className={styles.searchWrapper}>
        <input
          ref={inputRef}
          name="q"
          className={styles.searchInput}
          placeholder="Search videos"
          defaultValue={initialQuery}
        />
        <button
          type="button"
          className={styles.clearIconButton}
          onClick={handleClear}
        >
          <span className={styles.clearIcon} aria-hidden="true">
            ×
          </span>
          <span className={styles.visuallyHidden}>Clear search</span>
        </button>
        <button type="submit" className={styles.searchIconButton}>
          <img
            src="/search.png"
            alt=""
            className={styles.searchIconImage}
            aria-hidden="true"
          />
          <span className={styles.visuallyHidden}>Search</span>
        </button>
      </div>
    </form>
  );
}

