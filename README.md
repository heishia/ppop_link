# PPOPLINK

Link in Bio SaaS Service - Linktree Alternative

## Tech Stack

- **Frontend**: Next.js 14 (React, TypeScript, Tailwind CSS)
- **Backend**: FastAPI (Python 3.11+)
- **Database**: Railway PostgreSQL
- **File Storage**: Railway Buckets (S3 compatible)
- **Authentication**: PPOP Auth (SSO with JWT)
- **Deployment**: Railway (Backend + Database + Storage)
- **Monitoring**: Sentry
- **CI/CD**: GitHub Actions

## Project Structure

```
ppoplink/
├── apps/
│   └── web/              # Next.js frontend application
│       ├── src/
│       │   └── app/      # App router pages
│       ├── package.json
│       └── next.config.js
├── backend/              # FastAPI backend server
│   ├── auth/             # Authentication module
│   ├── profiles/         # Profile management
│   ├── links/            # Links & Social links
│   ├── public/           # Public profile pages
│   ├── admin/            # Admin dashboard
│   ├── sms/              # SMS verification service
│   ├── files/            # File upload service
│   ├── core/             # Core configs, models, utils
│   ├── tests/            # Test suite
│   └── utils/            # Utility functions
├── database/             # Database schemas
│   ├── schema.sql        # Table definitions
│   └── seed.sql          # Initial seed data
├── .github/
│   └── workflows/        # CI/CD workflows
├── docs/                 # Documentation
├── Dockerfile            # Backend container
├── docker-compose.yml    # Local development
└── requirements.txt      # Python dependencies
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (optional, for containerized development)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/ppoplink.git
cd ppoplink
```

### 2. Backend Setup

#### Environment Configuration

This project uses a clear separation between development and production environments:

- `.env.example` - Environment variable specification (committed)
- `.env.dev` - Local development (gitignored)
- `.env.prod` - Production server (gitignored)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Copy example file to create development environment
cp .env.example .env.local

# Edit .env.local with your Railway credentials and settings
# Required variables:
# - APP_ENV=dev
# - DATABASE_URL (Railway PostgreSQL)
# - PPOP_AUTH_* (SSO settings)
# - Other configuration as needed
```

#### Database Setup

```bash
# Run database migrations in Railway PostgreSQL
# Connect using psql or any PostgreSQL client
# Execute database/schema.sql
# (Optional) Execute database/seed.sql for test data
```

#### Run Backend

```bash
# The backend will automatically load .env.dev when APP_ENV=dev
python -m backend
# or
python backend/run.py
```

Backend runs at: http://localhost:8000

API Docs: http://localhost:8000/api/docs (DEBUG mode only)

### 3. Frontend Setup

```bash
cd apps/web

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your API URL

# Run development server
npm run dev
```

Frontend runs at: http://localhost:3000

### 4. Docker Setup (Alternative)

```bash
# Copy example file to create development environment
cp .env.example .env.dev

# Edit .env.dev with your credentials
# Make sure APP_ENV=dev is set

# Build and start services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

**Docker Features:**
- Hot reload enabled for development
- Health checks configured
- Automatic restart on failure
- Volume mounting for live code updates

## Development

### Backend Development

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=backend --cov-report=html

# Lint code
ruff check backend/

# Format code
black backend/

# Type check
mypy backend/ --ignore-missing-imports
```

### Frontend Development

```bash
cd apps/web

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy

1. **Setup Secrets**: Add all required secrets to GitHub (see [docs/GITHUB_SECRETS.md](docs/GITHUB_SECRETS.md))

2. **Push to Main**: Automatic staging deployment
   ```bash
   git push origin main
   ```

3. **Create Release**: Automatic production deployment
   ```bash
   # Via GitHub UI: Releases → Draft a new release
   # Or via CLI:
   gh release create v1.0.0 --title "Release v1.0.0" --notes "Release notes"
   ```

## CI/CD Pipeline

- **Backend CI/CD**: Lint → Test → Build Docker → Deploy Railway → Sentry
- **Web CI/CD**: Lint → Type Check → Test → Build → Deploy Vercel → E2E → Sentry
- **Release Deploy**: Detect Changes → Parallel Deploy → Health Check → Notify

See [docs/CI_CD_ARCHITECTURE.md](docs/CI_CD_ARCHITECTURE.md) for detailed architecture.

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login |
| POST | `/refresh` | Refresh tokens |
| GET | `/me` | Get current user |
| POST | `/logout` | Logout |

