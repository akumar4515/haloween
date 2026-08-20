import { NextResponse } from "next/server";
import { fetchFeedPage, FEED_PAGE_SIZE } from "../../lib/feed";

// Each batch is built fresh; the underlying source calls do their own caching.
export const dynamic = "force-dynamic";

/**
 * GET /api/feed
 *
 * Serves the batches behind the feed's "Show more" button. The first batch is
 * server-rendered by the page itself, so this only ever handles continuations
 * and never needs to return the featured line-up.
 *
 * Query: q, per_page, affiliate_page, eporner_page
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q") || undefined;
  const requestedPerPage = Number(searchParams.get("per_page"));
  const perPage =
    Number.isFinite(requestedPerPage) && requestedPerPage > 0
      ? Math.min(requestedPerPage, 200)
      : FEED_PAGE_SIZE;

  const affiliatePage = Number(searchParams.get("affiliate_page")) || 1;
  const epornerPage = Number(searchParams.get("eporner_page")) || 1;

  try {
    const batch = await fetchFeedPage({
      q,
      perPage,
      affiliatePage,
      epornerPage,
      includeFeatured: false,
    });

    return NextResponse.json({
      success: true,
      videos: batch.videos,
      cursor: batch.cursor,
      hasMore: batch.hasMore,
    });
  } catch (error) {
    console.error("Feed batch failed:", error);
    return NextResponse.json(
      { success: false, videos: [], hasMore: false, error: "Feed unavailable" },
      { status: 500 }
    );
  }
}
