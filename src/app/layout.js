import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "./components/ConditionalLayout";
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

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Flovex - Free HD Adult Videos",
    template: "%s | Flovex",
  },
  description: "Watch free HD adult videos on Flovex. High-quality porn videos with fast streaming and mobile optimization.",
  keywords: ["free porn", "adult videos", "HD porn", "porn streaming", "adult entertainment"],
  applicationName: "Flovex",
  // No canonical here on purpose: child pages inherit metadata, so a canonical
  // set at the root makes every page that omits one look like a duplicate of
  // the home page. Each page declares its own via buildMetadata().
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Flovex - Free HD Adult Videos",
    description: "Watch free HD adult videos on Flovex. High-quality porn videos with fast streaming and mobile optimization.",
    siteName: "Flovex",
    images: [{
      url: "/web-logo.png",
      width: 400,
      height: 400,
      alt: "Flovex Logo"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Flovex - Free HD Adult Videos",
    description: "Watch free HD adult videos on Flovex. High-quality porn videos with fast streaming and mobile optimization.",
    images: ["/web-logo.png"]
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
    // RTA label: the value parental-control software looks for. It must be
    // this exact string, so it cannot double as a free-text "mature" rating.
    rating: "RTA-5042-1996-1400-1577-RTA",
    "content-rating": "adult",
    "revisit-after": "1 day",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/web-logo.png" />
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
                  // In local development, avoid SW caching/interception issues.
                  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for (let registration of registrations) {
                        registration.unregister();
                      }
                    });
                    return;
                  }

                  // Unregister old service workers first
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                    // Register new service worker
                    navigator.serviceWorker.register('/sw.js?v=' + Date.now())
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                        // Update service worker if available
                        registration.update();
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
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
