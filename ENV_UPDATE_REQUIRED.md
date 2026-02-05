# .env File Update Required

## ✅ What You Need to Change

### Frontend `.env` (root directory)

**If your `.env` currently has:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

**Change it to (remove `/api`):**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

**Why?** We standardized all files to append `/api` automatically where needed, so the base URL should NOT include it.

### Backend `.env` (halloween-backend directory)

**✅ NO CHANGES NEEDED** - Backend `.env` remains the same:
```env
PORT=5000
BACKEND_URL=http://localhost:5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=STRONG_SECRET_HERE
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=flovex
```

## Summary

- ✅ **Frontend**: Remove `/api` from `NEXT_PUBLIC_API_BASE_URL`
- ✅ **Backend**: No changes needed

After updating, restart both servers.
