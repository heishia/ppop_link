-- Migration: Remove password_hash column (OAuth 전용)
-- Date: 2026-01-01
-- Description: PPOP Auth OAuth 전용이므로 password_hash 컬럼 완전 제거
-- User confirmed: 완전히 삭제

ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
