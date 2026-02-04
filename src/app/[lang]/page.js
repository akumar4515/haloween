// Language-specific home page
const LANGUAGE_CONTENT = {
  es: {
    title: "Flovex - Videos Adultos HD Gratis",
    description: "Mira videos adultos HD gratis en Flovex. Videos de alta calidad con streaming rápido y optimización móvil.",
    keywords: ["pornografía gratis", "videos adultos", "pornografía HD", "streaming porno", "entretenimiento adulto"],
    newest: "Más recientes",
    free: "Gratis",
    premium: "Premium"
  },
  fr: {
    title: "Flovex - Vidéos Adultes HD Gratuites",
    description: "Regardez des vidéos adultes HD gratuites sur Flovex. Vidéos de haute qualité avec streaming rapide et optimisation mobile.",
    keywords: ["porno gratuit", "vidéos adultes", "porno HD", "streaming porno", "divertissement adulte"],
    newest: "Plus récentes",
    free: "Gratuit",
    premium: "Premium"
  },
  de: {
    title: "Flovex - Kostenlose HD Adult Videos",
    description: "Schaue kostenlose HD Adult Videos auf Flovex. Hochwertige Pornos mit schnellem Streaming und mobiler Optimierung.",
    keywords: ["kostenloser porno", "adult videos", "HD porno", "porno streaming", "erwachsenenunterhaltung"],
    newest: "Neueste",
    free: "Kostenlos",
    premium: "Premium"
  },
  it: {
    title: "Flovex - Video Adult HD Gratuiti",
    description: "Guarda video adulti HD gratuiti su Flovex. Video di alta qualità con streaming veloce e ottimizzazione mobile.",
    keywords: ["porno gratis", "video adulti", "porno HD", "streaming porno", "intrattenimento adulto"],
    newest: "Più recenti",
    free: "Gratuito",
    premium: "Premium"
  },
  pt: {
    title: "Flovex - Vídeos Adultos HD Grátis",
    description: "Assista vídeos adultos HD grátis no Flovex. Vídeos de alta qualidade com streaming rápido e otimização móvel.",
    keywords: ["pornô grátis", "vídeos adultos", "pornô HD", "streaming pornô", "entretenimento adulto"],
    newest: "Mais recentes",
    free: "Grátis",
    premium: "Premium"
  },
  ru: {
    title: "Flovex - Бесплатные HD Adult Видео",
    description: "Смотрите бесплатные HD adult видео на Flovex. Высококачественные порно с быстрым стримингом и мобильной оптимизацией.",
    keywords: ["бесплатный порно", "adult видео", "HD порно", "стриминг порно", "взрослое развлечение"],
    newest: "Новейшие",
    free: "Бесплатно",
    premium: "Премиум"
  },
  ja: {
    title: "Flovex - 無料HDアダルト動画",
    description: "Flovexで無料HDアダルト動画を視聴。高速ストリーミングとモバイル最適化の高品質ポルノ動画。",
    keywords: ["無料ポルノ", "アダルト動画", "HDポルノ", "ポルノストリーミング", "アダルトエンターテイメント"],
    newest: "最新",
    free: "無料",
    premium: "プレミアム"
  },
  ko: {
    title: "Flovex - 무료 HD 성인 비디오",
    description: "Flovex에서 무료 HD 성인 비디오를 시청하세요. 빠른 스트리밍과 모바일 최적화의 고품질 포르노 비디오.",
    keywords: ["무료 포르노", "성인 비디오", "HD 포르노", "포르노 스트리밍", "성인 엔터테인먼트"],
    newest: "최신",
    free: "무료",
    premium: "프리미엄"
  },
  zh: {
    title: "Flovex - 免费HD成人视频",
    description: "在Flovex上观看免费HD成人视频。具有快速流媒体和移动优化的高质量色情视频。",
    keywords: ["免费色情", "成人视频", "HD色情", "色情流媒体", "成人娱乐"],
    newest: "最新",
    free: "免费",
    premium: "高级"
  }
};

const NEWEST_KEYS = ["new", "newest", "latest", "recent"];

const normalizeParam = (value) => {
  if (Array.isArray(value)) {
    return normalizeParam(value[0]);
  }
  return value;
};

const normalizeQuery = (value) => {
  if (Array.isArray(value)) {
    return normalizeQuery(value[0]);
  }
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  return NEWEST_KEYS.includes(trimmed.toLowerCase()) ? "newest" : value;
};

