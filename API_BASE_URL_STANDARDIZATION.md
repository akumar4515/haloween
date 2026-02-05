# API Base URL Standardization

## Summary
All files now use a consistent API base URL pattern. The `NEXT_PUBLIC_API_BASE_URL` environment variable should **NOT** include `/api` - it will be appended automatically where needed.

## Environment Variable

### Frontend `.env` (root directory)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

**Important**: Do NOT include `/api` in the base URL. It will be appended automatically based on the route type.

## Route Patterns

### Routes that use `/api` prefix:
- **Auth routes**: `${API_BASE}/api/auth/*`
  - `/api/auth/google`
  - `/api/auth/google/callback`
  - `/api/auth/me`

- **Video routes**: `${API_BASE}/api/videos/*`
  - `/api/videos`
  - `/api/videos/search`
  - `/api/videos/{id}`

- **Eporner routes**: `${API_BASE}/api/eporner/*`
  - `/api/eporner/videos`
  - `/api/eporner/videos/search`
  - `/api/eporner/videos/{id}`

- **Category/Channel/Actor routes**: `${API_BASE}/api/*`
  - `/api/categories`
  - `/api/channels`
  - `/api/actors`

### Routes that use base URL directly (no `/api`):
- **User routes**: `${API_BASE}/user/*`
  - `/user/watch-history`
  - `/user/follow`
  - `/user/following/*`

- **Admin routes**: `${API_BASE}/admin/*`
  - `/admin/auth`
  - `/admin/*` (various admin endpoints)

## Files Updated

### Core Components
- ✅ `src/app/components/UserAuth.js`
- ✅ `src/app/contexts/UserContext.js`
- ✅ `src/app/auth/callback/AuthCallbackClient.js`
- ✅ `src/app/auth/google/callback/GoogleCallbackClient.js`

### Hooks
- ✅ `src/app/hooks/useWatchHistory.js`
- ✅ `src/app/hooks/useFollow.js`

### Pages
- ✅ `src/app/page.js`
- ✅ `src/app/watch/[id]/page.js`
- ✅ `src/app/watch/[id]/RecommendationsSection.js`
- ✅ `src/app/library/page.js`
- ✅ `src/app/[lang]/page.js`
- ✅ `src/app/amp/page.js`
- ✅ `src/app/amp/watch/[id]/page.js`
- ✅ `src/app/video-sitemap.xml/route.js`

### Admin Components
- ✅ `src/app/admin/components/AdminLogin.js`
- ✅ `src/app/admin/components/VideosManager.js`
- ✅ `src/app/admin/components/ChannelsManager.js`
- ✅ `src/app/admin/components/CategoriesManager.js`
- ✅ `src/app/admin/components/ActorsManager.js`

## Testing

After updating your `.env` file:
1. Restart both frontend and backend servers
2. Test authentication flow
3. Test video fetching
4. Test admin panel
5. Check browser console for any API errors

All API calls should now work consistently with the standardized base URL.
