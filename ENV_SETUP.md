# Environment Variables Setup for Testing

## Frontend (.env in root directory)

Create a `.env` file in the root directory with:

```env
# Backend API Base URL (without /api - it will be appended automatically where needed)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Backend (.env in halloween-backend directory)

Create a `.env` file in the `halloween-backend` directory with:

```env
# Server Configuration
PORT=5000
BACKEND_URL=http://localhost:5000
BASE_URL=http://localhost:5000

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-database-password
DB_NAME=flovex
DB_SSL=false
DB_CONNECTION_LIMIT=10

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-secret-key-change-this

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Eporner API Configuration (optional)
EPORNER_BASE_URL=https://www.eporner.com
DEBUG_EPORNER=false
```

## Quick Setup Commands

### Frontend
```bash
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:5000" > .env
```

### Backend
```bash
cd halloween-backend
cat > .env << EOF
PORT=5000
BACKEND_URL=http://localhost:5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=flovex
DB_SSL=false
DB_CONNECTION_LIMIT=10
JWT_SECRET=your-secret-key-change-this
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
EPORNER_BASE_URL=https://www.eporner.com
DEBUG_EPORNER=false
EOF
```

## Testing URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Backend Base**: http://localhost:5000
