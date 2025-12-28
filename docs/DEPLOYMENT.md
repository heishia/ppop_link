# Deployment Guide

This document provides step-by-step instructions for deploying PPOPLINK to production.

## Prerequisites

- GitHub repository with the codebase
- Vercel account (for Web Frontend)
- Railway or Render account (for Backend API)
- Supabase project (for Database & Storage)
- Sentry account (for Error Tracking)
- Slack workspace (for Notifications)

---

## 1. Vercel Setup (Web Frontend)

### 1.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select `apps/web` as the root directory
5. Framework Preset: Next.js
6. Click "Deploy"

### 1.2 Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

**Production:**
```
NEXT_PUBLIC_API_URL=https://api.ppoplink.site
NEXT_PUBLIC_PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-production-04b4.up.railway.app
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=web
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

**Preview:**
```
NEXT_PUBLIC_API_URL=https://staging-api.ppoplink.site
NEXT_PUBLIC_PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-staging-xxxx.up.railway.app
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=web
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### 1.3 Get Vercel Tokens

For GitHub Actions deployment:

1. Go to Account Settings → Tokens
2. Create new token with appropriate scope
3. Add to GitHub Secrets:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID` (found in Project Settings)
   - `VERCEL_PROJECT_ID` (found in Project Settings)

---

## 2. Railway Setup (Backend API)

### 2.1 Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select "Empty Service" (we'll use Docker)

### 2.2 Configure Service

1. Service Settings:
   - Name: `ppoplink-backend-production`
   - Region: Select closest to your users
   - Build: Dockerfile
   - Dockerfile Path: `./Dockerfile`

2. Add Environment Variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
DEBUG=false
API_PREFIX=/api
CORS_ORIGINS=https://ppoplink.site,https://www.ppoplink.site
STORAGE_BUCKET_PROFILES=profiles
STORAGE_BUCKET_BACKGROUNDS=backgrounds
MAX_FILE_SIZE_MB=5
SENTRY_DSN=your-backend-sentry-dsn
ENVIRONMENT=production
SENTRY_RELEASE=$RAILWAY_GIT_COMMIT_SHA
```

3. Add Custom Domain:
   - Settings → Networking → Custom Domain
   - Add: `api.ppoplink.site`

### 2.3 Create Staging Environment

Repeat steps above for staging:
- Service Name: `ppoplink-backend-staging`
- Domain: `staging-api.ppoplink.site`
- Environment: `staging`

### 2.4 Get Railway Token

For GitHub Actions:

1. Account Settings → Tokens
2. Create new token
3. Add to GitHub Secrets:
   - `RAILWAY_TOKEN`
   - `RAILWAY_SERVICE_PRODUCTION` (service ID)
   - `RAILWAY_SERVICE_STAGING` (service ID)

---

## 3. Supabase Setup

### 3.1 Database Schema

1. Go to Supabase Dashboard → SQL Editor
2. Run `database/schema.sql`
3. Verify tables are created

### 3.2 Storage Buckets

1. Go to Storage
2. Create buckets:
   - `profiles` (public)
   - `backgrounds` (public)
3. Set policies for public read access

### 3.3 Get Credentials

From Project Settings → API:
- `SUPABASE_URL`
- `SUPABASE_KEY` (anon public)
- `SUPABASE_SERVICE_KEY` (service_role - keep secret!)

---

## 4. Sentry Setup

### 4.1 Create Projects

1. Create Organization (if not exists)
2. Create two projects:
   - `web` (JavaScript/Next.js)
   - `backend` (Python/FastAPI)

### 4.2 Get Credentials

For each project:
- DSN (Settings → Client Keys)
- Auth Token (Settings → Auth Tokens)

Add to GitHub Secrets:
```
SENTRY_AUTH_TOKEN
SENTRY_ORG
NEXT_PUBLIC_SENTRY_DSN (web)
SENTRY_DSN (backend)
```

---

## 5. Slack Notifications

### 5.1 Create Incoming Webhook

