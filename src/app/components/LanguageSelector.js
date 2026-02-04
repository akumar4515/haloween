"use client";

import { usePathname, useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const search = searchParams.toString();

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

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'rgba(5, 5, 7, 0.9)',
      border: '1px solid #332b3c',
      borderRadius: '8px',
      padding: '8px',
      backdropFilter: 'blur(10px)'
    }}>
      <select
        style={{
          backgroundColor: 'transparent',
          color: '#f5f5f7',
          border: 'none',
          outline: 'none',
          fontSize: '14px',
          cursor: 'pointer'
        }}
        onChange={handleLanguageChange}
        defaultValue={
          (() => {
            const pathParts = pathname.split('/').filter(Boolean);
            return pathParts.length > 0 && SUPPORTED_LANGUAGES.some(l => l.code === pathParts[0])
              ? pathParts[0]
              : 'en';
          })()
        }
      >
        {SUPPORTED_LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code} style={{ backgroundColor: '#050507' }}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
