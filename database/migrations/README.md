# 데이터베이스 마이그레이션

## 마이그레이션 실행 방법

### Railway에서 실행

1. Railway 프로젝트 대시보드 접속
2. PostgreSQL 데이터베이스 선택
3. "Query" 탭 클릭
4. 마이그레이션 파일 내용을 순서대로 복사하여 실행

### 로컬에서 실행 (psql 사용)

```bash
# Supabase 또는 PostgreSQL 연결
psql "postgresql://[username]:[password]@[host]:[port]/[database]"

# 마이그레이션 파일 실행
\i database/migrations/006_create_content_table.sql
```

## 마이그레이션 목록

- `001_add_public_link_id.sql` - 공개 링크 ID 추가
- `002_add_button_style.sql` - 버튼 스타일 추가
- `003_ppop_auth_migration.sql` - PPOP Auth 마이그레이션
- `004_update_plan_types.sql` - 플랜 타입 업데이트
- `005_add_phone_number.sql` - 전화번호 추가
- **`006_create_content_table.sql`** - 컨텐츠 테이블 생성 (NEW!)

## 006_create_content_table.sql 상세 정보

### 생성되는 테이블

- `content` - 컨텐츠 저장 테이블

### 컬럼 정보

- `id` (UUID) - 기본 키
- `slug` (VARCHAR) - URL 친화적인 고유 식별자
- `title` (VARCHAR) - 제목
- `description` (TEXT) - 설명
- `content` (TEXT) - 본문 (마크다운 형식)
- `category` (VARCHAR) - 카테고리
- `author_id` (UUID) - 작성자 ID (users 테이블 참조)
- `is_published` (BOOLEAN) - 발행 여부
- `published_at` (TIMESTAMP) - 발행 일시
- `created_at` (TIMESTAMP) - 생성 일시
- `updated_at` (TIMESTAMP) - 수정 일시

### 인덱스

- `idx_content_slug` - slug 검색 최적화
- `idx_content_category` - 카테고리 필터링 최적화
- `idx_content_published` - 발행된 컨텐츠 조회 최적화
- `idx_content_author` - 작성자별 조회 최적화

### 트리거

- `trigger_update_content_updated_at` - updated_at 자동 업데이트

### 초기 데이터

마이그레이션 실행 시 기존 하드코딩된 3개의 컨텐츠가 자동으로 삽입됩니다:
1. 링크 바이오 완벽 가이드
2. SNS 마케팅을 위한 링크 바이오 활용법
3. 뽑링크 주요 기능 소개

## 마이그레이션 후 확인사항

```sql
-- 테이블 생성 확인
SELECT * FROM content;

-- 인덱스 확인
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'content';

-- 트리거 확인
SELECT tgname FROM pg_trigger WHERE tgrelid = 'content'::regclass;
```

## 롤백 (필요시)

```sql
-- 테이블 삭제
DROP TABLE IF EXISTS content CASCADE;

-- 함수 삭제
DROP FUNCTION IF EXISTS update_content_updated_at() CASCADE;
```

