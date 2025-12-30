# 🔒 Security Features

PPOPLINK의 보안 기능 문서입니다.

## 목차
- [개요](#개요)
- [보안 계층](#보안-계층)
- [설치 및 설정](#설치-및-설정)
- [기능 상세](#기능-상세)
- [관리자 API](#관리자-api)
- [모니터링](#모니터링)
- [테스트](#테스트)

## 개요

5개의 보안 계층으로 구성된 다층 방어 시스템:

1. **보안 헤더** - XSS, 클릭재킹 등 클라이언트 사이드 공격 방어
2. **악의적 패턴 차단** - `.sql`, `.env` 등 민감한 파일 요청 즉시 차단
3. **IP 블랙리스트** - 악의적인 IP 영구 차단 (DB 저장)
4. **Rate Limiting** - 과도한 요청 차단 및 자동 블랙리스트 추가
5. **요청 크기 제한** - DoS 공격 방지

## 보안 계층

```
┌─────────────────────────────────────────┐
│         Incoming Request                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   1. Security Headers Middleware        │
│   - X-Content-Type-Options              │
│   - X-Frame-Options                     │
│   - Strict-Transport-Security           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   2. IP Blacklist Check                 │
│   - Query database                      │
│   - Cache results (60s)                 │
│   - Block if blacklisted → 403          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   3. Malicious Pattern Detection        │
│   - Check URL patterns                  │
│   - Block suspicious paths → 403        │
│   - Auto-blacklist (3+ in 5min)         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   4. Request Size Check                 │
│   - Max 10MB                            │
│   - Reject oversized → 413              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│   5. Rate Limiting                      │
│   - 200 req/min (global)                │
│   - 30 req/min (public profile)         │
│   - Auto-blacklist (10+ in 5min)        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Route Handler                    │
└─────────────────────────────────────────┘
```

## 설치 및 설정

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

새로 추가된 패키지:
- `slowapi==0.1.9` - Rate limiting

### 2. 데이터베이스 마이그레이션

Supabase Dashboard에서 SQL Editor로 실행:

```sql
-- database/migrations/010_create_ip_blacklist.sql 실행
```

### 3. 환경 변수 (선택사항)

Sentry 알림을 받으려면:

```env
SENTRY_DSN=your-sentry-dsn
ENVIRONMENT=production
```

### 4. 서버 재시작

```bash
# 로컬
python -m backend

# Railway (자동 배포)
git push
```

## 기능 상세

### 1. 보안 헤더

모든 응답에 자동으로 추가되는 헤더:

| 헤더 | 값 | 목적 |
|------|-----|------|
| X-Content-Type-Options | nosniff | MIME 타입 스니핑 방지 |
| X-Frame-Options | DENY | 클릭재킹 공격 방지 |
| X-XSS-Protection | 1; mode=block | XSS 공격 차단 |
| Strict-Transport-Security | max-age=31536000 | HTTPS 강제 |
| Content-Security-Policy | default-src 'self' | XSS 방지 |
| Referrer-Policy | strict-origin-when-cross-origin | 정보 유출 방지 |

### 2. 악의적 패턴 차단

차단되는 패턴:
- SQL 파일: `.sql`, `.bak`, `.old`
- 설정 파일: `.env`, `.ini`, `.conf`, `.config`
- PHP 관련: `.php`, `phpinfo`
- 압축 파일: `.zip`, `.tar`, `.gz`
- 로그: `.log`
- 시스템 파일: `.DS_Store`, `.git/`, `.htaccess`
- 히스토리: `.bash_history`, `.zsh_history`, `.mysql_history`
- 민감 정보: `database`, `credentials`, `secrets`, `api_keys`, `tokens`

**동작:**
- 패턴 매칭 시 즉시 403 Forbidden 반환
- Sentry에 보안 이벤트 기록
- 5분간 3번 이상 시도 시 자동으로 24시간 블랙리스트 추가

### 3. IP 블랙리스트

데이터베이스에 저장되는 영구 차단 시스템:

**특징:**
- IPv4/IPv6 지원
- 임시 차단 (시간 제한)
- 영구 차단
- 위반 횟수 추적
- 60초 캐시 (DB 부하 감소)

**자동 차단 조건:**
- Rate limit 10회 초과 (5분 이내) → 1시간 차단
- 악의적 패턴 3회 시도 (5분 이내) → 24시간 차단
- 의심스러운 활동 5회 (5분 이내) → 6시간 차단

### 4. Rate Limiting

엔드포인트별 요청 제한:

| 엔드포인트 | 제한 | 설명 |
|-----------|------|------|
| 전체 (기본) | 200/분 | 모든 API |
| `/api/public/{id}` | 30/분 | 공개 프로필 조회 |
| `/api/public/{id}/click/{link_id}` | 60/분 | 클릭 기록 |

**동작:**
- IP 주소 기준 제한
- 초과 시 429 Too Many Requests 반환
- Sentry에 자동 기록
- 자동 블랙리스트 트리거

### 5. 요청 크기 제한

- 최대 요청 크기: **10MB**
- 초과 시: 413 Payload Too Large
- DoS 공격 방지

## 관리자 API

관리자 권한으로 IP 블랙리스트를 관리할 수 있습니다.

### 인증

모든 관리자 API는 JWT 토큰과 `isAdmin: true` 필요:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 엔드포인트

#### 1. 블랙리스트 조회

```bash
GET /api/admin/security/blacklist?page=1&page_size=50
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ip_address": "192.168.1.100",
      "reason": "Auto-blocked: 10 rate_limit violations in 300s",
      "blocked_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-01-15T11:30:00Z",
      "violation_count": 10,
      "last_violation_at": "2024-01-15T10:29:55Z",
      "is_permanent": false
    }
  ],
  "total": 1
}
```

#### 2. IP 차단 추가

```bash
POST /api/admin/security/blacklist
Content-Type: application/json

{
  "ip_address": "203.0.113.0",
  "reason": "Manual block: Suspicious activity",
  "duration_hours": 24,
  "is_permanent": false
}
```

#### 3. IP 차단 해제

```bash
DELETE /api/admin/security/blacklist/203.0.113.0
```

#### 4. 보안 통계

```bash
GET /api/admin/security/stats
```

**응답:**
```json
{
  "success": true,
  "data": {
    "total_blocked_ips": 15,
    "total_violations": 247,
    "active_monitoring_ips": 42,
    "cache_size": 8
  }
}
```

## 모니터링

### Sentry 이벤트

다음 보안 이벤트가 자동으로 Sentry에 기록됩니다:

1. **malicious_pattern_blocked**
   - 악의적인 URL 패턴 차단
   - Severity: warning
   - Context: IP, path, user-agent

2. **ip_blacklisted_access_attempt**
   - 블랙리스트 IP의 접근 시도
   - Severity: warning
   - Context: IP, path, reason

3. **rate_limit_exceeded**
   - Rate limit 초과
   - Severity: warning
   - Context: IP, path, limit

4. **auto_blacklist_triggered**
   - 자동 블랙리스트 추가
   - Severity: error
   - Context: IP, reason, violation_count

### 로그 확인

```bash
# Railway 로그
railway logs

# 로컬 로그
tail -f backend.log
```

## 테스트

### 자동 테스트 스크립트

```bash
# 테스트 실행
python scripts/test_security.py
```

테스트 항목:
- ✅ 보안 헤더 확인
- ✅ 악의적 패턴 차단
- ✅ 관리자 엔드포인트 보호
- ✅ 요청 크기 제한
- ✅ Rate limiting (선택사항)

### 수동 테스트

#### 1. 악의적 패턴

```bash
# 403 Forbidden 예상
curl https://ppoplink.site/api/public/.env
curl https://ppoplink.site/api/public/backup.sql
curl https://ppoplink.site/api/public/phpinfo.php
```

#### 2. Rate Limiting

```bash
# 201번째 요청에서 429 예상
for i in {1..201}; do
  curl https://ppoplink.site/health
done
```

#### 3. 보안 헤더

```bash
curl -I https://ppoplink.site/health
# X-Content-Type-Options, X-Frame-Options 등 확인
```

#### 4. IP 블랙리스트 (관리자)

```bash
# 차단 추가
curl -X POST https://ppoplink.site/api/admin/security/blacklist \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ip_address": "1.2.3.4",
    "reason": "Test block",
    "duration_hours": 1
  }'

# 차단 목록 조회
curl https://ppoplink.site/api/admin/security/blacklist \
  -H "Authorization: Bearer YOUR_TOKEN"

# 차단 해제
curl -X DELETE https://ppoplink.site/api/admin/security/blacklist/1.2.3.4 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 문제 해결

### "slowapi not found" 에러

```bash
pip install slowapi==0.1.9
```

### 마이그레이션 실패

1. Supabase Dashboard → SQL Editor
2. `010_create_ip_blacklist.sql` 직접 실행
3. 에러 확인 및 수정

### Sentry에 이벤트가 안 뜸

1. `SENTRY_DSN` 환경 변수 확인
2. Railway Dashboard → Variables 확인
3. 서버 로그에서 "Sentry initialized" 메시지 확인

### Rate Limiting이 작동 안 함

1. IP가 올바르게 감지되는지 확인 (프록시 뒤에 있는 경우)
2. `X-Forwarded-For` 헤더 확인
3. 로그에서 클라이언트 IP 확인

## 보안 권고사항

1. **정기적인 블랙리스트 검토**
   - 매주 차단된 IP 검토
   - 만료된 차단 정리
   - 패턴 분석

2. **Sentry 알림 설정**
   - 보안 이벤트 알림 설정
   - 임계값 설정 (예: 10분에 10회 이상)

3. **로그 모니터링**
   - Railway/Sentry에서 로그 주기적 확인
   - 비정상적인 패턴 발견 시 조치

4. **Rate Limit 조정**
   - 트래픽 패턴에 맞게 조정
   - 정당한 사용자가 차단되지 않도록 주의

5. **정기적인 보안 업데이트**
   - 악의적 패턴 목록 업데이트
   - 의존성 보안 업데이트

## 참고

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Sentry Documentation](https://docs.sentry.io/)

