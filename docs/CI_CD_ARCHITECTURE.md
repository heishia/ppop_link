# CI/CD Architecture Documentation

## Overview

PPOPLINK uses a Release-based CI/CD pipeline with parallel workflows for Web and Backend deployments.

## Architecture Diagram

```
Git Repository (main)
  ↓
Release Created/Published
  ↓
Changed Files Detection (git diff)
  ↓
┌─────────────────────┬─────────────────────┐
│                     │                     │
│  Web Frontend       │  Backend API        │
│  CI/CD              │  CI/CD              │
│                     │                     │
│  1. Detect Changes  │  1. Detect Changes  │
│  2. Lint (ESLint)   │  2. Lint (Ruff)     │
│  3. Type Check      │  3. Type Check      │
│  4. Unit Tests      │  4. Unit Tests      │
│  5. Build           │  5. Integration     │
│  6. Deploy Vercel   │  6. Build Docker    │
│  7. E2E Tests       │  7. Push GHCR       │
│  8. Sentry Release  │  8. Deploy Railway  │
│                     │  9. Health Check    │
│                     │  10. Sentry Release │
│                     │                     │
└─────────────────────┴─────────────────────┘
              ↓
    Slack Notifications
```

## Workflows

### 1. Backend CI/CD (`.github/workflows/backend-cicd.yml`)

**Triggers:**
- Push to `main` or `dev` branches (with path filter)
- Pull requests to `main`
- Manual workflow dispatch

**Jobs:**
1. **detect-changes**: Check if backend files changed
2. **lint**: Run Ruff, Black, mypy
3. **test**: Run pytest with coverage
4. **build**: Build and push Docker image to GHCR
5. **deploy-staging**: Deploy to Railway staging
6. **sentry-release**: Create Sentry release

**Path Filters:**
- `server/**`
- `database/**`
- `requirements.txt`
- `Dockerfile`

### 2. Web CI/CD (`.github/workflows/web-cicd.yml`)

**Triggers:**
- Push to `main` or `dev` branches (with path filter)
- Pull requests to `main`
- Manual workflow dispatch

**Jobs:**
1. **detect-changes**: Check if web files changed
2. **lint**: Run ESLint, Prettier
3. **type-check**: Run TypeScript compiler
4. **test**: Run Jest with coverage
5. **build**: Build Next.js application
6. **deploy-preview**: Deploy to Vercel preview
7. **e2e-test**: Run Playwright E2E tests
8. **sentry-release**: Create Sentry release

**Path Filters:**
- `apps/web/**`

### 3. Release Production Deploy (`.github/workflows/release-deploy.yml`)

**Triggers:**
- Release published
- Manual workflow dispatch with release tag

**Jobs:**
1. **detect-changes**: Compare release tag with previous release
2. **deploy-backend-production**: Deploy backend to production Railway
3. **deploy-web-production**: Deploy web to production Vercel
4. **post-deployment-check**: Verify deployments

**Features:**
- Selective deployment based on changed files
- Parallel deployment of web and backend
- Health checks after deployment
- Sentry release tracking
- Slack notifications

## Environment Strategy

### Development (`dev` branch)
- **Backend**: Auto-deploy to dev Railway instance
- **Web**: Auto-deploy to Vercel preview
- **Purpose**: Feature testing, integration testing

### Staging (`main` branch)
- **Backend**: Auto-deploy to staging Railway instance
- **Web**: Auto-deploy to Vercel preview
- **Purpose**: Pre-production testing, QA

### Production (Release)
- **Backend**: Deploy to production Railway
- **Web**: Deploy to production Vercel
- **Purpose**: Live user traffic

## Change Detection Strategy

### Git Diff Based Detection

The pipeline uses `dorny/paths-filter` action to detect changes:

```yaml
paths-filter:
  - web: 'apps/web/**'
  - backend: 'server/**'
  - shared: 'database/**'
```

### Execution Logic

- **Web only changed**: Run Web CI/CD only
- **Backend only changed**: Run Backend CI/CD only
- **Both changed**: Run both workflows in parallel
- **Database changed**: Run Backend CI/CD (includes migrations)

## Testing Strategy

### Backend Testing

| Type | Tool | Coverage Target | Priority |
|------|------|----------------|----------|
| Lint | Ruff, Black | 100% | High |
| Type Check | mypy | Best effort | Medium |
| Unit | pytest | 80% | High |
| Integration | pytest + TestClient | 80% | Critical |

**Test Structure:**
```
backend/tests/
├── conftest.py          # Fixtures
├── unit/
│   ├── test_security.py
│   └── test_auth_service.py
└── integration/
    ├── test_auth_api.py
    └── test_health.py
```

### Web Testing

