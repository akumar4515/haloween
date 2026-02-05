# OAuth Authentication Debugging Guide

## Current Issue
Authentication goes to fallback screen but doesn't log in to the website.

## OAuth Flow

1. **User clicks login** → Opens popup to: `${API_BASE}/api/auth/google`
2. **Backend redirects** → Google OAuth consent screen
3. **Google redirects** → Backend callback: `http://localhost:5000/api/auth/google/callback`
4. **Backend processes** → Creates/updates user, generates JWT token
5. **Backend redirects** → Frontend: `${FRONTEND_URL}/auth/callback?token=...&success=true`
6. **Frontend callback** → Should detect popup and send message to opener, or handle full-page redirect

## Google OAuth Configuration Check

Your current configuration:
- **Authorised JavaScript origins**: 
  - `https://www.flovex.net`
  - `https://haloween-25xi-dhojdssgm-akumar4515s-projects.vercel.app`
  - `http://localhost:3000` ✅

- **Authorised redirect URIs**:
  - `https://halloween-backend-cria.onrender.com/api/auth/google/callback` (production)
  - `http://localhost:5000/api/auth/google/callback` ✅ (development)

## Backend .env Check

Make sure your backend `.env` has:
```env
FRONTEND_URL=http://localhost:3000
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

## Debugging Steps

### 1. Check Browser Console
Open browser DevTools (F12) and check:
- Any JavaScript errors
- Network tab for failed requests
- Console logs from authentication flow

### 2. Check Network Requests
In DevTools Network tab, look for:
- Request to `/api/auth/google` (should redirect to Google)
- Request to `/api/auth/google/callback` (should return redirect to frontend)
- Request to `/auth/callback` (should have token in URL)
- Request to `/api/auth/me` (should return user data)

### 3. Check Popup Window
- Is the popup opening?
- Does it redirect through Google OAuth?
- Does it eventually reach `/auth/callback`?
- Check if `window.opener` exists in the popup

### 4. Check localStorage
After authentication attempt, check:
```javascript
localStorage.getItem('userAuth')
```
Should contain: `{ authenticated: true, token: "...", user: {...} }`

### 5. Common Issues

#### Issue: Popup loses `window.opener` reference
**Solution**: The code now uses `postMessage` API which is more reliable.

#### Issue: Backend redirect URL mismatch
**Check**: Backend `.env` `FRONTEND_URL` must match your frontend URL

#### Issue: CORS errors
**Check**: Backend CORS is enabled, but verify it allows your frontend origin

#### Issue: Token not being saved
**Check**: 
- Is `/api/auth/me` returning user data?
- Is the token valid?
- Check browser console for errors

## Testing Commands

### Test Backend Health
```bash
curl http://localhost:5000/
```

### Test Auth Endpoint
```bash
curl http://localhost:5000/api/auth/google
# Should redirect to Google OAuth
```

### Test Auth Me (with token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/auth/me
```

## Fixed Issues

1. ✅ Added `/api` prefix to GoogleCallbackClient redirect URL
2. ✅ Improved popup detection using `window.opener && !window.opener.closed`
3. ✅ Added better error handling and logging
4. ✅ Improved message passing between popup and parent window

## Next Steps

1. Clear browser cache and localStorage
2. Restart both frontend and backend servers
3. Try login again
4. Check browser console for any errors
5. Verify token is being saved in localStorage
