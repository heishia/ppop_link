# Railway 프로덕션 환경변수 설정 가이드

이 문서는 Railway에 배포된 백엔드 서비스에 필요한 프로덕션 환경변수 목록을 제공합니다.

## Railway 환경변수 설정 방법

### 단계별 가이드

1. **Railway 대시보드 접속**

   - https://railway.app 접속
   - 로그인 후 대시보드로 이동

2. **프로젝트 및 서비스 선택**

   - 왼쪽 사이드바에서 프로젝트 선택
   - 프로젝트 내에서 백엔드 서비스 선택 (예: `ppoplink-backend-production`)

3. **Variables 탭 열기**

   - 서비스 페이지 상단의 **Variables** 탭 클릭
   - 또는 왼쪽 메뉴에서 **Variables** 선택

4. **환경변수 추가**

   - **New Variable** 버튼 클릭
   - **Name** 필드에 환경변수 이름 입력 (예: `PPOP_AUTH_CLIENT_ORIGIN`)
   - **Value** 필드에 값 입력 (예: `https://auth-client-production-04b4.up.railway.app`)
   - **Add** 버튼 클릭

5. **환경변수 확인**

   - 추가한 환경변수가 목록에 표시되는지 확인
   - 필요시 **Edit** 버튼으로 수정 가능

6. **서비스 재시작** (중요!)
   - 환경변수 추가/수정 후에는 서비스를 재시작해야 적용됩니다
   - 상단 메뉴에서 **Deployments** 탭 클릭
   - 최신 배포의 **...** 메뉴 → **Redeploy** 선택
   - 또는 자동 재배포가 설정되어 있으면 커밋/푸시 시 자동으로 재배포됩니다

---

## 필수 환경변수 (Required)

### App Configuration

```env
APP_ENV=prod
APP_NAME=PPOPLINK
APP_PORT=8000
```

### Database (Supabase)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
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

## 선택적 환경변수 (Optional)

### Storage (Supabase Storage)

```env
STORAGE_BUCKET_PROFILES=profiles
STORAGE_BUCKET_BACKGROUNDS=backgrounds
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
SENTRY_ENVIRONMENT=production
```

### Frontend (Web) - Vercel 환경변수

프론트엔드는 Vercel에 배포되므로 Vercel 대시보드에서 설정합니다:

```env
NEXT_PUBLIC_API_URL=https://api.ppoplink.site
NEXT_PUBLIC_SITE_URL=https://ppoplink.site
NEXT_PUBLIC_PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-production-04b4.up.railway.app
NEXT_PUBLIC_PPOP_AUTH_SERVICE_CODE=ppop-link
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-verification-code
NEXT_PUBLIC_NAVER_SITE_VERIFICATION=your-naver-verification-code
```

---

## 전체 환경변수 예시

Railway Variables 탭에 다음을 모두 추가하세요:

```env
# App Configuration
APP_ENV=prod
APP_NAME=PPOPLINK
APP_PORT=8000

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

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
CORS_ORIGINS=https://ppoplink.site,https://www.ppoplink.site,https://your-project.vercel.app

# Storage (Supabase Storage)
STORAGE_BUCKET_PROFILES=profiles
STORAGE_BUCKET_BACKGROUNDS=backgrounds
MAX_FILE_SIZE_MB=5

# Plan Limits
FREE_MAX_LINKS=6
FREE_MAX_SOCIAL_LINKS=5

# Logging
LOG_LEVEL=INFO

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

---

## 중요 사항

### CORS_ORIGINS 설정

- 쉼표로 구분된 도메인 목록
- 프로토콜 포함 (http:// 또는 https://)
- 공백 없이 입력
- Vercel 도메인과 커스텀 도메인 모두 포함
- 예: `https://ppoplink.site,https://www.ppoplink.site,https://your-project.vercel.app`

**중요:** Vercel에 배포된 프론트엔드 도메인을 반드시 포함해야 합니다:
- Vercel 기본 도메인: `https://your-project.vercel.app` (Vercel 프로젝트 설정에서 확인)
- 커스텀 도메인: `https://yourdomain.com` (설정한 경우)

### 보안

- **절대** 코드에 실제 값을 커밋하지 마세요
- Railway 환경변수만 사용하세요
- 민감한 정보는 Railway Secrets로 관리하세요

### 환경변수 확인

배포 후 다음 명령어로 환경변수가 제대로 설정되었는지 확인할 수 있습니다:

```bash
# Railway CLI 사용
railway variables

# 또는 Railway 대시보드에서 확인
```

---

## 문제 해결

### CORS 에러가 발생하는 경우

1. `CORS_ORIGINS` 환경변수 확인
   - Vercel 도메인이 포함되어 있는지 확인 (`https://your-project.vercel.app`)
   - 커스텀 도메인이 포함되어 있는지 확인 (`https://yourdomain.com`)
2. `PPOP_AUTH_CLIENT_ORIGIN` 환경변수 확인 (PPOP Auth 클라이언트 도메인)
3. 프론트엔드 도메인이 포함되어 있는지 확인
4. 프로토콜(http/https)이 올바른지 확인
5. 쉼표 구분이 올바른지 확인 (공백 없이 쉼표로만 구분)
6. Railway 서비스 재시작

**Vercel 도메인 확인 방법:**
- Vercel 대시보드 → 프로젝트 선택 → Settings → Domains
- 기본 Vercel 도메인: `your-project.vercel.app` 형식
- 커스텀 도메인: 설정한 도메인

**PPOP Auth 클라이언트에서 발생하는 CORS 오류의 경우:**

