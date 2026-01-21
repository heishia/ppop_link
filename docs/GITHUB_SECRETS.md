# GitHub Secrets Configuration

This document lists all required GitHub Secrets for the CI/CD pipeline.

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to Settings ??Secrets and variables ??Actions
3. Click "New repository secret"
4. Add name and value
5. Click "Add secret"

---

## Required Secrets

### Railway (Backend + Database + Storage)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `RAILWAY_TOKEN` | Railway API token | Account Settings ??Tokens ??Create Token |
| `RAILWAY_SERVICE_PRODUCTION` | Production service ID | Copy from Railway service URL |
| `RAILWAY_SERVICE_STAGING` | Staging service ID | Copy from Railway service URL |

### Database (Railway PostgreSQL)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `DATABASE_URL` | Railway PostgreSQL connection string | Railway Dashboard ??PostgreSQL ??Connect |

### Storage (Railway Buckets)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `S3_ENDPOINT_URL` | Railway Buckets endpoint | Railway Dashboard ??Buckets ??Settings |
| `S3_ACCESS_KEY_ID` | S3 access key | Railway Dashboard ??Buckets ??Credentials |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | Railway Dashboard ??Buckets ??Credentials |

### Sentry (Error Tracking)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SENTRY_AUTH_TOKEN` | Sentry authentication token | Settings ??Auth Tokens ??Create Token |
| `SENTRY_ORG` | Sentry organization slug | Organization Settings ??General |
| `NEXT_PUBLIC_SENTRY_DSN` | Web frontend Sentry DSN | Project Settings ??Client Keys (DSN) |
| `SENTRY_DSN` | Backend Sentry DSN | Project Settings ??Client Keys (DSN) |

### Slack (Notifications)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SLACK_WEBHOOK_URL` | Incoming webhook URL | Slack App Directory ??Incoming Webhooks ??Add to Workspace |

### API Configuration

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `NEXT_PUBLIC_API_URL` | Production API URL | `https://api.ppoplink.site` |
| `PROD_NEXT_PUBLIC_API_URL` | Same as above (for release workflow) | `https://api.ppoplink.site` |

### Test Environment

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `TEST_DATABASE_URL` | Test PostgreSQL URL | `postgresql://test:test@localhost:5432/test` |

---

## Secrets Checklist

Copy this checklist and mark as you add each secret:

### Deployment
- [ ] RAILWAY_TOKEN
- [ ] RAILWAY_SERVICE_PRODUCTION
- [ ] RAILWAY_SERVICE_STAGING

### Database & Storage
- [ ] DATABASE_URL
- [ ] S3_ENDPOINT_URL
- [ ] S3_ACCESS_KEY_ID
- [ ] S3_SECRET_ACCESS_KEY

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
- [ ] TEST_DATABASE_URL

---

## Security Best Practices

1. **Never commit secrets to code**
   - Always use GitHub Secrets
   - Add `.env` to `.gitignore`

2. **Use strong secrets**
   - Use `openssl rand -hex 32` to generate random keys

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

1. Go to Settings ??Secrets and variables ??Actions
2. Click on the secret name
3. Click "Update secret"
4. Enter new value
5. Save
6. Trigger a new deployment
