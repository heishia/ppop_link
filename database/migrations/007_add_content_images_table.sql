-- 컨텐츠 이미지 테이블 생성
-- 컨텐츠 본문에 삽입되는 이미지 관리

CREATE TABLE IF NOT EXISTS content_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_images_content_id ON content_images(content_id);
CREATE INDEX IF NOT EXISTS idx_content_images_uploaded_by ON content_images(uploaded_by);

COMMENT ON TABLE content_images IS '컨텐츠 본문에 삽입되는 이미지';
COMMENT ON COLUMN content_images.content_id IS '컨텐츠 ID (NULL 가능 - 아직 컨텐츠에 연결 안 된 이미지)';
COMMENT ON COLUMN content_images.image_url IS 'Supabase Storage 공개 URL';
COMMENT ON COLUMN content_images.file_path IS 'Supabase Storage 파일 경로';

