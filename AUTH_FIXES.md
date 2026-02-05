# Authentication Fixes Applied

## Issues Fixed

### 1. API Base URL Inconsistencies
**Problem**: Some files expected `NEXT_PUBLIC_API_BASE_URL` to include `/api`, others didn't.

**Fixed Files**:
- ✅ `src/app/components/UserAuth.js` - Now uses `/api` (for `/api/auth/*` routes)
- ✅ `src/app/contexts/UserContext.js` - Now uses `/api` (for `/api/auth/me`)
- ✅ `src/app/hooks/useWatchHistory.js` - Removes `/api` (for `/user/*` routes)
- ✅ `src/app/hooks/useFollow.js` - Removes `/api` (for `/user/*` routes)
- ✅ `src/app/library/page.js` - Removes `/api` (uses hooks)
- ✅ `src/app/admin/components/AdminLogin.js` - Removes `/api` (for `/admin/*` routes)

### 2. Route Structure Understanding
- **Auth routes**: `/api/auth/*` (e.g., `/api/auth/google`, `/api/auth/me`)
- **User routes**: `/user/*` (e.g., `/user/watch-history`, `/user/follow`)
- **Admin routes**: `/admin/*` (e.g., `/admin/auth`)

## Required Environment Variables

### Frontend `.env` (root directory)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

**Important**: Do NOT include `/api` - it will be appended automatically where needed.

### Backend `.env` (halloween-backend directory)
```env
# Server Configuration
PORT=5000
BACKEND_URL=http://localhost:5000
BASE_URL=http://localhost:5000

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=STRONG_SECRET_HERE

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

## Important Notes

1. **GOOGLE_REDIRECT_URI** must match exactly:
   - Backend `.env`: `GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback`
   - Google Cloud Console: Authorized redirect URIs must include this exact URL

2. **OAuth Flow**:
   - User clicks login → Opens popup to `http://localhost:5000/api/auth/google`
   - Backend redirects to Google OAuth
   - Google redirects to `GOOGLE_REDIRECT_URI` (backend)
   - Backend processes and redirects to `FRONTEND_URL/auth/callback?token=...&success=true`
   - Frontend `AuthCallbackClient` handles the token and updates user context

3. **Testing**:
   - Make sure backend is running on port 5000
   - Make sure frontend is running on port 3000
   - Check browser console for any CORS or network errors
   - Verify Google OAuth credentials are correct in Google Cloud Console

## Common Issues

1. **"Failed to load" errors**: Check if backend is running and `NEXT_PUBLIC_API_BASE_URL` is correct
2. **CORS errors**: Backend should have CORS enabled (already configured in `index.js`)
3. **OAuth redirect mismatch**: Verify `GOOGLE_REDIRECT_URI` matches Google Cloud Console settings
4. **Token not saving**: Check browser localStorage and console for errors
