-- users 테이블에서 is_admin 컬럼 제거
-- JWT에서만 관리자 여부를 확인하므로 DB 저장 불필요
-- PPOP Auth가 권한의 단일 진실의 원천(Single Source of Truth)

ALTER TABLE users DROP COLUMN IF EXISTS is_admin;

