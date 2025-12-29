# 중복 가입 방지 기능

## 개요

PPOPLINK는 이메일과 전화번호 중복 가입을 방지하는 기능을 제공합니다. 이 문서는 중복 가입 방지 로직의 구현 방법과 동작 원리를 설명합니다.

## 주요 기능

### 1. 이메일 중복 검증
- **검증 시점**: 신규 사용자 생성 전
- **검증 방법**: 데이터베이스에서 동일한 이메일이 이미 등록되어 있는지 확인
- **에러 메시지**: "이미 가입된 이메일입니다. 다른 이메일을 사용해주세요."
- **HTTP 상태 코드**: 409 Conflict

### 2. 전화번호 중복 검증
- **검증 시점**: 신규 사용자 생성 전
- **검증 조건**: PPOP Auth에서 인증된 전화번호만 검증
- **검증 방법**: 데이터베이스에서 동일한 전화번호가 이미 등록되어 있는지 확인
- **에러 메시지**: "이미 가입된 전화번호입니다. 다른 전화번호를 사용해주세요."
- **HTTP 상태 코드**: 409 Conflict

## 데이터베이스 스키마 변경

### Migration 005: 전화번호 필드 추가

```sql
-- database/migrations/005_add_phone_number.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
```

### Users 테이블 스키마

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    user_seq SERIAL,
    public_link_id VARCHAR(20) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,  -- 새로 추가된 필드
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    bio VARCHAR(500),
    profile_image_url VARCHAR(500),
    background_image_url VARCHAR(500),
    background_color VARCHAR(7),
    theme VARCHAR(50) DEFAULT 'default',
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## 코드 구현

### 1. 예외 클래스 추가

```python
# backend/core/exceptions.py

class EmailAlreadyExistsError(DuplicateError):
    detail = "Email already registered"

class PhoneAlreadyExistsError(DuplicateError):
    detail = "Phone number already registered"
```

### 2. User 모델 업데이트

```python
# backend/core/models.py

class User(UserBase, TimestampMixin):
    id: UUID
    user_seq: Optional[int] = None
    public_link_id: Optional[str] = None
    phone_number: Optional[str] = None  # 새로 추가된 필드
    # ... 기타 필드
```

### 3. 중복 검증 로직

```python
# backend/auth/service.py

async def _check_duplicate_email_and_phone(
    self, 
    email: Optional[str], 
    phone_number: Optional[str]
) -> None:
    """
    이메일과 전화번호 중복 체크
    
    Raises:
        EmailAlreadyExistsError: 이메일이 이미 등록됨
        PhoneAlreadyExistsError: 전화번호가 이미 등록됨
    """
    # 이메일 중복 체크
    if email:
        result = db.table(self.TABLE_USERS).select("id").eq("email", email).execute()
        if result.data:
            raise EmailAlreadyExistsError(
                detail="이미 가입된 이메일입니다. 다른 이메일을 사용해주세요."
            )
    
    # 전화번호 중복 체크 (인증된 전화번호만)
    if phone_number:
        result = db.table(self.TABLE_USERS).select("id").eq("phone_number", phone_number).execute()
        if result.data:
            raise PhoneAlreadyExistsError(
                detail="이미 가입된 전화번호입니다. 다른 전화번호를 사용해주세요."
            )
```

## PPOP Auth 연동

### 토큰에서 전화번호 추출

PPOP Auth의 JWT 토큰에서 `phone_number` 클레임을 추출합니다:

```python
async def get_or_create_user_from_token(self, access_token: str) -> User:
    payload = get_token_payload(access_token)
    ppop_user_id = payload.get("sub")
    email = payload.get("email")
    phone_number = payload.get("phone_number")  # PPOP Auth에서 인증된 전화번호
    
    # 중복 체크
    await self._check_duplicate_email_and_phone(email, phone_number)
    
    # 사용자 생성
    user = await self._create_user_from_ppop(ppop_user_id, email, phone_number)
    return user
```

### PPOP Auth 토큰 구조

