-- PPOPLINK Seed Data
-- 테스트용 초기 데이터

-- 관리자 계정 (비밀번호: Admin123!)
INSERT INTO users (id, username, email, password_hash, display_name, is_admin, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin',
    'admin@ppoplink.site',
    '$2b$12$etZp1hYuN5HJbwodDtv0duW8KcBw2n/JW2OpmIJ.mooM97dKAzOV.',
    'Administrator',
    TRUE,
    TRUE
);

-- 관리자 플랜
INSERT INTO user_plans (user_id, plan_type)
VALUES ('a0000000-0000-0000-0000-000000000001', 'pro');

-- 테스트 사용자 (비밀번호: Test1234!)
INSERT INTO users (id, username, email, password_hash, display_name, bio, theme, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'testuser',
    'test@example.com',
    '$2b$12$biS11n.hLJ1NxTX8GJIOHefRvg.frB6s847p..Wy7ObxERWuZjkei',
    'Test User',
    'Hello! This is my link page.',
    'default',
    TRUE
);

-- 테스트 사용자 플랜
INSERT INTO user_plans (user_id, plan_type)
VALUES ('b0000000-0000-0000-0000-000000000001', 'free');

-- 테스트 링크
INSERT INTO links (user_id, title, url, display_order, is_active, click_count)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'My Portfolio', 'https://portfolio.example.com', 0, TRUE, 0),
    ('b0000000-0000-0000-0000-000000000001', 'My Blog', 'https://blog.example.com', 1, TRUE, 0),
    ('b0000000-0000-0000-0000-000000000001', 'Contact Me', 'https://contact.example.com', 2, TRUE, 0);

-- 테스트 소셜 링크
INSERT INTO social_links (user_id, platform, url, display_order, is_active)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'youtube', 'https://youtube.com/@testuser', 0, TRUE),
    ('b0000000-0000-0000-0000-000000000001', 'threads', 'https://threads.net/@testuser', 1, TRUE),
    ('b0000000-0000-0000-0000-000000000001', 'email', 'mailto:test@example.com', 2, TRUE);

