"use client";

import { usePathname } from "next/navigation";
import styles from "../page.module.css";

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export default function LanguageSelector() {
  const pathname = usePathname();

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const search = window.location.search.replace("?", "");

    // Remove existing language prefix
    const pathParts = pathname.split('/').filter(Boolean);
    let cleanPath = pathname;
    if (pathParts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === pathParts[0])) {
      cleanPath = '/' + pathParts.slice(1).join('/');
    }
    if (cleanPath === '') cleanPath = '/';

    const newPath = lang === 'en' ? cleanPath : `/${lang}${cleanPath}`;
    const newUrl = newPath + (search ? `?${search}` : '');

    window.location.href = newUrl;
  };

  const currentLang = (() => {
    const pathParts = pathname.split('/').filter(Boolean);
    return pathParts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === pathParts[0])
      ? pathParts[0]
      : 'en';
  })();

  return (
    <div className={styles.languageSelector}>
      <label className={styles.languageLabel} htmlFor="language-select">
        Language
      </label>
      <select
        id="language-select"
        className={styles.languageSelect}
        onChange={handleLanguageChange}
        value={currentLang}
      >
        {SUPPORTED_LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
