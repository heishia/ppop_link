-- Migration: Make password_hash nullable for OAuth-only authentication
-- Date: 2025-12-30
-- Description: 
-- 현재 시스템은 PPOP Auth OAuth만 사용하므로 password_hash를 nullable로 변경
-- 모든 사용자는 OAuth를 통해 가입하며 password_hash는 항상 NULL입니다.

-- password_hash 컬럼을 nullable로 변경
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

-- Note: 
-- - 모든 사용자는 PPOP Auth OAuth를 통해 가입/로그인
-- - password_hash는 항상 NULL로 설정됨
-- - 향후 직접 회원가입 기능 추가 시 이 컬럼을 활용 가능
