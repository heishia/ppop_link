# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PPOPLINK is a Link in Bio SaaS service (Linktree alternative) built as a monorepo with a FastAPI backend and Next.js frontend. The project uses PPOP Auth for SSO authentication and Railway PostgreSQL for database.

## Tech Stack

- **Backend**: FastAPI (Python 3.11+), Railway PostgreSQL, Sentry
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Zustand
- **Auth**: PPOP Auth SSO (OAuth 2.0 with JWT)
- **Database**: Railway PostgreSQL (psycopg2)
- **Storage**: Railway Buckets (S3 compatible, boto3)
- **Deployment**: Railway (backend + database + storage)

## Common Commands

### Backend Development

```bash
# Run backend server (automatically loads .env.local for dev)
python -m backend
# or
python backend/run.py

# Testing
pytest                                    # Run all tests
pytest backend/tests/unit/               # Run unit tests only
pytest backend/tests/integration/        # Run integration tests only
pytest --cov=backend --cov-report=html   # Run with coverage report

# Linting and formatting
ruff check backend/                      # Lint code
black backend/                           # Format code
mypy backend/ --ignore-missing-imports   # Type check
```

### Frontend Development

```bash
cd web

# Development
npm run dev                              # Start dev server at localhost:3000
npm run dev:open                         # Start dev server and auto-open browser

# Testing
npm test                                 # Run tests
npm run test:watch                       # Run tests in watch mode
npm run test:coverage                    # Run with coverage

# Linting and formatting
npm run lint                             # Lint code
npm run lint:fix                         # Lint and auto-fix
npm run type-check                       # TypeScript type checking
npm run format                           # Format with Prettier
npm run format:check                     # Check formatting

# Build
npm run build                            # Build for production
npm start                                # Start production server
```

### Root-level Commands

```bash
# Install dependencies
npm run install:all                      # Install all dependencies (web only)

# Development
npm run dev                              # Start web dev server
npm run dev:backend                      # Start backend server
```

## Architecture

### Authentication Flow (PPOP Auth SSO)

1. **OAuth 2.0 Flow**: User → Frontend → PPOP Auth (login) → Backend (token exchange) → Frontend (authenticated)
2. **Token Storage**: HttpOnly cookies for access/refresh tokens (set by backend at `/api/auth/*`)
3. **Token Refresh**: Frontend middleware (`web/src/middleware.ts`) handles automatic token refresh
4. **Subscription Check**: Backend validates subscription status with PPOP Auth API before granting access to PRO features

Key files:
- `backend/auth/service.py`: OAuth logic, token exchange, user creation
- `backend/auth/router.py`: Auth endpoints (`/api/auth/login`, `/api/auth/callback`, etc.)
- `web/src/store/authStore.ts`: Frontend auth state (Zustand)
- `web/src/middleware.ts`: Token refresh and route protection

### Backend Structure

**Module Organization**: Each feature module follows this pattern:
```
backend/{feature}/
  ├── router.py      # FastAPI routes
  ├── service.py     # Business logic
  └── schemas.py     # Pydantic request/response models
```

**Core Modules** (`backend/core/`):
- `config.py`: Environment settings with pydantic-settings (loads `.env.local` for dev, `.env` for prod)
- `database.py`: PostgreSQL connection pool management (psycopg2 ThreadedConnectionPool)
- `security.py`: JWT validation (validates PPOP Auth tokens using JWKS)
- `security_middleware.py`: Security headers, IP blacklist, malicious pattern detection, request size limits
- `exceptions.py`: Custom exception classes
- `models.py`: Pydantic models for domain entities

**Request Flow**:
1. Middleware chain: CORS → Security headers → IP blacklist → Malicious patterns → Request size limit
2. Router → Service layer (business logic) → Database (PostgreSQL via psycopg2)
3. Exception handlers return standardized JSON responses

**Rate Limiting**: 200 requests/minute per IP (configured with slowapi in `main.py`)

### Frontend Structure

**App Router** (`web/src/app/`):
- `/` - Landing page
- `/login`, `/register` - Auth pages (redirect to PPOP Auth)
- `/auth/callback` - OAuth callback handler
- `/dashboard` - User dashboard (protected)
- `/[username]` - Public profile pages
- `api/` - API route handlers (proxy to backend with cookie forwarding)

