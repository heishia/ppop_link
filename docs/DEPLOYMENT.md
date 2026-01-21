# Deployment Guide

This document provides step-by-step instructions for deploying PPOPLINK to production.

## Prerequisites

- GitHub repository with the codebase
- Railway account (for Backend, Database, Storage)
- Sentry account (for Error Tracking)
- Slack workspace (for Notifications)

---

## 1. Railway Setup (Backend + Database + Storage)

### 1.1 Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 1.2 Add PostgreSQL Database

1. Click "+ New" in your project
2. Select "Database" -> "PostgreSQL"
3. Railway will automatically provide `DATABASE_URL`

### 1.3 Add Storage (Railway Buckets)

1. Click "+ New" in your project
2. Select "Storage" -> "Buckets"
3. Configure bucket settings
4. Copy credentials:
   - `S3_ENDPOINT_URL`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`

### 1.4 Configure Backend Service

1. Service Settings:
   - Name: `ppoplink-backend-production`
   - Build: Dockerfile
   - Dockerfile Path: `./Dockerfile`

2. Add Environment Variables (see docs/RAILWAY_ENV_VARS.md)

3. Add Custom Domain:
   - Settings -> Networking -> Custom Domain
   - Add: `api.ppoplink.site`

### 1.5 Get Railway Token

For GitHub Actions:

1. Account Settings -> Tokens
2. Create new token
3. Add to GitHub Secrets:
   - `RAILWAY_TOKEN`
   - `RAILWAY_SERVICE_PRODUCTION` (service ID)

---

## 2. Database Setup

### 2.1 Run Migrations

Connect to Railway PostgreSQL and run:

```bash
# Using psql
psql $DATABASE_URL -f database/schema.sql
```

### 2.2 Verify Tables

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 3. Sentry Setup

### 3.1 Create Projects

1. Create Organization (if not exists)
2. Create two projects:
   - `web` (JavaScript/Next.js)
   - `backend` (Python/FastAPI)

### 3.2 Get Credentials

For each project:
- DSN (Settings -> Client Keys)
- Auth Token (Settings -> Auth Tokens)

---

## 4. GitHub Secrets

See [docs/GITHUB_SECRETS.md](./GITHUB_SECRETS.md) for complete list.

---

## 5. Deployment Workflow

### Development Flow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature

# 4. Merge to main -> Auto deploy to staging
```

### Production Release

1. Create a release on GitHub (Releases -> Draft a new release)
2. Create tag (e.g., v1.0.0)
3. Publish -> Auto deploy to production

### Rollback

1. Go to Railway Dashboard -> Deployments
2. Find previous working deployment
3. Click "Redeploy"

---

## 6. Monitoring

- **Health Check**: https://api.ppoplink.site/health
- **Sentry**: Real-time error tracking
- **Railway Metrics**: CPU, Memory, Network

---

## 7. Security Checklist

- [ ] All secrets in GitHub Secrets (not in code)
- [ ] CORS origins properly configured
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Database backups scheduled (Railway automatic)
