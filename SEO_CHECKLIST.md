# 네이버 검색 최적화 체크리스트

## ✅ 적용 완료 항목

### 1. 단일 URL 정책
- ✅ **www → non-www 301 리다이렉트 설정**
  - `www.ppoplink.site` → `ppoplink.site` 자동 리다이렉트
  - `next.config.js`에서 permanent redirect 설정

### 2. robots.txt
- ✅ **네이버 검색로봇(Yeti) 허용**
  - `/robots.txt` 자동 생성 (`robots.ts`)
  - 관리자 페이지(`/dashboard`), API(`/api`), 인증(`/auth`) 수집 금지
  - sitemap 위치 명시

### 3. sitemap.xml
- ✅ **사이트맵 자동 생성**
  - `/sitemap.xml` 자동 생성 (`sitemap.ts`)
  - 주요 페이지 포함 (홈, 소개, 도움말, 콘텐츠 등)
  - 업데이트 빈도, 우선순위 설정

### 4. 404 오류 페이지
- ✅ **HTTP 404 상태 코드 반환**
  - Next.js `not-found.tsx`가 자동으로 404 상태 반환
  - 사용자 친화적인 오류 메시지 제공
  - 검색 결과 노출 방지 (`robots: index: false`)

### 5. 모바일 최적화
- ✅ **반응형 웹 디자인**
  - Tailwind CSS로 모바일 우선 반응형 구현
  - viewport 메타 태그 설정
  - 모바일 사용성 최적화

### 6. Canonical URL
- ✅ **대표 URL 설정**
  - `layout.tsx`에서 canonical URL 설정
  - Open Graph, Twitter Card 메타 태그 포함

### 7. 구조화된 데이터
- ✅ **Schema.org 마크업**
  - Organization 정보
  - WebSite 정보
  - JSON-LD 형식

---

## 📋 검색 최적화 핵심 원칙

### 1️⃣ 단일 호스트명 사용
- **원칙**: 같은 콘텐츠는 하나의 URL로만 제공
- **적용**: `www.ppoplink.site` → `ppoplink.site` (301 리다이렉트)
- **이유**: 중복 콘텐츠 방지, 검색 효율성 향상

### 2️⃣ robots.txt 설정
- **위치**: 반드시 루트 (`/robots.txt`)
- **내용**: 
  - 수집 허용: 공개 페이지
  - 수집 금지: 관리자, 개인정보, API
  - Sitemap 위치 명시

### 3️⃣ sitemap.xml 제공
- **목적**: 사이트 구조를 검색엔진에 알림
- **포함**: 수집 대상 URL 목록
- **정보**: 최종 수정일, 변경 빈도, 우선순위

### 4️⃣ HTTP 상태 코드 준수
- **404**: 페이지 없음 → HTTP 404 반환
- **403**: 접근 금지 → HTTP 403 반환
- **503**: 서비스 불가 → HTTP 503 반환
- ❌ **금지**: 오류 페이지인데 HTTP 200 반환

### 5️⃣ 모바일 친화성
- **반응형 웹**: 권장 (동일 URL, 기기별 최적화)
- **별도 모바일 URL**: 가능하지만 canonical 설정 필수
- **viewport 설정**: 필수

---

## 🔍 현재 프로젝트 상태

### 설정 파일 위치
```
web/
├── next.config.js          # www 리다이렉트, 이미지 최적화
├── src/app/
│   ├── layout.tsx          # 메타데이터, canonical, 구조화 데이터
│   ├── robots.ts           # robots.txt 생성
│   ├── sitemap.ts          # sitemap.xml 생성
│   └── not-found.tsx       # 404 페이지
└── public/
    └── naver146d0...html   # 네이버 소유 확인 파일
```

### 주요 URL
- 메인: `https://ppoplink.site`
- Robots: `https://ppoplink.site/robots.txt`
- Sitemap: `https://ppoplink.site/sitemap.xml`
- 네이버 확인: `https://ppoplink.site/naver146d0066b6c60f67e0480c28a2400fa2.html`

---

## 🚀 배포 후 확인사항

### 1. URL 리다이렉트 테스트
```bash
# www → non-www 리다이렉트 확인
curl -I https://www.ppoplink.site
# 응답: HTTP 301, Location: https://ppoplink.site
```

### 2. robots.txt 확인
```bash
# 브라우저에서 확인
https://ppoplink.site/robots.txt
```

### 3. sitemap.xml 확인
```bash
# 브라우저에서 확인
https://ppoplink.site/sitemap.xml
```

### 4. 404 페이지 테스트
```bash
# 존재하지 않는 페이지 접속
https://ppoplink.site/nonexistent-page
# HTTP 404 상태 코드 확인
```

### 5. 네이버 웹마스터도구
1. 소유 확인 HTML 파일 접근 확인
2. "확인" 버튼 클릭하여 소유권 인증
3. 사이트맵 제출: `https://ppoplink.site/sitemap.xml`

---

## 📌 추가 권장사항

### 검색 노출 향상
- [ ] 페이지별 고유한 title, description 작성
- [ ] 이미지 alt 텍스트 작성
- [ ] 내부 링크 구조 최적화
- [ ] 콘텐츠 정기 업데이트

### 성능 최적화
- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] Core Web Vitals 개선
- [ ] CDN 활용

### 보안
- [ ] HTTPS 사용 (이미 적용됨)
- [ ] 보안 헤더 설정
- [ ] CORS 정책 검토

---

## 🔗 참고 자료
- [네이버 검색 등록 가이드](https://searchadvisor.naver.com/)
- [robots.txt 명세](http://www.robotstxt.org/)
- [Sitemap 프로토콜](https://www.sitemaps.org/)
- [Schema.org](https://schema.org/)

