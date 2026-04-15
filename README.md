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
├── web/                      # Next.js frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   ├── lib/              # API client, hooks, utils
│   │   ├── store/            # Zustand stores
│   │   ├── types/            # TypeScript types
│   │   └── constants/        # Constants
│   ├── public/               # Static assets
│   ├── scripts/              # Dev scripts
│   ├── package.json
│   └── railway.toml          # Frontend Railway config
├── backend/                  # FastAPI backend
│   ├── auth/                 # Authentication (PPOP Auth SSO)
│   ├── profiles/             # Profile management
│   ├── links/                # Links & Social links
│   ├── public/               # Public profile pages
│   ├── analytics/            # Click analytics
│   ├── content/              # Content management
│   ├── admin/                # Admin dashboard
│   ├── files/                # File upload (S3)
│   ├── core/                 # Config, DB, security, middleware
│   ├── tests/                # Test suite (unit + integration)
│   └── utils/                # Utility functions
├── scripts/                  # Root dev scripts
│   └── dev.js                # Concurrent backend + frontend
├── .github/workflows/        # CI/CD workflows
├── Dockerfile                # Backend container (Railway)
├── railway.toml              # Backend Railway config
├── requirements.txt          # Python dependencies
├── package.json              # Root scripts (monorepo)
├── pytest.ini                # Pytest configuration
└── .env.example              # Environment template
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm

### 1. Clone & Install

```bash
git clone https://github.com/your-org/ppoplink.git
cd ppoplink

# Install all dependencies (backend + frontend)
npm run setup
```

### 2. Environment Setup

```bash
# Backend (.env.example → .env.local)
cp .env.example .env.local

# Frontend (web/.env.example → web/.env.local)
cp web/.env.example web/.env.local

# Edit both files with your credentials
```

### 3. Run Development Server

```bash
# Backend + Frontend simultaneously
npm run dev

# Or run separately:
npm run dev:backend    # Backend only (localhost:8005)
npm run dev:web        # Frontend only (localhost:3000)
```

- **Backend API Docs**: http://localhost:8005/api/docs
- **Frontend**: http://localhost:3000

---

## Commands Reference

### Root Commands (from project root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Backend + Frontend 동시 실행 |
| `npm run dev:backend` | Backend만 실행 (port 8005) |
| `npm run dev:web` | Frontend만 실행 (port 3000) |
| `npm run dev:open` | Frontend 실행 + 브라우저 자동 열기 |
| `npm run setup` | 전체 의존성 설치 (backend + web) |
| `npm run build` | Frontend 프로덕션 빌드 |
| `npm start` | Frontend 프로덕션 서버 |

### Backend Commands

| Command | Description |
|---------|-------------|
| `python run.py` | Backend 서버 실행 |
| `python -m backend` | Backend 서버 실행 (모듈) |
| `pip install -r requirements.txt` | Python 패키지 설치 |
| `pytest` | 전체 테스트 실행 |
| `pytest backend/tests/unit/` | 유닛 테스트만 실행 |
| `pytest backend/tests/integration/` | 통합 테스트만 실행 |
| `pytest --cov=backend --cov-report=html` | 커버리지 리포트 |
| `ruff check backend/` | 린트 검사 |
| `black backend/` | 코드 포매팅 |
| `mypy backend/ --ignore-missing-imports` | 타입 체크 |

### Frontend Commands (from `web/` or root)

| Command (root) | Command (web/) | Description |
|----------------|----------------|-------------|
| `npm run lint` | `npm run lint` | 린트 검사 |
| `npm run lint:fix` | `npm run lint:fix` | 린트 자동 수정 |
| `npm run format` | `npm run format` | Prettier 포매팅 |
| `npm run type-check` | `npm run type-check` | TypeScript 타입 체크 |
| `npm test` | `npm test` | 테스트 실행 |
| `npm run test:coverage` | `npm run test:coverage` | 커버리지 리포트 |

