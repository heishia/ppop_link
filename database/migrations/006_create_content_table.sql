-- 컨텐츠 테이블 생성
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_published ON content(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_content_author ON content(author_id);

-- 기존 하드코딩된 컨텐츠 데이터 삽입
INSERT INTO content (slug, title, description, content, category, is_published, published_at, created_at) VALUES
(
    'link-bio-guide',
    '링크 바이오 완벽 가이드',
    '링크 바이오란 무엇인지, 어떻게 활용하는지 알아보는 완벽한 가이드입니다.',
    E'# 링크 바이오란?\n\n링크 바이오(Link in Bio)는 소셜 미디어 프로필에 하나의 링크만 추가할 수 있는 제약을 극복하기 위한 솔루션입니다.\n\n## 주요 특징\n\n1. **여러 링크를 하나로**: 인스타그램, 틱톡 등에서 하나의 링크로 여러 콘텐츠 공유\n2. **쉬운 관리**: 링크를 추가, 수정, 삭제하기 쉬움\n3. **분석 기능**: 어떤 링크가 인기 있는지 확인 가능\n\n## 활용 방법\n\n- 최신 유튜브 영상 공유\n- 온라인 스토어 링크\n- 블로그 포스트\n- 이벤트 페이지\n\n뽑링크를 사용하면 무료로 간단하게 링크 바이오를 만들 수 있습니다!',
    '가이드',
    true,
    '2025-01-10 00:00:00+00',
    '2025-01-10 00:00:00+00'
),
(
    'marketing-tips',
    'SNS 마케팅을 위한 링크 바이오 활용법',
    '인스타그램, 유튜브 등 SNS에서 링크 바이오를 효과적으로 활용하는 방법을 소개합니다.',
    E'# SNS 마케팅 링크 바이오 활용법\n\n링크 바이오는 SNS 마케팅의 핵심 도구입니다.\n\n## 인스타그램 활용\n\n1. **프로필 최적화**: 바이오에 뽑링크 URL 추가\n2. **스토리 활용**: "링크는 프로필에!" 문구 사용\n3. **정기 업데이트**: 최신 콘텐츠를 항상 상단에 배치\n\n## 유튜브 활용\n\n- 채널 설명에 링크 추가\n- 커뮤니티 탭에서 공유\n- 영상 설명란에 포함\n\n## 효과적인 링크 구성\n\n1. 최신 콘텐츠 (상단)\n2. 인기 콘텐츠\n3. 상시 링크 (스토어, 블로그 등)\n4. 소셜 미디어 링크\n\n## 분석 활용\n\n뽑링크의 분석 기능으로 어떤 링크가 인기 있는지 확인하고, 마케팅 전략을 개선하세요!',
    '마케팅',
    true,
    '2025-01-05 00:00:00+00',
    '2025-01-05 00:00:00+00'
),
(
    'ppoplink-features',
    '뽑링크 주요 기능 소개',
    '뽑링크의 핵심 기능들을 자세히 알아보고, 각 기능을 어떻게 활용하는지 설명합니다.',
    E'# 뽑링크 주요 기능\n\n뽑링크는 간단하면서도 강력한 링크 바이오 서비스입니다.\n\n## 무제한 링크 추가\n\n- 링크 개수 제한 없음\n- 소셜 미디어 링크 무제한\n- 자유로운 순서 변경\n\n## 커스터마이징\n\n### 프로필 설정\n- 프로필 이미지\n- 배경 이미지\n- 배경 색상\n- 자기소개\n\n### 버튼 스타일\n1. **기본**: 컬러 배경\n2. **외곽선**: 흰 배경 + 검은 테두리\n3. **채움**: 검은 배경\n\n## 분석 기능\n\n- 프로필 조회수\n- 링크별 클릭 수\n- 일별 통계\n- 인기 링크 확인\n\n## 무료 제공\n\n모든 기능을 무료로 사용할 수 있습니다!\n\n- 회원가입만 하면 즉시 사용\n- 숨겨진 비용 없음\n- 광고 없음\n\n지금 바로 뽑링크를 시작해보세요!',
    '프로그램 소개',
    true,
    '2025-01-01 00:00:00+00',
    '2025-01-01 00:00:00+00'
)
ON CONFLICT (slug) DO NOTHING;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

