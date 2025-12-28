# GitHub Secrets Configuration

This document lists all required GitHub Secrets for the CI/CD pipeline.

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add name and value
5. Click "Add secret"

---

## Required Secrets

### Vercel (Web Frontend Deployment)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | Account Settings → Tokens → Create Token |
| `VERCEL_ORG_ID` | Vercel organization ID | Project Settings → General (scroll down) |
| `VERCEL_PROJECT_ID` | Vercel project ID | Project Settings → General (scroll down) |

### Railway (Backend Deployment)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `RAILWAY_TOKEN` | Railway API token | Account Settings → Tokens → Create Token |
| `RAILWAY_SERVICE_PRODUCTION` | Production service ID | Copy from Railway service URL |
| `RAILWAY_SERVICE_STAGING` | Staging service ID | Copy from Railway service URL |

### Supabase (Database & Storage)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SUPABASE_URL` | Supabase project URL | Project Settings → API → Project URL |
| `SUPABASE_KEY` | Supabase anon key | Project Settings → API → Project API keys (anon public) |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Project Settings → API → Project API keys (service_role) |

### JWT (Authentication)

| Secret Name | Description | How to Generate |
|-------------|-------------|-----------------|
| `JWT_SECRET_KEY` | Secret key for JWT signing | `openssl rand -hex 32` |

### Sentry (Error Tracking)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SENTRY_AUTH_TOKEN` | Sentry authentication token | Settings → Auth Tokens → Create Token |
| `SENTRY_ORG` | Sentry organization slug | Organization Settings → General |
| `NEXT_PUBLIC_SENTRY_DSN` | Web frontend Sentry DSN | Project Settings → Client Keys (DSN) |
| `SENTRY_DSN` | Backend Sentry DSN | Project Settings → Client Keys (DSN) |

### Slack (Notifications)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SLACK_WEBHOOK_URL` | Incoming webhook URL | Slack App Directory → Incoming Webhooks → Add to Workspace |

### API Configuration

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_API_URL` | Production API URL | `https://api.ppoplink.site` |
| `PROD_NEXT_PUBLIC_API_URL` | Same as above (for release workflow) | `https://api.ppoplink.site` |

### Test Environment

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `TEST_SUPABASE_URL` | Test Supabase URL | `https://test.supabase.co` |
| `TEST_SUPABASE_KEY` | Test Supabase key | `test-key` |
| `TEST_SUPABASE_SERVICE_KEY` | Test service key | `test-service-key` |
| `TEST_JWT_SECRET_KEY` | Test JWT secret | `test-secret-key-for-testing-only` |

---

## Secrets Checklist

Copy this checklist and mark as you add each secret:

### Deployment
- [ ] VERCEL_TOKEN
- [ ] VERCEL_ORG_ID
- [ ] VERCEL_PROJECT_ID
- [ ] RAILWAY_TOKEN
- [ ] RAILWAY_SERVICE_PRODUCTION
- [ ] RAILWAY_SERVICE_STAGING

### Database & Auth
- [ ] SUPABASE_URL
- [ ] SUPABASE_KEY
- [ ] SUPABASE_SERVICE_KEY
- [ ] JWT_SECRET_KEY

### Monitoring
- [ ] SENTRY_AUTH_TOKEN
- [ ] SENTRY_ORG
- [ ] NEXT_PUBLIC_SENTRY_DSN
- [ ] SENTRY_DSN
- [ ] SLACK_WEBHOOK_URL

### Configuration
- [ ] NEXT_PUBLIC_API_URL
- [ ] PROD_NEXT_PUBLIC_API_URL

### Testing
- [ ] TEST_SUPABASE_URL
- [ ] TEST_SUPABASE_KEY
- [ ] TEST_SUPABASE_SERVICE_KEY
- [ ] TEST_JWT_SECRET_KEY

---

## Security Best Practices

1. **Never commit secrets to code**
   - Always use GitHub Secrets
   - Add `.env` to `.gitignore`

2. **Use strong secrets**
   - JWT_SECRET_KEY should be at least 32 characters
   - Use `openssl rand -hex 32` to generate

3. **Rotate secrets regularly**
   - Recommended: every 3 months
   - Update in GitHub Secrets
   - Redeploy applications

4. **Limit access**
   - Only repository admins should access secrets
   - Use environment-specific secrets when possible

5. **Monitor usage**
   - Check GitHub Actions logs for secret usage
   - Monitor Sentry for authentication errors

---

## Troubleshooting

### Secret Not Working

1. Check secret name matches exactly (case-sensitive)
2. Verify no extra spaces in secret value
3. Check if secret is available in the environment
4. Redeploy after adding/updating secrets

### How to Update a Secret

1. Go to Settings → Secrets and variables → Actions
2. Click on the secret name
3. Click "Update secret"
4. Enter new value
5. Save
6. Trigger a new deployment

### How to Test Secrets Locally

**Never use production secrets locally!**

Create a `.env.local` file:
```bash
# Copy from .env.example
cp .env.example .env.local

# Edit with your local values
# DO NOT use production secrets
```

---

## Environment-Specific Secrets

Some platforms support environment-specific secrets:

### Vercel
- Production environment variables
- Preview environment variables
- Development environment variables

### Railway
- Environment groups
- Service-specific variables

Configure these in their respective dashboards, not in GitHub Secrets.