### Profile (`/api/profile`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get my profile |
| PUT | `/` | Update profile |
| PUT | `/theme` | Update theme/background color |
| POST | `/image` | Upload profile image |
| POST | `/background` | Upload background image (Pro only) |

### Links (`/api/links`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get my links |
| POST | `/` | Create link |
| PUT | `/{id}` | Update link |
| DELETE | `/{id}` | Delete link |
| PUT | `/reorder` | Reorder links |

### Social Links (`/api/social-links`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get my social links |
| POST | `/` | Create social link |
| PUT | `/{id}` | Update social link |
| DELETE | `/{id}` | Delete social link |

### SMS (`/api/sms`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send` | Send verification SMS |
| POST | `/verify` | Verify SMS code |
| POST | `/resend` | Resend verification SMS |

### Public (`/api/u`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{username}` | Get public profile |
| POST | `/{username}/click/{link_id}` | Record click |

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users (paginated) |
| GET | `/stats` | Get statistics |
| PUT | `/users/{id}/plan` | Update user plan |

## Plan Limits

| Feature | Free | Pro |
|---------|------|-----|
| Links | 5 | Unlimited |
| Social Links | 3 | Unlimited |
| Background Color | Yes | Yes |
| Background Image | No | Yes |
| Themes | Basic (2) | All |

## Environment Variables

### Environment Strategy

The project uses a **3-file environment strategy** for clear separation:

1. **`.env.example`** - Template with all required variables (committed to git)
2. **`.env.dev`** - Development configuration (gitignored)
3. **`.env.prod`** - Production configuration (gitignored, server only)

**Key Benefits:**
- No code changes needed when switching environments
- Environment variables automatically loaded based on `APP_ENV`
- Easy onboarding for new team members
- Production secrets never in repository

### Backend Environment Variables

See `.env.example` for the complete list. Key variables:

```env
# App Configuration
APP_ENV=dev                    # dev or prod
APP_NAME=PPOPLINK
APP_PORT=8005

# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@host:5432/railway

# Storage (Railway Buckets - S3 compatible)
S3_ENDPOINT_URL=https://your-bucket.storage.railway.app
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=ppoplink
S3_REGION=auto

# PPOP Auth (SSO)
PPOP_AUTH_API_URL=https://auth-api.yourdomain.com
PPOP_AUTH_CLIENT_URL=https://auth.yourdomain.com
PPOP_AUTH_CLIENT_ID=your-client-id
PPOP_AUTH_CLIENT_SECRET=your-client-secret
PPOP_AUTH_REDIRECT_URI=https://ppoplink.site/auth/callback
PPOP_AUTH_JWKS_URI=https://auth-api.yourdomain.com/.well-known/jwks.json

# Server Configuration
DEBUG=true                     # Enable debug mode and API docs
API_PREFIX=/api
CORS_ORIGINS=http://localhost:3000

# Storage Buckets
STORAGE_BUCKET_PROFILES=profiles
STORAGE_BUCKET_BACKGROUNDS=backgrounds
STORAGE_BUCKET_CONTENT_IMAGES=content-images
MAX_FILE_SIZE_MB=5

# Plan Limits
FREE_MAX_LINKS=6
FREE_MAX_SOCIAL_LINKS=5

# Logging
LOG_LEVEL=INFO                 # DEBUG, INFO, WARNING, ERROR
```

### Environment-Specific Behavior

**Development (`APP_ENV=dev`):**
- `DEBUG=true` - API docs enabled at `/api/docs`
- Hot reload enabled
- Verbose logging
- Loads `.env.dev`

**Production (`APP_ENV=prod`):**
- `DEBUG=false` - API docs disabled
- Optimized performance
- Minimal logging
- Loads `.env.prod`

### Frontend

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=web
SENTRY_AUTH_TOKEN=your-token
```

## Testing

### Backend Tests

- **Unit Tests**: Service layer logic
- **Integration Tests**: API endpoints with TestClient
- **Coverage Target**: 80%

```bash
# Run all tests
pytest

# Run specific test file
pytest backend/tests/unit/test_security.py

# Run with coverage
pytest --cov=backend --cov-report=html
```

### Frontend Tests

- **Unit Tests**: React components with Jest
- **Integration Tests**: API mocking with MSW
- **E2E Tests**: User flows with Playwright
- **Coverage Target**: 70%

```bash
cd apps/web

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Monitoring

- **Sentry**: Error tracking and performance monitoring
- **Railway Metrics**: Backend performance and resource usage
- **Railway PostgreSQL**: Database monitoring and metrics

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/your-org/ppoplink/issues)
- Email: support@ppoplink.site
