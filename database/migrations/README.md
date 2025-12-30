# Database Migrations

## 마이그레이션 실행 방법

### Supabase Dashboard에서 실행

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. **New Query** 클릭
5. 마이그레이션 파일 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭

### 실행 순서

마이그레이션은 번호 순서대로 실행해야 합니다:

1. `001_add_public_link_id.sql`
2. `002_add_button_style.sql`
3. `003_ppop_auth_migration.sql`
4. `004_update_plan_types.sql`
5. `005_add_phone_number.sql`
6. `006_create_content_table.sql`
7. `007_add_content_images_table.sql`
8. `008_remove_is_admin_column.sql`
9. `009_make_password_hash_nullable.sql`
10. **`010_create_ip_blacklist.sql`** ← 새로 추가된 보안 마이그레이션

## 최신 마이그레이션 (010)

### 010_create_ip_blacklist.sql

IP 블랙리스트 테이블을 생성합니다. 이 테이블은 악의적인 IP 주소를 추적하고 차단하는 데 사용됩니다.

**기능:**

- IP 주소 저장 (IPv4/IPv6)
- 차단 이유 기록
- 만료 시간 설정 (임시 차단)
- 영구 차단 옵션
- 위반 횟수 추적

**실행 후 확인:**

```sql
-- 테이블이 생성되었는지 확인
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'ip_blacklist';

-- 인덱스 확인
SELECT indexname
FROM pg_indexes
WHERE tablename = 'ip_blacklist';
```

## 롤백

만약 마이그레이션을 롤백해야 한다면:

```sql
-- 010 롤백
DROP TABLE IF EXISTS ip_blacklist CASCADE;
```

## 주의사항

⚠️ **프로덕션 환경에서 마이그레이션 실행 전:**

1. 데이터베이스 백업
2. 마이그레이션 스크립트 검토
3. 개발 환경에서 먼저 테스트
4. 트래픽이 적은 시간대에 실행