### All-in-one Root Commands

| Command | Description |
|---------|-------------|
| `npm run install:all` | Backend + Frontend 의존성 설치 |
| `npm run install:backend` | Backend 의존성만 설치 |
| `npm run install:web` | Frontend 의존성만 설치 |
| `npm run lint:backend` | Backend 린트 (ruff) |
| `npm run format:backend` | Backend 포매팅 (black) |
| `npm run type-check:backend` | Backend 타입 체크 (mypy) |
| `npm run test:backend` | Backend 테스트 (pytest) |
| `npm run test:backend:coverage` | Backend 커버리지 리포트 |

---

## Environment Variables

### Strategy

| File | Purpose | Git |
|------|---------|-----|
| `.env.example` | Template (backend) | Committed |
| `.env.local` | Development (backend) | Gitignored |
| `.env` | Production (backend) | Gitignored |
| `web/.env.example` | Template (frontend) | Committed |
| `web/.env.local` | Development (frontend) | Gitignored |

Backend는 `APP_ENV` 값에 따라 자동으로 환경 파일을 로드합니다:
- `APP_ENV=dev` → `.env.local`
- `APP_ENV=prod` → `.env`

### Key Backend Variables

```env
APP_ENV=dev
APP_PORT=8005
DATABASE_URL=postgresql://user:pass@host:5432/railway
S3_ENDPOINT_URL=https://your-bucket.storage.railway.app
PPOP_AUTH_API_URL=https://auth-api.yourdomain.com
PPOP_AUTH_CLIENT_ID=your-client-id
```

### Key Frontend Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8005
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PPOP_AUTH_CLIENT_URL=https://auth.yourdomain.com
```

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | OAuth 로그인 (PPOP Auth 리다이렉트) |
| GET | `/callback` | OAuth 콜백 처리 |
| POST | `/refresh` | 토큰 갱신 |
| GET | `/me` | 현재 유저 정보 |
| POST | `/logout` | 로그아웃 |

### Profile (`/api/profile`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 내 프로필 조회 |
| PUT | `/` | 프로필 수정 |
| PUT | `/theme` | 테마/배경색 변경 |
| POST | `/image` | 프로필 이미지 업로드 |
| POST | `/background` | 배경 이미지 업로드 (PRO) |

### Links (`/api/links`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 내 링크 목록 |
| POST | `/` | 링크 생성 |
| PUT | `/{id}` | 링크 수정 |
| DELETE | `/{id}` | 링크 삭제 |
| PUT | `/reorder` | 링크 순서 변경 |

### Social Links (`/api/social-links`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | 소셜 링크 목록 |
| POST | `/` | 소셜 링크 생성 |
| PUT | `/{id}` | 소셜 링크 수정 |
| DELETE | `/{id}` | 소셜 링크 삭제 |

### Public (`/api/u`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{username}` | 공개 프로필 조회 |
| POST | `/{username}/click/{link_id}` | 클릭 기록 |

### Admin (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | 유저 목록 (페이지네이션) |
| GET | `/stats` | 통계 조회 |
| PUT | `/users/{id}/plan` | 유저 플랜 변경 |

## Plan Limits

| Feature | Free | PRO |
|---------|------|-----|
| Links | 6 | Unlimited |
| Social Links | 5 | Unlimited |
| Background Color | Yes | Yes |
| Background Image | No | Yes |

## Deployment

- **Backend**: Railway (Docker, auto-deploy on push to main)
- **Frontend**: Railway (railpack builder)
- **CI/CD**: GitHub Actions

```bash
# Push to main triggers auto-deployment
git push origin main
```

## Testing

### Backend

```bash
pytest                                    # All tests
pytest backend/tests/unit/               # Unit tests only
pytest backend/tests/integration/        # Integration tests only
pytest --cov=backend --cov-report=html   # With coverage (target: 80%)
```

### Frontend

```bash
cd web
npm test                  # All tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage (target: 70%)
```

## License

MIT
