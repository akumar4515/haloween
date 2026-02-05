import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "./components/ConditionalLayout";
import { shouldShowAd, EXOCLICK_ZONES } from "./config/ads";
import PopunderScript from "./components/PopunderScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

// Generate hreflang links for international SEO
function generateHreflangLinks(pathname = '/') {
  const links = [];

  // Clean pathname (remove language prefix if present)
  let cleanPath = pathname;
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && SUPPORTED_LANGUAGES.some(lang => lang.code === pathParts[0])) {
    cleanPath = '/' + pathParts.slice(1).join('/');
  }
  if (cleanPath === '') cleanPath = '/';

  // Add hreflang for each supported language
  SUPPORTED_LANGUAGES.forEach(lang => {
    const href = lang.code === 'en'
      ? `${siteUrl}${cleanPath}`
      : `${siteUrl}/${lang.code}${cleanPath}`;

    links.push({
      rel: 'alternate',
      hreflang: lang.code,
      href
    });
  });

  // Add x-default for default language
  links.push({
    rel: 'alternate',
    hreflang: 'x-default',
    href: `${siteUrl}${cleanPath}`
  });

  return links;
}

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Flovex - Free HD Adult Videos",
    template: "%s | Flovex",
  },
  description: "Watch free HD adult videos on Flovex. High-quality porn videos with fast streaming and mobile optimization.",
  keywords: ["free porn", "adult videos", "HD porn", "porn streaming", "adult entertainment"],
  applicationName: "Flovex",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Flovex - Free HD Adult Videos",
    description: "Watch free HD adult videos on Flovex. High-quality porn videos with fast streaming and mobile optimization.",
    siteName: "Flovex",
    images: [{
      url: "/logo.png",
      width: 400,
      height: 400,
      alt: "Flovex Logo"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Flovex - Free HD Adult Videos",
    description: "Watch free HD adult videos on Flovex. High-quality porn videos with fast streaming and mobile optimization.",
    images: ["/logo.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  other: {
    "rating": "RTA-5042-1996-1400-1577-RTA",
    "content-rating": "adult",
    "revisit-after": "1 day",
    "rating": "mature"
  }
};

export default function RootLayout({ children }) {
  // Generate hreflang links for current page
  const hreflangLinks = generateHreflangLinks();

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#ff5f9c" />
        <meta name="msapplication-TileColor" content="#050507" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Flovex" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Flovex" />
        <meta
          httpEquiv="Delegate-CH"
          content="Sec-CH-UA https://s.magsrv.com; Sec-CH-UA-Mobile https://s.magsrv.com; Sec-CH-UA-Arch https://s.magsrv.com; Sec-CH-UA-Model https://s.magsrv.com; Sec-CH-UA-Platform https://s.magsrv.com; Sec-CH-UA-Platform-Version https://s.magsrv.com; Sec-CH-UA-Bitness https://s.magsrv.com; Sec-CH-UA-Full-Version-List https://s.magsrv.com; Sec-CH-UA-Full-Version https://s.magsrv.com;"
        />
        <meta
          httpEquiv="Delegate-CH"
          content="Sec-CH-UA https://s.pemsrv.com; Sec-CH-UA-Mobile https://s.pemsrv.com; Sec-CH-UA-Arch https://s.pemsrv.com; Sec-CH-UA-Model https://s.pemsrv.com; Sec-CH-UA-Platform https://s.pemsrv.com; Sec-CH-UA-Platform-Version https://s.pemsrv.com; Sec-CH-UA-Bitness https://s.pemsrv.com; Sec-CH-UA-Full-Version-List https://s.pemsrv.com; Sec-CH-UA-Full-Version https://s.pemsrv.com;"
        />

        {/* International SEO - hreflang links */}
        {hreflangLinks.map((link, index) => (
          <link
            key={index}
            rel={link.rel}
            hrefLang={link.hreflang}
            href={link.href}
          />
        ))}

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://www.eporner.com" />
        <link rel="dns-prefetch" href="https://static-ca-cdn.eporner.com" />

        {/* Preload critical resources */}
        <link rel="preload" href="/logo.png" as="image" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ConditionalLayout>{children}</ConditionalLayout>

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
        <PopunderScript />
      </body>
    </html>
  );
}