- `PPOP_AUTH_CLIENT_ORIGIN` 환경변수에 PPOP Auth 클라이언트의 전체 도메인을 설정하세요
- **프로덕션 환경**: `PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-production-04b4.up.railway.app`
- **스테이징 환경**: `PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-staging-xxxx.up.railway.app`
- **로컬 개발**: `.env.dev` 파일에 추가 (선택사항, 로컬에서 PPOP Auth 클라이언트를 테스트하는 경우만)

### PPOP_AUTH_CLIENT_ORIGIN 값 확인 방법

1. **PPOP Auth 클라이언트 도메인 확인**

   - PPOP Auth 클라이언트가 배포된 Railway 서비스의 도메인을 확인하세요
   - Railway 대시보드 → PPOP Auth 클라이언트 서비스 → Settings → Networking
   - 또는 브라우저 주소창에서 확인 (예: `https://auth-client-production-04b4.up.railway.app`)

2. **프로덕션 vs 스테이징**

   - 프로덕션 환경: `https://auth-client-production-04b4.up.railway.app`
   - 스테이징 환경: `https://auth-client-staging-xxxx.up.railway.app` (실제 도메인으로 변경)
   - 각 환경의 백엔드 서비스에 해당 환경의 클라이언트 도메인을 설정하세요

3. **로컬 개발 환경 설정** (선택사항)
   - 로컬에서 PPOP Auth 클라이언트를 테스트하는 경우에만 필요
   - 프로젝트 루트의 `.env.dev` 파일에 추가:
   ```env
   PPOP_AUTH_CLIENT_ORIGIN=http://localhost:3001
   ```
   - 또는 실제 PPOP Auth 클라이언트 프로덕션 도메인 사용 가능

### 환경변수가 적용되지 않는 경우

1. **Railway 서비스 재배포**

   - Deployments 탭 → 최신 배포 → **Redeploy** 클릭
   - 또는 코드를 커밋/푸시하여 자동 재배포 트리거

2. **환경변수 이름 확인**

   - 대소문자를 정확히 입력했는지 확인
   - 예: `PPOP_AUTH_CLIENT_ORIGIN` (대문자, 언더스코어)

3. **Railway 로그 확인**

   - Deployments 탭 → 최신 배포 → **View Logs** 클릭
   - 환경변수 로드 관련 오류 메시지 확인

4. **환경변수 값 확인**

   - Variables 탭에서 값이 올바르게 저장되었는지 확인
   - 공백이나 특수문자가 포함되지 않았는지 확인
   - 프로토콜(`https://`)이 포함되어 있는지 확인

5. **서비스 재시작**
   - 환경변수 추가/수정 후 반드시 서비스를 재시작해야 합니다
   - Railway는 환경변수 변경 시 자동으로 재배포하지 않을 수 있습니다

---

## PPOP_AUTH_CLIENT_ORIGIN 상세 설정 가이드

### 프로덕션 환경 설정

**Railway 백엔드 서비스 (프로덕션)에 추가할 환경변수:**

```env
PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-production-04b4.up.railway.app
```

**설정 위치:**

- Railway 대시보드 → 프로덕션 백엔드 서비스 → Variables 탭
- Name: `PPOP_AUTH_CLIENT_ORIGIN`
- Value: `https://auth-client-production-04b4.up.railway.app` (실제 PPOP Auth 클라이언트 도메인으로 변경)

### 스테이징 환경 설정

**Railway 백엔드 서비스 (스테이징)에 추가할 환경변수:**

```env
PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-staging-xxxx.up.railway.app
```

**설정 위치:**

- Railway 대시보드 → 스테이징 백엔드 서비스 → Variables 탭
- Name: `PPOP_AUTH_CLIENT_ORIGIN`
- Value: 스테이징 PPOP Auth 클라이언트의 실제 도메인

### 로컬 개발 환경 설정 (선택사항)

로컬에서 PPOP Auth 클라이언트를 테스트하는 경우에만 필요합니다.

**프로젝트 루트의 `.env.dev` 파일에 추가:**

```env
# PPOP Auth 클라이언트 도메인 (CORS용)
PPOP_AUTH_CLIENT_ORIGIN=http://localhost:3001
```

또는 프로덕션 PPOP Auth 클라이언트를 사용하는 경우:

```env
PPOP_AUTH_CLIENT_ORIGIN=https://auth-client-production-04b4.up.railway.app
```

### 환경변수 적용 확인

환경변수를 추가한 후:

1. **서비스 재배포**

   - Railway 대시보드 → Deployments 탭
   - 최신 배포의 **...** 메뉴 → **Redeploy** 클릭

2. **로그 확인**

   - 배포 완료 후 로그에서 환경변수 로드 확인
   - CORS 설정 관련 오류가 없는지 확인

3. **API 테스트**
   - 브라우저 개발자 도구 → Network 탭
   - PPOP Auth 클라이언트에서 `/auth/register/extended` 호출 시 CORS 오류가 발생하지 않는지 확인

### 주의사항

- **프로덕션과 스테이징은 다른 도메인을 사용해야 합니다**
- **환경변수 값에는 프로토콜(`https://`)을 포함해야 합니다**
- **도메인 끝에 슬래시(`/`)를 포함하지 마세요**
- **환경변수 추가/수정 후 반드시 서비스를 재시작하세요**

## 참고 자료

- [Railway 환경변수 문서](https://docs.railway.app/develop/variables)
- [프로젝트 배포 가이드](./DEPLOYMENT.md)
- [PPOP Auth 설정 가이드](./PPOP_AUTH_SETUP.md)
