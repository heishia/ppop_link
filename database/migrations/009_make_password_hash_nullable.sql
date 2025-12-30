-- Migration: Make password_hash nullable for OAuth users
-- Date: 2025-12-30
-- Description: OAuth 사용자는 비밀번호가 필요 없으므로 password_hash를 nullable로 변경

-- 1. password_hash 컬럼을 nullable로 변경
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- 2. 검증: password_hash가 NULL인 경우 id가 있어야 함 (data integrity)
-- OAuth 사용자인지 확인하는 제약 조건 추가
ALTER TABLE users 
ADD CONSTRAINT check_password_or_oauth 
CHECK (
    password_hash IS NOT NULL OR 
    id IS NOT NULL
);

-- Note: 
-- - OAuth 로그인 사용자는 password_hash가 NULL
-- - 기존 로컬 회원가입 사용자는 password_hash 필수
-- - 모든 사용자는 id가 필수 (PRIMARY KEY)