1. Go to Slack App Directory
2. Search "Incoming Webhooks"
3. Add to Workspace
4. Select channel (e.g., #deployments)
5. Copy Webhook URL

### 5.2 Add to GitHub Secrets

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 6. GitHub Secrets Summary

Add all secrets to GitHub Repository Settings → Secrets and variables → Actions:

### Vercel
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Railway
- `RAILWAY_TOKEN`
- `RAILWAY_SERVICE_PRODUCTION`
- `RAILWAY_SERVICE_STAGING`

### Supabase
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`

### JWT
- `JWT_SECRET_KEY` (generate with: `openssl rand -hex 32`)

### Sentry
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`

### Slack
- `SLACK_WEBHOOK_URL`

### API URLs
- `NEXT_PUBLIC_API_URL` (production)
- `PROD_NEXT_PUBLIC_API_URL` (for release workflow)

### Test Environment (for CI)
- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_KEY`
- `TEST_SUPABASE_SERVICE_KEY`
- `TEST_JWT_SECRET_KEY`

---

## 7. Deployment Workflow

### 7.1 Development Flow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push to GitHub
git push origin feature/new-feature

# 4. Create Pull Request
# GitHub Actions will run tests automatically

# 5. Merge to main
# Automatic deployment to staging
```

### 7.2 Production Release

```bash
# 1. Ensure main branch is stable
# Staging deployment should be working

# 2. Create a release on GitHub
# Go to Releases → Draft a new release

# 3. Create tag (e.g., v1.0.0)
# Follow semantic versioning

# 4. Add release notes
# Describe changes in this release

# 5. Publish release
# GitHub Actions will automatically deploy to production
```

### 7.3 Rollback

**Web (Vercel):**
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Backend (Railway):**
1. Go to Railway Dashboard → Deployments
2. Find previous working deployment
3. Click "Redeploy"

Or use Docker image tags:
```bash
# Find previous working tag
docker pull ghcr.io/your-org/ppoplink/backend:v1.0.0

# Update Railway to use that tag
railway up --service backend --tag v1.0.0
```

---

## 8. Monitoring

### 8.1 Health Checks

- **Backend**: https://api.ppoplink.site/health
- **Web**: Check Vercel deployment status

### 8.2 Error Tracking

- **Sentry Dashboard**: Monitor errors in real-time
- **Slack Notifications**: Get alerts for deployments and errors

### 8.3 Performance

- **Vercel Analytics**: Web Vitals and performance metrics
- **Railway Metrics**: CPU, Memory, Network usage
- **Supabase Dashboard**: Database query performance

---

## 9. Troubleshooting

### Build Fails

**Web:**
- Check ESLint errors
- Verify TypeScript types
- Check environment variables

**Backend:**
- Check Python syntax
- Verify requirements.txt
- Check Docker build logs

### Deployment Fails

**Vercel:**
- Check build logs in Vercel dashboard
- Verify environment variables
- Check domain configuration

**Railway:**
- Check deployment logs
- Verify Docker image builds
- Check health check endpoint
- Verify environment variables

### Runtime Errors

1. Check Sentry for error details
2. Check Railway/Vercel logs
3. Verify database connectivity
4. Check API endpoints manually

---

## 10. Security Checklist

- [ ] All secrets are stored in GitHub Secrets (not in code)
- [ ] JWT_SECRET_KEY is strong and unique
- [ ] CORS origins are properly configured
- [ ] Supabase RLS policies are enabled
- [ ] HTTPS is enforced on all domains
- [ ] Rate limiting is configured
- [ ] Sentry PII filtering is enabled
- [ ] Database backups are scheduled

---

## 11. Cost Estimation

### Monthly Costs

- **Vercel (Hobby)**: $0
- **Railway (Starter)**: $5
- **Supabase (Free)**: $0
- **Sentry (Developer)**: $0
- **GitHub Actions**: $0 (within free tier)
- **Slack**: $0

**Total**: ~$5/month

### Scaling Considerations

When you need to scale:
- **Vercel Pro**: $20/month (more bandwidth, team features)
- **Railway Pro**: $20/month (more resources)
- **Supabase Pro**: $25/month (more storage, better performance)
- **Sentry Team**: $26/month (more events, better features)

---

## 12. Next Steps

After initial deployment:

1. Set up custom domains
2. Configure CDN (Vercel handles this)
3. Set up monitoring alerts
4. Configure backup strategy
5. Document runbooks for common issues
6. Set up staging environment testing
7. Configure automatic changelog generation
8. Set up performance monitoring