PPOP Auth에서 발급하는 JWT 토큰은 다음과 같은 클레임을 포함해야 합니다:

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "phone_number": "+821012345678",  // E.164 형식 (선택적)
  "exp": 1234567890,
  "iat": 1234567890
}
```

**중요**: `phone_number` 클레임은 PPOP Auth에서 전화번호 인증이 완료된 경우에만 포함됩니다.

## 인증 흐름

```
1. 사용자가 PPOP Auth에서 로그인/회원가입
2. PPOP Auth에서 이메일 및 전화번호 인증 (선택적)
3. PPOP Auth가 JWT 토큰 발급 (email, phone_number 포함)
4. PPOPLINK 백엔드에서 토큰 검증
5. 토큰에서 email, phone_number 추출
6. 중복 검증 수행:
   - 이메일 중복 체크 → 중복 시 409 에러
   - 전화번호 중복 체크 → 중복 시 409 에러
7. 검증 통과 시 사용자 생성
```

## 에러 처리

### 프론트엔드 에러 처리 예시

```typescript
try {
  const response = await fetch('/api/auth/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 409) {
      // 중복 가입 에러
      if (error.detail.includes('이메일')) {
        alert('이미 가입된 이메일입니다. 다른 이메일을 사용해주세요.');
      } else if (error.detail.includes('전화번호')) {
        alert('이미 가입된 전화번호입니다. 다른 전화번호를 사용해주세요.');
      }
    }
  }
} catch (error) {
  console.error('Login failed:', error);
}
```

## 마이그레이션 가이드

### 1. 데이터베이스 마이그레이션 실행

```bash
# PostgreSQL에 연결
psql -h your-db-host -U your-db-user -d your-db-name

# 마이그레이션 실행
\i database/migrations/005_add_phone_number.sql
```

### 2. 기존 사용자 데이터

- 기존 사용자의 `phone_number` 필드는 `NULL`로 유지됩니다.
- 기존 사용자는 계속 정상적으로 로그인할 수 있습니다.
- 기존 사용자가 PPOP Auth에서 전화번호를 인증하면, 다음 로그인 시 자동으로 업데이트됩니다.

### 3. 테스트

```bash
# 단위 테스트 실행
pytest backend/tests/unit/test_auth_service.py -v

# 통합 테스트 실행
pytest backend/tests/integration/test_auth_api.py -v
```

## 보안 고려사항

1. **전화번호 형식**: E.164 형식 권장 (예: +821012345678)
2. **인증 완료된 번호만**: PPOP Auth에서 인증이 완료된 전화번호만 저장
3. **개인정보 보호**: 전화번호는 민감한 개인정보이므로 암호화 저장 고려
4. **로깅**: 중복 시도는 로그에 기록하되, 전화번호 전체는 마스킹 처리

## 문제 해결

### Q1: 전화번호가 저장되지 않아요
**A**: PPOP Auth 토큰에 `phone_number` 클레임이 포함되어 있는지 확인하세요. PPOP Auth에서 전화번호 인증이 완료되어야 합니다.

### Q2: 이메일은 중복 체크되는데 전화번호는 안 돼요
**A**: 데이터베이스 마이그레이션이 정상적으로 실행되었는지 확인하세요:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'phone_number';
```

### Q3: 기존 사용자가 로그인할 수 없어요
**A**: 기존 사용자의 `phone_number`는 `NULL`이므로 중복 체크에 영향을 주지 않습니다. 다른 원인을 확인하세요.

## 관련 파일

- `database/migrations/005_add_phone_number.sql` - 마이그레이션 스크립트
- `database/schema.sql` - 전체 스키마 정의
- `backend/core/exceptions.py` - 예외 클래스 정의
- `backend/core/models.py` - User 모델 정의
- `backend/auth/service.py` - 인증 서비스 로직
- `backend/auth/schemas.py` - API 스키마 정의

## 참고 자료

- [PPOP Auth 문서](./PPOP_AUTH_SETUP.md)
- [데이터베이스 스키마](../database/schema.sql)
- [API 문서](./API_DOCUMENTATION.md)