**State Management** (`web/src/store/`):
- `authStore.ts`: Authentication state (Zustand)
- Other stores for features (links, profile, etc.)

**API Layer** (`web/src/lib/api/`):
- Axios-based API client
- Automatically includes credentials (cookies) in requests
- Error handling with standardized error parsing

**Middleware** (`web/src/middleware.ts`):
- Automatic token refresh when access token expires
- Protected route enforcement
- Cookie management for cross-origin requests

### Database (Railway PostgreSQL)

**Key Tables**:
- `users`: User profiles (id is PPOP Auth user_id UUID)
- `user_plans`: Local plan cache (actual subscription managed by PPOP Auth)
- `links`: User's custom links
- `social_links`: User's social media links
- `click_events`: Click tracking for analytics

**Connection**: Direct PostgreSQL connection via psycopg2 with ThreadedConnectionPool.

**Storage (Railway Buckets - S3 compatible)**:
- `profiles`: Profile images
- `backgrounds`: Background images (PRO only)
- `content-images`: Content images

### Environment Configuration

**Backend** uses a 3-file strategy based on `APP_ENV`:
- `.env.example`: Template (committed)
- `.env.local`: Development (gitignored, automatically loaded when `APP_ENV=dev`)
- `.env`: Production (gitignored, automatically loaded when `APP_ENV=prod`)

**Frontend**:
- `.env.local`: Development
- Vercel deployment: Environment variables set in Vercel dashboard

Critical environment variables:
- `DATABASE_URL` (Railway PostgreSQL connection string)
- `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`
- `PPOP_AUTH_API_URL`, `PPOP_AUTH_CLIENT_URL`, `PPOP_AUTH_CLIENT_ID`, `PPOP_AUTH_CLIENT_SECRET`
- `PPOP_AUTH_REDIRECT_URI`, `PPOP_AUTH_JWKS_URI`, `PPOP_AUTH_SERVICE_CODE`, `PPOP_AUTH_ADMIN_API_KEY`

### Plan Limits

Enforced in backend business logic:
- **Free**: 6 links, 5 social links
- **PRO** (verified via PPOP Auth API): Unlimited links, unlimited social links, background images

### Testing Strategy

**Backend**:
- Unit tests: Service layer logic (`backend/tests/unit/`)
- Integration tests: API endpoints with TestClient (`backend/tests/integration/`)
- Coverage target: 80%
- Configured in `pytest.ini` with markers: `@pytest.mark.unit`, `@pytest.mark.integration`

**Frontend**:
- Unit tests: React components with Jest
- Integration tests: API mocking with MSW
- Coverage target: 70%

## Deployment

- **Backend**: Railway (auto-deploy on push to main)
- **Frontend**: Vercel (auto-deploy on push to main)
- **CI/CD**: GitHub Actions for lint, test, build, deploy
- **Monitoring**: Sentry for error tracking

## Important Notes

1. **Authentication**: This project uses PPOP Auth SSO exclusively. Users are created in local DB after successful OAuth flow. The `users.id` field is the PPOP Auth user_id (UUID).

2. **Subscription Management**: PRO/BASIC plans are managed by PPOP Auth. Backend queries PPOP Auth API to verify subscription status before granting access to PRO features.

3. **Token Handling**: Tokens are stored in HttpOnly cookies (set by backend). Frontend never handles raw tokens. Middleware automatically refreshes expired tokens.

4. **Database Access**: Backend uses direct PostgreSQL connection via psycopg2. All access control logic is implemented in backend service layer.

5. **CORS**: Configured in `backend/main.py` to allow credentials from frontend origins. Production CORS must include PPOP Auth client origin.

6. **Cookie Configuration**: Cookie settings vary by environment (see `backend/core/config.py`):
   - Dev: `SameSite=Lax`, `Secure=False`
   - Prod: `SameSite=None`, `Secure=True` (for cross-origin)

7. **Public Link IDs**: Users have a `public_link_id` (sqids encoding of `user_seq`) used in public URLs (`/{username}` or `/l/{public_link_id}`).