| Type | Tool | Coverage Target | Priority |
|------|------|----------------|----------|
| Lint | ESLint | 100% | High |
| Format | Prettier | 100% | Medium |
| Type Check | TypeScript | 100% | High |
| Unit | Jest | 70% | Medium |
| Integration | MSW | 60% | Medium |
| E2E | Playwright | Key flows | Low |

## Deployment Platforms

### Web Frontend (Vercel)

**Advantages:**
- Zero-config Next.js deployment
- Automatic preview deployments
- Built-in CDN and edge functions
- Instant rollback capability

**Configuration:**
- Root directory: `apps/web`
- Build command: `npm run build`
- Output directory: `.next`

### Backend API (Railway)

**Advantages:**
- Docker-based deployment
- Automatic SSL certificates
- Built-in monitoring
- Easy environment management

**Configuration:**
- Dockerfile: `./Dockerfile`
- Health check: `/health`
- Port: 8000

## Monitoring & Observability

### Sentry Integration

**Backend:**
- Error tracking
- Performance monitoring
- Release tracking
- User context

**Web:**
- Error tracking
- Performance monitoring
- Session replay
- Release tracking

### Slack Notifications

**Events:**
- Deployment started
- Deployment completed
- Deployment failed
- Test failures
- Health check failures

**Format:**
```json
{
  "workflow": "Backend Production Deployment",
  "status": "success",
  "environment": "production",
  "url": "https://api.ppoplink.site",
  "branch": "main",
  "commit": "abc123",
  "author": "developer"
}
```

## Security

### Secrets Management

All secrets stored in GitHub Secrets:
- Deployment tokens (Vercel, Railway)
- API keys (Supabase, Sentry)
- JWT secrets
- Webhook URLs

### Secret Rotation

- **Recommended**: Every 3 months
- **Process**: Update in GitHub Secrets → Redeploy

### Security Scanning

- Dependabot enabled for dependency updates
- No secrets in code (enforced by `.gitignore`)
- HTTPS enforced on all endpoints

## Performance Optimization

### Build Optimization

**Backend:**
- Multi-stage Docker builds
- Layer caching with GitHub Actions cache
- Minimal base image (python:3.11-slim)

**Web:**
- Next.js automatic code splitting
- Image optimization
- Static generation where possible

### Deployment Speed

- **Web**: ~2-3 minutes (build + deploy)
- **Backend**: ~5-7 minutes (build + push + deploy)
- **Total**: ~7-10 minutes for full deployment

## Cost Analysis

### GitHub Actions

- **Free tier**: 2,000 minutes/month
- **Expected usage**: ~360 minutes/month
- **Cost**: $0

### Hosting

- **Vercel**: $0 (Hobby plan)
- **Railway**: $5/month (Starter plan)
- **Total**: $5/month

### Monitoring

- **Sentry**: $0 (Developer plan, 5K events)
- **Slack**: $0 (Free plan)

**Total Monthly Cost**: ~$5

## Developer Experience

### Deployment Flow

```
1. Developer commits to feature branch
2. Create PR to main
3. Automatic tests run
4. Review and merge
5. Automatic staging deployment
6. Test on staging
7. Create GitHub Release
8. Automatic production deployment
9. Slack notification
```

### Time to Deploy

- **Staging**: Immediate on merge to main (~5-10 min)
- **Production**: Immediate on release publish (~7-10 min)

### Rollback Time

- **Web**: < 1 minute (Vercel dashboard)
- **Backend**: < 5 minutes (Railway redeploy or Docker tag)

## Best Practices

### Commit Messages

Use Conventional Commits:
```
feat: add user profile page
fix: resolve authentication bug
docs: update deployment guide
chore: update dependencies
```

### Release Process

1. Ensure staging is stable
2. Create release with semantic version (v1.0.0)
3. Write clear release notes
4. Publish release
5. Monitor deployment in Slack
6. Verify production health checks

### Testing Before Release

- [ ] All tests pass on main branch
- [ ] Staging deployment successful
- [ ] Manual testing on staging
- [ ] No critical Sentry errors
- [ ] Database migrations tested

## Troubleshooting

### Common Issues

**Build Fails:**
- Check linter errors
- Verify dependencies
- Check environment variables

**Deployment Fails:**
- Check deployment logs
- Verify secrets are set
- Check health endpoint

**Tests Fail:**
- Check test logs
- Verify test environment
- Check database connectivity

### Debug Commands

```bash
# Local backend testing
pytest -v

# Local web testing
cd apps/web && npm test

# Docker build test
docker build -t test-backend .

# Docker run test
docker run -p 8000:8000 test-backend
```

## Future Improvements

### Short Term
- [ ] Add pre-commit hooks (Husky)
- [ ] Automatic changelog generation
- [ ] Increase test coverage
- [ ] Add E2E tests for critical flows

### Long Term
- [ ] Blue-green deployments
- [ ] Canary releases
- [ ] Automated performance testing
- [ ] Infrastructure as Code (Terraform)
- [ ] Multi-region deployment

