# PPOP Auth SSO Setup Guide

## Overview

PPOPLINK uses PPOP Auth for Single Sign-On (SSO) authentication. This document explains how to configure the integration.

## Responsibility Separation

### PPOP Auth Responsibilities
- User registration and signup
- User login and authentication
- Email verification
- Phone number verification (SMS)
- Duplicate email/phone number validation
- JWT token issuance
- User credential management

### PPOPLINK Responsibilities
- JWT token verification (from PPOP Auth)
- User information synchronization (from JWT to local DB)
- Link management (CRUD operations)
- Analytics and click tracking
- Public profile display
- Subscription status checking (via PPOP Auth API)

**Important:** PPOPLINK does NOT handle any authentication, verification, or duplicate checking. All authentication logic is delegated to PPOP Auth.

## Environment Variables

Add the following variables to your `.env.dev` or `.env.prod` file:

```bash
# PPOP Auth SSO Configuration
PPOP_AUTH_API_URL=https://auth-api.yourdomain.com
PPOP_AUTH_CLIENT_URL=https://auth.yourdomain.com
PPOP_AUTH_CLIENT_ID=your_client_id
PPOP_AUTH_CLIENT_SECRET=your_client_secret
PPOP_AUTH_REDIRECT_URI=http://localhost:3000/auth/callback
PPOP_AUTH_JWKS_URI=https://auth-api.yourdomain.com/.well-known/jwks.json
```

### Variable Descriptions

| Variable | Description |
|----------|-------------|
| `PPOP_AUTH_API_URL` | PPOP Auth API server URL |
| `PPOP_AUTH_CLIENT_URL` | PPOP Auth login UI URL |
| `PPOP_AUTH_CLIENT_ID` | OAuth2 Client ID (provided by PPOP Auth) |
| `PPOP_AUTH_CLIENT_SECRET` | OAuth2 Client Secret (keep secure!) |
| `PPOP_AUTH_REDIRECT_URI` | Callback URL after login (must match registered redirect URI) |
| `PPOP_AUTH_JWKS_URI` | JWKS endpoint for JWT verification |

## Authentication Flow

```
1. User clicks "Sign in with PPOP" button
2. Frontend requests login URL from backend (/api/auth/oauth/login)
3. User is redirected to PPOP Auth login page
4. User authenticates with PPOP Auth (email/phone verification handled here)
5. PPOP Auth validates credentials and checks for duplicates
6. PPOP Auth redirects to callback URL with authorization code
7. Frontend sends code to backend (/api/auth/oauth/callback)
8. Backend exchanges code for tokens with PPOP Auth
9. Backend verifies token using JWKS and syncs user info to local DB
10. Tokens and user info returned to frontend
11. Frontend stores tokens and redirects to dashboard
```

**Note:** All authentication, verification, and duplicate checking happens in steps 4-5 at PPOP Auth. PPOPLINK only handles token verification and user data synchronization.

## API Endpoints

### GET /api/auth/oauth/login
Returns the PPOP Auth login URL and state parameter.

**Response:**
```json
{
  "success": true,
  "login_url": "https://auth.yourdomain.com/oauth/authorize?...",
  "state": "random_csrf_token"
}
```

### POST /api/auth/oauth/callback
Exchanges authorization code for tokens.

**Request:**
```json
{
  "code": "authorization_code",
  "state": "csrf_state"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "token_type": "Bearer"
  },
  "user": { ... }
}
```

### POST /api/auth/oauth/refresh
Refreshes access token using refresh token.

### GET /api/auth/me
Returns current authenticated user info.

### POST /api/auth/logout
Logs out the current user.

## Database Migration

Run the migration to allow nullable password_hash for SSO users:

```sql
-- database/migrations/003_ppop_auth_migration.sql
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
```

## Production Checklist

- [ ] Set correct `PPOP_AUTH_REDIRECT_URI` for production domain
- [ ] Register redirect URI with PPOP Auth
- [ ] Store `PPOP_AUTH_CLIENT_SECRET` securely (use secrets manager)
- [ ] Run database migration
- [ ] Update CORS origins for production

