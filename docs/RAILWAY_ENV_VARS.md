# Railway ?꾨줈?뺤뀡 ?섍꼍蹂???ㅼ젙 媛?대뱶

??臾몄꽌??Railway??諛고룷??諛깆뿏???쒕퉬?ㅼ뿉 ?꾩슂???꾨줈?뺤뀡 ?섍꼍蹂??紐⑸줉???쒓났?⑸땲??

## Railway ?섍꼍蹂???ㅼ젙 諛⑸쾿

### ?묎렐諛⑸쾿 媛?대뱶

1. **Railway ??쒕낫???묒냽**
   - https://railway.app ?묒냽
   - 濡쒓렇??????쒕낫?쒕줈 ?대룞

2. **?꾨줈?앺듃 諛??쒕퉬???좏깮**
   - ?쇱そ ?ъ씠?쒕컮?먯꽌 ?꾨줈?앺듃 ?좏깮
   - ?꾨줈?앺듃 ?댁뿉??諛깆뿏???쒕퉬???좏깮 (?? `ppoplink-backend-production`)

3. **Variables ???닿린**
   - ?쒕퉬???섏씠吏 ?곷떒??**Variables** ???대┃
   - ?먮뒗 ?쇱そ 硫붾돱?먯꽌 **Variables** ?좏깮

4. **?섍꼍蹂??異붽?**
   - **New Variable** 踰꾪듉 ?대┃
   - **Name** ?꾨뱶???섍꼍蹂???대쫫 ?낅젰 (?? `DATABASE_URL`)
   - **Value** ?꾨뱶??媛??낅젰
   - **Add** 踰꾪듉 ?대┃

5. **?섍꼍蹂???뺤씤**
   - 異붽????섍꼍蹂?섍? 紐⑸줉???쒖떆?섎뒗吏 ?뺤씤
   - ?꾩슂??**Edit** 踰꾪듉?쇰줈 ?섏젙 媛??
6. **?쒕퉬???ъ떆??* (以묒슂!)
   - ?섍꼍蹂??異붽?/?섏젙 ?꾩뿉???쒕퉬?ㅻ? ?ъ떆?묓빐???곸슜?⑸땲??   - ?곷떒 硫붾돱?먯꽌 **Deployments** ???대┃
   - 理쒖떊 諛고룷??**...** 硫붾돱 ??**Redeploy** ?좏깮

---

## ?꾩닔 ?섍꼍蹂??(Required)

### App Configuration

```env
APP_ENV=prod
APP_NAME=PPOPLINK
APP_PORT=8005
```

### Database (Railway PostgreSQL)

```env
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
```

> Railway PostgreSQL ?쒕퉬?ㅻ? ?꾨줈?앺듃??異붽??섎㈃ ?먮룞?쇰줈 `DATABASE_URL`???쒓났?⑸땲??

### Storage (Railway Buckets - S3 compatible)

```env
S3_ENDPOINT_URL=https://your-bucket.storage.railway.app
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=ppoplink
S3_REGION=auto
```

### PPOP Auth (SSO)

```env
PPOP_AUTH_API_URL=https://auth-api.yourdomain.com
PPOP_AUTH_CLIENT_URL=https://auth.yourdomain.com
PPOP_AUTH_CLIENT_ID=your-client-id
PPOP_AUTH_CLIENT_SECRET=your-client-secret
PPOP_AUTH_REDIRECT_URI=https://ppoplink.site/auth/callback
PPOP_AUTH_JWKS_URI=https://auth-api.yourdomain.com/.well-known/jwks.json
```

### Server Configuration

```env
DEBUG=false
API_PREFIX=/api
CORS_ORIGINS=https://ppoplink.site,https://www.ppoplink.site
```

---

## ?좏깮???섍꼍蹂??(Optional)

### Storage Buckets

```env
STORAGE_BUCKET_PROFILES=profiles
STORAGE_BUCKET_BACKGROUNDS=backgrounds
STORAGE_BUCKET_CONTENT_IMAGES=content-images
MAX_FILE_SIZE_MB=5
```

### Plan Limits

```env
FREE_MAX_LINKS=6
FREE_MAX_SOCIAL_LINKS=5
```

### Logging

```env
LOG_LEVEL=INFO
```

### Sentry (Error Tracking)

```env
SENTRY_DSN=your-sentry-dsn
```

---

## ?꾩껜 ?섍꼍蹂???덉떆

```env
# App Configuration
APP_ENV=prod
APP_NAME=PPOPLINK
APP_PORT=8005

# Database (Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway

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
PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-production-04b4.up.railway.app

# Server Configuration
DEBUG=false
API_PREFIX=/api
CORS_ORIGINS=https://ppoplink.site,https://www.ppoplink.site

# Storage Buckets
STORAGE_BUCKET_PROFILES=profiles
STORAGE_BUCKET_BACKGROUNDS=backgrounds
STORAGE_BUCKET_CONTENT_IMAGES=content-images
MAX_FILE_SIZE_MB=5

# Plan Limits
FREE_MAX_LINKS=6
FREE_MAX_SOCIAL_LINKS=5

# Logging
LOG_LEVEL=INFO

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn
```

---

## 李멸퀬 臾몄꽌

- [Railway ?섍꼍蹂??臾몄꽌](https://docs.railway.app/develop/variables)
- [?꾨줈?앺듃 諛고룷 媛?대뱶](./DEPLOYMENT.md)
- [PPOP Auth ?ㅼ젙 媛?대뱶](./PPOP_AUTH_SETUP.md)