async function fetchVideos(searchParams = {}, lang = 'en') {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

  let { q } = searchParams;
  q = normalizeQuery(q);
  const page = Number(searchParams?.page) || 1;
  const perPage = Number(searchParams?.per_page) || 50;

  try {
    const hasSearchQuery = q && q !== "newest" && q !== "free" && q !== "premium";
    const endpoint = hasSearchQuery ? "videos/search" : "videos";
    const searchUrl = new URL(`${baseUrl}/eporner/${endpoint}`, "http://localhost");

    if (hasSearchQuery) {
      searchUrl.searchParams.set("query", q);
      searchUrl.searchParams.set("order", "mostviewed");
    }

    searchUrl.searchParams.set("page", String(page));
    searchUrl.searchParams.set("per_page", String(perPage));
    searchUrl.searchParams.set("thumbsize", "big");

    const res = await fetch(searchUrl.toString(), { cache: "no-store" });

    let data = null;
    const contentType = res.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (isJson) {
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        if (!res.ok) {
          console.error(`API Error (${res.status}):`, await res.text().catch(() => 'Unable to read error'));
        }
        return [];
      }
    } else {
      console.error("Non-JSON response:", await res.text());
      return [];
    }

    let videos = [];

    if (data && data.success && data.data) {
      if (Array.isArray(data.data)) {
        videos = data.data;
      } else if (data.data.videos && Array.isArray(data.data.videos)) {
        videos = data.data.videos;
      } else if (data.data.data && Array.isArray(data.data.data)) {
        videos = data.data.data;
      } else if (data.data && typeof data.data === 'object' && data.data.id) {
        videos = [data.data];
      }
    } else if (data && data.data && Array.isArray(data.data)) {
      videos = data.data;
    } else if (data && Array.isArray(data)) {
      videos = data;
    }

    return videos;
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
}

async function VideoGrid({ searchParams, lang }) {
  const videos = await fetchVideos(searchParams, lang);
  const selectedQ = normalizeQuery(searchParams?.q) || "newest";
  const content = LANGUAGE_CONTENT[lang] || LANGUAGE_CONTENT.en;

  const buildTagHref = (value) => {
    const sp = new URLSearchParams();
    if (value) sp.set("q", value);
    return `/${lang}?${sp.toString()}`;
  };

  if (!videos.length) {
    return (
      <div className="emptyState">
        <p>{content.noVideos || "No videos found. Try adjusting your search."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="tagBar">
        {["newest", "free", "premium"].map((tag) => (
          <a
            key={tag}
            href={buildTagHref(tag)}
            className={`tagChip ${selectedQ === tag ? 'active' : ''}`}
          >
            {content[tag] || tag.charAt(0).toUpperCase() + tag.slice(1)}
          </a>
        ))}
      </div>
      <div className="grid">
        {videos.map((video) => (
          <a key={video.id} href={`/${lang}/watch/${video.id}`} className="card">
            <div className="thumbnailWrapper">
              <img
                src={video.thumbnail_url || video.thumbnail || video.default_thumb?.src || ''}
                alt={video.title || 'Video thumbnail'}
                className="thumbnail"
                loading="lazy"
              />
              {video.duration && (
                <span className="duration">
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </span>
              )}
            </div>
            <div className="cardBody">
              <h3 className="cardTitle">{video.title || "Untitled"}</h3>
              <p className="cardMeta">
                {video.views ? `${video.views.toLocaleString()} views` : 'No views yet'}
              </p>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const content = LANGUAGE_CONTENT[lang] || LANGUAGE_CONTENT.en;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    alternates: {
      canonical: `/${lang}`,
      languages: {
        'en': `${siteUrl}/`,
        'es': `${siteUrl}/es`,
        'fr': `${siteUrl}/fr`,
        'de': `${siteUrl}/de`,
        'it': `${siteUrl}/it`,
        'pt': `${siteUrl}/pt`,
        'ru': `${siteUrl}/ru`,
        'ja': `${siteUrl}/ja`,
        'ko': `${siteUrl}/ko`,
        'zh': `${siteUrl}/zh`,
        'x-default': `${siteUrl}/`,
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: `/${lang}`,
      siteName: "Flovex",
      locale: lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description,
    },
  };
}

export default async function LangHome({ params, searchParams }) {
  const { lang } = await params;
  const search = await searchParams;
  const content = LANGUAGE_CONTENT[lang] || LANGUAGE_CONTENT.en;

  return (
    <div className="page">
      <div className="header">
        <div className="menuButton">
          <div className="menuIconLine"></div>
          <div className="menuIconLine"></div>
          <div className="menuIconLine"></div>
        </div>

        <a href={`/${lang}`} className="logo">
          <img src="/logo.png" alt="Flovex" className="logoImage" />
          Flovex
        </a>

        <form action={`/${lang}`} method="get" className="searchForm">
          <input
            type="text"
            name="q"
            placeholder={content.searchPlaceholder || "Search videos..."}
            className="searchInput"
          />
        </form>
      </div>

      <main>
        <Suspense fallback={<div className="loading">Loading videos...</div>}>
          <VideoGrid searchParams={search || {}} lang={lang} />
        </Suspense>
      </main>
    </div>
  );
}
