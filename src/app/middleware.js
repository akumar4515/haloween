import { NextResponse } from 'next/server';

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'];
const DEFAULT_LANGUAGE = 'en';

// Language detection and redirection
export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // Skip API routes, static files, and admin routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/video-sitemap.xml') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract language from pathname (e.g., /es/, /fr/)
  const pathnameParts = pathname.split('/').filter(Boolean);
  const firstPart = pathnameParts[0];

  // Check if first part is a supported language
  if (SUPPORTED_LANGUAGES.includes(firstPart)) {
    // Language is already in URL, continue
    return NextResponse.next();
  }

  // Detect user's preferred language from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || '';
  const userLanguages = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].split('-')[0])
    .filter(lang => SUPPORTED_LANGUAGES.includes(lang));

  const detectedLanguage = userLanguages[0] || DEFAULT_LANGUAGE;

  // If user prefers a non-English language, redirect to language-specific URL
  if (detectedLanguage !== DEFAULT_LANGUAGE && detectedLanguage !== 'en') {
    const newUrl = new URL(`/${detectedLanguage}${pathname}${search}`, request.url);
    return NextResponse.redirect(newUrl, { status: 302 });
  }

  // Continue with default (English) version
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|video-sitemap.xml).*)',
  ],
};
