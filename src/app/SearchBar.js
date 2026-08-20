"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";
import { SearchIcon } from "./components/Icons";

export default function SearchBar({ initialQuery = "", autoFocus = false }) {
  const inputRef = useRef(null);
  const formRef = useRef(null);

  // When the mobile search row opens, put the caret straight in the field
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

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
    <form
      ref={formRef}
      className={styles.searchForm}
      method="get"
      action="/"
      role="search"
    >
      <div className={styles.searchWrapper}>
        <input
          ref={inputRef}
          name="q"
          type="search"
          className={styles.searchInput}
          placeholder="Search"
          defaultValue={initialQuery}
          aria-label="Search videos"
          autoComplete="off"
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
        <button
          type="submit"
          className={styles.searchIconButton}
          aria-label="Search"
        >
          <SearchIcon />
        </button>
      </div>
    </form>
  );
}
